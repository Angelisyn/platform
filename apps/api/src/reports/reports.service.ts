import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReportDto } from './dto/create-report.dto';
import { ReportStatus, FindingSeverity } from '@prisma/client';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllForUser(userId: string) {
    const reports = await this.prisma.report.findMany({
      where: { project: { ownerId: userId } },
      include: {
        project: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const enrichedReports = await Promise.all(
      reports.map((r) => this.enrichReportWithSummary(r, r.project.name)),
    );

    return enrichedReports;
  }

  async findOneForUser(id: string, userId: string) {
    const report = await this.prisma.report.findFirst({
      where: {
        id,
        project: { ownerId: userId },
      },
      include: {
        project: { select: { name: true } },
      },
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    return this.enrichReportWithSummary(report, report.project.name);
  }

  async createForUser(userId: string, dto: CreateReportDto) {
    const project = await this.prisma.project.findFirst({
      where: { id: dto.projectId, ownerId: userId },
    });

    if (!project) {
      throw new ForbiddenException('Project does not belong to user or does not exist');
    }

    let report;
    try {
      report = await this.prisma.report.create({
        data: {
          name: dto.name,
          projectId: dto.projectId,
          targetId: dto.targetId,
          status: ReportStatus.READY,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        throw new BadRequestException(
          'The specified project does not exist',
        );
      }
      throw error;
    }

    return this.enrichReportWithSummary(report, project.name);
  }

  private async enrichReportWithSummary(report: any, projectName: string) {
    const whereClause: any = { projectId: report.projectId };
    if (report.targetId) {
      whereClause.targetId = report.targetId;
    }

    const counts = await this.prisma.finding.groupBy({
      by: ['severity'],
      where: whereClause,
      _count: { severity: true },
    });

    const summary = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      info: 0,
    };

    for (const c of counts) {
      if (c.severity === FindingSeverity.CRITICAL) summary.critical = c._count.severity;
      if (c.severity === FindingSeverity.HIGH) summary.high = c._count.severity;
      if (c.severity === FindingSeverity.MEDIUM) summary.medium = c._count.severity;
      if (c.severity === FindingSeverity.LOW) summary.low = c._count.severity;
      if (c.severity === FindingSeverity.INFO) summary.info = c._count.severity;
    }

    return {
      ...report,
      projectName,
      findingsSummary: summary,
      generatedAt: report.createdAt.toISOString(),
    };
  }
}
