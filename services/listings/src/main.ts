import { buildServer, createDb } from './server.js';

const { db, close } = createDb();
const app = buildServer(db);
app.addHook('onClose', close);
await app.listen({ port: Number(process.env.LISTINGS_PORT ?? 4100), host: '0.0.0.0' });
