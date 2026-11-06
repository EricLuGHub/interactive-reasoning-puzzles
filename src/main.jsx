import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { RotateCcw } from 'lucide-react';
import './styles.css';

const games = [
  ['balloon', 'Balloon'],
  ['code', 'Code Compare'],
  ['pincode', 'Pincode'],
  ['numberbox', 'NumberBox'],
  ['shapeshift', 'Shapeshift'],
  ['switch', 'The Switch'],
  ['skyscraper', 'Skyscrapers'],
  ['figure', 'Figure It Out'],
  ['grill', 'Grill Master'],
  ['stock', 'Stock Master'],
];

const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const choice = (items) => items[Math.floor(Math.random() * items.length)];
const shuffle = (items) => [...items].sort(() => Math.random() - 0.5);
const money = (value) => `$${value.toFixed(2)}`;

function App() {
  const [game, setGame] = useState('balloon');
  const title = games.find(([id]) => id === game)?.[1];

  return (
    <main className="app">
      <aside className="nav">
        <p className="eyebrow">Zap-N practice</p>
        <h1>{title}</h1>
        <div className="game-list">
          {games.map(([id, label]) => (
            <button key={id} className={game === id ? 'active' : ''} onClick={() => setGame(id)}>
              {label}
            </button>
          ))}
        </div>
      </aside>
      <section className="stage">
        {game === 'balloon' && <BalloonGame />}
        {game === 'code' && <CodeCompare />}
        {game === 'pincode' && <Pincode />}
        {game === 'numberbox' && <NumberBox />}
        {game === 'shapeshift' && <Shapeshift />}
        {game === 'switch' && <SwitchGame />}
        {game === 'skyscraper' && <Skyscrapers />}
        {game === 'figure' && <FigureItOut />}
        {game === 'grill' && <GrillMaster />}
        {game === 'stock' && <StockMaster />}
      </section>
    </main>
  );
}

