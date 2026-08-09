import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProjectsModule } from './projects/projects.module';
import { AgentsModule } from './agents/agents.module';
import { CryptoModule } from './common/crypto/crypto.module';
import { ApiKeysModule } from './api-keys/api-keys.module';
import { TargetsModule } from './targets/targets.module';
import { ScansModule } from './scans/scans.module';
import { FindingsModule } from './findings/findings.module';
import { ReportsModule } from './reports/reports.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UsersModule,
    ProjectsModule,
    AgentsModule,
    CryptoModule,
    ApiKeysModule,
    TargetsModule,
    ScansModule,
    FindingsModule,
    ReportsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
