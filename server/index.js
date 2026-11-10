import express from 'express';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { createRoom, getRoom } from './game.js';

const PORT = process.env.PORT || 3001;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: true } });

// serve the built client in production
const dist = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(dist));
app.get(/^\/(?!socket\.io).*/, (_req, res) => res.sendFile(path.join(dist, 'index.html')));

const sockets = new Map(); // playerId -> socket

function broadcast(room) {
  for (const id of room.players.keys()) {
    const s = sockets.get(id);
    if (s && s.data.roomCode === room.code) s.emit('state', room.viewFor(id));
  }
}

io.on('connection', (socket) => {
  const playerId = String(socket.handshake.auth?.playerId || '').slice(0, 64);
  if (!playerId) return socket.disconnect();
  sockets.get(playerId)?.disconnect();
  sockets.set(playerId, socket);

  const room = () => getRoom(socket.data.roomCode);
  const reply = (ack, res) => typeof ack === 'function' && ack(res || { ok: true });

  const enter = (r, name, ack) => {
    const res = r.join(playerId, name);
    if (res.error) return reply(ack, res);
    socket.data.roomCode = r.code;
    reply(ack, { ok: true, code: r.code });
    broadcast(r);
  };

  socket.on('create', ({ name, settings } = {}, ack) => {
    if (!String(name || '').trim()) return reply(ack, { error: 'اكتب اسمك' });
    const r = createRoom(playerId, settings, broadcast);
    enter(r, name, ack);
  });

  socket.on('join', ({ code, name } = {}, ack) => {
    const r = getRoom(code);
    if (!r) return reply(ack, { error: 'الغرفة غير موجودة' });
    enter(r, name, ack);
  });

  // generic action handler: run, ack, broadcast
  const action = (event, fn) =>
    socket.on(event, (payload, ack) => {
      const r = room();
      if (!r) return reply(ack, { error: 'لست في غرفة' });
      const res = fn(r, payload || {});
      reply(ack, res);
      broadcast(r);
    });

  action('start', (r) => r.start(playerId));
  action('reroll', (r) => r.reroll(playerId));
  action('question', (r, { text }) => r.setQuestion(playerId, text));
  action('answer', (r, { text }) => r.answer(playerId, text));
  action('reveal', (r) => r.reveal(playerId));
  action('vote', (r, { idx }) => r.vote(playerId, idx));
  action('next', (r) => r.next(playerId));
  action('playAgain', (r) => r.playAgain(playerId));
  action('leave', (r) => {
    r.leave(playerId, true);
    socket.data.roomCode = null;
    socket.emit('left');
  });

  socket.on('disconnect', () => {
    if (sockets.get(playerId) === socket) sockets.delete(playerId);
    const r = room();
    if (r) {
      r.leave(playerId, false);
      broadcast(r);
    }
  });
});

httpServer.listen(PORT, '0.0.0.0', () => {
  const ips = Object.values(os.networkInterfaces())
    .flat()
    .filter((i) => i && i.family === 'IPv4' && !i.internal)
    .map((i) => i.address);
  console.log(`Server on http://localhost:${PORT}  (LAN: ${ips.join(', ')})`);
});
