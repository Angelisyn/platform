import { Module } from '@nestjs/common';
import { AgentsController } from './agents.controller';
import { AgentsService } from './agents.service';
import { ProviderAdapterService } from './providers/provider-adapter.service';
import { ApiKeysModule } from '../api-keys/api-keys.module';

@Module({
  imports: [ApiKeysModule],
  controllers: [AgentsController],
  providers: [AgentsService, ProviderAdapterService],
})
export class AgentsModule {}
