import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  UseGuards,
  forwardRef,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { TargetsService } from './targets.service';
import { CreateTargetDto } from './dto/create-target.dto';
import { UpdateTargetDto } from './dto/update-target.dto';
import { ScansService } from '../scans/scans.service';
import { FindingsService } from '../findings/findings.service';

@UseGuards(JwtAuthGuard)
@Controller('targets')
export class TargetsController {
  constructor(
    private readonly targetsService: TargetsService,
    @Inject(forwardRef(() => ScansService))
    private readonly scansService: ScansService,
    @Inject(forwardRef(() => FindingsService))
    private readonly findingsService: FindingsService,
  ) {}

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.targetsService.findAllForUser(user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.targetsService.findOneForUser(id, user.id);
  }

  @Get(':targetId/scans')
  findScansForTarget(
    @Param('targetId') targetId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.scansService.findByTargetForUser(targetId, user.id);
  }

  @Get(':targetId/findings')
  findFindingsForTarget(
    @Param('targetId') targetId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.findingsService.findByTargetForUser(targetId, user.id);
  }

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateTargetDto) {
    return this.targetsService.createForUser(user.id, dto);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateTargetDto,
  ) {
    return this.targetsService.updateForUser(id, user.id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.targetsService.removeForUser(id, user.id);
  }
}