function Panel({ children, onReset, stats }) {
  return (
    <div className="panel">
      <div className="panel-top">
        <div className="stats">{stats}</div>
        {onReset && (
          <button className="icon-button" onClick={onReset} aria-label="Reset" title="Reset">
            <RotateCcw size={19} />
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

const balloonPhases = [
  { name: 'Gain', count: 30, valuePerPump: 0.05, penaltyRate: 0 },
  { name: 'Penalty', count: 20, valuePerPump: 0.1, penaltyRate: 1 },
];

const balloonTypes = {
  blue: { maxPop: 128, average: 64 },
  yellow: { maxPop: 32, average: 16 },
  orange: { maxPop: 8, average: 4 },
};
const balloonColors = Object.keys(balloonTypes);

function balloonThreshold(color) {
  return rand(1, balloonTypes[color].maxPop);
}

function makeBalloonPhaseDeck(count) {
  const colors = [];
  while (colors.length < count) colors.push(...shuffle(balloonColors));
  return colors.slice(0, count).map((color) => ({ color, threshold: balloonThreshold(color) }));
}

function BalloonGame() {
  const fresh = () => ({
    phaseIndex: 0,
    trialIndex: 1,
    decks: balloonPhases.map((phase) => makeBalloonPhaseDeck(phase.count)),
    pumps: 0,
    bank: 0,
    popped: false,
    done: false,
    history: [],
    message: 'Pump the balloon and bank before it pops.',
  });
  const [s, setS] = useState(fresh);
  const phase = balloonPhases[s.phaseIndex];
  const trial = s.decks[s.phaseIndex][s.trialIndex - 1];
  const skin = trial?.color ?? 'blue';
  const threshold = trial?.threshold ?? 1;
  const currentValue = s.pumps * phase.valuePerPump;
  const visualInflation = Math.min(100, (s.pumps / 70) * 100);

  function advance(next) {
    const atEndOfPhase = s.trialIndex >= phase.count;
    const atEndOfGame = atEndOfPhase && s.phaseIndex >= balloonPhases.length - 1;
    if (atEndOfGame) {
      setS({ ...next, done: true, message: `Finished. Final bank: ${money(next.bank)}.` });
      return;
    }
    setS({
      ...next,
      phaseIndex: atEndOfPhase ? s.phaseIndex + 1 : s.phaseIndex,
      trialIndex: atEndOfPhase ? 1 : s.trialIndex + 1,
      pumps: 0,
      popped: false,
    });
  }

  function pump() {
    if (s.done || s.popped) return;
    const pumps = s.pumps + 1;
    if (pumps >= threshold) {
      const penalty = currentValue * phase.penaltyRate;
      const next = {
        ...s,
        pumps,
        popped: true,
        bank: Math.max(0, s.bank - penalty),
        history: [{ result: 'pop', color: skin, pumps, value: -penalty }, ...s.history],
        message: penalty ? `Popped. Penalty: ${money(penalty)}.` : 'Popped. This balloon earned nothing.',
      };
      setS(next);
      setTimeout(() => advance(next), 650);
      return;
    }
    setS({ ...s, pumps, message: `Current value: ${money(pumps * phase.valuePerPump)}.` });
  }

  function bank() {
    if (s.done || s.popped || s.pumps === 0) return;
    advance({
      ...s,
      bank: s.bank + currentValue,
      history: [{ result: 'bank', color: skin, pumps: s.pumps, value: currentValue }, ...s.history],
      message: `Banked ${money(currentValue)}.`,
    });
  }

  return (
    <Panel
      onReset={() => setS(fresh())}
      stats={
        <>
          <Stat label="Bank" value={money(s.bank)} />
          <Stat label="Phase" value={phase.name} />
          <Stat label="Balloon" value={`${s.trialIndex}/${phase.count}`} />
          <Stat label="Type" value={skin} />
        </>
      }
    >
      <div className="balloon-area">
        <div
          className={`balloon ${skin} ${s.popped ? 'popped' : ''}`}
          style={{ transform: `scale(${1 + visualInflation / 170})` }}
        >
          <span>{s.popped ? 'POP' : s.pumps}</span>
        </div>
        <div className="string" />
      </div>
      <div className="readout">
        <strong>{money(currentValue)}</strong>
        <span>{s.message}</span>
      </div>
      <div className="actions two">
        <button className="primary" onClick={pump} disabled={s.done || s.popped}>
          Pump
        </button>
        <button onClick={bank} disabled={s.done || s.popped || !s.pumps}>
          Bank
        </button>
      </div>
    </Panel>
  );
}

function makeCodeRound(round) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const target = Array.from({ length: 7 }, () => choice(chars)).join('');
  const mutate = () => {
    const i = rand(0, target.length - 1);
    let c = choice(chars);
    while (c === target[i]) c = choice(chars);
    return target.slice(0, i) + c + target.slice(i + 1);
  };
  return {
    target,
    options: shuffle([target, mutate(), mutate(), mutate()]),
  };
}

function CodeCompare() {
  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [item, setItem] = useState(() => makeCodeRound(1));
  const [timeLeft, setTimeLeft] = useState(60);
  const [message, setMessage] = useState('Pick the exact matching code.');
  const done = round > 30 || timeLeft <= 0;

  useEffect(() => {
    if (done) return undefined;
    const timer = setInterval(() => setTimeLeft((t) => Math.max(0, t - 1)), 1000);
    return () => clearInterval(timer);
  }, [done]);

  function answer(value) {
    if (done) return;
    const correct = value === item.target;
    const nextRound = round + 1;
    setScore((x) => x + (correct ? 1 : -1));
    setMessage(correct ? 'Correct.' : `Miss. Target was ${item.target}.`);
    setRound(nextRound);
    if (nextRound <= 30) setItem(makeCodeRound(nextRound));
  }

  return (
    <Panel onReset={() => window.location.reload()} stats={<><Stat label="Round" value={`${Math.min(round, 30)}/30`} /><Stat label="Score" value={score} /><Stat label="Time left" value={`${timeLeft}s`} /></>}>
      <div className="center-block">
        <div className="code-target">{done ? 'Finished' : item.target}</div>
        <div className="option-grid">
          {!done && item.options.map((option) => <button key={option} onClick={() => answer(option)}>{option}</button>)}
        </div>
        <p className="message">{done ? `Final score: ${score}` : message}</p>
      </div>
    </Panel>
  );
}

function makeSequence(length) {
  return Array.from({ length }, () => String(rand(0, 9))).join('');
}

function Pincode() {
  const [round, setRound] = useState(1);
  const [length, setLength] = useState(4);
  const [seq, setSeq] = useState(() => makeSequence(4));
  const [shown, setShown] = useState(0);
  const [flashOn, setFlashOn] = useState(true);
  const [input, setInput] = useState('');
  const [score, setScore] = useState(0);
  const [stage, setStage] = useState('show');
  const mode = round <= 10 ? 'repeat' : round <= 20 ? 'reverse' : 'sort';
  const answer = mode === 'repeat' ? seq : mode === 'reverse' ? [...seq].reverse().join('') : [...seq].sort().join('');

  useEffect(() => {
    if (stage !== 'show') return undefined;
    if (shown >= seq.length) {
      const t = setTimeout(() => setStage('input'), 250);
      return () => clearTimeout(t);
    }
    if (flashOn) {
      const t = setTimeout(() => setFlashOn(false), 420);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => {
      setShown((x) => x + 1);
      setFlashOn(true);
    }, 170);
    return () => clearTimeout(t);
  }, [stage, shown, seq, flashOn]);

  function submit() {
    const ok = input === answer;
    const nextLength = Math.max(4, Math.min(8, length + (ok ? 1 : -1)));
    setScore(score + (ok ? 1 : -1));
    if (round >= 30) {
      setStage('done');
      return;
    }
    setRound(round + 1);
    setLength(nextLength);
    setSeq(makeSequence(nextLength));
    setShown(0);
    setFlashOn(true);
    setInput('');
    setStage('show');
  }

  return (
    <Panel onReset={() => window.location.reload()} stats={<><Stat label="Question" value={`${Math.min(round, 30)}/30`} /><Stat label="Mode" value={mode} /><Stat label="Score" value={score} /></>}>
      <div className="center-block">
        {stage === 'show' && <div className={`digit-flash ${flashOn ? '' : 'blank'}`}>{flashOn ? seq[shown] ?? '' : ''}</div>}
        {stage === 'input' && (
          <>
            <input className="answer-input" autoFocus value={input} onChange={(e) => setInput(e.target.value.replace(/\D/g, ''))} onKeyDown={(e) => e.key === 'Enter' && submit()} />
            <button className="primary" onClick={submit}>Submit</button>
          </>
        )}
        {stage === 'done' && <div className="code-target">Final score: {score}</div>}
      </div>
    </Panel>
  );
}

function makeNumberBox() {
  const nums = Array.from({ length: 4 }, () => rand(1, 10));
  const ops = ['+', '-', '*'];
  let target = nums[0];
  for (let i = 1; i < nums.length; i += 1) {
    const op = choice(ops);
    target = op === '+' ? target + nums[i] : op === '-' ? target - nums[i] : target * nums[i];
  }
  return { target, nums: nums.map((n, i) => ({ id: `${i}-${n}`, value: n })) };
}

function NumberBox() {
  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [box, setBox] = useState(makeNumberBox);
  const [selected, setSelected] = useState(null);
  const [op, setOp] = useState(null);
  const [message, setMessage] = useState('Use all four numbers to reach the target.');

  function pick(i) {
    if (selected === null) {
      setSelected(i);
      return;
    }
    if (!op || selected === i) {
      setSelected(i);
      return;
    }
    const a = box.nums[selected].value;
    const b = box.nums[i].value;
    const value = op === '+' ? a + b : op === '-' ? a - b : op === '*' ? a * b : b !== 0 && a % b === 0 ? a / b : null;
    if (value === null) return;
    const nums = box.nums.filter((_, idx) => idx !== selected && idx !== i);
    nums.push({ id: `${Date.now()}-${value}`, value });
    setBox({ ...box, nums });
    setSelected(null);
    setOp(null);
    if (nums.length === 1) {
      const ok = nums[0].value === box.target;
      setScore(score + (ok ? 1 : -1));
      setMessage(ok ? 'Correct.' : `Miss. You made ${nums[0].value}.`);
    }
  }

  function next(delta = 0) {
    setScore(score + delta);
    setRound(round + 1);
    setBox(makeNumberBox());
    setSelected(null);
    setOp(null);
    setMessage('Use all four numbers to reach the target.');
  }

  return (
    <Panel onReset={() => window.location.reload()} stats={<><Stat label="Round" value={`${Math.min(round, 10)}/10`} /><Stat label="Target" value={box.target} /><Stat label="Score" value={score} /></>}>
      <div className="center-block">
        <div className="number-row">
          {box.nums.map((n, i) => <button key={n.id} className={selected === i ? 'active' : ''} onClick={() => pick(i)}>{n.value}</button>)}
        </div>
        <div className="ops">{['+', '-', '*', '/'].map((x) => <button key={x} className={op === x ? 'active' : ''} onClick={() => setOp(x)}>{x}</button>)}</div>
        <p className="message">{message}</p>
        <div className="actions two">
          <button onClick={() => next(-1)} disabled={round > 10}>Give up</button>
          <button className="primary" onClick={() => next(0)} disabled={box.nums.length !== 1 || round >= 10}>Next</button>
        </div>
      </div>
    </Panel>
  );
}

function Shapeshift() {
  const make = () => ({ shape: choice(['circle', 'square']), x: rand(8, 82), y: rand(10, 70) });
  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [item, setItem] = useState(make);
  const [timeLeft, setTimeLeft] = useState(60);
  const [stimulusMs, setStimulusMs] = useState(1400);
  const done = timeLeft <= 0;

  useEffect(() => {
    if (done) return undefined;
    const clock = setInterval(() => setTimeLeft((t) => Math.max(0, t - 1)), 1000);
    return () => clearInterval(clock);
  }, [done]);

  useEffect(() => {
    if (done) return undefined;
    const limit = Math.max(650, 1450 - Math.floor(round / 12) * 100);
    setStimulusMs(limit);
    const startedAt = Date.now();
    const timer = setInterval(() => {
      const remaining = Math.max(0, limit - (Date.now() - startedAt));
      setStimulusMs(remaining);
      if (remaining <= 0) {
        clearInterval(timer);
        setScore((x) => x - 1);
        setRound((x) => x + 1);
        setItem(make());
      }
    }, 60);
    return () => clearInterval(timer);
  }, [round, done]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowRight') answer('circle');
      if (e.key === 'ArrowLeft') answer('square');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  function answer(value) {
    if (done) return;
    setScore((x) => x + (value === item.shape ? 1 : -1));
    setRound((x) => x + 1);
    setItem(make());
  }

  return (
    <Panel onReset={() => window.location.reload()} stats={<><Stat label="Time" value={`${timeLeft}s`} /><Stat label="Score" value={score} /><Stat label="Item time" value={`${(stimulusMs / 1000).toFixed(1)}s`} /></>}>
      <div className="reaction-zone">
        {!done && <div className={`flash-shape ${item.shape}`} style={{ left: `${item.x}%`, top: `${item.y}%` }} />}
        {done && <div className="code-target">Final score: {score}</div>}
      </div>
      <div className="actions two"><button onClick={() => answer('square')}>Left: square</button><button className="primary" onClick={() => answer('circle')}>Right: circle</button></div>
    </Panel>
  );
}

function makeSwitchRound(task = 'math') {
  const a = rand(1, 19);
  const b = rand(1, 19);
  const arrows = ['<<<', '>>>', '<><', '><>'];
  const left = choice(arrows);
  const same = Math.random() > 0.5;
  return { a, b, task, left, right: same ? left : choice(arrows.filter((x) => x !== left)), same };
}

function SwitchGame() {
  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [item, setItem] = useState(makeSwitchRound);
  const [timeLeft, setTimeLeft] = useState(60);
  const done = timeLeft <= 0;
  const correct = item.task === 'math' ? (item.a + item.b) % 2 === 1 : item.same;

  useEffect(() => {
    if (done) return undefined;
    const clock = setInterval(() => setTimeLeft((t) => Math.max(0, t - 1)), 1000);
    return () => clearInterval(clock);
  }, [done]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'n') answer(false);
      if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'y') answer(true);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  function answer(value) {
    if (done) return;
    setScore((x) => x + (value === correct ? 1 : -1));
    setRound((x) => x + 1);
    setItem(makeSwitchRound(item.task === 'math' ? 'arrows' : 'math'));
  }

  return (
    <Panel onReset={() => window.location.reload()} stats={<><Stat label="Time" value={`${timeLeft}s`} /><Stat label="Score" value={score} /><Stat label="Items" value={round - 1} /></>}>
      {done ? (
        <div className="center-block"><div className="code-target">Final score: {score}</div></div>
      ) : (
        <>
          <div className="switch-grid">
            <div className={item.task === 'math' ? 'focus-card' : 'task-card'}>{item.a} + {item.b}<span>Odd?</span></div>
            <div className={item.task === 'arrows' ? 'focus-card' : 'task-card'}>{item.left} / {item.right}<span>Same?</span></div>
          </div>
          <div className="actions two"><button onClick={() => answer(false)}>No</button><button className="primary" onClick={() => answer(true)}>Yes</button></div>
        </>
      )}
    </Panel>
  );
}

function makeTowers(level = 1) {
  const palette = ['red', 'blue', 'green', 'yellow', 'purple', 'teal'];
  const blockCount = Math.min(18, 5 + level);
  const towerCount = level >= 11 ? 5 : level >= 5 ? 4 : 3;
  const blocks = Array.from({ length: blockCount }, (_, i) => ({
    id: `b${i}`,
    color: palette[i % Math.min(palette.length, 3 + Math.floor(level / 3))],
  }));
  const target = Array.from({ length: towerCount }, () => []);
  blocks.forEach((block, i) => target[i % towerCount].push(block));

  let towers = target.map((tower) => tower.map((block) => ({ ...block })));
  const movesToScramble = 14 + level * 7;
  for (let move = 0; move < movesToScramble; move += 1) {
    const sources = towers.map((tower, i) => (tower.length ? i : null)).filter((x) => x !== null);
    const from = choice(sources);
    let to = rand(0, towerCount - 1);
    while (to === from) to = rand(0, towerCount - 1);
    towers[to].push(towers[from].pop());
  }

  if (JSON.stringify(towers.map((t) => t.map((b) => b.id))) === JSON.stringify(target.map((t) => t.map((b) => b.id)))) {
    towers = shuffle(blocks).reduce(
      (acc, block, i) => {
        acc[i % towerCount].push({ ...block });
        return acc;
      },
      Array.from({ length: towerCount }, () => []),
    );
  }

  return { target, towers };
}

function Skyscrapers() {
  const [level, setLevel] = useState(1);
  const [puzzle, setPuzzle] = useState(() => makeTowers(1));
  const [selected, setSelected] = useState(null);
  const [moves, setMoves] = useState(0);
  const [solvedLevels, setSolvedLevels] = useState(0);
  const [timeLeft, setTimeLeft] = useState(45);
  const [timedOut, setTimedOut] = useState(false);
  const solved = JSON.stringify(puzzle.towers.map((t) => t.map((b) => b.color))) === JSON.stringify(puzzle.target.map((t) => t.map((b) => b.color)));

  useEffect(() => {
    if (solved || timedOut || level > 15) return undefined;
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timer);
          setTimedOut(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [level, solved, timedOut]);

  function clickTower(i) {
    if (timedOut || level > 15) return;
    if (selected === null) {
      if (puzzle.towers[i].length) setSelected(i);
      return;
    }
    if (selected !== i) {
      const towers = puzzle.towers.map((t) => [...t]);
      towers[i].push(towers[selected].pop());
      setPuzzle({ ...puzzle, towers });
      setMoves(moves + 1);
    }
    setSelected(null);
  }

  function next() {
    const nextLevel = level + 1;
    if (solved) setSolvedLevels(solvedLevels + 1);
    setLevel(nextLevel);
    setPuzzle(makeTowers(nextLevel));
    setMoves(0);
    setSelected(null);
    setTimeLeft(Math.max(18, 48 - nextLevel * 2));
    setTimedOut(false);
  }

  return (
    <Panel onReset={() => window.location.reload()} stats={<><Stat label="Level" value={`${Math.min(level, 15)}/15`} /><Stat label="Solved" value={solvedLevels} /><Stat label="Time left" value={`${timeLeft}s`} /></>}>
      <TowerBoard label="Target" towers={puzzle.target} />
      <TowerBoard label="Your towers" towers={puzzle.towers} selected={selected} onClick={clickTower} />
      <p className="message">{timedOut ? 'Time ran out for this level.' : solved ? `Solved in ${moves} moves.` : `${moves} moves`}</p>
      <button className="primary" onClick={next} disabled={(!solved && !timedOut) || level >= 15}>Next</button>
    </Panel>
  );
}

function TowerBoard({ label, towers, selected, onClick }) {
  return (
    <div className="tower-section">
      <h2>{label}</h2>
      <div className="towers">{towers.map((tower, i) => <button key={i} className={`tower ${selected === i ? 'active' : ''}`} onClick={() => onClick?.(i)}>{tower.map((b) => <span key={b.id} className={`block ${b.color}`} />)}</button>)}</div>
    </div>
  );
}

const figureProps = {
  shape: ['circle', 'square', 'triangle', 'diamond'],
  color: ['red', 'blue', 'green', 'yellow'],
  pattern: ['plain', 'dots', 'stripes'],
  mark: ['one', 'two', 'three'],
};

function makeFigure(round) {
  const keys = Object.keys(figureProps).slice(0, Math.min(4, 2 + round));
  return Object.fromEntries(keys.map((k) => [k, choice(figureProps[k])]));
}

function FigureItOut() {
  const [round, setRound] = useState(1);
  const [hidden, setHidden] = useState(() => makeFigure(1));
  const [guess, setGuess] = useState({});
  const [attempts, setAttempts] = useState(0);
  const [feedback, setFeedback] = useState('Pick properties, then check.');
  const keys = Object.keys(hidden);

  function check() {
    const right = keys.filter((k) => guess[k] === hidden[k]).length;
    setAttempts(attempts + 1);
    if (right === keys.length) setFeedback(`Solved in ${attempts + 1} attempts.`);
    else setFeedback(`${right} of ${keys.length} properties are correct.`);
  }

  function next() {
    const r = round + 1;
    setRound(r);
    setHidden(makeFigure(r));
    setGuess({});
    setAttempts(0);
    setFeedback('Pick properties, then check.');
  }

  const solved = keys.every((k) => guess[k] === hidden[k]);

  return (
    <Panel onReset={() => window.location.reload()} stats={<><Stat label="Round" value={`${round}/5`} /><Stat label="Attempts" value={attempts} /><Stat label="Properties" value={keys.length} /></>}>
      <div className="figure-layout">
        <div className="mystery-card">{solved ? <FigureView spec={hidden} /> : '?'}</div>
        <div className="property-grid">{keys.map((k) => <label key={k}>{k}<select value={guess[k] ?? ''} onChange={(e) => setGuess({ ...guess, [k]: e.target.value })}><option value="">Choose</option>{figureProps[k].map((v) => <option key={v}>{v}</option>)}</select></label>)}</div>
      </div>
      <p className="message">{feedback}</p>
      <div className="actions two"><button onClick={check}>Check</button><button className="primary" onClick={next} disabled={!solved || round >= 5}>Next</button></div>
    </Panel>
  );
}

function FigureView({ spec }) {
  return <div className={`figure ${spec.shape} ${spec.color} ${spec.pattern}`}>{spec.mark}</div>;
}

function GrillMaster() {
  const [time, setTime] = useState(60);
  const timeRef = useRef(60);
  const makeFood = () => ({
    id: `${Date.now()}-${Math.random()}`,
    cook: rand(0, 24),
    speed: rand(2, 4) + (60 - timeRef.current) / 38,
    rawEnd: Math.max(44, 58 - Math.floor((60 - timeRef.current) / 8)),
    cookedWindow: Math.max(12, 26 - Math.floor((60 - timeRef.current) / 5)),
  });
  const [items, setItems] = useState(() => Array.from({ length: 5 }, makeFood));
  const [score, setScore] = useState(0);
  const [misses, setMisses] = useState(0);

  useEffect(() => {
    timeRef.current = time;
  }, [time]);

  useEffect(() => {
    const tick = setInterval(() => {
      if (timeRef.current <= 0) return;
      setItems((xs) => {
        let burned = 0;
        const next = xs
          .map((x) => ({ ...x, cook: x.cook + x.speed }))
          .filter((x) => {
            const isBurned = x.cook <= x.rawEnd + x.cookedWindow + 10;
            if (!isBurned) burned += 1;
            return isBurned;
          });
        if (burned) {
          setMisses((m) => m + burned);
          setScore((v) => v - burned);
        }
        return next;
      });
    }, 450);
    const add = setInterval(() => {
      if (timeRef.current <= 0) return;
      const maxItems = timeRef.current > 40 ? 8 : timeRef.current > 20 ? 10 : 12;
      setItems((xs) => (xs.length >= maxItems ? xs : [...xs, makeFood()]));
    }, 650);
    const clock = setInterval(() => {
      setTime((t) => Math.max(0, t - 1));
    }, 1000);
    return () => { clearInterval(tick); clearInterval(add); clearInterval(clock); };
  }, []);

  function pull(id) {
    if (time <= 0) return;
    const item = items.find((x) => x.id === id);
    if (!item) return;
    const ok = item.cook >= item.rawEnd && item.cook <= item.rawEnd + item.cookedWindow;
    setScore((x) => x + (ok ? 1 : -1));
    if (!ok) setMisses((x) => x + 1);
    setItems(items.filter((x) => x.id !== id));
  }

  return (
    <Panel onReset={() => window.location.reload()} stats={<><Stat label="Time" value={`${Math.max(0, time)}s`} /><Stat label="Score" value={score} /><Stat label="Misses" value={misses} /></>}>
      <div className="grill">
        {items.map((item) => {
          const state = item.cook < item.rawEnd ? 'raw' : item.cook <= item.rawEnd + item.cookedWindow ? 'done' : 'burn';
          return (
            <button key={item.id} className={`meat ${state}`} onClick={() => pull(item.id)} aria-label={`${state} grill item`}>
              <span className="steak" />
              <span className="cook-bar">
                <span style={{ width: `${Math.min(100, item.cook)}%` }} />
              </span>
            </button>
          );
        })}
      </div>
    </Panel>
  );
}

function StockMaster() {
  const makeGauge = (id) => ({ id, angle: rand(0, 359), speed: rand(2, 5), start: rand(0, 359) });
  const [gauges, setGauges] = useState(() => Array.from({ length: 12 }, (_, id) => makeGauge(id)));
  const [score, setScore] = useState(0);
  const [time, setTime] = useState(60);

  useEffect(() => {
    if (time <= 0) return undefined;
    const motion = setInterval(() => {
      setGauges((gs) => gs.map((g) => ({ ...g, angle: (g.angle + g.speed) % 360 })));
    }, 80);
    const clock = setInterval(() => setTime((t) => Math.max(0, t - 1)), 1000);
    return () => {
      clearInterval(motion);
      clearInterval(clock);
    };
  }, [time]);

  function buy(g) {
    if (time <= 0) return;
    const diff = Math.abs(((g.angle - g.start + 540) % 360) - 180);
    setScore(score + (diff < 30 ? 1 : -1));
    setGauges((gs) => gs.map((x) => (x.id === g.id ? makeGauge(x.id) : x)));
  }

  return (
    <Panel onReset={() => window.location.reload()} stats={<><Stat label="Time" value={`${time}s`} /><Stat label="Score" value={score} /><Stat label="Goal" value="colored zone" /></>}>
      <div className="stock-grid">{gauges.map((g) => <button key={g.id} className="gauge" onClick={() => buy(g)}><span className="zone" style={{ transform: `rotate(${g.start}deg)` }} /><span className="needle" style={{ transform: `rotate(${g.angle}deg)` }} /></button>)}</div>
    </Panel>
  );
}

createRoot(document.getElementById('root')).render(<App />);
