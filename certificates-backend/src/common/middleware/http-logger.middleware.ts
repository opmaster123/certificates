import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

function sanitizePayload(body: any): any {
  if (!body || typeof body !== 'object') return body;
  if (Array.isArray(body)) {
    return body.map((item) => sanitizePayload(item));
  }
  const sanitized: Record<string, any> = {};
  const sensitiveKeys = [
    'password',
    'newpassword',
    'currentpassword',
    'oldpassword',
    'token',
    'refreshtoken',
    'secret',
  ];
  for (const [key, value] of Object.entries(body)) {
    if (sensitiveKeys.includes(key.toLowerCase())) {
      sanitized[key] = '***';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizePayload(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

function isStaticAsset(url: string): boolean {
  return (
    url.startsWith('/assets/') ||
    /\.(css|js|map|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/i.test(url)
  );
}

@Injectable()
export class HttpLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction): void {
    const { method, originalUrl } = req;
    const start = Date.now();
    const staticAsset = isStaticAsset(originalUrl);

    // For non-static mutating requests (POST, PUT, PATCH, DELETE), log the incoming action
    if (!staticAsset && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      const sanitized = sanitizePayload(req.body);
      const bodyStr =
        sanitized && Object.keys(sanitized).length > 0
          ? ` [Body: ${JSON.stringify(sanitized)}]`
          : '';
      this.logger.log(`--> [ACTION] ${method} ${originalUrl}${bodyStr}`);
    }

    res.on('finish', () => {
      const { statusCode } = res;
      const duration = Date.now() - start;
      const contentLength = res.get('content-length') || '0';

      const user = (req as any).user;
      const userTag = user?.id
        ? ` [User: ${user.email || user.id}]`
        : '';

      const logMessage = `<-- ${method} ${originalUrl} ${statusCode} (${duration}ms) [Size: ${contentLength}b]${userTag}`;

      if (statusCode >= 500) {
        this.logger.error(logMessage);
      } else if (statusCode >= 400) {
        this.logger.warn(logMessage);
      } else if (!staticAsset) {
        this.logger.log(logMessage);
      }
    });

    next();
  }
}
