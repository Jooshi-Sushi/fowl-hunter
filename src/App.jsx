import { useState, useEffect } from 'react'
import { Bird, LayoutDashboard, List, MessageSquare } from 'lucide-react'
import {
  loadDMs, insertDM, updateDM, deleteDM as dbDeleteDM,
  loadLines, insertLine, deleteLine as dbDeleteLine,
} from './storage'
import Overview from './tabs/Overview'
import AllDMs from './tabs/AllDMs'
import PickupLines from './tabs/PickupLines'
import './index.css'

const TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'all', label: 'All DMs', icon: List },
  { id: 'lines', label: 'Pickup Lines', icon: MessageSquare },
]

export default function App() {
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

  async function addDM(dm) {
    await insertDM(dm)
    setDMs(prev => [dm, ...prev])
  }

  async function editDM(dm) {
    await updateDM(dm)
    setDMs(prev => prev.map(d => d.id === dm.id ? dm : d))
  }

  async function removeDM(id) {
    await dbDeleteDM(id)
    setDMs(prev => prev.filter(d => d.id !== id))
  }

  async function addLine(line) {
    await insertLine(line)
    setLines(prev => [...prev, line])
  }

  async function removeLine(id) {
    await dbDeleteLine(id)
    setLines(prev => prev.filter(l => l.id !== id))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f1117] flex items-center justify-center">
        <div className="text-slate-500 text-sm">Loading…</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0f1117]">
      <header className="border-b border-slate-800 bg-[#0f1117]/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center">
                <Bird size={14} className="text-white" />
              </div>
              <span className="font-bold text-white text-sm tracking-tight">Fowl Hunter</span>
            </div>
            <nav className="flex items-center gap-1">
              {TABS.map(t => {
                const Icon = t.icon
                const active = tab === t.id
                return (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      active
                        ? 'bg-violet-600/20 text-violet-300'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`}
                  >
                    <Icon size={13} />
                    <span className="hidden sm:inline">{t.label}</span>
                  </button>
                )
              })}
            </nav>
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
          <PickupLines lines={lines} dms={dms} onAdd={addLine} onDelete={removeLine} />
        )}
      </main>
    </div>
  )
}
