import { useState, useEffect } from 'react'
import { Bird, LayoutDashboard, List, MessageSquare, Sun, Moon } from 'lucide-react'
import confetti from 'canvas-confetti'
import {
  loadDMs, insertDM, updateDM, deleteDM as dbDeleteDM,
  loadLines, insertLine, updateLine as dbUpdateLine, deleteLine as dbDeleteLine,
} from './storage'
import Overview from './tabs/Overview'
import AllDMs from './tabs/AllDMs'
import PickupLines from './tabs/PickupLines'
import { ThemeProvider, useTheme } from './ThemeContext'
import './index.css'

const TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'all', label: 'All DMs', icon: List },
  { id: 'lines', label: 'Pickup Lines', icon: MessageSquare },
]

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-full transition-colors"
      style={{ color: 'rgba(255,255,255,0.7)', background: 'transparent' }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#ffffff' }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)' }}
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
    </button>
  )
}

function AppInner() {
  const [tab, setTab] = useState('overview')
  const [dms, setDMs] = useState([])
  const [lines, setLines] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([loadDMs(), loadLines()]).then(([dmsData, linesData]) => {
      setDMs(dmsData)
      setLines(linesData)
      setLoading(false)
    })
  }, [])

  function fireConfetti() {
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#b6004f', '#ff7196', '#a855f7', '#f59e0b', '#10b981'],
    })
  }

  async function addDM(dm) {
    await insertDM(dm)
    setDMs(prev => [dm, ...prev])
    if (dm.status === 'Got the Number') fireConfetti()
  }

  async function editDM(dm) {
    await updateDM(dm)
    setDMs(prev => prev.map(d => d.id === dm.id ? dm : d))
    if (dm.status === 'Got the Number') fireConfetti()
  }

  async function removeDM(id) {
    await dbDeleteDM(id)
    setDMs(prev => prev.filter(d => d.id !== id))
  }

  async function addLine(line) {
    await insertLine(line)
    setLines(prev => [...prev, line])
  }

  async function updateLine(line) {
    await dbUpdateLine(line)
    setLines(prev => prev.map(l => l.id === line.id ? line : l))
  }

  async function removeLine(id) {
    await dbDeleteLine(id)
    setLines(prev => prev.filter(l => l.id !== id))
  }

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'var(--surface)' }}
      >
        <div style={{ color: 'var(--on-surface-muted)', fontSize: '0.875rem', fontFamily: 'var(--font-body)' }}>
          Loading…
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--surface)' }}>
      <header
        className="sticky top-0 z-40 backdrop-blur-xl"
        style={{
          background: 'rgba(26,20,35,0.95)',
          boxShadow: '0 1px 30px rgba(0,0,0,0.2)',
        }}
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-container))' }}
              >
                <Bird size={14} style={{ color: '#ffffff' }} />
              </div>
              <span
                className="text-sm tracking-tight"
                style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: '#ffffff' }}
              >
                Fowl Hunter
              </span>
            </div>

            {/* Nav + Toggle */}
            <div className="flex items-center gap-1">
              <nav className="flex items-center gap-1">
                {TABS.map(t => {
                  const Icon = t.icon
                  const active = tab === t.id
                  return (
                    <button
                      key={t.id}
                      onClick={() => setTab(t.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                      style={{
                        background: active ? 'rgba(255,113,150,0.2)' : 'transparent',
                        color: active ? '#ff7196' : 'rgba(255,255,255,0.7)',
                        fontFamily: 'var(--font-body)',
                      }}
                      onMouseEnter={e => {
                        if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
                        if (!active) e.currentTarget.style.color = '#ffffff'
                      }}
                      onMouseLeave={e => {
                        if (!active) e.currentTarget.style.background = 'transparent'
                        if (!active) e.currentTarget.style.color = 'rgba(255,255,255,0.7)'
                      }}
                    >
                      <Icon size={13} />
                      <span className="hidden sm:inline">{t.label}</span>
                    </button>
                  )
                })}
              </nav>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {tab === 'overview' && (
          <Overview dms={dms} lines={lines} onViewAll={() => setTab('all')} />
        )}
        {tab === 'all' && (
          <AllDMs
            dms={dms}
            lines={lines}
            onAdd={addDM}
            onEdit={editDM}
            onDelete={removeDM}
            onSaveLine={addLine}
          />
        )}
        {tab === 'lines' && (
          <PickupLines
            lines={lines}
            dms={dms}
            onAdd={addLine}
            onUpdate={updateLine}
            onDelete={removeLine}
          />
        )}
      </main>
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AppInner />
    </ThemeProvider>
  )
}
