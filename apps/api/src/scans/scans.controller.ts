import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  UseGuards,
  forwardRef,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { ScansService } from './scans.service';
import { CreateScanDto } from './dto/create-scan.dto';
import { FindingsService } from '../findings/findings.service';

@UseGuards(JwtAuthGuard)
@Controller('scans')
export class ScansController {
  constructor(
    private readonly scansService: ScansService,
    @Inject(forwardRef(() => FindingsService))
    private readonly findingsService: FindingsService,
  ) {}

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.scansService.findAllForUser(user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.scansService.findOneForUser(id, user.id);
  }

  @Get(':scanId/findings')
  findFindingsForScan(
    @Param('scanId') scanId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.findingsService.findByScanForUser(scanId, user.id);
  }

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateScanDto) {
    return this.scansService.createForUser(user.id, dto);
  }

  @Post(':id/cancel')
  cancel(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.scansService.cancelForUser(id, user.id);
  }
}
