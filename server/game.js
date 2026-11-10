import { QUESTIONS } from './questions.js';

export const MIN_PLAYERS = 3;
export const MAX_PLAYERS = 10;

const rooms = new Map();

const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const clamp = (v, min, max, def) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n))) : def;
};

function newCode() {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code;
  do {
    code = Array.from({ length: 4 }, () => letters[Math.floor(Math.random() * letters.length)]).join('');
  } while (rooms.has(code));
  return code;
}

export const getRoom = (code) => rooms.get(String(code || '').toUpperCase());

export function createRoom(creatorId, settings, onChange) {
  const room = new Room(newCode(), creatorId, settings, onChange);
  rooms.set(room.code, room);
  return room;
}

export class Room {
  constructor(code, creatorId, settings, onChange) {
    this.code = code;
    this.creatorId = creatorId;
    this.settings = {
      rounds: clamp(settings?.rounds, 1, 20, 5),
      answerTime: clamp(settings?.answerTime, 15, 300, 60),
      voteTime: clamp(settings?.voteTime, 10, 180, 30),
    };
    this.onChange = onChange;
    this.players = new Map(); // id -> {id, name, score, connected}
    this.timer = null;
    this.emptySince = null;
    this.resetGame();
  }

  resetGame() {
    this.clearTimer();
    this.phase = 'LOBBY';
    this.round = 0;
    this.hostQueue = [];
    this.hostId = null;
    this.resetRound();
    for (const p of this.players.values()) p.score = 0;
  }

  resetRound() {
    this.question = null;
    this.suggestions = [];
    this.answers = {}; // playerId -> text
    this.items = []; // {idx, readerId, authorId, text, revealed}
    this.revealIndex = 0;
    this.votes = {}; // voterId -> idx
    this.gains = {};
    this.deadline = null;
  }

  // ---------- helpers ----------
  connectedIds() {
    return [...this.players.values()].filter((p) => p.connected).map((p) => p.id);
  }
  clearTimer() {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    this.deadline = null;
  }
  setTimer(seconds, fn) {
    this.clearTimer();
    this.deadline = Date.now() + seconds * 1000;
    this.timer = setTimeout(() => {
      this.timer = null;
      fn();
      this.onChange(this);
    }, seconds * 1000);
  }
  isCreator(id) {
    return id === this.creatorId;
  }

  // ---------- membership ----------
  join(id, name) {
    const existing = this.players.get(id);
    if (existing) {
      existing.connected = true;
      if (name) existing.name = name;
      this.emptySince = null;
      return { ok: true };
    }
    if (this.phase !== 'LOBBY') return { error: 'اللعبة بدأت بالفعل' };
    if (this.players.size >= MAX_PLAYERS) return { error: 'الغرفة ممتلئة' };
    const clean = String(name || '').trim().slice(0, 20);
    if (!clean) return { error: 'اكتب اسمك' };
    if ([...this.players.values()].some((p) => p.name === clean)) return { error: 'الاسم مستخدم، اختر اسماً آخر' };
    this.players.set(id, { id, name: clean, score: 0, connected: true });
    this.emptySince = null;
    return { ok: true };
  }

  leave(id, permanent) {
    const p = this.players.get(id);
    if (!p) return;
    if (this.phase === 'LOBBY' || permanent) this.players.delete(id);
    else p.connected = false;

    const connected = this.connectedIds();
    if (connected.length === 0) {
      this.emptySince = Date.now();
      return;
    }
    if (this.creatorId === id || !this.players.get(this.creatorId)?.connected) this.creatorId = connected[0];

    // keep the game moving
    if (this.phase === 'PICK_QUESTION' && this.hostId === id) this.pickHost();
    else if (this.phase === 'ANSWERING') this.checkAnswersDone();
    else if (this.phase === 'VOTING') this.checkVotesDone();
  }

  // ---------- flow ----------
  start(by) {
    if (!this.isCreator(by)) return { error: 'فقط منشئ الغرفة يبدأ اللعبة' };
    if (this.phase !== 'LOBBY') return { error: 'اللعبة بدأت' };
    if (this.connectedIds().length < MIN_PLAYERS) return { error: `تحتاج ${MIN_PLAYERS} لاعبين على الأقل` };
    this.nextRound();
    return { ok: true };
  }

  pickHost() {
    const connected = new Set(this.connectedIds());
    while (this.hostQueue.length && !connected.has(this.hostQueue[0])) this.hostQueue.shift();
    if (!this.hostQueue.length) this.hostQueue = shuffle([...connected].filter((id) => id !== this.hostId));
    if (!this.hostQueue.length) this.hostQueue = [...connected];
    this.hostId = this.hostQueue.shift();
    this.suggestions = this.randomQuestions(3);
  }

  randomQuestions(n) {
    return shuffle(QUESTIONS).slice(0, n);
  }

  nextRound() {
    this.clearTimer();
    this.round += 1;
    this.resetRound();
    this.phase = 'PICK_QUESTION';
    this.pickHost();
  }

  reroll(by) {
    if (this.phase !== 'PICK_QUESTION' || by !== this.hostId) return;
    this.suggestions = this.randomQuestions(3);
  }

  setQuestion(by, text) {
    if (this.phase !== 'PICK_QUESTION' || by !== this.hostId) return { error: 'ليس دورك' };
    const q = String(text || '').trim().slice(0, 200);
    if (!q) return { error: 'اكتب سؤالاً' };
    this.question = q;
    this.phase = 'ANSWERING';
    this.setTimer(this.settings.answerTime, () => this.endAnswering());
    return { ok: true };
  }

