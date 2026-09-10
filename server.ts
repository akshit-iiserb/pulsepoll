// Custom Next.js server with Socket.IO integration
import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server as SocketIOServer } from 'socket.io';
import { setupSocketHandlers } from './src/lib/socket-server';

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname: dev ? 'localhost' : hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
    // Fallback to long-polling for restricted networks
    transports: ['websocket', 'polling'],
  });

  // Attach io to global so API routes can emit events if needed
  (global as any).io = io;

  setupSocketHandlers(io);

  httpServer.listen(port, hostname, () => {
    const displayHost = dev ? 'localhost' : hostname;
    console.log(
      `\n  🎉 Audience Engage ready on http://${displayHost}:${port}\n` +
      `  📊 Host Console: http://${displayHost}:${port}\n` +
      `  ⚡ Socket.IO: ws://${displayHost}:${port}\n`
    );
  });
});
