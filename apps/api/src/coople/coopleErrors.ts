export interface UpstreamErrorDetails {
  status?: number;
  errorCode?: string;
  issues?: unknown;
  cause?: unknown;
}

export abstract class UpstreamError extends Error {
  constructor(
    message: string,
    readonly details: UpstreamErrorDetails = {},
  ) {
    super(message, { cause: details.cause });
    this.name = new.target.name;
  }
}

export class UpstreamNotFoundError extends UpstreamError {}

export class UpstreamUnavailableError extends UpstreamError {}

export class UpstreamTimeoutError extends UpstreamError {}

export class UpstreamInvalidResponseError extends UpstreamError {}
