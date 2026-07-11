import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService, // Inject Prisma directly
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromCookie(request);

    if (!token) {
      throw new UnauthorizedException('لم يتم تقديم رمز المصادقة في ملفات التعريف (Cookies)');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET || 'fallbackSecretKey',
      });

      // Query database directly inside the Guard
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });
      if (!user) {
        throw new UnauthorizedException('المستخدم غير موجود');
      }

      // Inject only the user ID into the request context
      request['user'] = { id: user.id };
    } catch {
      throw new UnauthorizedException('رمز المصادقة غير صالح أو منتهي الصلاحية');
    }

    return true;
  }

  private extractTokenFromCookie(request: Request): string | undefined {
    const cookieHeader = request.headers.cookie;
    if (!cookieHeader) return undefined;

    const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.split('=').map((c) => c.trim());
      if (key) acc[key] = value;
      return acc;
    }, {} as Record<string, string>);

    return cookies['token'];
  }
}
