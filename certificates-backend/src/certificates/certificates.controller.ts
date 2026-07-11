import { Controller, Get, Patch, Param, Body, UseGuards, Req, Query } from '@nestjs/common';
import { CertificatesService } from './certificates.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { UpdateCertificateDatesDto } from '@shared/dtos-and-types';
import {
  ApiCertificatesTags,
  ApiFindMyCertificatesDoc,
  ApiFindOneCertificateDoc,
  ApiUpdateCertificateDatesDoc,
} from './certificates.swagger';

@ApiCertificatesTags()
@Controller('certificates')
export class CertificatesController {
  constructor(private readonly certificatesService: CertificatesService) {}

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiFindMyCertificatesDoc()
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
  @ApiFindOneCertificateDoc()
  findOne(@Param('identifier') identifier: string) {
    return this.certificatesService.findOne(identifier);
  }

  @Patch(':id/dates')
  @UseGuards(JwtAuthGuard)
  @ApiUpdateCertificateDatesDoc()
  updateDates(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: UpdateCertificateDatesDto,
  ) {
    return this.certificatesService.updateDates(req.user.id, id, body);
  }
}

