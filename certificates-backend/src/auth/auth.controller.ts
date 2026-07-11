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
import type { RegisterProfile, UpdateProfile, ChangePasswordData } from '@shared/dtos-and-types/auth';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from './jwt-auth.guard';
import * as express from 'express';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: 200,
    description: 'Returns the logged-in user profile.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async getProfile(@Request() req: any) {
    return this.authService.getMe(req.user.id);
  }

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['email', 'password', 'firstName', 'lastName'],
      properties: {
        email: { type: 'string', example: 'user@example.com' },
        password: { type: 'string', example: 'password123' },
        firstName: { type: 'string', example: 'Mohammed' },
        lastName: { type: 'string', example: 'Ali' },
        jobTitle: { type: 'string', example: 'Auditor' },
        company: { type: 'string', example: 'Acme Corp' },
        experienceYears: { type: 'number', example: 5 },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'User successfully registered.' })
  @ApiResponse({ status: 409, description: 'Email already exists.' })
  async register(
    @Body() body: RegisterProfile,
    @Res({ passthrough: true }) response: express.Response,
  ) {
    return this.authService.register(body, response);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login user' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['email', 'password'],
      properties: {
        email: { type: 'string', example: 'user@example.com' },
        password: { type: 'string', example: 'password123' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'User successfully logged in.' })
  @ApiResponse({ status: 401, description: 'Invalid credentials.' })
  async login(
    @Body() body: any,
    @Res({ passthrough: true }) response: express.Response,
  ) {
    return this.authService.login(body, response);
  }

  @Post('logout')
  @ApiOperation({ summary: 'Logout user (clears the token cookie)' })
  @ApiResponse({ status: 200, description: 'User successfully logged out.' })
  async logout(@Res({ passthrough: true }) response: express.Response) {
    return this.authService.logout(response);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Patch('profile')
  @ApiOperation({ summary: 'Update user profile' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        firstName: { type: 'string', example: 'Mohammed' },
        lastName: { type: 'string', example: 'Ali' },
        phoneNumber: { type: 'string', example: '+966500000000' },
        jobTitle: { type: 'string', example: 'Senior Auditor' },
        company: { type: 'string', example: 'Acme Corp' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Returns the updated user profile.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async updateProfile(@Request() req: any, @Body() body: UpdateProfile) {
    return this.authService.updateProfile(req.user.id, body);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Patch('change-password')
  @ApiOperation({ summary: 'Change user password' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['currentPassword', 'newPassword'],
      properties: {
        currentPassword: { type: 'string', example: 'password123' },
        newPassword: { type: 'string', example: 'newPassword123' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Password successfully updated.' })
  @ApiResponse({ status: 400, description: 'Invalid current password.' })
  async changePassword(@Request() req: any, @Body() body: ChangePasswordData) {
    return this.authService.changePassword(req.user.id, body);
  }
}
