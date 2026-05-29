import { ArgumentsHost, BadRequestException, Logger } from '@nestjs/common';

import { AllExceptionsFilter } from './all-exceptions.filter';

describe('AllExceptionsFilter', () => {
  const filter = new AllExceptionsFilter();

  beforeAll(() => {
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  });

  function mockHost(url = '/api/test') {
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    const host = {
      switchToHttp: () => ({
        getResponse: () => ({ status }),
        getRequest: () => ({ url, method: 'GET' }),
      }),
    } as unknown as ArgumentsHost;
    return { host, status, json };
  }

  it('maps an HttpException to its status and message', () => {
    const { host, status, json } = mockHost();
    filter.catch(new BadRequestException('bad request'), host);
    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 400, message: 'bad request', path: '/api/test' }),
    );
  });

  it('falls back to 500 for unknown errors', () => {
    const { host, status, json } = mockHost();
    filter.catch(new Error('boom'), host);
    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 500 }));
  });
});
