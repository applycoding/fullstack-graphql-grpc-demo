export class ServiceError extends Error {
  readonly code: number;

  constructor(code: number, message: string) {
    super(message);
    this.name = 'ServiceError';
    this.code = code;
  }
}
