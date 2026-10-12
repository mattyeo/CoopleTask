import type { ApiErrorBody, ApiErrorCode } from '@coople-jobs/shared';
import type { FastifyInstance, FastifyReply } from 'fastify';
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

function hasClientErrorStatus(error: unknown): error is { statusCode: number } {
  if (typeof error !== 'object' || error === null || !('statusCode' in error)) return false;
  const { statusCode } = error;
  return typeof statusCode === 'number' && statusCode >= 400 && statusCode < 500;
}

/** Sends an `ApiErrorBody`. Errors must never be cached, whatever the route set before failing. */
function sendError(
  reply: FastifyReply,
  statusCode: number,
  code: ApiErrorCode,
  message: string,
): FastifyReply {
  const body: ApiErrorBody = { error: { code, message } };
  return reply.status(statusCode).header('cache-control', 'no-store').send(body);
}

export function registerErrorHandlers(app: FastifyInstance): void {
  app.setErrorHandler((error, request, reply) => {
    if (error instanceof AppError) {
      return sendError(reply, error.statusCode, error.code, error.message);
    }
    if (error instanceof ZodError) {
      return sendError(reply, 400, 'INVALID_REQUEST', 'Invalid request');
    }
    // Malformed requests rejected by Fastify itself (e.g. invalid JSON body)
    if (hasClientErrorStatus(error)) {
      return sendError(reply, 400, 'INVALID_REQUEST', 'Invalid request');
    }
    request.log.error(error);
    return sendError(reply, 500, 'INTERNAL_ERROR', 'Internal server error');
  });

  app.setNotFoundHandler((_request, reply) => {
    return sendError(reply, 404, 'INVALID_REQUEST', 'Route not found');
  });
}
