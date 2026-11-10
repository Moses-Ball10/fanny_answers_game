import { useState } from 'react';
import { Avatar, Title, isHost, nameOf, useError } from '../ui.jsx';

export default function PickQuestion({ s }) {
  const [custom, setCustom] = useState('');
  const [run, error] = useError();

  if (!isHost(s)) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
        <div className="pop-in"><Avatar s={s} id={s.hostId} size={96} /></div>
        <Title sub="يختار سؤالاً الآن…">{nameOf(s, s.hostId)} هو المضيف</Title>
        <div className="text-5xl animate-bounce">🤔</div>
      </main>
    );
  }

  return (
    <main className="space-y-4">
      <Title sub="اختر سؤالاً أو اكتب سؤالك">أنت المضيف! 🎤</Title>
      {s.suggestions.map((q) => (
        <button key={q} onClick={() => run('question', { text: q })} className="card pop-in block w-full text-right text-lg font-bold transition active:scale-[.98]">
          {q}
        </button>
      ))}
      <button className="btn-ghost" onClick={() => run('reroll')}>🎲 أسئلة أخرى</button>
      <div className="card space-y-3">
        <textarea className="input min-h-24 resize-none" placeholder="أو اكتب سؤالك الخاص…" maxLength={200} value={custom} onChange={(e) => setCustom(e.target.value)} />
        <button className="btn-pop" disabled={!custom.trim()} onClick={() => run('question', { text: custom })}>أرسل السؤال</button>
      </div>
      {error}
    </main>
  );
}
