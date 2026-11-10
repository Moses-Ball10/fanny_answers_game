import { useState } from 'react';
import { Countdown, QuestionCard, Title, Waiting, isHost, useError } from '../ui.jsx';

export default function Answering({ s }) {
  const [text, setText] = useState('');
  const [run, error] = useError();
  const answerers = s.players.filter((p) => p.id !== s.hostId && p.connected).map((p) => p.id);
  const waiting = <Waiting s={s} ids={answerers} doneIds={s.answeredIds} label="من أجاب؟" />;

  return (
    <main>
      <Countdown s={s} />
      <QuestionCard s={s} />
      {isHost(s) ? (
        <>
          <Title sub="انتظر أجوبة اللاعبين">أنت المضيف</Title>
          {waiting}
        </>
      ) : s.myAnswer ? (
        <>
          <div className="card pop-in mb-4 text-center">
            <div className="mb-1 text-sm text-white/60">إجابتك</div>
            <p className="text-lg font-bold">{s.myAnswer}</p>
          </div>
          {waiting}
        </>
      ) : (
        <div className="space-y-3">
          <textarea autoFocus className="input min-h-32 resize-none" placeholder="اكتب أطرف إجابة ممكنة 😂" maxLength={200} value={text} onChange={(e) => setText(e.target.value)} />
          <button className="btn-sun" disabled={!text.trim()} onClick={() => run('answer', { text })}>أرسل الإجابة</button>
          {error}
        </div>
      )}
    </main>
  );
}
