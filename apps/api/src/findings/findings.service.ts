import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FindingsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllForUser(userId: string) {
    const findings = await this.prisma.finding.findMany({
      where: {
        project: {
          ownerId: userId,
        },
      },
      include: {
        target: { select: { name: true, target: true } },
        scan: { select: { name: true } },
        project: { select: { name: true } },
      },
      orderBy: { detectedAt: 'desc' },
    });

    return findings.map((f) => ({
      ...f,
      targetName: f.target.name,
      targetValue: f.target.target,
      scanName: f.scan.name,
      projectName: f.project.name,
    }));
  }

  async findOneForUser(id: string, userId: string) {
    const finding = await this.prisma.finding.findFirst({
      where: {
        id,
        project: { ownerId: userId },
      },
      include: {
        target: { select: { name: true, target: true } },
        scan: { select: { name: true } },
        project: { select: { name: true } },
      },
    });

    if (!finding) {
      throw new NotFoundException('Finding not found');
    }

    return {
      ...finding,
      targetName: finding.target.name,
      targetValue: finding.target.target,
      scanName: finding.scan.name,
      projectName: finding.project.name,
    };
  }

  async findByScanForUser(scanId: string, userId: string) {
    const scan = await this.prisma.scan.findFirst({
      where: { id: scanId, project: { ownerId: userId } },
    });

    if (!scan) {
      throw new NotFoundException('Scan not found');
    }

    const findings = await this.prisma.finding.findMany({
      where: { scanId },
      include: {
        target: { select: { name: true, target: true } },
        scan: { select: { name: true } },
        project: { select: { name: true } },
      },
      orderBy: { detectedAt: 'desc' },
    });

    return findings.map((f) => ({
      ...f,
      targetName: f.target.name,
      targetValue: f.target.target,
      scanName: f.scan.name,
      projectName: f.project.name,
    }));
  }

  async findByTargetForUser(targetId: string, userId: string) {
    const target = await this.prisma.target.findFirst({
      where: { id: targetId, project: { ownerId: userId } },
    });

    if (!target) {
      throw new NotFoundException('Target not found');
    }

    const findings = await this.prisma.finding.findMany({
      where: { targetId },
      include: {
        target: { select: { name: true, target: true } },
        scan: { select: { name: true } },
        project: { select: { name: true } },
      },
      orderBy: { detectedAt: 'desc' },
    });

    return findings.map((f) => ({
      ...f,
      targetName: f.target.name,
      targetValue: f.target.target,
      scanName: f.scan.name,
      projectName: f.project.name,
    }));
  }
}
