import { BadGatewayException, BadRequestException } from '@nestjs/common';
import { ProviderAdapterService } from './provider-adapter.service';

describe('ProviderAdapterService', () => {
  let service: ProviderAdapterService;

  beforeEach(() => {
    service = new ProviderAdapterService();
    jest.restoreAllMocks();
  });

  it('should successfully execute OpenAI completion request and return output', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          choices: [{ message: { content: 'OpenAI generated response' } }],
        }),
    } as Response);

    const result = await service.execute({
      provider: 'openai',
      model: 'gpt-4o',
      prompt: 'Tell me a story',
      apiKey: 'sk-secret-key-12345',
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      'https://api.openai.com/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer sk-secret-key-12345',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [{ role: 'user', content: 'Tell me a story' }],
        }),
      },
    );

    expect(result).toEqual({ output: 'OpenAI generated response' });
    expect('apiKey' in result).toBe(false);
  });

  it('should pass the requested model to OpenAI request body', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          choices: [{ message: { content: 'Response from gpt-3.5-turbo' } }],
        }),
    } as Response);

    await service.execute({
      provider: 'openai',
      model: 'gpt-3.5-turbo',
      prompt: 'Hello',
      apiKey: 'sk-secret-key-12345',
    });

    const callArg = JSON.parse(fetchSpy.mock.calls[0][1]?.body as string) as {
      model: string;
    };
    expect(callArg.model).toBe('gpt-3.5-turbo');
  });

  it('should handle OpenAI API errors cleanly and redact secret key from error message', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      text: () =>
        Promise.resolve(
          JSON.stringify({
            error: {
              message: 'Invalid API key provided: sk-secret-key-12345',
            },
          }),
        ),
    } as Response);

    let caughtError: unknown = null;
    try {
      await service.execute({
        provider: 'openai',
        model: 'gpt-4o',
        prompt: 'Hello',
        apiKey: 'sk-secret-key-12345',
      });
    } catch (err: unknown) {
      caughtError = err;
    }

    expect(caughtError).toBeInstanceOf(BadGatewayException);
    const bgErr = caughtError as BadGatewayException;
    expect(bgErr.message).toContain('OpenAI API request failed (401)');
    expect(bgErr.message).toContain('[REDACTED]');
    expect(bgErr.message).not.toContain('sk-secret-key-12345');
  });

  it('should throw BadRequestException for unsupported/unconfigured provider', async () => {
    await expect(
      service.execute({
        provider: 'unsupported-llm',
        model: 'model-v1',
        prompt: 'Test',
        apiKey: 'sk-key',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
