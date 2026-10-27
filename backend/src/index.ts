import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { initDb } from './db';
import snippetsRoute from './routes/snippets';

const app = new Hono();

app.use(
  '*',
  cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://raw-snippet-vault.test', '*'],
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

await initDb();

app.get('/api/health', (c) => {
  return c.json({
    status: 'ok',
    system: 'Raw Snippet Vault',
    engine: 'Bun + Hono + Zod',
    aesthetic: 'Archival Raw',
    time: new Date().toISOString(),
  });
});

app.route('/api/snippets', snippetsRoute);

const port = Number(process.env.PORT) || 3003;
console.log(`[VAULT] Hono server listening on http://localhost:${port}`);

export default {
  port,
  fetch: app.fetch,
};
