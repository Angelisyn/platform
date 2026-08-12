import { Injectable, Logger } from '@nestjs/common';
import * as net from 'node:net';

export interface PortScanResult {
  port: number;
  state: 'open' | 'closed' | 'filtered';
  service?: string;
  banner?: string;
}

export interface ScanExecutionResult {
  targetValue: string;
  scanType: string;
  ports: PortScanResult[];
  rawOutput: string;
  startedAt: Date;
  completedAt: Date;
  error?: string;
}

/** Well-known port-to-service mapping for common ports */
const WELL_KNOWN_PORTS: Record<number, string> = {
  21: 'ftp',
  22: 'ssh',
  23: 'telnet',
  25: 'smtp',
  53: 'dns',
  80: 'http',
  110: 'pop3',
  135: 'msrpc',
  139: 'netbios-ssn',
  143: 'imap',
  443: 'https',
  445: 'microsoft-ds',
  993: 'imaps',
  995: 'pop3s',
  1433: 'mssql',
  1521: 'oracle',
  3306: 'mysql',
  3389: 'ms-wbt-server',
  5432: 'postgresql',
  5900: 'vnc',
  6379: 'redis',
  8080: 'http-proxy',
  8443: 'https-alt',
  8888: 'sun-answerbook',
  9090: 'zeus-admin',
  27017: 'mongodb',
};

/** Default ports to scan per scan type */
const SCAN_TYPE_PORTS: Record<string, number[]> = {
  NETWORK_DISCOVERY: [22, 80, 443, 3389],
  PORT_SCAN: [
    21, 22, 23, 25, 53, 80, 110, 135, 139, 143, 443, 445, 993, 995, 1433, 1521,
    3306, 3389, 5432, 5900, 6379, 8080, 8443, 27017,
  ],
  VULNERABILITY_SCAN: [
    21, 22, 23, 25, 80, 110, 135, 139, 443, 445, 1433, 3306, 3389, 5432, 6379,
    8080, 27017,
  ],
  WEB_ASSESSMENT: [80, 443, 8080, 8443, 8888, 9090],
};

@Injectable()
export class LocalScannerService {
  private readonly logger = new Logger(LocalScannerService.name);

  /**
   * Probe a single TCP port with a configurable timeout.
   * Uses a strictly guarded cleanup callback to prevent race conditions.
   */
  private probePort(
    host: string,
    port: number,
    timeoutMs = 1500,
  ): Promise<PortScanResult> {
    return new Promise((resolve) => {
      const socket = new net.Socket();
      let isDone = false;
      let banner = '';
      let bannerTimer: NodeJS.Timeout | null = null;

      const finish = (result: PortScanResult) => {
        if (isDone) return;
        isDone = true;

        if (bannerTimer) {
          clearTimeout(bannerTimer);
          bannerTimer = null;
        }

        try {
          socket.removeAllListeners();
          socket.destroy();
        } catch {
          // Ignore socket destruction errors
        }

        resolve(result);
      };

      socket.setTimeout(timeoutMs);

      socket.once('connect', () => {
        // Wait briefly for optional banner payload on connect
        bannerTimer = setTimeout(() => {
          finish({
            port,
            state: 'open',
            service: WELL_KNOWN_PORTS[port],
            banner: banner || undefined,
          });
        }, 300);

        socket.once('data', (data) => {
          banner = data.toString('utf-8').trim().slice(0, 256);
          finish({
            port,
            state: 'open',
            service: WELL_KNOWN_PORTS[port],
            banner,
          });
        });
      });

      socket.once('timeout', () => {
        finish({ port, state: 'filtered' });
      });

      socket.once('error', () => {
        finish({ port, state: 'closed' });
      });

      try {
        socket.connect(port, host);
      } catch {
        finish({ port, state: 'closed' });
      }
    });
  }

  /**
   * Execute a local port scan against the specified target.
   */
  async executeScan(
    targetValue: string,
    scanType: string,
  ): Promise<ScanExecutionResult> {
    const startedAt = new Date();
    const portsToScan = SCAN_TYPE_PORTS[scanType] ?? SCAN_TYPE_PORTS.PORT_SCAN;

    this.logger.log(
      `Starting local ${scanType} scan on ${targetValue} (${portsToScan.length} ports)`,
    );

    const results: PortScanResult[] = [];
    const outputLines: string[] = [];

    outputLines.push(`=== Angelisyn Local Scanner ===`);
    outputLines.push(`Target: ${targetValue}`);
    outputLines.push(`Scan Type: ${scanType}`);
    outputLines.push(`Ports: ${portsToScan.length}`);
    outputLines.push(`Started: ${startedAt.toISOString()}`);
    outputLines.push('');

    try {
      // Scan ports in small batches to balance speed vs resource usage
      const batchSize = 5;
      for (let i = 0; i < portsToScan.length; i += batchSize) {
        const batch = portsToScan.slice(i, i + batchSize);
        const batchResults = await Promise.all(
          batch.map((port) => this.probePort(targetValue, port)),
        );
        results.push(...batchResults);

        for (const result of batchResults) {
          const serviceName = result.service ? ` (${result.service})` : '';
          const bannerInfo = result.banner ? ` [${result.banner}]` : '';
          outputLines.push(
            `${result.port}/tcp  ${result.state.padEnd(8)}  ${serviceName}${bannerInfo}`,
          );
        }
      }

      const completedAt = new Date();
      const durationMs = completedAt.getTime() - startedAt.getTime();

      const openPorts = results.filter((r) => r.state === 'open');
      const filteredPorts = results.filter((r) => r.state === 'filtered');

      outputLines.push('');
      outputLines.push(`Scan completed in ${durationMs}ms`);
      outputLines.push(
        `${openPorts.length} open, ${filteredPorts.length} filtered, ${results.length - openPorts.length - filteredPorts.length} closed`,
      );

      this.logger.log(
        `Scan completed on ${targetValue}: ${openPorts.length} open ports found in ${durationMs}ms`,
      );

      return {
        targetValue,
        scanType,
        ports: results,
        rawOutput: outputLines.join('\n'),
        startedAt,
        completedAt,
      };
    } catch (error) {
      const completedAt = new Date();
      const errMsg =
        error instanceof Error ? error.message : 'Unknown scanner error';
      outputLines.push('');
      outputLines.push(`ERROR: ${errMsg}`);

      this.logger.error(`Scan failed on ${targetValue}: ${errMsg}`);

      return {
        targetValue,
        scanType,
        ports: results,
        rawOutput: outputLines.join('\n'),
        startedAt,
        completedAt,
        error: errMsg,
      };
    }
  }
}
