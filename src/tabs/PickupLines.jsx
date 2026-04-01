import { useState, useMemo } from 'react'
import { Plus, Trash2, Copy, Pin, PinOff, Check } from 'lucide-react'
import { isSuccess } from '../constants'
import { generateId, truncate, formatRelativeTime, formatFullDate } from '../utils'

export default function PickupLines({ lines, dms, onAdd, onUpdate, onDelete }) {
  const [text, setText] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [copied, setCopied] = useState(null)

  const enriched = useMemo(() => {
    return lines
      .map(line => {
        const used = dms.filter(d => d.pickupLineId === line.id || d.pickupLineText === line.text)
        const wins = used.filter(d => isSuccess(d.status)).length
        return {
          ...line,
          usedCount: used.length,
          successRate: used.length ? Math.round((wins / used.length) * 100) : null,
        }
      })
      .sort((a, b) => {
        if (a.pinned && !b.pinned) return -1
        if (!a.pinned && b.pinned) return 1
        return 0
      })
  }, [lines, dms])

  function handleAdd(e) {
    e.preventDefault()
    if (!text.trim()) return
    if (lines.find(l => l.text.toLowerCase() === text.trim().toLowerCase())) {
      setText('')
      return
    }
    onAdd({ id: generateId(), text: text.trim(), createdAt: new Date().toISOString(), pinned: false })
    setText('')
  }

  function handleCopy(line) {
    navigator.clipboard.writeText(line.text).then(() => {
      setCopied(line.id)
      setTimeout(() => setCopied(null), 1500)
    })
  }

  function handleTogglePin(line) {
    onUpdate({ ...line, pinned: !line.pinned })
  }

  const inputCls = "flex-1 bg-[var(--surface)] border border-[var(--border)] rounded-lg px-4 py-2.5 text-sm text-[var(--text-1)] placeholder-[var(--text-4)] focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30"

  return (
    <div className="space-y-5">
      {/* Add form */}
      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          type="text"
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Enter a new pickup line…"
          className={inputCls}
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg px-4 py-2.5 text-sm font-medium transition-colors"
        >
          <Plus size={15} /> Add Line
        </button>
      </form>

      {/* Table */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden">
        {enriched.length === 0 ? (
          <div className="text-center py-16 text-[var(--text-4)] text-sm">
            No pickup lines yet. Add your first one above.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="text-left text-xs font-medium text-[var(--text-4)] px-5 py-3">Line</th>
                  <th className="text-left text-xs font-medium text-[var(--text-4)] px-3 py-3 hidden sm:table-cell">Uses</th>
                  <th className="text-left text-xs font-medium text-[var(--text-4)] px-3 py-3">Success Rate</th>
                  <th className="text-left text-xs font-medium text-[var(--text-4)] px-3 py-3 hidden md:table-cell">Added</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {enriched.map(line => (
                  <tr
                    key={line.id}
                    className={`transition-colors ${line.pinned ? 'bg-violet-600/5' : 'hover:bg-[var(--surface-2)]'}`}
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        {line.pinned && <Pin size={11} className="text-violet-400 flex-shrink-0" />}
                        <span className="text-sm text-[var(--text-1)]">{line.text}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 hidden sm:table-cell">
                      <span className="text-sm text-[var(--text-3)]">{line.usedCount}</span>
                    </td>
                    <td className="px-3 py-3">
                      {line.successRate === null ? (
                        <span className="text-xs text-[var(--text-4)]">—</span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-[var(--surface-2)] rounded-full h-1.5">
                            <div
                              className="bg-violet-500 h-1.5 rounded-full"
                              style={{ width: `${line.successRate}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-violet-400">{line.successRate}%</span>
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-3 hidden md:table-cell">
                      <span
                        className="text-xs text-[var(--text-4)] cursor-default"
                        title={formatFullDate(line.createdAt)}
                      >
                        {formatRelativeTime(line.createdAt)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleCopy(line)}
                          className="p-1.5 rounded-md hover:bg-[var(--surface-2)] text-[var(--text-4)] hover:text-[var(--text-2)] transition-colors"
                          title="Copy"
                        >
                          {copied === line.id ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
                        </button>
                        <button
                          onClick={() => handleTogglePin(line)}
                          className={`p-1.5 rounded-md transition-colors ${
                            line.pinned
                              ? 'text-violet-400 hover:bg-violet-500/20'
                              : 'text-[var(--text-4)] hover:text-violet-400 hover:bg-[var(--surface-2)]'
                          }`}
                          title={line.pinned ? 'Unpin' : 'Pin'}
                        >
                          {line.pinned ? <PinOff size={13} /> : <Pin size={13} />}
                        </button>
                        <button
                          onClick={() => setConfirmDelete(line.id)}
                          className="p-1.5 rounded-md hover:bg-red-500/20 text-[var(--text-4)] hover:text-red-400 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="text-xs text-[var(--text-4)]">{lines.length} line{lines.length !== 1 ? 's' : ''} saved</div>

      {/* Confirm Delete */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setConfirmDelete(null)} />
          <div className="relative bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 w-full max-w-sm shadow-2xl text-center">
            <Trash2 size={24} className="mx-auto mb-3 text-red-400" />
            <h3 className="text-[var(--text-1)] font-semibold mb-1">Delete this line?</h3>
            <p className="text-sm text-[var(--text-3)] mb-5">This will not affect logged DMs.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 bg-[var(--surface-2)] hover:opacity-80 text-[var(--text-2)] rounded-lg px-4 py-2 text-sm font-medium transition-colors border border-[var(--border)]"
              >
                Cancel
              </button>
              <button
                onClick={() => { onDelete(confirmDelete); setConfirmDelete(null) }}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
