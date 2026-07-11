#!/usr/bin/env node

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { render, Box, Text, useInput, useStdin, useStdout, useApp } from 'ink';
import { spawn, spawnSync } from 'node:child_process';

const h = React.createElement;

// ── Terminal output helpers (from gamifix) ─────────────────────────
const graphemeSegmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
const ANSI_CONTROL_PATTERN = /\x1B(?:\[[0-?]*[ -/]*[@-~]|\][^\x07]*(?:\x07|\x1B\\)?)/gu;
const ANSI_SGR_PATTERN = /^\x1B\[[0-9;:]*m$/u;
const ANSI_SGR_SPLIT_PATTERN = /(\x1B\[[0-9;:]*m)/gu;
const ANSI_RESET = '\x1B[0m';

const preserveTextStyles = (text) =>
  text.replace(ANSI_CONTROL_PATTERN, (sequence) => (ANSI_SGR_PATTERN.test(sequence) ? sequence : ''));

const normalizeTerminalOutput = (chunk) =>
  preserveTextStyles(String(chunk))
    .replaceAll('✅', '[OK]')
    .replaceAll('❌', '[ERROR]')
    .replace(/⚠️?/gu, '[WARN]')
    .replaceAll('🌱', '[START]')
    .replaceAll('🧹', '[CLEANUP]')
    .replaceAll('🚀', '>')
    .replace(/\[OK\](?:\s+\[OK\])+/gu, '[OK]')
    .replace(/[\p{Extended_Pictographic}\p{Regional_Indicator}\p{Emoji_Modifier}]/gu, (emoji) =>
      emoji === '🎉' ? emoji : ''
    )
    .replace(/[\u200D\uFE0E\uFE0F]/gu, '')
    .replace(/\t/gu, '  ')
    .replace(/\r(?!\n)/gu, '\n');

const isFullwidthCodePoint = (codePoint) =>
  codePoint >= 0x1100 &&
  (codePoint <= 0x115f ||
    codePoint === 0x2329 ||
    codePoint === 0x232a ||
    (codePoint >= 0x2e80 && codePoint <= 0x3247 && codePoint !== 0x303f) ||
    (codePoint >= 0x3250 && codePoint <= 0x4dbf) ||
    (codePoint >= 0x4e00 && codePoint <= 0xa4c6) ||
    (codePoint >= 0xa960 && codePoint <= 0xa97c) ||
    (codePoint >= 0xac00 && codePoint <= 0xd7a3) ||
    (codePoint >= 0xf900 && codePoint <= 0xfaff) ||
    (codePoint >= 0xfe10 && codePoint <= 0xfe19) ||
    (codePoint >= 0xfe30 && codePoint <= 0xfe6b) ||
    (codePoint >= 0xff01 && codePoint <= 0xff60) ||
    (codePoint >= 0xffe0 && codePoint <= 0xffe6) ||
    (codePoint >= 0x1b000 && codePoint <= 0x1f251) ||
    (codePoint >= 0x20000 && codePoint <= 0x3fffd));

const getGraphemeWidth = (grapheme) => {
  if (/^\p{Mark}+$/u.test(grapheme)) return 0;
  return isFullwidthCodePoint(grapheme.codePointAt(0)) ? 2 : 1;
};

const wrapLogLine = (line, width) => {
  if (line === '') return [''];

  const wrapped = [];
  let currentLine = '';
  let currentWidth = 0;
  let activeStyles = '';

  for (const token of line.split(ANSI_SGR_SPLIT_PATTERN)) {
    if (!token) continue;

    if (ANSI_SGR_PATTERN.test(token)) {
      currentLine += token;
      if (/^\x1B\[(?:0)?m$/u.test(token)) {
        activeStyles = '';
      } else if (token.slice(2, -1).split(/[;:]/u).includes('0')) {
        activeStyles = token;
      } else {
        activeStyles += token;
      }
      continue;
    }

    for (const { segment } of graphemeSegmenter.segment(token)) {
      const segmentWidth = getGraphemeWidth(segment);
      if (currentWidth > 0 && currentWidth + segmentWidth > width) {
        wrapped.push(currentLine + (activeStyles ? ANSI_RESET : ''));
        currentLine = activeStyles;
        currentWidth = 0;
      }
      currentLine += segment;
      currentWidth += segmentWidth;
    }
  }

  if (currentLine) {
    wrapped.push(currentLine + (activeStyles ? ANSI_RESET : ''));
  }
  return wrapped.length > 0 ? wrapped : [''];
};

const wrapLogLines = (lines, width) => lines.flatMap((line) => wrapLogLine(line, width));

const getLogWidth = (cols, isCommandsTab) =>
  Math.max(1, isCommandsTab ? Math.floor((cols * 2) / 3) - 6 : cols - 6);

const getLogHeight = (rows, isCommandsTab) => Math.max(1, rows - (isCommandsTab ? 10 : 8));

// ── Process configuration ──────────────────────────────────────────
const SERVICE_TABS = [
  { name: 'backend', cmd: 'pnpm', args: ['run', 'dev:backend'] },
  { name: 'frontend', cmd: 'pnpm', args: ['run', 'dev:frontend'] },
  { name: 'prisma studio', cmd: 'pnpm', args: ['run', 'db:studio'] },
];

const COMMANDS = [
  {
    name: 'Reset & Seed DB',
    steps: [
      { cmd: 'pnpm', args: ['exec', 'prisma', 'generate'], cwd: 'certificates-backend' },
      { cmd: 'pnpm', args: ['exec', 'prisma', 'db', 'push', '--force-reset'], cwd: 'certificates-backend' },
      { cmd: 'pnpm', args: ['run', 'db:seed'], cwd: '.' },
    ],
  },
  { name: 'Prisma db push', cmd: 'pnpm', args: ['exec', 'prisma', 'db', 'push'], cwd: 'certificates-backend' },
  { name: 'Prisma generate', cmd: 'pnpm', args: ['exec', 'prisma', 'generate'], cwd: 'certificates-backend' },
  { name: 'Prisma db seed', cmd: 'pnpm', args: ['run', 'db:seed'], cwd: '.' },
  {
    name: 'Build all',
    steps: [
      { cmd: 'pnpm', args: ['run', 'build:backend'], cwd: '.' },
      { cmd: 'pnpm', args: ['run', 'build:frontend'], cwd: '.' },
    ],
  },
  {
    name: 'Run tests',
    steps: [
      { cmd: 'pnpm', args: ['run', 'test:backend'], cwd: '.' },
      { cmd: 'pnpm', args: ['run', 'test:frontend'], cwd: '.' },
    ],
  },
  { name: 'Format code', cmd: 'pnpm', args: ['run', 'format'], cwd: '.' },
];

const COMMANDS_TAB_INDEX = SERVICE_TABS.length;
const TABS = [...SERVICE_TABS, { name: 'commands' }];

const MAX_LINES = 2500;

// Module-level registry of all active child processes (accessible from cleanup)
const activeProcesses = [];
const getCommandSteps = (command) => command.steps ?? [{ cmd: command.cmd, args: command.args, cwd: command.cwd }];

// ── Status constants ───────────────────────────────────────────────
const STATUS = {
  STARTING: 'starting',
  RUNNING: 'running',
  EXITED: 'exited',
};

const COMMAND_STATUS = {
  IDLE: 'idle',
  RUNNING: 'running',
  SUCCESS: 'success',
  FAILED: 'failed',
  STOPPED: 'stopped',
};

const killProcess = (p) => {
  if (!p) return;
  if (process.platform === 'win32' && p.pid) {
    spawnSync('taskkill', ['/pid', p.pid, '/f', '/t']);
  } else {
    try {
      if (p.pid) process.kill(-p.pid, 'SIGTERM');
    } catch {
      try {
        p.kill('SIGTERM');
      } catch {}
    }
  }
};

const STATUS_COLOR = {
  [STATUS.STARTING]: 'yellow',
  [STATUS.RUNNING]: 'green',
  [STATUS.EXITED]: 'red',
};

const COMMAND_STATUS_COLOR = {
  [COMMAND_STATUS.IDLE]: 'gray',
  [COMMAND_STATUS.RUNNING]: 'yellow',
  [COMMAND_STATUS.SUCCESS]: 'green',
  [COMMAND_STATUS.FAILED]: 'red',
  [COMMAND_STATUS.STOPPED]: 'yellow',
};

// ── Keyboard layout helpers (Arabic keyboard support) ─────────────
const ARABIC_DIGIT_MAP = {
  '١': '1',
  '۱': '1',
  '٢': '2',
  '۲': '2',
  '٣': '3',
  '۳': '3',
  '٤': '4',
  '۴': '4',
  '٥': '5',
  '۵': '5',
  '٦': '6',
  '۶': '6',
  '٧': '7',
  '۷': '7',
  '٨': '8',
  '۸': '8',
  '٩': '9',
  '۹': '9',
  '٠': '0',
  '۰': '0',
};

const normalizeDigit = (char) => ARABIC_DIGIT_MAP[char] ?? char;

const isRestartKey = (char) =>
  char === 'r' ||
  char === 'R' ||
  char === 'ق' || // Arabic keyboard layout physical 'R' key (Qaf)
  char === 'ٌ' || // Arabic keyboard layout Shift+'R' (Dammatan)
  char === 'ر'; // Arabic letter Ra (phonetic match)

// ── App component ──────────────────────────────────────────────────
function App() {
  const { stdout } = useStdout();
  const { internal_eventEmitter, isRawModeSupported } = useStdin();
  const { exit } = useApp();
  const [activeTab, setActiveTab] = useState(0);
  const [logs, setLogs] = useState(() => SERVICE_TABS.map(() => []));
  const [statuses, setStatuses] = useState(() => SERVICE_TABS.map(() => STATUS.STARTING));
  const [selectedCommand, setSelectedCommand] = useState(0);
  const [commandLogs, setCommandLogs] = useState(() => COMMANDS.map(() => []));
  const [commandStatuses, setCommandStatuses] = useState(() => COMMANDS.map(() => COMMAND_STATUS.IDLE));
  const [runningCommand, setRunningCommand] = useState(null);
  const [commandInput, setCommandInput] = useState('');
  const [cols, setCols] = useState(stdout.columns || 120);
  const [rows, setRows] = useState(stdout.rows || 30);
  const [scrollOffset, setScrollOffset] = useState(0); // 0 = pinned to bottom
  const processRefs = useRef([]);
  const commandProcessRef = useRef(null);
  const activeTabRef = useRef(0);
  const selectedCommandRef = useRef(0);
  const scrollOffsetRef = useRef(0);

  // Keep refs in sync with state so the raw listener can read them
  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);
  useEffect(() => {
    selectedCommandRef.current = selectedCommand;
  }, [selectedCommand]);
  useEffect(() => {
    scrollOffsetRef.current = scrollOffset;
  }, [scrollOffset]);

  // Track terminal resize
  useEffect(() => {
    const onResize = () => {
      setCols(stdout.columns || 120);
      setRows(stdout.rows || 30);
    };
    stdout.on('resize', onResize);
    return () => stdout.off('resize', onResize);
  }, [stdout]);

  // Enable mouse reporting for wheel scroll
  useEffect(() => {
    if (stdout?.isTTY) {
      process.stdout.write('\x1b[?1000h'); // enable basic mouse
      process.stdout.write('\x1b[?1006h'); // enable SGR extended mode
      return () => {
        process.stdout.write('\x1b[?1000l');
        process.stdout.write('\x1b[?1006l');
      };
    }
  }, [stdout]);

  // Spawn all processes
  const spawnTab = useCallback((i) => {
    const tab = SERVICE_TABS[i];
    const proc = spawn(tab.cmd, tab.args, {
      shell: true,
      cwd: tab.cwd || process.cwd(),
      env: process.env,
      stdio: ['pipe', 'pipe', 'pipe'],
      detached: process.platform !== 'win32',
    });

    activeProcesses.push(proc);
    proc.on('exit', () => {
      const idx = activeProcesses.indexOf(proc);
      if (idx !== -1) activeProcesses.splice(idx, 1);
    });

    const appendLog = (chunk) => {
      const text = normalizeTerminalOutput(chunk);
      setStatuses((prev) => {
        if (prev[i] === STATUS.STARTING || prev[i] === STATUS.EXITED) {
          const next = [...prev];
          next[i] = STATUS.RUNNING;
          return next;
        }
        return prev;
      });

      setLogs((prev) => {
        const next = [...prev];
        const lines = [...next[i]];
        const cleanText = text.replace(/\r?\n$/, '');
        const newLines = cleanText.split(/\r?\n/);
        lines.push(...newLines);
        if (lines.length > MAX_LINES) {
          lines.splice(0, lines.length - MAX_LINES);
        }
        next[i] = lines;
        return next;
      });
    };

    proc.stdout.on('data', appendLog);
    proc.stderr.on('data', appendLog);

    proc.on('exit', (code) => {
      setStatuses((prev) => {
        const next = [...prev];
        next[i] = STATUS.EXITED;
        return next;
      });
      setLogs((prev) => {
        const next = [...prev];
        next[i] = [...next[i], '', `── process exited with code ${code ?? 'unknown'} ──`];
        return next;
      });
    });

    return proc;
  }, []);

  const appendCommandLog = useCallback((commandIndex, chunk) => {
    const text = normalizeTerminalOutput(chunk);

    setCommandLogs((prev) => {
      const next = [...prev];
      const lines = [...next[commandIndex]];
      const cleanText = text.replace(/\r?\n$/, '');
      lines.push(...cleanText.split(/\r?\n/));
      if (lines.length > MAX_LINES) {
        lines.splice(0, lines.length - MAX_LINES);
      }
      next[commandIndex] = lines;
      return next;
    });
  }, []);

  const startCommand = useCallback(
    (commandIndex) => {
      if (commandProcessRef.current) return;

      const command = COMMANDS[commandIndex];
      const steps = getCommandSteps(command);
      const commandText = steps.map(({ cmd, args }) => `${cmd} ${args.join(' ')}`).join(' && ');

      setCommandLogs((prev) => {
        const next = [...prev];
        next[commandIndex] = [`$ ${commandText}`, ''];
        return next;
      });
      setCommandStatuses((prev) => {
        const next = [...prev];
        next[commandIndex] = COMMAND_STATUS.RUNNING;
        return next;
      });
      setCommandInput('');
      setScrollOffset(0);

      const step = steps[0];
      const proc = spawn(step.cmd, step.args, {
        shell: true,
        cwd: step.cwd || process.cwd(),
        env: process.env,
        stdio: ['pipe', 'pipe', 'pipe'],
        detached: process.platform !== 'win32',
      });
      const running = { proc, commandIndex, stopRequested: false };

      commandProcessRef.current = running;
      setRunningCommand(commandIndex);
      activeProcesses.push(proc);
      proc.stdin.write('\n');

      proc.stdout.on('data', (chunk) => appendCommandLog(commandIndex, chunk));
      proc.stderr.on('data', (chunk) => appendCommandLog(commandIndex, chunk));
      proc.stdin.on('error', () => {});

      proc.on('error', (error) => {
        appendCommandLog(commandIndex, `\n── failed to start: ${error.message} ──`);
      });

      proc.on('close', (code, signal) => {
        const idx = activeProcesses.indexOf(proc);
        if (idx !== -1) activeProcesses.splice(idx, 1);

        let finalCode = code;
        if (!running.stopRequested) {
          for (const nextStep of steps.slice(1)) {
            appendCommandLog(commandIndex, `\n$ ${nextStep.cmd} ${nextStep.args.join(' ')}\n`);
            const result = spawnSync(nextStep.cmd, nextStep.args, {
              shell: true,
              cwd: nextStep.cwd || process.cwd(),
              input: '\n',
              stdio: ['pipe', 'inherit', 'inherit'],
            });
            if (result.status !== 0) finalCode = result.status;
          }
        }

        const wasStopped = running.stopRequested;
        const nextStatus = wasStopped
          ? COMMAND_STATUS.STOPPED
          : finalCode === 0
          ? COMMAND_STATUS.SUCCESS
          : COMMAND_STATUS.FAILED;
        const result = wasStopped
          ? 'command stopped'
          : `command exited with code ${finalCode ?? 'unknown'}${signal ? ` (${signal})` : ''}`;

        setCommandStatuses((prev) => {
          const next = [...prev];
          next[commandIndex] = nextStatus;
          return next;
        });
        appendCommandLog(commandIndex, `\n── ${result} ──`);

        if (commandProcessRef.current?.proc === proc) {
          commandProcessRef.current = null;
          setRunningCommand(null);
          setCommandInput('');
        }
      });
    },
    [appendCommandLog]
  );

  useEffect(() => {
    processRefs.current = SERVICE_TABS.map((_, i) => spawnTab(i));

    return () => {
      processRefs.current.forEach(killProcess);
    };
  }, [spawnTab]);

  // ── Raw stdin listener for mouse wheel ──────
  useEffect(() => {
    const handleRawInput = (data) => {
      const str = typeof data === 'string' ? data : data.toString('utf-8');

      // Mouse wheel events (SGR format: \x1b[<64;...M = scroll up, \x1b[<65;...M = scroll down)
      const sgrMatch = str.match(/\x1b\[<(\d+);\d+;\d+[Mm]/);
      if (sgrMatch) {
        const btn = parseInt(sgrMatch[1], 10);
        if (btn === 64) {
          setScrollOffset((prev) => {
            const isCommandsTab = activeTabRef.current === COMMANDS_TAB_INDEX;
            const activeLines = isCommandsTab
              ? commandLogs[selectedCommandRef.current] || []
              : logs[activeTabRef.current] || [];
            const physicalLineCount = wrapLogLines(activeLines, getLogWidth(cols, isCommandsTab)).length;
            const maxScroll = Math.max(0, physicalLineCount - getLogHeight(rows, isCommandsTab));
            return Math.min(prev + 3, maxScroll);
          });
        } else if (btn === 65) {
          setScrollOffset((prev) => Math.max(0, prev - 3));
        }
      }
    };

    internal_eventEmitter?.on('input', handleRawInput);
    return () => {
      internal_eventEmitter?.removeListener('input', handleRawInput);
    };
  }, [cols, commandLogs, internal_eventEmitter, logs, rows]);

  // ── useInput for navigation ──────────────────
  useInput(
    useCallback(
      (input, key) => {
        const running = commandProcessRef.current;
        const selectedIndex = selectedCommandRef.current;
        const isCommandInputActive =
          activeTabRef.current === COMMANDS_TAB_INDEX && running?.commandIndex === selectedIndex;

        // Stop the running one-off command before allowing Ctrl+C to quit.
        if (key.ctrl && (input === 'c' || input === 'C' || input === 'ؤ' || input === 'ء')) {
          if (running) {
            running.stopRequested = true;
            appendCommandLog(running.commandIndex, '\n── stopping command... ──');
            killProcess(running.proc);
            return;
          }

          processRefs.current.forEach(killProcess);
          exit();
          return;
        }

        const normalizedDigit = normalizeDigit(input);
        const num = parseInt(normalizedDigit, 10);
        if (!isCommandInputActive && /^\d$/u.test(normalizedDigit) && num > 0 && num <= TABS.length) {
          setActiveTab(num - 1);
          return;
        }

        if (key.leftArrow) {
          setActiveTab((prev) => (prev > 0 ? prev - 1 : TABS.length - 1));
          return;
        }
        if (key.rightArrow) {
          setActiveTab((prev) => (prev < TABS.length - 1 ? prev + 1 : 0));
          return;
        }

        if (key.tab) {
          setActiveTab((prev) => (prev < TABS.length - 1 ? prev + 1 : 0));
          return;
        }
        if (key.shiftTab) {
          setActiveTab((prev) => (prev > 0 ? prev - 1 : TABS.length - 1));
          return;
        }

        if (activeTabRef.current === COMMANDS_TAB_INDEX) {
          if (key.upArrow) {
            setSelectedCommand((prev) => (prev > 0 ? prev - 1 : COMMANDS.length - 1));
            return;
          }
          if (key.downArrow) {
            setSelectedCommand((prev) => (prev < COMMANDS.length - 1 ? prev + 1 : 0));
            return;
          }

          if (key.return) {
            if (!running) {
              startCommand(selectedIndex);
            } else if (running.commandIndex === selectedIndex) {
              appendCommandLog(selectedIndex, `\n› ${commandInput}`);
              running.proc.stdin.write(`${commandInput}\n`);
              setCommandInput('');
            }
            return;
          }

          if (running?.commandIndex === selectedIndex) {
            if (key.backspace || key.delete) {
              setCommandInput((prev) => prev.slice(0, -1));
              return;
            }
            if (!key.ctrl && !key.meta && input) {
              setCommandInput((prev) => prev + input);
            }
          }
          return;
        }

        if (isRestartKey(input)) {
          const i = activeTabRef.current;
          const oldProc = processRefs.current[i];

          if (oldProc && oldProc._isRestarting) {
            return;
          }

          const startNew = () => {
            setStatuses((prev) => {
              const next = [...prev];
              next[i] = STATUS.STARTING;
              return next;
            });
            setLogs((prev) => {
              const next = [...prev];
              next[i] = [...next[i], '', '── restarting process ──', ''];
              return next;
            });
            processRefs.current[i] = spawnTab(i);
          };

          if (oldProc && oldProc.exitCode === null && oldProc.signalCode === null) {
            oldProc._isRestarting = true;
            setStatuses((prev) => {
              const next = [...prev];
              next[i] = STATUS.STARTING;
              return next;
            });
            setLogs((prev) => {
              const next = [...prev];
              next[i] = [...next[i], '', '── waiting for process to exit... ──'];
              return next;
            });

            oldProc.once('exit', () => {
              startNew();
            });

            killProcess(oldProc);
          } else {
            startNew();
          }
          return;
        }
      },
      [appendCommandLog, commandInput, exit, spawnTab, startCommand]
    ),
    { isActive: Boolean(isRawModeSupported) }
  );

  useEffect(() => {
    setScrollOffset(0);
  }, [activeTab, selectedCommand]);

  const activeLogLength =
    activeTab === COMMANDS_TAB_INDEX ? commandLogs[selectedCommand]?.length : logs[activeTab]?.length;
  useEffect(() => {
    setScrollOffset(0);
  }, [activeLogLength]);

  // ── Layout calculations ────────────────────────────────────────
  const isCommandsTab = activeTab === COMMANDS_TAB_INDEX;
  const activeLines = isCommandsTab ? commandLogs[selectedCommand] || [] : logs[activeTab] || [];
  const contentHeight = getLogHeight(rows, isCommandsTab);
  const logWidth = getLogWidth(cols, isCommandsTab);
  const physicalLines = useMemo(() => wrapLogLines(activeLines, logWidth), [activeLines, logWidth]);
  const totalLines = physicalLines.length;
  const bottomStart = Math.max(0, totalLines - contentHeight);
  const scrollStart = Math.max(0, bottomStart - scrollOffset);
  const visibleLines = physicalLines.slice(scrollStart, scrollStart + contentHeight);
  const isScrolledUp = scrollOffset > 0;

  // ── Build tab bar items ────────────────────────────────────────
  const tabElements = TABS.map((tab, i) => {
    const isActive = i === activeTab;
    const statusColor =
      i === COMMANDS_TAB_INDEX
        ? runningCommand !== null
          ? COMMAND_STATUS_COLOR[COMMAND_STATUS.RUNNING]
          : COMMAND_STATUS_COLOR[commandStatuses[selectedCommand]]
        : STATUS_COLOR[statuses[i]];

    return h(
      Box,
      {
        key: tab.name,
        paddingX: 1,
        marginRight: 1,
        borderStyle: 'round',
        borderColor: isActive ? 'cyanBright' : undefined,
      },
      h(
        Text,
        {
          bold: true,
          color: isActive ? 'cyanBright' : undefined,
        },
        h(Text, { color: statusColor }, '● '),
        ` ${i + 1} ${tab.name.toUpperCase()}`
      )
    );
  });

  // ── Build log lines ────────────────────────────────────────────
  const logElements =
    visibleLines.length === 0
      ? h(
          Box,
          { flexGrow: 1, justifyContent: 'center', alignItems: 'center' },
          h(Text, { dimColor: true }, 'Waiting for output...')
        )
      : visibleLines.map((line, i) => h(Text, { key: i, wrap: 'truncate-end' }, line === '' ? ' ' : line));

  const commandMenuElements = COMMANDS.map((command, i) => {
    const isSelected = i === selectedCommand;
    const status = commandStatuses[i];
    const statusIcon =
      status === COMMAND_STATUS.SUCCESS
        ? '✓'
        : status === COMMAND_STATUS.FAILED
        ? '✕'
        : status === COMMAND_STATUS.RUNNING
        ? '●'
        : status === COMMAND_STATUS.STOPPED
        ? '■'
        : '○';

    return h(
      Box,
      {
        key: command.name,
        paddingX: 1,
        backgroundColor: isSelected ? 'blue' : undefined,
      },
      h(
        Text,
        {
          bold: isSelected,
          color: 'white',
        },
        `${isSelected ? '›' : ' '} ${statusIcon} ${command.name}`
      )
    );
  });

  // ── Mode indicator (Status Bar) ────────────────────────────────
  const scrollIndicator = isScrolledUp
    ? h(Text, { color: 'black', backgroundColor: 'yellow', bold: true }, ` SCROLLED ↑${scrollOffset} `)
    : h(Text, { color: 'black', dimColor: true }, ` ${activeLines.length} LINES `);

  const statusHelp = isCommandsTab
    ? ` ↑/↓ Select  •  Enter Run/Send  •  1-${TABS.length}, ←/→ Tabs  •  Shift+Drag Copy  •  Ctrl+C Stop/Quit `
    : ` Tab, 1-${TABS.length}, ←/→ Switch Tabs  •  r Restart Tab  •  Mouse Scroll  •  Shift+Drag Copy  •  Ctrl+C Quit `;

  const statusBar = h(
    Box,
    {
      flexDirection: 'row',
      backgroundColor: 'cyan',
      flexShrink: 0,
      overflow: 'hidden',
    },
    h(Box, { backgroundColor: 'cyanBright', paddingX: 1 }, h(Text, { bold: true, color: 'black' }, statusHelp)),
    h(Box, { flexGrow: 1 }),
    scrollIndicator
  );

  const serviceOutputPane = !isCommandsTab
    ? h(
        Box,
        {
          flexDirection: 'column',
          flexGrow: 1,
          borderStyle: 'round',
          borderColor: 'cyan',
          paddingX: 1,
          overflow: 'hidden',
        },
        h(
          Box,
          { flexDirection: 'row', paddingBottom: 1 },
          h(Text, { color: STATUS_COLOR[statuses[activeTab]] }, '● '),
          h(Text, { bold: true, color: 'white' }, SERVICE_TABS[activeTab].name.toUpperCase()),
          h(Text, { dimColor: true }, `  ›  ${SERVICE_TABS[activeTab].cmd} ${SERVICE_TABS[activeTab].args.join(' ')}`),
          h(Box, { flexGrow: 1 }),
          h(Text, { dimColor: true }, `Status: ${statuses[activeTab]}`)
        ),
        h(Box, { flexDirection: 'column', flexGrow: 1, flexShrink: 1, overflowY: 'hidden' }, logElements)
      )
    : null;

  const selectedCommandConfig = COMMANDS[selectedCommand];
  const selectedCommandStatus = commandStatuses[selectedCommand];
  const selectedCommandIsRunning = runningCommand === selectedCommand;
  const anotherCommandIsRunning = runningCommand !== null && !selectedCommandIsRunning;

  const commandsOutputPane = isCommandsTab
    ? h(
        Box,
        { flexDirection: 'row', flexGrow: 1, flexShrink: 1, overflow: 'hidden' },
        h(
          Box,
          {
            width: '33%',
            flexDirection: 'column',
            borderStyle: 'round',
            borderColor: 'magenta',
            paddingX: 1,
            overflow: 'hidden',
          },
          h(Text, { bold: true, color: 'magenta', underline: true }, 'COMMON COMMANDS'),
          h(Text, { dimColor: true }, 'Use ↑/↓ to select, then Enter to run'),
          h(Box, { height: 1 }),
          ...commandMenuElements,
          h(Box, { flexGrow: 1 }),
          runningCommand !== null
            ? h(Text, { color: 'yellow' }, `Running: ${COMMANDS[runningCommand].name}`)
            : h(Text, { dimColor: true }, 'No command is running')
        ),
        h(
          Box,
          {
            flexGrow: 1,
            flexDirection: 'column',
            borderStyle: 'round',
            borderColor: selectedCommandIsRunning ? 'yellow' : 'cyan',
            paddingX: 1,
            overflow: 'hidden',
          },
          h(
            Box,
            { flexDirection: 'row' },
            h(Text, { bold: true, color: 'cyanBright' }, selectedCommandConfig.name),
            h(Box, { flexGrow: 1 }),
            h(Text, { color: COMMAND_STATUS_COLOR[selectedCommandStatus] }, selectedCommandStatus.toUpperCase())
          ),
          h(
            Text,
            { dimColor: true },
            `$ ${getCommandSteps(selectedCommandConfig)
              .map(({ cmd, args }) => `${cmd} ${args.join(' ')}`)
              .join(' && ')}`
          ),
          h(Box, { height: 1 }),
          h(Box, { flexDirection: 'column', flexGrow: 1, flexShrink: 1, overflowY: 'hidden' }, logElements),
          selectedCommandIsRunning
            ? h(
                Box,
                { flexDirection: 'row' },
                h(Text, { bold: true, color: 'cyanBright' }, '> '),
                h(Text, null, commandInput),
                h(Text, { color: 'cyanBright' }, '█')
              )
            : anotherCommandIsRunning
            ? h(Text, { color: 'yellow' }, `${COMMANDS[runningCommand].name} is currently running`)
            : h(Text, { dimColor: true }, 'Press Enter to run this command')
        )
      )
    : null;

  return h(
    Box,
    { flexDirection: 'column', width: cols, height: rows, overflow: 'hidden' },
    h(
      Box,
      {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 0,
        flexShrink: 0,
        overflow: 'hidden',
      },
      h(
        Box,
        {
          paddingX: 1,
          marginRight: 2,
          borderStyle: 'round',
          borderColor: 'magenta',
        },
        h(Text, { bold: true, color: 'magenta' }, '🚀 CERTIFICATES')
      ),
      ...tabElements
    ),
    serviceOutputPane,
    commandsOutputPane,
    statusBar
  );
}

// ── Entry point ────────────────────────────────────────────────────
const app = render(h(App), { exitOnCtrlC: false });

let isCleaningUp = false;
const cleanup = (code = 0) => {
  if (isCleaningUp) return;
  isCleaningUp = true;

  activeProcesses.forEach(killProcess);
  activeProcesses.length = 0;

  try {
    app.unmount();
  } catch {}

  process.exit(typeof code === 'number' ? code : 1);
};

process.on('SIGINT', () => cleanup(0));
process.on('SIGTERM', () => cleanup(0));
process.on('SIGHUP', () => cleanup(0));
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception, shutting down child processes...', err);
  cleanup(1);
});
process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection, shutting down child processes...', err);
  cleanup(1);
});
