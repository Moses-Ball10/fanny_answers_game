import { Avatar, Leaderboard, Title, isCreator } from '../ui.jsx';
import { emit } from '../socket.js';

export default function Final({ s }) {
  const top = [...s.players].sort((a, b) => b.score - a.score).slice(0, 3);
  // podium order: 2nd, 1st, 3rd
  const podium = [top[1], top[0], top[2]];
  const heights = ['h-24', 'h-36', 'h-16'];
  const medals = ['🥈', '🥇', '🥉'];
  return (
    <main className="space-y-6">
      <Title sub="انتهت اللعبة">🏆 الفائزون 🏆</Title>
      <div className="flex items-end justify-center gap-3" dir="ltr">
        {podium.map((p, i) =>
          p ? (
            <div key={p.id} className="pop-in flex w-24 flex-col items-center gap-1" style={{ animationDelay: `${[300, 700, 0][i]}ms` }}>
              <span className="text-3xl">{medals[i]}</span>
              <Avatar s={s} id={p.id} size={i === 1 ? 64 : 48} />
              <span className="max-w-full truncate font-bold">{p.name}</span>
              <div className={`${heights[i]} flex w-full items-start justify-center rounded-t-2xl bg-sun pt-2 font-display text-3xl text-ink`}>{p.score}</div>
            </div>
          ) : (
            <div key={i} className="w-24" />
          )
        )}
      </div>
      <Leaderboard s={s} />
      {isCreator(s) && <button className="btn-sun" onClick={() => emit('playAgain')}>العب مرة أخرى 🔁</button>}
    </main>
  );
}
