import { io } from 'socket.io-client';

const store = (k, v) => {
  try {
    if (v === undefined) return localStorage.getItem(k);
    if (v === null) localStorage.removeItem(k);
    else localStorage.setItem(k, v);
  } catch { return null; }
};
export { store };

let playerId = store('playerId');
if (!playerId) {
  playerId = crypto.randomUUID?.() || String(Math.random()).slice(2) + Date.now();
  store('playerId', playerId);
}

export const socket = io({ auth: { playerId } });

export const emit = (event, payload) =>
  new Promise((resolve) => socket.emit(event, payload, (res) => resolve(res || {})));
