import { useState, useCallback, useEffect } from 'react'
import confetti from 'canvas-confetti'
import './EnglishGame.css'

// ── Word bank ────────────────────────────────────────────────
// miss: index of the hidden letter (0=first, 1=middle, 2=last)
const WORDS = [
  { word: 'CAT', emoji: '🐱', miss: 2 },
  { word: 'DOG', emoji: '🐶', miss: 2 },
  { word: 'PIG', emoji: '🐷', miss: 2 },
  { word: 'COW', emoji: '🐮', miss: 2 },
  { word: 'HEN', emoji: '🐔', miss: 2 },
  { word: 'ANT', emoji: '🐜', miss: 2 },
  { word: 'BEE', emoji: '🐝', miss: 2 },
  { word: 'FOX', emoji: '🦊', miss: 2 },
  { word: 'OWL', emoji: '🦉', miss: 1 },
  { word: 'RAT', emoji: '🐀', miss: 0 },
  { word: 'BUS', emoji: '🚌', miss: 2 },
  { word: 'CAR', emoji: '🚗', miss: 2 },
  { word: 'JET', emoji: '✈️',  miss: 2 },
  { word: 'VAN', emoji: '🚐', miss: 2 },
  { word: 'EGG', emoji: '🥚', miss: 2 },
  { word: 'CUP', emoji: '☕', miss: 2 },
  { word: 'POT', emoji: '🥘', miss: 2 },
  { word: 'PAN', emoji: '🍳', miss: 2 },
  { word: 'JAM', emoji: '🍓', miss: 0 },
  { word: 'NUT', emoji: '🥜', miss: 2 },
  { word: 'BOX', emoji: '📦', miss: 2 },
  { word: 'HAT', emoji: '🎩', miss: 2 },
  { word: 'SUN', emoji: '☀️', miss: 2 },
  { word: 'MAP', emoji: '🗺️', miss: 2 },
  { word: 'WEB', emoji: '🕸️', miss: 2 },
  { word: 'LOG', emoji: '🪵', miss: 2 },
  { word: 'PEN', emoji: '✏️', miss: 2 },
  { word: 'LEG', emoji: '🦵', miss: 2 },
  { word: 'TUB', emoji: '🛁', miss: 2 },
  { word: 'ICE', emoji: '🧊', miss: 2 },
  { word: 'TOY', emoji: '🧸', miss: 2 },
  { word: 'SKY', emoji: '🌤️', miss: 2 },
  { word: 'BAT', emoji: '🦇', miss: 1 },
  { word: 'HOT', emoji: '🌶️', miss: 1 },
  { word: 'HAM', emoji: '🍖', miss: 1 },
]

const MESSAGES = [
  { text: 'AMAZING!',    emoji: '🌟' },
  { text: 'FANTASTIC!',  emoji: '🎉' },
  { text: 'SUPERSTAR!',  emoji: '⭐' },
  { text: 'YOU DID IT!', emoji: '🏆' },
  { text: 'BRILLIANT!',  emoji: '🦄' },
  { text: 'AWESOME!',    emoji: '💫' },
  { text: 'PERFECT!',    emoji: '🌈' },
  { text: 'WOW WOW WOW!', emoji: '🚀' },
]

const FLOAT_EMOJIS = ['⭐', '🌟', '✨', '💫', '🎉', '🎊', '❤️', '🦋']

const VOWELS     = ['A', 'E', 'I', 'O', 'U']
const CONSONANTS = ['B', 'C', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'M',
                    'N', 'P', 'R', 'S', 'T', 'V', 'W', 'X', 'Y']

// ── Helpers ──────────────────────────────────────────────────
function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5)
}

function generateChoices(correct) {
  const pool = VOWELS.includes(correct) ? VOWELS : CONSONANTS
  const distractors = shuffle(pool.filter(l => l !== correct)).slice(0, 3)
  return shuffle([correct, ...distractors])
}

function fireCelebration() {
  const shoot = (x, y, delay) =>
    setTimeout(() => confetti({
      particleCount: 70,
      spread: 100,
      origin: { x, y },
      colors: ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#ff6b9d', '#c77dff'],
      ticks: 200,
    }), delay)
  shoot(0.5, 0.4, 0)
  shoot(0.2, 0.6, 150)
  shoot(0.8, 0.6, 150)
  shoot(0.35, 0.3, 300)
  shoot(0.65, 0.3, 300)
}

