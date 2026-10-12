import type { ApiErrorBody, ApiErrorCode } from '@coople-jobs/shared';
import type { FastifyInstance } from 'fastify';
import { ZodError } from 'zod';

export class AppError extends Error {
  constructor(
    readonly statusCode: number,
    readonly code: ApiErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

function errorBody(code: ApiErrorCode, message: string): ApiErrorBody {
  return { error: { code, message } };
}

function hasClientErrorStatus(error: unknown): error is { statusCode: number } {
  if (typeof error !== 'object' || error === null || !('statusCode' in error)) return false;
  const { statusCode } = error;
  return typeof statusCode === 'number' && statusCode >= 400 && statusCode < 500;
}

export function registerErrorHandlers(app: FastifyInstance): void {
  app.setErrorHandler((error, request, reply) => {
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send(errorBody(error.code, error.message));
    }
    if (error instanceof ZodError) {
      return reply.status(400).send(errorBody('INVALID_REQUEST', 'Invalid request'));
    }
    // Malformed requests rejected by Fastify itself (e.g. invalid JSON body)
    if (hasClientErrorStatus(error)) {
      return reply.status(400).send(errorBody('INVALID_REQUEST', 'Invalid request'));
    }
    request.log.error(error);
    return reply.status(500).send(errorBody('INTERNAL_ERROR', 'Internal server error'));
  });

  app.setNotFoundHandler((_request, reply) => {
    return reply.status(404).send(errorBody('INVALID_REQUEST', 'Route not found'));
  });
}
