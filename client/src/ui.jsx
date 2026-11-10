import { useEffect, useState } from 'react';
import { emit } from './socket.js';

export const player = (s, id) => s.players.find((p) => p.id === id);
export const nameOf = (s, id) => player(s, id)?.name ?? '؟';
export const isCreator = (s) => s.me === s.creatorId;
export const isHost = (s) => s.me === s.hostId;

const COLORS = ['#ffd23f', '#ff5d8f', '#3ee8b5', '#6ec5ff', '#ff9f43', '#c084fc', '#f87171', '#a3e635', '#38bdf8', '#fb7185'];
export function Avatar({ s, id, size = 40 }) {
  const i = s.players.findIndex((p) => p.id === id);
  const name = nameOf(s, id);
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full font-extrabold text-ink"
      style={{ width: size, height: size, background: COLORS[(i + COLORS.length) % COLORS.length], fontSize: size * 0.45 }}
    >
      {name.slice(0, 1)}
    </span>
  );
}

export function TopBar({ s }) {
  const leave = () => {
    if (confirm('هل تريد مغادرة الغرفة؟')) emit('leave');
  };
  return (
    <header className="mb-5 flex items-center justify-between text-sm">
      <button onClick={leave} className="rounded-full bg-white/10 px-3 py-1.5 font-bold text-white/70">
        خروج
      </button>
      {s.phase !== 'LOBBY' && s.phase !== 'FINAL' && (
        <span className="font-bold text-white/70">
          الجولة {s.round} / {s.settings.rounds}
        </span>
      )}
      <span className="rounded-full bg-white/10 px-3 py-1.5 font-mono font-bold tracking-widest" dir="ltr">
        {s.code}
      </span>
    </header>
  );
}

export function Title({ children, sub }) {
  return (
    <div className="mb-5 text-center">
      <h1 className="font-display text-4xl leading-tight text-sun drop-shadow-[0_3px_0_rgba(0,0,0,.35)]">{children}</h1>
      {sub && <p className="mt-1 text-white/70">{sub}</p>}
    </div>
  );
}

export function Countdown({ s }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, []);
  if (!s.deadline) return null;
  const left = Math.max(0, Math.ceil((s.deadline - (now + s.clockOffset)) / 1000));
  const urgent = left <= 10;
  return (
    <div className="mb-4 flex justify-center">
      <span
        className={`rounded-full px-5 py-1.5 font-display text-2xl tabular-nums ${urgent ? 'animate-pulse bg-pop' : 'bg-white/10'}`}
      >
        ⏱ {left}
      </span>
    </div>
  );
}

export function QuestionCard({ s }) {
  return (
    <div className="card mb-5 border-b-4 border-sun text-center">
      <div className="mb-1 text-xs font-bold text-white/50">سؤال {nameOf(s, s.hostId)}</div>
      <p className="text-xl font-extrabold leading-relaxed">{s.question}</p>
    </div>
  );
}

export function Waiting({ s, doneIds, ids, label }) {
  return (
    <div className="card">
      <div className="mb-3 text-center font-bold text-white/70">{label}</div>
      <div className="flex flex-wrap justify-center gap-3">
        {ids.map((id) => {
          const done = doneIds.includes(id);
          return (
            <div key={id} className={`flex flex-col items-center gap-1 transition ${done ? '' : 'opacity-35'}`}>
              <Avatar s={s} id={id} />
              <span className="text-xs">{done ? '✓ ' : ''}{nameOf(s, id)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function Leaderboard({ s, gains = {} }) {
  const sorted = [...s.players].sort((a, b) => b.score - a.score);
  return (
    <ol className="card space-y-2">
      {sorted.map((p, i) => (
        <li key={p.id} className={`flex items-center gap-3 rounded-2xl px-3 py-2 ${p.id === s.me ? 'bg-white/10' : ''}`}>
          <span className="w-6 text-center font-display text-xl text-white/60">{i + 1}</span>
          <Avatar s={s} id={p.id} size={34} />
          <span className={`flex-1 font-bold ${p.connected ? '' : 'opacity-40'}`}>{p.name}</span>
          {gains[p.id] ? <span className="text-sm font-bold text-mint">+{gains[p.id]}</span> : null}
          <span className="font-display text-2xl text-sun">{p.score}</span>
        </li>
      ))}
    </ol>
  );
}

export function useError() {
  const [error, setError] = useState('');
  const run = async (event, payload) => {
    setError('');
    const res = await emit(event, payload);
    if (res?.error) setError(res.error);
    return res;
  };
  const view = error ? <p className="mt-3 text-center font-bold text-pop">{error}</p> : null;
  return [run, view];
}
