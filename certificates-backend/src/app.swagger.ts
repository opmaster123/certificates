import { applyDecorators } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

export const ApiAppTags = () => ApiTags('App');

export const ApiGetHelloDoc = () =>
  applyDecorators(
    ApiOperation({ summary: 'Get hello greeting' }),
    ApiResponse({
      status: 200,
      description: 'Return a simple hello greeting.',
      type: String,
    }),
  );