  answer(by, text) {
    if (this.phase !== 'ANSWERING') return { error: 'انتهى وقت الإجابة' };
    if (by === this.hostId) return { error: 'المضيف لا يجيب' };
    if (!this.players.has(by)) return { error: 'لست في الغرفة' };
    const a = String(text || '').trim().slice(0, 200);
    if (!a) return { error: 'اكتب إجابة' };
    this.answers[by] = a;
    this.checkAnswersDone();
    return { ok: true };
  }

  checkAnswersDone() {
    const needed = this.connectedIds().filter((id) => id !== this.hostId);
    if (needed.every((id) => this.answers[id])) this.endAnswering();
  }

  endAnswering() {
    if (this.phase !== 'ANSWERING') return;
    this.clearTimer();
    const authors = Object.keys(this.answers);
    if (authors.length === 0) {
      this.phase = 'ROUND_RESULTS';
      return;
    }
    // readers get someone else's answer (derangement)
    let readers;
    if (authors.length === 1) readers = [this.hostId];
    else {
      do readers = shuffle(authors);
      while (readers.some((r, i) => r === authors[i]));
    }
    this.items = shuffle(
      authors.map((authorId, i) => ({ readerId: readers[i], authorId, text: this.answers[authorId], revealed: false }))
    ).map((it, idx) => ({ ...it, idx }));
    this.revealIndex = 0;
    this.phase = 'REVEAL';
  }

  // reader taps once to reveal, again to pass to the next reader
  reveal(by) {
    if (this.phase !== 'REVEAL') return;
    const item = this.items[this.revealIndex];
    const readerGone = !this.players.get(item.readerId)?.connected;
    if (by !== item.readerId && !(this.isCreator(by) || readerGone)) return;
    if (!item.revealed) item.revealed = true;
    else {
      this.revealIndex += 1;
      if (this.revealIndex >= this.items.length) this.startVoting();
    }
  }

  startVoting() {
    this.phase = 'VOTING';
    this.setTimer(this.settings.voteTime, () => this.endVoting());
  }

  canVote(id) {
    return this.items.some((it) => it.authorId !== id);
  }

  vote(by, idx) {
    if (this.phase !== 'VOTING') return { error: 'انتهى التصويت' };
    const item = this.items[Number(idx)];
    if (!item) return { error: 'إجابة غير موجودة' };
    if (item.authorId === by) return { error: 'لا يمكنك التصويت لإجابتك' };
    this.votes[by] = item.idx;
    this.checkVotesDone();
    return { ok: true };
  }

  checkVotesDone() {
    const voters = this.connectedIds().filter((id) => this.canVote(id));
    if (voters.every((id) => this.votes[id] !== undefined)) this.endVoting();
  }

  endVoting() {
    if (this.phase !== 'VOTING') return;
    this.clearTimer();
    for (const idx of Object.values(this.votes)) {
      const author = this.items[idx].authorId;
      this.gains[author] = (this.gains[author] || 0) + 1;
    }
    for (const [id, pts] of Object.entries(this.gains)) {
      const p = this.players.get(id);
      if (p) p.score += pts;
    }
    this.phase = 'ROUND_RESULTS';
  }

  next(by) {
    if (!this.isCreator(by) || this.phase !== 'ROUND_RESULTS') return;
    if (this.round >= this.settings.rounds) {
      this.clearTimer();
      this.phase = 'FINAL';
    } else this.nextRound();
  }

  playAgain(by) {
    if (!this.isCreator(by) || this.phase !== 'FINAL') return;
    for (const [id, p] of this.players) if (!p.connected) this.players.delete(id);
    this.resetGame();
  }

  // ---------- per-player view (never leaks authors before results) ----------
  viewFor(me) {
    const voteCount = {};
    for (const idx of Object.values(this.votes)) voteCount[idx] = (voteCount[idx] || 0) + 1;
    const showAuthors = this.phase === 'ROUND_RESULTS' || this.phase === 'FINAL';

    return {
      code: this.code,
      me,
      phase: this.phase,
      round: this.round,
      settings: this.settings,
      creatorId: this.creatorId,
      hostId: this.hostId,
      minPlayers: MIN_PLAYERS,
      serverNow: Date.now(),
      deadline: this.deadline,
      players: [...this.players.values()].map(({ id, name, score, connected }) => ({ id, name, score, connected })),
      question: this.question,
      suggestions: me === this.hostId ? this.suggestions : [],
      answeredIds: Object.keys(this.answers),
      myAnswer: this.answers[me] || null,
      revealIndex: this.revealIndex,
      items: this.items.map((it) => {
        const visible = it.revealed || showAuthors || it.readerId === me;
        return {
          idx: it.idx,
          readerId: it.readerId,
          revealed: it.revealed,
          text: visible ? it.text : null,
          isMine: it.authorId === me,
          authorId: showAuthors ? it.authorId : null,
          votes: showAuthors ? voteCount[it.idx] || 0 : null,
        };
      }),
      votedIds: Object.keys(this.votes),
      myVote: this.votes[me] ?? null,
      canVote: this.canVote(me),
      gains: showAuthors ? this.gains : {},
    };
  }
}

// clean up abandoned rooms
setInterval(() => {
  for (const [code, room] of rooms) {
    if (room.emptySince && Date.now() - room.emptySince > 10 * 60 * 1000) {
      room.clearTimer();
      rooms.delete(code);
    }
  }
}, 60 * 1000).unref();