function FloatingEmojis() {
  const items = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    emoji: FLOAT_EMOJIS[i % FLOAT_EMOJIS.length],
    left: `${5 + (i * 8.5) % 90}%`,
    delay: `${(i * 0.15).toFixed(2)}s`,
    duration: `${1.2 + (i % 4) * 0.3}s`,
    size: `${1.5 + (i % 3) * 0.7}rem`,
  }))
  return (
    <div className="float-container" aria-hidden="true">
      {items.map(item => (
        <span key={item.id} className="float-emoji" style={{
          left: item.left,
          animationDelay: item.delay,
          animationDuration: item.duration,
          fontSize: item.size,
        }}>{item.emoji}</span>
      ))}
    </div>
  )
}

// ── Main component ───────────────────────────────────────────
export default function EnglishGame({ onBack }) {
  // Shuffle word order once on mount
  const [wordQueue]   = useState(() => shuffle(WORDS))
  const [wordIdx, setWordIdx]       = useState(0)
  const [choices, setChoices]       = useState([])
  const [phase, setPhase]           = useState('playing') // 'playing' | 'correct'
  const [score, setScore]           = useState(0)
  const [shakeKey, setShakeKey]     = useState(0)
  const [celebration, setCelebration] = useState(MESSAGES[0])
  const [wrongLetter, setWrongLetter] = useState(null)

  const wordData    = wordQueue[wordIdx % wordQueue.length]
  const { word, emoji, miss } = wordData
  const correctLetter = word[miss]

  // Fresh choices whenever the word changes
  useEffect(() => {
    setChoices(generateChoices(correctLetter))
  }, [wordIdx, correctLetter])

  const nextWord = useCallback(() => {
    setWordIdx(i => i + 1)
    setPhase('playing')
    setWrongLetter(null)
  }, [])

  const handleChoice = useCallback((letter) => {
    if (phase !== 'playing') return

    if (letter === correctLetter) {
      const msg = MESSAGES[Math.floor(Math.random() * MESSAGES.length)]
      setCelebration(msg)
      setScore(s => s + 1)
      setPhase('correct')
      fireCelebration()
      setTimeout(nextWord, 2600)
    } else {
      setWrongLetter(letter)
      setShakeKey(k => k + 1)
      setTimeout(() => setWrongLetter(null), 600)
    }
  }, [phase, correctLetter, nextWord])

  return (
    <div className="game-root eng-root">
      {phase === 'correct' && <FloatingEmojis />}

      {/* Header */}
      <header className="game-header">
        <button className="back-btn" onClick={onBack} aria-label="Back to home">←</button>
        <div className="game-title">Word Fun! 📚</div>
        <div className="score-badge">
          <span className="score-star">⭐</span>
          <span className="score-num">{score}</span>
        </div>
      </header>

      {/* Word card — picture beside word tiles */}
      <div className="word-card">
        {/* Picture */}
        <div className="word-pic">{emoji}</div>

        {/* Tiles — key forces remount so shake re-triggers on repeated wrong answers */}
        <div
          key={shakeKey}
          className={`word-tiles${wrongLetter ? ' shake' : ''}`}
        >
          {word.split('').map((letter, i) => {
            if (i !== miss) {
              return <div key={i} className="word-tile tile-letter">{letter}</div>
            }
            if (phase === 'correct') {
              return <div key={i} className="word-tile tile-correct">{letter}</div>
            }
            return <div key={i} className="word-tile tile-blank" />
          })}
        </div>
      </div>

      {/* Prompt */}
      <div className="hint-text">
        {phase === 'playing' && 'Which letter completes the word?'}
        {phase === 'correct'  && ' '}
      </div>

      {/* Letter choice buttons — 2 × 2 grid */}
      <div className="choices-grid">
        {choices.map((letter, idx) => (
          <button
            key={letter}
            className={[
              'choice-btn',
              `choice-color-${idx}`,
              letter === wrongLetter ? 'choice-wrong' : '',
            ].join(' ')}
            onClick={() => handleChoice(letter)}
            aria-label={`Letter ${letter}`}
          >
            {letter}
          </button>
        ))}
      </div>

      {/* Celebration overlay */}
      {phase === 'correct' && (
        <div className="celebration-overlay" role="alert" aria-live="assertive">
          <div className="celebration-card">
            <div className="celeb-emoji">{celebration.emoji}</div>
            <div className="celeb-message">{celebration.text}</div>
            <div className="celeb-equation">
              {word} = {emoji}
            </div>
            <div className="celeb-sub">Next word coming up…</div>
          </div>
        </div>
      )}
    </div>
  )
}
