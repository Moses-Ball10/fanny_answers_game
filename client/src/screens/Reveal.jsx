import { Avatar, QuestionCard, Title, isCreator, nameOf, player } from '../ui.jsx';
import { emit } from '../socket.js';

export default function Reveal({ s }) {
  const cur = s.items[s.revealIndex];
  const mine = cur.readerId === s.me;
  const readerGone = !player(s, cur.readerId)?.connected;
  const canControl = mine || isCreator(s) || readerGone;
  const shown = s.items.filter((it) => it.revealed && it.idx !== cur.idx);

  return (
    <main className="space-y-4">
      <QuestionCard s={s} />
      <div className="text-center text-sm font-bold text-white/60">
        إجابة {s.revealIndex + 1} من {s.items.length}
      </div>

      <div className="flex items-center justify-center gap-3">
        <Avatar s={s} id={cur.readerId} size={44} />
        <span className="text-lg font-bold">{mine ? 'دورك تقرأ!' : `${nameOf(s, cur.readerId)} يقرأ…`}</span>
      </div>

      {cur.revealed ? (
        <div key={cur.idx} className="pop-in rounded-3xl bg-sun p-6 text-center text-ink shadow-2xl">
          <p className="text-2xl font-extrabold leading-relaxed">{cur.text}</p>
        </div>
      ) : mine ? (
        <div className="card text-center">
          <div className="mb-2 text-sm text-white/60">الإجابة اللي معك (لا تعرف من كتبها):</div>
          <p className="text-xl font-bold">{cur.text}</p>
        </div>
      ) : (
        <div className="card py-10 text-center text-5xl">🙈</div>
      )}

      {canControl && (
        <button className="btn-pop" onClick={() => emit('reveal')}>
          {!cur.revealed ? 'اكشفها للجميع 📢' : s.revealIndex + 1 < s.items.length ? 'التالي ⬅' : 'إلى التصويت 🗳'}
        </button>
      )}

      {shown.length > 0 && (
        <div className="space-y-2 pt-2">
          <div className="text-sm font-bold text-white/50">الإجابات السابقة</div>
          {shown.map((it) => (
            <div key={it.idx} className="rounded-2xl bg-white/5 px-4 py-2 text-white/80">{it.text}</div>
          ))}
        </div>
      )}
      {s.items.length === 0 && <Title>لا توجد إجابات</Title>}
    </main>
  );
}
