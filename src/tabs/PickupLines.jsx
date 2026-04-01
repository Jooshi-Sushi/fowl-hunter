import { useState, useMemo } from 'react'
import { Plus, Trash2, Copy, Pin, PinOff, Check } from 'lucide-react'
import { isSuccess } from '../constants'
import { generateId, truncate, formatRelativeTime, formatFullDate } from '../utils'

const CARD_SHADOW = '0 2px 40px -5px rgba(44,47,48,0.06), 0 1px 8px -2px rgba(44,47,48,0.04)'
const MODAL_SHADOW = '0 8px 60px -10px rgba(44,47,48,0.12)'

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

  return (
    <div className="space-y-5">
      {/* ── Add form ── */}
      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          type="text"
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Enter a new pickup line…"
          style={{
            flex: 1,
            background: 'var(--surface-container-low)',
            border: '1px solid rgba(171,173,174,0.15)',
            borderRadius: '0.75rem',
            padding: '0.625rem 1rem',
            fontSize: '0.875rem',
            color: 'var(--on-surface)',
            fontFamily: 'var(--font-body)',
            outline: 'none',
            transition: 'border-color 0.15s, box-shadow 0.15s',
          }}
          onFocus={e => {
            e.target.style.borderColor = 'rgba(182,0,79,0.4)'
            e.target.style.boxShadow = '0 0 0 3px rgba(182,0,79,0.08)'
          }}
          onBlur={e => {
            e.target.style.borderColor = 'rgba(171,173,174,0.15)'
            e.target.style.boxShadow = 'none'
          }}
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className="flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: 'linear-gradient(135deg, var(--primary), var(--primary-container))',
            color: 'var(--on-primary)',
            border: 'none',
            fontFamily: 'var(--font-body)',
            fontWeight: 600,
          }}
          onMouseEnter={e => { if (!e.currentTarget.disabled) e.currentTarget.style.opacity = '0.9' }}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          <Plus size={15} /> Add Line
        </button>
      </form>

      {/* ── Table ── */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: 'var(--surface-container-lowest)',
          boxShadow: CARD_SHADOW,
        }}
      >
        {enriched.length === 0 ? (
          <div
            className="text-center py-16 text-sm"
            style={{ color: 'var(--on-surface-muted)', fontFamily: 'var(--font-body)' }}
          >
            No pickup lines yet. Add your first one above.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(171,173,174,0.12)' }}>
                  <th
                    className="text-left text-xs font-medium px-5 py-3"
                    style={{ color: 'var(--on-surface-muted)', fontFamily: 'var(--font-body)' }}
                  >
                    Line
                  </th>
                  <th
                    className="text-left text-xs font-medium px-3 py-3 hidden sm:table-cell"
                    style={{ color: 'var(--on-surface-muted)', fontFamily: 'var(--font-body)' }}
                  >
                    Uses
                  </th>
                  <th
                    className="text-left text-xs font-medium px-3 py-3"
                    style={{ color: 'var(--on-surface-muted)', fontFamily: 'var(--font-body)' }}
                  >
                    Success Rate
                  </th>
                  <th
                    className="text-left text-xs font-medium px-3 py-3 hidden md:table-cell"
                    style={{ color: 'var(--on-surface-muted)', fontFamily: 'var(--font-body)' }}
                  >
                    Added
                  </th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {enriched.map((line, idx) => {
                  const rowBg = line.pinned
                    ? 'rgba(182,0,79,0.04)'
                    : idx % 2 === 0
                      ? 'transparent'
                      : 'rgba(239,241,242,0.4)'

                  return (
                    <tr
                      key={line.id}
                      className="transition-colors"
                      style={{ background: rowBg }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-container-low)'}
                      onMouseLeave={e => e.currentTarget.style.background = rowBg}
                    >
                      <td className="px-5 py-3" style={{ padding: '0.875rem 1.25rem' }}>
                        <div className="flex items-center gap-2">
                          {line.pinned && (
                            <Pin
                              size={11}
                              className="flex-shrink-0"
                              style={{ color: 'var(--primary)' }}
                            />
                          )}
                          <span
                            className="text-sm"
                            style={{ color: 'var(--on-surface)', fontFamily: 'var(--font-body)' }}
                          >
                            {line.text}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-3 hidden sm:table-cell">
                        <span
                          className="text-sm"
                          style={{ color: 'var(--on-surface-variant)', fontFamily: 'var(--font-body)' }}
                        >
                          {line.usedCount}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        {line.successRate === null ? (
                          <span
                            className="text-xs"
                            style={{ color: 'var(--on-surface-muted)', fontFamily: 'var(--font-body)' }}
                          >
                            —
                          </span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div
                              className="w-16 rounded-full h-1.5"
                              style={{ background: 'var(--surface-container-high)' }}
                            >
                              <div
                                className="h-1.5 rounded-full"
                                style={{
                                  width: `${line.successRate}%`,
                                  background: 'linear-gradient(90deg, var(--primary), var(--primary-container))',
                                }}
                              />
                            </div>
                            <span
                              className="text-xs font-medium"
                              style={{ color: 'var(--primary)', fontFamily: 'var(--font-display)' }}
                            >
                              {line.successRate}%
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-3 hidden md:table-cell">
                        <span
                          className="text-xs cursor-default"
                          style={{ color: 'var(--on-surface-muted)', fontFamily: 'var(--font-body)' }}
                          title={formatFullDate(line.createdAt)}
                        >
                          {formatRelativeTime(line.createdAt)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {/* Copy */}
                          <button
                            onClick={() => handleCopy(line)}
                            className="p-1.5 rounded-lg transition-colors"
                            style={{ color: 'var(--on-surface-muted)' }}
                            onMouseEnter={e => {
                              e.currentTarget.style.background = 'var(--surface-container-high)'
                              e.currentTarget.style.color = 'var(--on-surface-variant)'
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.background = 'transparent'
                              e.currentTarget.style.color = copied === line.id ? '#10b981' : 'var(--on-surface-muted)'
                            }}
                            title="Copy"
                          >
                            {copied === line.id
                              ? <Check size={13} style={{ color: '#10b981' }} />
                              : <Copy size={13} />}
                          </button>

                          {/* Pin toggle — primary color when active */}
                          <button
                            onClick={() => handleTogglePin(line)}
                            className="p-1.5 rounded-lg transition-colors"
                            style={{
                              color: line.pinned ? 'var(--primary)' : 'var(--on-surface-muted)',
                              background: line.pinned ? 'rgba(182,0,79,0.08)' : 'transparent',
                            }}
                            onMouseEnter={e => {
                              if (!line.pinned) {
                                e.currentTarget.style.background = 'var(--surface-container-high)'
                                e.currentTarget.style.color = 'var(--primary)'
                              } else {
                                e.currentTarget.style.background = 'rgba(182,0,79,0.15)'
                              }
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.background = line.pinned ? 'rgba(182,0,79,0.08)' : 'transparent'
                              e.currentTarget.style.color = line.pinned ? 'var(--primary)' : 'var(--on-surface-muted)'
                            }}
                            title={line.pinned ? 'Unpin' : 'Pin'}
                          >
                            {line.pinned ? <PinOff size={13} /> : <Pin size={13} />}
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => setConfirmDelete(line.id)}
                            className="p-1.5 rounded-lg transition-colors"
                            style={{ color: 'var(--on-surface-muted)' }}
                            onMouseEnter={e => {
                              e.currentTarget.style.background = 'rgba(186,26,26,0.1)'
                              e.currentTarget.style.color = 'var(--error)'
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.background = 'transparent'
                              e.currentTarget.style.color = 'var(--on-surface-muted)'
                            }}
                            title="Delete"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div
        className="text-xs"
        style={{ color: 'var(--on-surface-muted)', fontFamily: 'var(--font-body)' }}
      >
        {lines.length} line{lines.length !== 1 ? 's' : ''} saved
      </div>

      {/* ── Confirm Delete — glassmorphism ── */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0"
            style={{ background: 'rgba(44,47,48,0.3)', backdropFilter: 'blur(8px)' }}
            onClick={() => setConfirmDelete(null)}
          />
          <div
            className="relative w-full max-w-sm p-6 text-center rounded-2xl"
            style={{
              background: 'rgba(255,255,255,0.85)',
              backdropFilter: 'blur(20px)',
              boxShadow: MODAL_SHADOW,
              border: '1px solid rgba(171,173,174,0.15)',
            }}
          >
            <Trash2
              size={24}
              className="mx-auto mb-3"
              style={{ color: 'var(--error)' }}
            />
            <h3
              className="font-semibold mb-1"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--on-surface)' }}
            >
              Delete this line?
            </h3>
            <p
              className="text-sm mb-5"
              style={{ color: 'var(--on-surface-variant)', fontFamily: 'var(--font-body)' }}
            >
              This will not affect logged DMs.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 rounded-full px-4 py-2 text-sm font-medium transition-opacity"
                style={{
                  background: 'var(--surface-container-high)',
                  color: 'var(--primary)',
                  border: 'none',
                  fontFamily: 'var(--font-body)',
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                Cancel
              </button>
              <button
                onClick={() => { onDelete(confirmDelete); setConfirmDelete(null) }}
                className="flex-1 rounded-full px-4 py-2 text-sm font-medium transition-opacity"
                style={{
                  background: 'var(--error)',
                  color: 'var(--on-error)',
                  border: 'none',
                  fontFamily: 'var(--font-body)',
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
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
