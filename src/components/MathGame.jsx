import { useState, useCallback, useEffect } from 'react'
import confetti from 'canvas-confetti'
import './MathGame.css'

const MESSAGES = [
  { text: 'AMAZING!', emoji: '🌟' },
  { text: 'FANTASTIC!', emoji: '🎉' },
  { text: 'SUPERSTAR!', emoji: '⭐' },
  { text: 'YOU DID IT!', emoji: '🏆' },
  { text: 'BRILLIANT!', emoji: '🦄' },
  { text: 'WOW WOW WOW!', emoji: '🚀' },
  { text: 'PERFECT!', emoji: '🌈' },
  { text: 'AWESOME!', emoji: '💫' },
]

const FLOAT_EMOJIS = ['⭐', '🌟', '✨', '💫', '🎉', '🎊', '❤️', '🦋']

function getMaxAddend(score) {
  if (score < 5) return 9
  if (score < 10) return 19
  if (score < 15) return 49
  if (score < 20) return 99
  return 999
}

function generateQuestion(score) {
  const max = getMaxAddend(score)
  const a = Math.floor(Math.random() * max) + 1
  const b = Math.floor(Math.random() * max) + 1
  return { a, b, answer: a + b }
}

function fireCelebration() {
  const shoot = (x, y, delay) =>
    setTimeout(() =>
      confetti({
        particleCount: 70,
        spread: 100,
        origin: { x, y },
        colors: ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#ff6b9d', '#c77dff', '#fff'],
        ticks: 200,
      }),
      delay
    )
  shoot(0.5, 0.4, 0)
  shoot(0.2, 0.6, 150)
  shoot(0.8, 0.6, 150)
  shoot(0.35, 0.3, 300)
  shoot(0.65, 0.3, 300)
}

function FloatingEmojis({ active }) {
  const items = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    emoji: FLOAT_EMOJIS[i % FLOAT_EMOJIS.length],
    left: `${5 + (i * 8.5) % 90}%`,
    delay: `${(i * 0.15).toFixed(2)}s`,
    duration: `${1.2 + (i % 4) * 0.3}s`,
    size: `${1.5 + (i % 3) * 0.7}rem`,
  }))

  if (!active) return null

  return (
    <div className="float-container" aria-hidden="true">
      {items.map(item => (
        <span
          key={item.id}
          className="float-emoji"
          style={{
            left: item.left,
            animationDelay: item.delay,
            animationDuration: item.duration,
            fontSize: item.size,
          }}
        >
          {item.emoji}
        </span>
      ))}
    </div>
  )
}

