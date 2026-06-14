import { useState } from 'react'
import MathGame from './components/MathGame'
import EnglishGame from './components/EnglishGame'
import './App.css'

export default function App() {
  const [screen, setScreen] = useState('home')

  if (screen === 'math')    return <MathGame    onBack={() => setScreen('home')} />
  if (screen === 'english') return <EnglishGame onBack={() => setScreen('home')} />

  return (
    <div className="home-root">
      <h1 className="home-title">Fun Learning! 🎓</h1>
      <p className="home-sub">Pick a game to play!</p>
      <div className="home-grid">
        <button className="home-card math-card" onClick={() => setScreen('math')}>
          <span className="home-card-icon">🧮</span>
          <span className="home-card-name">Math Fun</span>
          <span className="home-card-desc">Add numbers!</span>
        </button>
        <button className="home-card english-card" onClick={() => setScreen('english')}>
          <span className="home-card-icon">📚</span>
          <span className="home-card-name">Word Fun</span>
          <span className="home-card-desc">Spell words!</span>
        </button>
      </div>
    </div>
  )
}
