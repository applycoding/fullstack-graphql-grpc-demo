import { status } from '@grpc/grpc-js';
import { GraphQLError } from 'graphql';

export type ServiceErrorKind = 'invalid' | 'not_found' | 'conflict' | 'unavailable';

export function grpcCode(error: unknown): number {
  if (typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'number') {
    return error.code;
  }
  return status.UNKNOWN;
}

export function classifyGrpcCode(code: number): ServiceErrorKind {
  switch (code) {
    case status.INVALID_ARGUMENT:
    case status.OUT_OF_RANGE:
      return 'invalid';
    case status.NOT_FOUND:
      return 'not_found';
    case status.FAILED_PRECONDITION:
    case status.ALREADY_EXISTS:
      return 'conflict';
    default:
      return 'unavailable';
  }
}

export function graphqlErrorFor(kind: ServiceErrorKind, message: string): GraphQLError {
  switch (kind) {
    case 'invalid':
    case 'conflict':
      return new GraphQLError(message, { extensions: { code: 'BAD_USER_INPUT' } });
    case 'not_found':
      return new GraphQLError(message, { extensions: { code: 'NOT_FOUND' } });
    case 'unavailable':
      return new GraphQLError('The hotel service is unavailable', {
        extensions: { code: 'INTERNAL_SERVER_ERROR' },
      });
    default: {
      const exhaustive: never = kind;
      return exhaustive;
    }
  }
}

export function serviceMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'details' in error && typeof error.details === 'string' && error.details) {
    return error.details;
  }
  if (error instanceof Error) {
    return error.message.replace(/^\d+\s+[A-Z_]+:\s+/, '');
  }
  return 'Hotel service error';
}

export function asGraphqlError(error: unknown): GraphQLError {
  return graphqlErrorFor(classifyGrpcCode(grpcCode(error)), serviceMessage(error));
}
