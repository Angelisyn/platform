import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FindingSeverity, FindingStatus } from '@prisma/client';
import type { ScanExecutionResult, PortScanResult } from './local-scanner.service';

export interface GeneratedFinding {
  title: string;
  severity: FindingSeverity;
  status: FindingStatus;
  description: string;
  evidence?: string;
  impact?: string;
  recommendation?: string;
  cve?: string;
  port?: number;
}

@Injectable()
export class ScannerParserService {
  private readonly logger = new Logger(ScannerParserService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Parse scan execution output, generate security findings, and persist them to the database.
   */
  async parseAndPersistFindings(
    scanResult: ScanExecutionResult,
    scanId: string,
    targetId: string,
    projectId: string,
  ): Promise<number> {
    const openPorts = scanResult.ports.filter((p) => p.state === 'open');
    const generatedFindings: GeneratedFinding[] = [];

    for (const item of openPorts) {
      const portFindings = this.evaluatePortSecurity(item, scanResult.targetValue);
      generatedFindings.push(...portFindings);
    }

    if (generatedFindings.length === 0 && openPorts.length > 0) {
      // General informative finding if open ports were found but no specific vulnerability matched
      generatedFindings.push({
        title: `Open Network Services Detected (${openPorts.length} Ports)`,
        severity: FindingSeverity.INFO,
        status: FindingStatus.OPEN,
        description: `Local port scan identified ${openPorts.length} responsive TCP service ports on target ${scanResult.targetValue}.`,
        evidence: openPorts.map((p) => `Port ${p.port}/tcp: ${p.service || 'unknown'}`).join('\n'),
        impact: 'Exposed services increase potential attack surface.',
        recommendation: 'Verify that only required network services are publicly accessible.',
      });
    }

    if (generatedFindings.length > 0) {
      await this.prisma.finding.createMany({
        data: generatedFindings.map((f) => ({
          ...f,
          scanId,
          targetId,
          projectId,
        })),
      });

      this.logger.log(
        `Persisted ${generatedFindings.length} security findings for scan ${scanId} on target ${targetId}`,
      );
    }

    return generatedFindings.length;
  }

  private evaluatePortSecurity(
    portResult: PortScanResult,
    targetValue: string,
  ): GeneratedFinding[] {
    const findings: GeneratedFinding[] = [];
    const { port, service, banner } = portResult;

    // Specific security rules based on open ports
    if (port === 23) {
      findings.push({
        title: 'Unencrypted Telnet Service Exposed',
        severity: FindingSeverity.HIGH,
        status: FindingStatus.OPEN,
        description: `Telnet service detected on port 23/tcp on target ${targetValue}. Telnet transmits credentials and command traffic in cleartext over the network.`,
        evidence: banner || `Port 23/tcp open (Telnet)`,
        impact: 'Attachers on the network path can intercept login credentials and plain text sessions.',
        recommendation: 'Disable Telnet and migrate to SSH (Secure Shell) for remote command administration.',
        port: 23,
      });
    }

    if (port === 21) {
      findings.push({
        title: 'Cleartext FTP Protocol Detected',
        severity: FindingSeverity.MEDIUM,
        status: FindingStatus.OPEN,
        description: `File Transfer Protocol (FTP) service detected on port 21/tcp. Legacy FTP transmits authentication credentials and payload data in unencrypted format.`,
        evidence: banner || `Port 21/tcp open (${service || 'ftp'})`,
        impact: 'Credentials and transferred files can be captured via network sniffing.',
        recommendation: 'Upgrade to SFTP (SSH File Transfer Protocol) or FTPS (FTP over TLS).',
        port: 21,
      });
    }

    if (port === 80) {
      findings.push({
        title: 'Plaintext HTTP Web Endpoint Active',
        severity: FindingSeverity.LOW,
        status: FindingStatus.OPEN,
        description: `HTTP service listening on port 80/tcp without enforced TLS encryption.`,
        evidence: banner || `Port 80/tcp open (http)`,
        impact: 'Web traffic is susceptible to eavesdropping and session hijacking.',
        recommendation: 'Configure HTTP-to-HTTPS redirect (301) and enforce TLS/SSL certificates.',
        port: 80,
      });
    }

    if (port === 445 || port === 139) {
      findings.push({
        title: 'Microsoft SMB File Sharing Exposed',
        severity: FindingSeverity.MEDIUM,
        status: FindingStatus.OPEN,
        description: `Server Message Block (SMB) service detected on port ${port}/tcp. SMB services are historically targeted by lateral movement exploits (e.g. MS17-010 EternalBlue).`,
        evidence: banner || `Port ${port}/tcp open (${service || 'smb'})`,
        impact: 'Unrestricted SMB exposure may permit unauthenticated share access or remote code execution vulnerabilities.',
        recommendation: 'Restrict SMB access to trusted internal IP ranges or VPN networks, and ensure SMBv1 is disabled.',
        port,
      });
    }

    if (port === 3389) {
      findings.push({
        title: 'Remote Desktop Protocol (RDP) Service Active',
        severity: FindingSeverity.MEDIUM,
        status: FindingStatus.OPEN,
        description: `Windows Remote Desktop Protocol (RDP) active on port 3389/tcp.`,
        evidence: banner || `Port 3389/tcp open (ms-wbt-server)`,
        impact: 'Exposed RDP endpoints are high-value targets for brute-force credential stuffing and credential harvesting.',
        recommendation: 'Require Network Level Authentication (NLA), enforce multi-factor authentication (MFA), or place RDP behind a secure VPN gateway.',
        port: 3389,
      });
    }

    if (port === 6379) {
      findings.push({
        title: 'Redis In-Memory Datastore Port Accessible',
        severity: FindingSeverity.HIGH,
        status: FindingStatus.OPEN,
        description: `Redis server listening on default port 6379/tcp. Redis instances deployed without authentication enable unauthenticated remote data dumping or remote command execution.`,
        evidence: banner || `Port 6379/tcp open (redis)`,
        impact: 'Potential full database compromise or arbitrary file write vulnerabilities.',
        recommendation: 'Bind Redis to localhost (127.0.0.1) only, enable `requirepass` authentication, or place behind a firewall.',
        port: 6379,
      });
    }

    if (port === 27017) {
      findings.push({
        title: 'MongoDB Database Service Exposed',
        severity: FindingSeverity.HIGH,
        status: FindingStatus.OPEN,
        description: `MongoDB database daemon detected on port 27017/tcp.`,
        evidence: banner || `Port 27017/tcp open (mongodb)`,
        impact: 'Exposed MongoDB instances may be vulnerable to unauthenticated access or ransomware attacks.',
        recommendation: 'Enable MongoDB authentication (`security.authorization: enabled`) and restrict port 27017 to internal application servers.',
        port: 27017,
      });
    }

    // Default INFO level finding for any open port discovered
    if (findings.length === 0) {
      findings.push({
        title: `Open Service: Port ${port}/tcp (${service || 'unknown'})`,
        severity: FindingSeverity.INFO,
        status: FindingStatus.OPEN,
        description: `TCP port ${port} is open on target ${targetValue} running ${service || 'an unidentified service'}.`,
        evidence: banner || `Port ${port}/tcp open`,
        impact: 'Service is active and accepting connections.',
        recommendation: 'Verify service necessity and keep application binaries updated.',
        port,
      });
    }

    return findings;
  }
}
