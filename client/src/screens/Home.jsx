import { useState } from 'react';
import { store } from '../socket.js';
import { Title, useError } from '../ui.jsx';

function Stepper({ label, value, set, min, max, step, unit }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="whitespace-nowrap font-bold">{label}</span>
      <div className="flex items-center gap-2">
        <button className="h-10 w-10 rounded-xl bg-white/10 text-xl font-bold" onClick={() => set(Math.min(max, value + step))}>+</button>
        <span className="w-16 text-center font-display text-2xl text-sun">
          {value}
          {unit && <span className="mr-1 font-sans text-xs text-white/60">{unit}</span>}
        </span>
        <button className="h-10 w-10 rounded-xl bg-white/10 text-xl font-bold" onClick={() => set(Math.max(min, value - step))}>−</button>
      </div>
    </div>
  );
}

export default function Home() {
  const urlCode = new URLSearchParams(location.search).get('room') || '';
  const [mode, setMode] = useState(urlCode ? 'join' : null);
  const [name, setName] = useState(store('name') || '');
  const [code, setCode] = useState(urlCode.toUpperCase());
  const [rounds, setRounds] = useState(5);
  const [answerTime, setAnswerTime] = useState(60);
  const [voteTime, setVoteTime] = useState(30);
  const [run, error] = useError();

  const go = async () => {
    store('name', name.trim());
    if (mode === 'create') await run('create', { name, settings: { rounds, answerTime, voteTime } });
    else await run('join', { name, code });
    if (urlCode) history.replaceState(null, '', '/');
  };

  return (
    <main className="flex flex-1 flex-col justify-center">
      <div className="mb-8 text-center">
        <div className="mb-2 text-6xl">🤪</div>
        <h1 className="font-display text-6xl text-sun drop-shadow-[0_4px_0_rgba(0,0,0,.4)]">أجوبة مضحكة</h1>
        <p className="mt-2 text-white/70">سؤال واحد… وأجوبة ما لها علاقة!</p>
      </div>

      {!mode && (
        <div className="space-y-4">
          <button className="btn-sun" onClick={() => setMode('create')}>إنشاء غرفة</button>
          <button className="btn-pop" onClick={() => setMode('join')}>الانضمام لغرفة</button>
        </div>
      )}

      {mode && (
        <div className="card pop-in space-y-4">
          <Title>{mode === 'create' ? 'غرفة جديدة' : 'انضمام'}</Title>
          <input className="input" placeholder="اسمك" maxLength={20} value={name} onChange={(e) => setName(e.target.value)} />
          {mode === 'join' && (
            <input
              className="input text-center font-mono text-2xl tracking-[.4em]"
              dir="ltr"
              placeholder="CODE"
              maxLength={4}
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
            />
          )}
          {mode === 'create' && (
            <div className="space-y-3 rounded-2xl bg-black/20 p-4">
              <Stepper label="عدد الجولات" value={rounds} set={setRounds} min={1} max={20} step={1} />
              <Stepper label="وقت الإجابة" value={answerTime} set={setAnswerTime} min={15} max={300} step={15} unit="ث" />
              <Stepper label="وقت التصويت" value={voteTime} set={setVoteTime} min={10} max={180} step={10} unit="ث" />
            </div>
          )}
          <button className="btn-sun" disabled={!name.trim() || (mode === 'join' && code.length !== 4)} onClick={go}>
            {mode === 'create' ? 'أنشئ الغرفة' : 'ادخل'}
          </button>
          <button className="w-full text-sm text-white/60" onClick={() => setMode(null)}>رجوع</button>
          {error}
        </div>
      )}
    </main>
  );
}
