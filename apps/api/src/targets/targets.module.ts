import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { TargetsController } from './targets.controller';
import { TargetsService } from './targets.service';
import { ScansModule } from '../scans/scans.module';
import { FindingsModule } from '../findings/findings.module';

@Module({
  imports: [PrismaModule, forwardRef(() => ScansModule), forwardRef(() => FindingsModule)],
  controllers: [TargetsController],
  providers: [TargetsService],
  exports: [TargetsService],
})
export class TargetsModule {}
