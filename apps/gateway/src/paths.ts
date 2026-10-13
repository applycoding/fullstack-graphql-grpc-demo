import path from 'path';

export function protoPath(): string {
  return path.resolve(__dirname, '../../../proto/hotels.proto');
}
