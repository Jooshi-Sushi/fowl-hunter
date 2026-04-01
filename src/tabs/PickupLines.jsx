import { useState, useMemo } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { isSuccess } from '../constants'
import { generateId, truncate, formatRelativeTime, formatFullDate } from '../utils'

export default function PickupLines({ lines, dms, onAdd, onDelete }) {
  const [text, setText] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(null)

  const enriched = useMemo(() => {
    return lines.map(line => {
      const used = dms.filter(d => d.pickupLineId === line.id || d.pickupLineText === line.text)
      const wins = used.filter(d => isSuccess(d.status)).length
      return {
        ...line,
        usedCount: used.length,
        successRate: used.length ? Math.round((wins / used.length) * 100) : null,
      }
    })
  }, [lines, dms])

  function handleAdd(e) {
    e.preventDefault()
    if (!text.trim()) return
    if (lines.find(l => l.text.toLowerCase() === text.trim().toLowerCase())) {
      setText('')
      return
    }
    onAdd({ id: generateId(), text: text.trim(), createdAt: new Date().toISOString() })
    setText('')
  }

  return (
    <div className="space-y-5">
      {/* Add form */}
      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          type="text"
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Enter a new pickup line…"
          className="flex-1 bg-[#1a1d27] border border-slate-700/50 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30"
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
      <div className="bg-[#1a1d27] border border-slate-700/50 rounded-xl overflow-hidden">
        {enriched.length === 0 ? (
          <div className="text-center py-16 text-slate-500 text-sm">
            No pickup lines yet. Add your first one above.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700/50">
                  <th className="text-left text-xs font-medium text-slate-500 px-5 py-3">Line</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-3 py-3 hidden sm:table-cell">Uses</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-3 py-3">Success Rate</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-3 py-3 hidden md:table-cell">Added</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {enriched.map(line => (
                  <tr key={line.id} className="hover:bg-slate-800/20 transition-colors">
                    <td className="px-5 py-3">
                      <span className="text-sm text-white">{line.text}</span>
                    </td>
                    <td className="px-3 py-3 hidden sm:table-cell">
                      <span className="text-sm text-slate-400">{line.usedCount}</span>
                    </td>
                    <td className="px-3 py-3">
                      {line.successRate === null ? (
                        <span className="text-xs text-slate-600">—</span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-slate-800 rounded-full h-1.5">
                            <div
                              className="bg-violet-500 h-1.5 rounded-full"
                              style={{ width: `${line.successRate}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-violet-300">{line.successRate}%</span>
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-3 hidden md:table-cell">
                      <span
                        className="text-xs text-slate-500 cursor-default"
                        title={formatFullDate(line.createdAt)}
                      >
                        {formatRelativeTime(line.createdAt)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setConfirmDelete(line.id)}
                        className="p-1.5 rounded-md hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="text-xs text-slate-600">{lines.length} line{lines.length !== 1 ? 's' : ''} saved</div>

      {/* Confirm Delete */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setConfirmDelete(null)} />
          <div className="relative bg-[#1a1d27] border border-slate-700/50 rounded-xl p-6 w-full max-w-sm shadow-2xl text-center">
            <Trash2 size={24} className="mx-auto mb-3 text-red-400" />
            <h3 className="text-white font-semibold mb-1">Delete this line?</h3>
            <p className="text-sm text-slate-400 mb-5">This will not affect logged DMs.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
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
