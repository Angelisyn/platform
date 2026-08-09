import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ScansController } from './scans.controller';
import { ScansService } from './scans.service';
import { LocalScannerService } from './local-scanner.service';
import { ScannerParserService } from './scanner-parser.service';
import { TargetsModule } from '../targets/targets.module';
import { FindingsModule } from '../findings/findings.module';

@Module({
  imports: [PrismaModule, forwardRef(() => TargetsModule), forwardRef(() => FindingsModule)],
  controllers: [ScansController],
  providers: [ScansService, LocalScannerService, ScannerParserService],
  exports: [ScansService, LocalScannerService, ScannerParserService],
})
export class ScansModule {}
