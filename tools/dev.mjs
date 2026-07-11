#!/usr/bin/env node

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { render, Box, Text, useInput, useStdout, useApp } from 'ink';
import { spawn, spawnSync } from 'node:child_process';

const h = React.createElement;

const TABS = [
  { name: 'backend', cmd: 'pnpm', args: ['run', 'dev:backend'], cwd: '.' },
  { name: 'frontend', cmd: 'pnpm', args: ['run', 'dev:frontend'], cwd: '.' },
  { name: 'prisma studio', cmd: 'npx', args: ['prisma', 'studio', '--browser', 'none'], cwd: 'certificates-backend' },
];

const MAX_LINES = 1000;
const activeProcesses = [];

const STATUS = {
  STARTING: 'starting',
  RUNNING: 'running',
  EXITED: 'exited',
};

const STATUS_COLOR = {
  [STATUS.STARTING]: 'yellow',
  [STATUS.RUNNING]: 'green',
  [STATUS.EXITED]: 'red',
};

function InteractiveKeys({ onKey }) {
  useInput(onKey);
  return null;
}

function App() {
  const { stdout } = useStdout();
  const { exit } = useApp();
  const [activeTab, setActiveTab] = useState(0);
  const [logs, setLogs] = useState(() => TABS.map(() => []));
  const [statuses, setStatuses] = useState(() => TABS.map(() => STATUS.STARTING));
  const [rows, setRows] = useState(stdout.rows || 30);
  const processRefs = useRef([]);

  // Track window resizing
  useEffect(() => {
    const onResize = () => setRows(stdout.rows || 30);
    stdout.on('resize', onResize);
    return () => stdout.off('resize', onResize);
  }, [stdout]);

  // Kill a child process cleanly
  const killProcess = (p) => {
    if (!p) return;
    if (process.platform === 'win32' && p.pid) {
      spawnSync('taskkill', ['/pid', p.pid, '/f', '/t']);
    } else {
      try {
        if (p.pid) process.kill(-p.pid, 'SIGTERM');
      } catch {
        try { p.kill('SIGTERM'); } catch {}
      }
    }
  };

  // Spawn process for a specific tab
  const spawnTab = useCallback((i) => {
    const tab = TABS[i];
    const proc = spawn(tab.cmd, tab.args, {
      shell: true,
      cwd: tab.cwd,
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
      const text = chunk.toString('utf-8');
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
        const newLines = text.replace(/\r?\n$/, '').split(/\r?\n/);
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
        next[i] = [...next[i], `── process exited with code ${code ?? 'unknown'} ──`];
        return next;
      });
    });

    return proc;
  }, []);

  // Spawn all tabs on start and clean up on exit
  useEffect(() => {
    processRefs.current = TABS.map((_, i) => spawnTab(i));
    return () => processRefs.current.forEach(killProcess);
  }, [spawnTab]);

  // Handle keys
  const handleInput = useCallback((input, key) => {
    const num = parseInt(input, 10);
    if (!isNaN(num) && num > 0 && num <= TABS.length) {
      setActiveTab(num - 1);
    } else if (key.leftArrow || key.shiftTab) {
      setActiveTab((prev) => (prev > 0 ? prev - 1 : TABS.length - 1));
    } else if (key.rightArrow || key.tab) {
      setActiveTab((prev) => (prev < TABS.length - 1 ? prev + 1 : 0));
    } else if (input === 'r') {
      const i = activeTab;
      const oldProc = processRefs.current[i];
      setStatuses((prev) => {
        const next = [...prev];
        next[i] = STATUS.STARTING;
        return next;
      });
      setLogs((prev) => {
        const next = [...prev];
        next[i] = [...next[i], '── restarting process ──'];
        return next;
      });
      killProcess(oldProc);
      processRefs.current[i] = spawnTab(i);
    } else if (key.ctrl && input === 'c') {
      processRefs.current.forEach(killProcess);
      exit();
    }
  }, [activeTab, exit, spawnTab]);

  // Calculate layout
  const contentHeight = rows - 6;
  const activeLines = logs[activeTab] || [];
  const visibleLines = activeLines.slice(-contentHeight);

  const isTTY = process.stdin.isTTY;

  return h(
    Box,
    { flexDirection: 'column', height: rows },
    isTTY && h(InteractiveKeys, { onKey: handleInput }),
    // Header
    h(
      Box,
      { flexDirection: 'row', alignItems: 'center', marginBottom: 1 },
      h(
        Box,
        { paddingX: 1, marginRight: 2, borderStyle: 'round', borderColor: 'magenta' },
        h(Text, { bold: true, color: 'magenta' }, '🚀 CERTIFICATES')
      ),
      ...TABS.map((tab, i) =>
        h(
          Box,
          {
            key: tab.name,
            paddingX: 1,
            marginRight: 1,
            borderStyle: 'round',
            borderColor: i === activeTab ? 'cyanBright' : undefined,
          },
          h(
            Text,
            { bold: true, color: i === activeTab ? 'cyanBright' : undefined },
            h(Text, { color: STATUS_COLOR[statuses[i]] }, '● '),
            `${i + 1} ${tab.name.toUpperCase()}`
          )
        )
      )
    ),
    // Logs Pane
    h(
      Box,
      {
        flexDirection: 'column',
        flexGrow: 1,
        borderStyle: 'round',
        borderColor: 'cyan',
        paddingX: 1,
      },
      // Command info line
      h(
        Box,
        { flexDirection: 'row', paddingBottom: 1 },
        h(Text, { color: STATUS_COLOR[statuses[activeTab]] }, '● '),
        h(Text, { bold: true }, TABS[activeTab].name.toUpperCase()),
        h(Text, { dimColor: true }, `  ›  ${TABS[activeTab].cmd} ${TABS[activeTab].args.join(' ')}`),
        h(Box, { flexGrow: 1 }),
        h(Text, { dimColor: true }, `Status: ${statuses[activeTab]}`)
      ),
      // Log output area
      h(
        Box,
        { flexDirection: 'column', flexGrow: 1 },
        visibleLines.length === 0
          ? h(Box, { flexGrow: 1, justifyContent: 'center', alignItems: 'center' }, h(Text, { dimColor: true }, 'Waiting for output...'))
          : visibleLines.map((line, i) => h(Text, { key: i, wrap: 'wrap' }, line === '' ? ' ' : line))
      )
    ),
    // Status Bar
    h(
      Box,
      { flexDirection: 'row', backgroundColor: 'cyan' },
      h(
        Box,
        { backgroundColor: 'cyanBright', paddingX: 1 },
        h(Text, { bold: true, color: 'black' }, ' Tab/1-3/←/→ Switch  •  r Restart  •  Ctrl+C Exit ')
      ),
      h(Box, { flexGrow: 1 }),
      h(Text, { color: 'black', dimColor: true }, ` ${activeLines.length} LINES `)
    )
  );
}

const app = render(h(App), { exitOnCtrlC: false });

const cleanup = () => {
  activeProcesses.forEach((p) => {
    if (process.platform === 'win32' && p.pid) {
      spawnSync('taskkill', ['/pid', p.pid, '/f', '/t']);
    } else {
      try { if (p.pid) process.kill(-p.pid, 'SIGTERM'); } catch {}
    }
  });
  try { app.unmount(); } catch {}
  process.exit(0);
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
