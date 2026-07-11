import { applyDecorators } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';

export const ApiAuthTags = () => ApiTags('Auth');

export const ApiGetProfileDoc = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'Get current user profile' }),
    ApiResponse({ status: 200, description: 'Returns the logged-in user profile.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );

export const ApiRegisterDoc = () =>
  applyDecorators(
    ApiOperation({ summary: 'Register a new user' }),
    ApiBody({
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
    }),
    ApiResponse({ status: 201, description: 'User successfully registered.' }),
    ApiResponse({ status: 409, description: 'Email already exists.' }),
  );

export const ApiLoginDoc = () =>
  applyDecorators(
    ApiOperation({ summary: 'Login user' }),
    ApiBody({
      schema: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', example: 'user@example.com' },
          password: { type: 'string', example: 'password123' },
        },
      },
    }),
    ApiResponse({ status: 200, description: 'User successfully logged in.' }),
    ApiResponse({ status: 401, description: 'Invalid credentials.' }),
  );

export const ApiLogoutDoc = () =>
  applyDecorators(
    ApiOperation({ summary: 'Logout user (clears the token cookie)' }),
    ApiResponse({ status: 200, description: 'User successfully logged out.' }),
  );

export const ApiUpdateProfileDoc = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'Update user profile' }),
    ApiBody({
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
    }),
    ApiResponse({ status: 200, description: 'Returns the updated user profile.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );

export const ApiChangePasswordDoc = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'Change user password' }),
    ApiBody({
      schema: {
        type: 'object',
        required: ['currentPassword', 'newPassword'],
        properties: {
          currentPassword: { type: 'string', example: 'password123' },
          newPassword: { type: 'string', example: 'newPassword123' },
        },
      },
    }),
    ApiResponse({ status: 200, description: 'Password successfully updated.' }),
    ApiResponse({ status: 400, description: 'Invalid current password.' }),
  );
