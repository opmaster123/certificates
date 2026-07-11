import { Controller, Get, Param, UseGuards, Req, Query } from '@nestjs/common';
import { CertificatesService } from './certificates.service';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiQuery,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CertificateResponseDto } from '@shared/dtos-and-types/certificate-response.dto';

@ApiTags('Certificates')
@Controller('certificates')
export class CertificatesController {
  constructor(private readonly certificatesService: CertificatesService) {}

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Retrieve paginated certificates belonging to the signed-in user',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'cert',
    required: false,
    type: String,
    description: 'Filter by cert type(s), comma-separated',
  })
  @ApiResponse({
    status: 200,
    description: 'Certificates retrieved successfully.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  findMyCertificates(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('cert') cert?: string,
  ) {
    return this.certificatesService.findMyCertificates(req.user.id, {
      page: page ? parseInt(page, 10) : undefined,
      cert,
    });
  }

  @Get(':identifier')
  @ApiOperation({
    summary: 'Retrieve a certificate by ULID ID or public Certificate Number',
  })
  @ApiParam({
    name: 'identifier',
    description:
      'Certificate ULID ID or public Certificate Number (e.g., KH12345678)',
  })
  @ApiResponse({
    status: 200,
    description: 'Certificate retrieved successfully.',
    type: CertificateResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Certificate not found.' })
  findOne(@Param('identifier') identifier: string) {
    return this.certificatesService.findOne(identifier);
  }
}
