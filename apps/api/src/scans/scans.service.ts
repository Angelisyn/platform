import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateScanDto } from './dto/create-scan.dto';
import { ScanStatus, ScanExecutionMode } from '@prisma/client';
import { LocalScannerService } from './local-scanner.service';
import { ScannerParserService } from './scanner-parser.service';

@Injectable()
export class ScansService {
  private readonly logger = new Logger(ScansService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly localScanner: LocalScannerService,
    private readonly scannerParser: ScannerParserService,
  ) {}

  async findAllForUser(userId: string) {
    const scans = await this.prisma.scan.findMany({
      where: {
        project: {
          ownerId: userId,
        },
      },
      include: {
        target: {
          select: {
            name: true,
            target: true,
          },
        },
        project: {
          select: {
            name: true,
          },
        },
        _count: {
          select: {
            findings: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return scans.map((s) => ({
      ...s,
      targetName: s.target.name,
      targetValue: s.target.target,
      projectName: s.project.name,
      findingsCount: s._count.findings,
    }));
  }

  async findOneForUser(id: string, userId: string) {
    const scan = await this.prisma.scan.findFirst({
      where: {
        id,
        project: {
          ownerId: userId,
        },
      },
      include: {
        target: {
          select: {
            name: true,
            target: true,
          },
        },
        project: {
          select: {
            name: true,
          },
        },
        _count: {
          select: {
            findings: true,
          },
        },
      },
    });

    if (!scan) {
      throw new NotFoundException('Scan job not found');
    }

    return {
      ...scan,
      targetName: scan.target.name,
      targetValue: scan.target.target,
      projectName: scan.project.name,
      findingsCount: scan._count.findings,
    };
  }

  async findByTargetForUser(targetId: string, userId: string) {
    const target = await this.prisma.target.findFirst({
      where: {
        id: targetId,
        project: {
          ownerId: userId,
        },
      },
    });

    if (!target) {
      throw new NotFoundException('Target not found');
    }

    const scans = await this.prisma.scan.findMany({
      where: { targetId },
      include: {
        _count: {
          select: { findings: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return scans.map((s) => ({
      ...s,
      findingsCount: s._count.findings,
    }));
  }

  async createForUser(userId: string, dto: CreateScanDto) {
    // 1. Verify project ownership
    const project = await this.prisma.project.findFirst({
      where: { id: dto.projectId, ownerId: userId },
    });

    if (!project) {
      throw new ForbiddenException('Project does not belong to user or does not exist');
    }

    // 2. Verify target ownership and relationship to project
    const target = await this.prisma.target.findFirst({
      where: { id: dto.targetId, projectId: dto.projectId },
    });

    if (!target) {
      throw new BadRequestException('Target does not exist or does not belong to specified project');
    }

    // 3. Create Scan record in QUEUED status
    let scan;
    try {
      scan = await this.prisma.scan.create({
        data: {
          name: dto.name,
          scanType: dto.scanType,
          executionMode: ScanExecutionMode.LOCAL,
          scanner: 'Local Process Engine',
          status: ScanStatus.QUEUED,
          projectId: dto.projectId,
          targetId: dto.targetId,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        throw new BadRequestException(
          'The specified project or target does not exist',
        );
      }
      throw error;
    }

    // 4. Asynchronously launch local scanner job
    void this.executeLocalScanAsync(
      scan.id,
      target.target,
      dto.scanType,
      dto.targetId,
      dto.projectId,
    );

    return {
      ...scan,
      findingsCount: 0,
    };
  }

  async cancelForUser(id: string, userId: string) {
    const scan = await this.findOneForUser(id, userId);

    if (scan.status === ScanStatus.COMPLETED || scan.status === ScanStatus.FAILED) {
      throw new BadRequestException(`Cannot cancel scan in ${scan.status} state`);
    }

    // Transition QUEUED or RUNNING to FAILED with cancellation details
    return this.prisma.scan.update({
      where: { id },
      data: {
        status: ScanStatus.FAILED,
        errorDetails: 'Scan execution cancelled by user request',
        completedAt: new Date(),
      },
    });
  }

  /**
   * Asynchronously execute local port scan, update status, and persist findings.
   */
  private async executeLocalScanAsync(
    scanId: string,
    targetValue: string,
    scanType: string,
    targetId: string,
    projectId: string,
  ): Promise<void> {
    try {
      // Set RUNNING status
      await this.prisma.scan.update({
        where: { id: scanId },
        data: {
          status: ScanStatus.RUNNING,
          startedAt: new Date(),
        },
      });

      // Execute probe
      const scanResult = await this.localScanner.executeScan(targetValue, scanType);

      if (scanResult.error) {
        await this.prisma.scan.update({
          where: { id: scanId },
          data: {
            status: ScanStatus.FAILED,
            rawOutput: scanResult.rawOutput,
            errorDetails: scanResult.error,
            completedAt: scanResult.completedAt,
          },
        });
        return;
      }

      // Parse & persist findings
      await this.scannerParser.parseAndPersistFindings(
        scanResult,
        scanId,
        targetId,
        projectId,
      );

      // Set COMPLETED status
      await this.prisma.scan.update({
        where: { id: scanId },
        data: {
          status: ScanStatus.COMPLETED,
          rawOutput: scanResult.rawOutput,
          completedAt: scanResult.completedAt,
        },
      });

      this.logger.log(`Completed local scan ${scanId} successfully`);
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Unknown execution error';
      this.logger.error(`Failed local scan execution ${scanId}: ${errMsg}`);

      await this.prisma.scan.update({
        where: { id: scanId },
        data: {
          status: ScanStatus.FAILED,
          errorDetails: errMsg,
          completedAt: new Date(),
        },
      }).catch(() => {});
    }
  }
}
