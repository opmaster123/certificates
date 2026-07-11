import {
  Injectable,
  ConflictException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterProfile, UpdateProfile, ChangePasswordData } from '@shared/dtos-and-types/auth';
import * as bcrypt from 'bcrypt';
import * as express from 'express';

const ENGLISH_NAME_REGEX = /^[A-Za-z\s'-]+$/;

function safeUser(user: any) {
  if (!user) return null;
  const { password, ...result } = user;
  return result;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async getMe(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });
    return safeUser(user);
  }

  async register(data: RegisterProfile, response: express.Response) {
    const existing = await this.prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existing) {
      throw new ConflictException('البريد الإلكتروني مسجل بالفعل');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const firstName = data.firstName?.trim() || '';
    const lastName = data.lastName?.trim() || '';

    if (!firstName || !ENGLISH_NAME_REGEX.test(firstName)) {
      throw new BadRequestException(
        'الاسم الأول يجب أن يكون بالأحرف الإنجليزية فقط',
      );
    }
    if (!lastName || !ENGLISH_NAME_REGEX.test(lastName)) {
      throw new BadRequestException(
        'اسم العائلة يجب أن يكون بالأحرف الإنجليزية فقط',
      );
    }

    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        firstName,
        lastName,
        avatar: data.avatar || null,
        phoneNumber: data.phoneNumber || null,
        birthDate: data.birthDate ? new Date(data.birthDate) : null,
        jobTitle: data.jobTitle || null,
        company: data.company || null,
        experienceYears:
          data.experienceYears !== undefined &&
          data.experienceYears !== null &&
          String(data.experienceYears) !== ''
            ? parseInt(String(data.experienceYears))
            : null,
      },
    });

    const payload = { sub: user.id, email: user.email };
    const access_token = this.jwtService.sign(payload);

    // Set cookie containing the JWT token
    response.cookie('token', access_token, {
      httpOnly: true, // Prevents XSS attacks from accessing the token
      secure: false, // Set to true in production over HTTPS
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    });

    return { success: true };
  }

  async login(data: any, response: express.Response) {
    const user = await this.prisma.user.findUnique({
      where: { email: data.email },
    });
    if (!user) {
      throw new UnauthorizedException(
        'البريد الإلكتروني أو كلمة المرور غير صحيحة',
      );
    }

    const isMatch = await bcrypt.compare(data.password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException(
        'البريد الإلكتروني أو كلمة المرور غير صحيحة',
      );
    }

    const payload = { sub: user.id, email: user.email };
    const access_token = this.jwtService.sign(payload);

    // Set cookie containing the JWT token
    response.cookie('token', access_token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return { success: true };
  }

  async logout(response: express.Response) {
    // Clear the token cookie
    response.cookie('token', '', {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
      expires: new Date(0), // Set expiration date in the past to delete the cookie
    });

    return { success: true };
  }

  async updateProfile(userId: string, data: UpdateProfile) {
    const firstName = data.firstName?.trim();
    const lastName = data.lastName?.trim();

    if (
      firstName !== undefined &&
      firstName !== null &&
      firstName !== ''
    ) {
      if (!ENGLISH_NAME_REGEX.test(firstName)) {
        throw new BadRequestException(
          'الاسم الأول يجب أن يكون بالأحرف الإنجليزية فقط',
        );
      }
    }
    if (lastName !== undefined && lastName !== null && lastName !== '') {
      if (!ENGLISH_NAME_REGEX.test(lastName)) {
        throw new BadRequestException(
          'اسم العائلة يجب أن يكون بالأحرف الإنجليزية فقط',
        );
      }
    }

    const updateData: any = {};
    if (firstName !== undefined && firstName !== null)
      updateData.firstName = firstName;
    if (lastName !== undefined && lastName !== null)
      updateData.lastName = lastName;
    if (data.email !== undefined && data.email !== null)
      updateData.email = data.email.trim();
    if (data.avatar !== undefined) updateData.avatar = data.avatar || null;
    if (data.phoneNumber !== undefined)
      updateData.phoneNumber = data.phoneNumber || null;
    if (data.birthDate !== undefined) {
      updateData.birthDate = data.birthDate ? new Date(data.birthDate) : null;
    }
    if (data.jobTitle !== undefined)
      updateData.jobTitle = data.jobTitle || null;
    if (data.company !== undefined) updateData.company = data.company || null;
    if (data.experienceYears !== undefined) {
      updateData.experienceYears =
        data.experienceYears !== null && String(data.experienceYears) !== ''
          ? parseInt(String(data.experienceYears))
          : null;
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    return safeUser(user);
  }

  async changePassword(userId: string, data: ChangePasswordData) {
    if (!data.currentPassword || !data.newPassword) {
      throw new BadRequestException('يرجى توفير كلمة المرور الحالية والجديدة');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new UnauthorizedException('المستخدم غير موجود');
    }

    const isMatch = await bcrypt.compare(data.currentPassword, user.password);
    if (!isMatch) {
      throw new BadRequestException('كلمة المرور الحالية غير صحيحة');
    }

    const hashedPassword = await bcrypt.hash(data.newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { success: true, message: 'تم تحديث كلمة المرور بنجاح' };
  }
}
