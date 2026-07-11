import {
  Controller,
  Post,
  Body,
  Get,
  Patch,
  UseGuards,
  Request,
  Res,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import type {
  RegisterProfile,
  UpdateProfile,
  ChangePasswordData,
  LoginCredentials,
} from '@shared/dtos-and-types';
import * as express from 'express';
import {
  ApiAuthTags,
  ApiGetProfileDoc,
  ApiRegisterDoc,
  ApiLoginDoc,
  ApiLogoutDoc,
  ApiUpdateProfileDoc,
  ApiChangePasswordDoc,
} from './auth.swagger';

@ApiAuthTags()
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiGetProfileDoc()
  async getProfile(@Request() req: any) {
    return this.authService.getMe(req.user.id);
  }

  @Post('register')
  @ApiRegisterDoc()
  async register(
    @Body() body: RegisterProfile,
    @Res({ passthrough: true }) response: express.Response,
  ) {
    return this.authService.register(body, response);
  }

  @Post('login')
  @ApiLoginDoc()
  async login(
    @Body() body: LoginCredentials,
    @Res({ passthrough: true }) response: express.Response,
  ) {
    return this.authService.login(body, response);
  }

  @Post('logout')
  @ApiLogoutDoc()
  async logout(@Res({ passthrough: true }) response: express.Response) {
    return this.authService.logout(response);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  @ApiUpdateProfileDoc()
  async updateProfile(@Request() req: any, @Body() body: UpdateProfile) {
    return this.authService.updateProfile(req.user.id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('change-password')
  @ApiChangePasswordDoc()
  async changePassword(@Request() req: any, @Body() body: ChangePasswordData) {
    return this.authService.changePassword(req.user.id, body);
  }
}
