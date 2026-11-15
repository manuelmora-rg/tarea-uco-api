import { createApp } from './app';
import { env } from './config/env';
import { listProviders } from './providers/provider.factory';

const app = createApp();

const server = app.listen(env.PORT, () => {
  console.log('');
  console.log('  🏴‍☠️  One Piece Explorer API');
  console.log(`  ➜  http://localhost:${env.PORT}/api/health`);
  console.log(`  ➜  Proveedor: ${env.DATA_PROVIDER} (disponibles: ${listProviders().join(', ')})`);
  console.log(`  ➜  Entorno: ${env.NODE_ENV}`);
  console.log('');
});

function shutdown(signal: string): void {
  console.log(`\n${signal} recibido. Cerrando servidor...`);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 5000).unref();
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
