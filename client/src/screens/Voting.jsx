import { Countdown, QuestionCard, Title, Waiting, useError } from '../ui.jsx';

export default function Voting({ s }) {
  const [run, error] = useError();
  const voters = s.players.filter((p) => p.connected).map((p) => p.id);
  return (
    <main className="space-y-4">
      <Countdown s={s} />
      <QuestionCard s={s} />
      <Title sub={s.canVote ? 'اختر الإجابة الأطرف' : 'لا يمكنك التصويت لإجابتك'}>صوّت! 🗳</Title>
      <div className="space-y-3">
        {s.items.map((it) => {
          const selected = s.myVote === it.idx;
          return (
            <button
              key={it.idx}
              disabled={it.isMine}
              onClick={() => run('vote', { idx: it.idx })}
              className={`block w-full rounded-2xl p-4 text-right text-lg font-bold transition active:scale-[.98] ${
                selected ? 'bg-sun text-ink ring-4 ring-white' : it.isMine ? 'bg-white/5 text-white/40' : 'bg-card ring-1 ring-white/15'
              }`}
            >
              {it.text}
              {it.isMine && <span className="mr-2 text-xs">(إجابتك)</span>}
              {selected && <span className="mr-2">✓</span>}
            </button>
          );
        })}
      </div>
      {error}
      <Waiting s={s} ids={voters} doneIds={s.votedIds} label="من صوّت؟" />
    </main>
  );
}
