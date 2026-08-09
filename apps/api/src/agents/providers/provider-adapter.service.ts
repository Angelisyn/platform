import {
  BadGatewayException,
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import type {
  AgentExecutionOptions,
  ProviderAdapter,
} from './provider-adapter.interface';

@Injectable()
export class ProviderAdapterService implements ProviderAdapter {
  async execute(options: AgentExecutionOptions): Promise<{ output: string }> {
    const providerLower = options.provider.toLowerCase();

    if (providerLower === 'openai') {
      return this.executeOpenAI(options);
    }

    throw new BadRequestException(
      `Execution engine for provider '${options.provider}' is not configured`,
    );
  }

  private async executeOpenAI(
    options: AgentExecutionOptions,
  ): Promise<{ output: string }> {
    try {
      const response = await fetch(
        'https://api.openai.com/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${options.apiKey}`,
          },
          body: JSON.stringify({
            model: options.model,
            messages: [{ role: 'user', content: options.prompt }],
          }),
        },
      );

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        let parsedError = '';
        try {
          const errorJson = JSON.parse(errorText) as {
            error?: { message?: string };
          };
          parsedError = errorJson.error?.message || '';
        } catch {
          parsedError = errorText;
        }

        const safeError = options.apiKey
          ? parsedError.replaceAll(options.apiKey, '[REDACTED]')
          : parsedError;

        throw new BadGatewayException(
          `OpenAI API request failed (${response.status}): ${safeError || response.statusText}`,
        );
      }

      const data = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };

      const output = data.choices?.[0]?.message?.content ?? '';
      return { output };
    } catch (error: unknown) {
      if (
        error instanceof BadGatewayException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      const rawMsg =
        error instanceof Error ? error.message : 'Unknown provider error';
      const safeMsg = options.apiKey
        ? rawMsg.replaceAll(options.apiKey, '[REDACTED]')
        : rawMsg;
      throw new BadGatewayException(`OpenAI execution failed: ${safeMsg}`);
    }
  }
}
