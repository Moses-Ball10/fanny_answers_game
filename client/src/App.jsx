import { useEffect, useState } from 'react';
import { socket, emit, store } from './socket.js';
import Home from './screens/Home.jsx';
import Lobby from './screens/Lobby.jsx';
import PickQuestion from './screens/PickQuestion.jsx';
import Answering from './screens/Answering.jsx';
import Reveal from './screens/Reveal.jsx';
import Voting from './screens/Voting.jsx';
import RoundResults from './screens/RoundResults.jsx';
import Final from './screens/Final.jsx';
import { TopBar } from './ui.jsx';

const SCREENS = {
  LOBBY: Lobby,
  PICK_QUESTION: PickQuestion,
  ANSWERING: Answering,
  REVEAL: Reveal,
  VOTING: Voting,
  ROUND_RESULTS: RoundResults,
  FINAL: Final,
};

export default function App() {
  const [state, setState] = useState(null);
  const [connected, setConnected] = useState(socket.connected);

  useEffect(() => {
    const onState = (s) => {
      s.clockOffset = s.serverNow - Date.now();
      setState(s);
      store('roomCode', s.code);
    };
    const onConnect = async () => {
      setConnected(true);
      // auto-rejoin after refresh / reconnect
      const code = store('roomCode');
      if (code) {
        const res = await emit('join', { code, name: store('name') });
        if (res.error) store('roomCode', null);
      }
    };
    const onLeft = () => {
      store('roomCode', null);
      setState(null);
    };
    socket.on('state', onState);
    socket.on('connect', onConnect);
    socket.on('disconnect', () => setConnected(false));
    socket.on('left', onLeft);
    if (socket.connected) onConnect();
    return () => {
      socket.off('state', onState);
      socket.off('connect', onConnect);
      socket.off('left', onLeft);
    };
  }, []);

  const Screen = state ? SCREENS[state.phase] : Home;

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col px-4 pb-8 pt-4">
      {!connected && (
        <div className="mb-3 rounded-xl bg-pop/90 px-3 py-2 text-center text-sm font-bold">جاري الاتصال بالخادم…</div>
      )}
      {state && <TopBar s={state} />}
      <Screen s={state} />
    </div>
  );
}
