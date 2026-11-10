import { useState } from 'react';
import { Avatar, Title, isCreator, useError } from '../ui.jsx';

export default function Lobby({ s }) {
  const [run, error] = useError();
  const [copied, setCopied] = useState(false);
  const link = `${location.origin}/?room=${s.code}`;
  const enough = s.players.length >= s.minPlayers;

  const share = async () => {
    try {
      if (navigator.share) await navigator.share({ title: 'أجوبة مضحكة', url: link });
      else {
        await navigator.clipboard.writeText(link);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }
    } catch {}
  };

  return (
    <main className="space-y-5">
      <Title sub="شارك الرمز مع أصحابك">رمز الغرفة</Title>
      <button onClick={share} className="card block w-full text-center">
        <div className="font-mono text-6xl font-extrabold tracking-[.3em] text-sun" dir="ltr">{s.code}</div>
        <div className="mt-2 text-sm text-white/60">{copied ? 'تم نسخ الرابط ✓' : 'اضغط لمشاركة الرابط'}</div>
      </button>

      <div className="card">
        <div className="mb-3 flex justify-between text-sm font-bold text-white/70">
          <span>اللاعبون</span>
          <span>{s.players.length} / 10</span>
        </div>
        <ul className="space-y-2">
          {s.players.map((p) => (
            <li key={p.id} className="pop-in flex items-center gap-3">
              <Avatar s={s} id={p.id} />
              <span className="flex-1 font-bold">{p.name}{p.id === s.me && ' (أنت)'}</span>
              {p.id === s.creatorId && <span className="text-lg">👑</span>}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex justify-around text-center text-sm text-white/70">
        <div><div className="font-display text-2xl text-sun">{s.settings.rounds}</div>جولات</div>
        <div><div className="font-display text-2xl text-sun">{s.settings.answerTime}ث</div>للإجابة</div>
        <div><div className="font-display text-2xl text-sun">{s.settings.voteTime}ث</div>للتصويت</div>
      </div>

      {isCreator(s) ? (
        <button className="btn-sun" disabled={!enough} onClick={() => run('start')}>
          {enough ? 'ابدأ اللعب 🚀' : `بانتظار ${s.minPlayers - s.players.length} لاعب على الأقل`}
        </button>
      ) : (
        <p className="text-center text-white/70">بانتظار {s.players.find((p) => p.id === s.creatorId)?.name} ليبدأ اللعبة…</p>
      )}
      {error}
    </main>
  );
}
