import path from 'path';

/** Package root. Works from src (tsx, vitest) and from dist (node). */
export function packageRoot(): string {
  return path.resolve(__dirname, '..');
}

export function protoPath(): string {
  return path.resolve(packageRoot(), '../../proto/hotels.proto');
}

export function migrationsDir(): string {
  return path.resolve(packageRoot(), 'migrations');
}

export function seedFile(): string {
  return path.resolve(packageRoot(), 'seed/seed.sql');
}