export default function MathGame({ onBack }) {
  const [score, setScore] = useState(0)
  const [question, setQuestion] = useState(() => generateQuestion(0))
  const [input, setInput] = useState('')
  const [phase, setPhase] = useState('playing') // 'playing' | 'correct' | 'wrong' | 'reveal'
  const [attempts, setAttempts] = useState(0)
  const [celebration, setCelebration] = useState(MESSAGES[0])
  const [wrongKey, setWrongKey] = useState(0)

  const answerDigits = question.answer.toString().length
  const aStr = question.a.toString().padStart(answerDigits, ' ')
  const bStr = question.b.toString().padStart(answerDigits, ' ')

  const nextQuestion = useCallback((currentScore) => {
    const nextScore = currentScore
    setQuestion(generateQuestion(nextScore))
    setInput('')
    setAttempts(0)
    setPhase('playing')
  }, [])

  const handleDigit = useCallback((d) => {
    if (phase !== 'playing') return
    if (input.length >= question.answer.toString().length) return
    setInput(prev => prev + d)
  }, [phase, input, question])

  const handleDelete = useCallback(() => {
    if (phase !== 'playing') return
    setInput(prev => prev.slice(0, -1))
  }, [phase])

  const handleSubmit = useCallback(() => {
    if (phase !== 'playing' || input === '') return

    if (parseInt([...input].reverse().join(''), 10) === question.answer) {
      const msg = MESSAGES[Math.floor(Math.random() * MESSAGES.length)]
      setCelebration(msg)
      setScore(s => {
        const newScore = s + 1
        setTimeout(() => nextQuestion(newScore), 2800)
        return newScore
      })
      setPhase('correct')
      fireCelebration()
    } else {
      const newAttempts = attempts + 1
      setAttempts(newAttempts)
      setWrongKey(k => k + 1)

      if (newAttempts >= 3) {
        setPhase('reveal')
        setScore(s => {
          setTimeout(() => nextQuestion(s), 3000)
          return s
        })
      } else {
        setPhase('wrong')
        setTimeout(() => {
          setInput('')
          setPhase('playing')
        }, 700)
      }
    }
  }, [phase, input, question, attempts, nextQuestion])

  // Keyboard support
  useEffect(() => {
    const handler = (e) => {
      if (e.key >= '0' && e.key <= '9') handleDigit(e.key)
      else if (e.key === 'Backspace') handleDelete()
      else if (e.key === 'Enter') handleSubmit()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handleDigit, handleDelete, handleSubmit])

  const isCorrect = phase === 'correct'
  const isReveal = phase === 'reveal'
  const isWrong = phase === 'wrong'

  return (
    <div className="game-root">
      <FloatingEmojis active={isCorrect} />

      {/* Header */}
      <header className="game-header">
        <button className="back-btn" onClick={onBack} aria-label="Back to home">←</button>
        <div className="game-title">Math Fun! 🧮</div>
        <div className="score-badge">
          <span className="score-star">⭐</span>
          <span className="score-num">{score}</span>
        </div>
      </header>

      {/* Vertical addition card */}
      <div
        className={`question-card ${isWrong ? 'shake' : ''}`}
        key={wrongKey}
      >
        <div className="add-grid" style={{ '--cols': answerDigits }}>

          {/* Row 1 — Number A */}
          <div className="add-sign-cell" />
          {aStr.split('').map((d, i) => (
            <div key={`a${i}`} className={`add-num-cell ${d.trim() ? 'add-num-a' : 'add-empty'}`}>
              {d.trim()}
            </div>
          ))}

          {/* Row 2 — Number B with + sign */}
          <div className="add-sign-cell add-plus">+</div>
          {bStr.split('').map((d, i) => (
            <div key={`b${i}`} className={`add-num-cell ${d.trim() ? 'add-num-b' : 'add-empty'}`}>
              {d.trim()}
            </div>
          ))}

          {/* Divider */}
          <div className="add-divider" />

          {/* Row 3 — Answer input boxes (filled right→left, ones column first) */}
          <div className="add-sign-cell add-equals">=</div>
          {Array.from({ length: answerDigits }, (_, i) => {
            // input[0] = first digit typed = ones column (rightmost box, i = answerDigits-1)
            const digit = input[answerDigits - 1 - i]
            const filled = digit !== undefined
            const active = i === answerDigits - 1 - input.length && phase === 'playing' && input.length < answerDigits
            return (
              <div
                key={`ans${i}`}
                className={[
                  'add-ans-cell',
                  filled   ? 'add-ans-filled'  : '',
                  active   ? 'add-ans-active'  : '',
                  isReveal ? 'add-ans-reveal'  : '',
                ].join(' ')}
              >
                {isReveal ? question.answer.toString()[i] : (digit || '')}
              </div>
            )
          })}

        </div>
      </div>

      {/* Difficulty level + hint */}
      <div className="level-bar">
        {['⭐', '⭐⭐', '⭐⭐⭐', '⭐⭐⭐⭐', '⭐⭐⭐⭐⭐'][Math.min(4, Math.floor(score / 5))]}
        {' '}Level {Math.min(5, Math.floor(score / 5) + 1)}
      </div>

      {/* Hint text */}
      <div className="hint-text">
        {isWrong && attempts < 3 && '🤔 Try again!'}
        {isReveal && `The answer is ${question.answer}! Keep going! 🌟`}
        {phase === 'playing' && input === '' && 'Tap the numbers, then press ✓'}
        {phase === 'playing' && input !== '' && 'Press ✓ when ready!'}
        {isCorrect && ' '}
      </div>

      {/* Number pad */}
      <div className="numpad">
        {[7, 8, 9, 4, 5, 6, 1, 2, 3].map(d => (
          <button
            key={d}
            className="num-btn digit-btn"
            onClick={() => handleDigit(String(d))}
            aria-label={String(d)}
          >
            {d}
          </button>
        ))}
        <button className="num-btn delete-btn" onClick={handleDelete} aria-label="Delete">⌫</button>
        <button className="num-btn digit-btn" onClick={() => handleDigit('0')} aria-label="0">0</button>
        <button className="num-btn submit-btn" onClick={handleSubmit} aria-label="Check answer">✓</button>
      </div>

      {/* Celebration overlay */}
      {isCorrect && (
        <div className="celebration-overlay" role="alert" aria-live="assertive">
          <div className="celebration-card">
            <div className="celeb-emoji">{celebration.emoji}</div>
            <div className="celeb-message">{celebration.text}</div>
            <div className="celeb-equation">
              {question.a} + {question.b} = <strong>{question.answer}</strong>
            </div>
            <div className="celeb-sub">Next question coming up...</div>
          </div>
        </div>
      )}
    </div>
  )
}
