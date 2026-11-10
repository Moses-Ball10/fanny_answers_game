import { Avatar, Leaderboard, QuestionCard, Title, isCreator, nameOf } from '../ui.jsx';
import { emit } from '../socket.js';

export default function RoundResults({ s }) {
  const items = [...s.items].sort((a, b) => b.votes - a.votes);
  const last = s.round >= s.settings.rounds;
  return (
    <main className="space-y-4">
      <Title>نتائج الجولة {s.round}</Title>
      {s.question && <QuestionCard s={s} />}
      <div className="space-y-2">
        {items.map((it, i) => (
          <div key={it.idx} className={`pop-in flex items-center gap-3 rounded-2xl p-3 ${i === 0 && it.votes > 0 ? 'bg-sun text-ink' : 'bg-card'}`} style={{ animationDelay: `${i * 80}ms` }}>
            <Avatar s={s} id={it.authorId} size={36} />
            <div className="flex-1">
              <div className="font-bold">{it.text}</div>
              <div className="text-xs opacity-70">— {nameOf(s, it.authorId)}</div>
            </div>
            <span className="font-display text-2xl">{it.votes}</span>
          </div>
        ))}
        {items.length === 0 && <p className="text-center text-white/60">لم يجب أحد هذه الجولة 😴</p>}
      </div>
      <Title>الترتيب</Title>
      <Leaderboard s={s} gains={s.gains} />
      {isCreator(s) ? (
        <button className="btn-sun" onClick={() => emit('next')}>{last ? 'النتيجة النهائية 🏆' : 'الجولة التالية ⬅'}</button>
      ) : (
        <p className="text-center text-white/60">بانتظار منشئ الغرفة…</p>
      )}
    </main>
  );
}
