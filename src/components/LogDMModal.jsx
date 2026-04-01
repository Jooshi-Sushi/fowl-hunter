import { useState, useEffect } from 'react'
import { X, Plus, AlertTriangle, Clock } from 'lucide-react'
import { STATUSES, PLATFORMS } from '../constants'
import { generateId, truncate, formatFullDate } from '../utils'

const CARD_SHADOW = '0 8px 60px -10px rgba(44,47,48,0.12)'

export default function LogDMModal({ onClose, onSave, lines, onSaveLine, editDM, dms = [] }) {
  const now = new Date()
  const localNow = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16)

  const [form, setForm] = useState({
    username: '',
    nickname: '',
    platform: 'Instagram',
    pickupLineId: '',
    pickupLineText: '',
    status: 'Got Good Energy',
    notes: '',
    sentAt: localNow,
    followUpDate: '',
  })
  const [newLineText, setNewLineText] = useState('')
  const [offerSaveLine, setOfferSaveLine] = useState(false)
  const [isCustomLine, setIsCustomLine] = useState(false)

  useEffect(() => {
    if (editDM) {
      const dt = new Date(editDM.sentAt)
      const local = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16)
      setForm({
        ...editDM,
        sentAt: local,
        followUpDate: editDM.followUpDate || '',
      })
      if (!lines.find(l => l.id === editDM.pickupLineId)) {
        setIsCustomLine(true)
        setNewLineText(editDM.pickupLineText)
      }
    }
  }, [editDM])

  const isDuplicate = !editDM && form.username.trim() &&
    dms.some(d => d.username.toLowerCase() === form.username.trim().toLowerCase())

  function set(key, val) {
    setForm(f => ({ ...f, [key]: val }))
  }

  function handleLineSelect(e) {
    const val = e.target.value
    if (val === '__custom__') {
      setIsCustomLine(true)
      set('pickupLineId', '')
      set('pickupLineText', '')
    } else {
      setIsCustomLine(false)
      setOfferSaveLine(false)
      const line = lines.find(l => l.id === val)
      set('pickupLineId', val)
      set('pickupLineText', line ? line.text : '')
    }
  }

  function handleCustomLineChange(e) {
    const val = e.target.value
    setNewLineText(val)
    set('pickupLineText', val)
    setOfferSaveLine(val.trim().length > 0)
  }

  function handleSaveLine() {
    if (!newLineText.trim()) return
    const existing = lines.find(l => l.text.toLowerCase() === newLineText.trim().toLowerCase())
    if (existing) {
      set('pickupLineId', existing.id)
      setIsCustomLine(false)
      setOfferSaveLine(false)
      return
    }
    const newLine = { id: generateId(), text: newLineText.trim(), createdAt: new Date().toISOString(), pinned: false }
    onSaveLine(newLine)
    set('pickupLineId', newLine.id)
    setIsCustomLine(false)
    setOfferSaveLine(false)
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.username.trim()) return
    if (!form.pickupLineText.trim()) return

    const sentAtISO = new Date(form.sentAt).toISOString()
    const now = new Date().toISOString()

    let statusHistory
    if (editDM) {
      const prevHistory = editDM.statusHistory || []
      if (form.status !== editDM.status) {
        statusHistory = [...prevHistory, { status: form.status, at: now }]
      } else {
        statusHistory = prevHistory
      }
    } else {
      statusHistory = [{ status: form.status, at: sentAtISO }]
    }

    const dm = {
      id: editDM ? editDM.id : generateId(),
      username: form.username.trim(),
      nickname: form.nickname.trim(),
      platform: form.platform,
      pickupLineId: form.pickupLineId,
      pickupLineText: form.pickupLineText.trim(),
      status: form.status,
      notes: form.notes.trim(),
      sentAt: sentAtISO,
      followUpDate: form.followUpDate || null,
      statusHistory,
    }
    onSave(dm)
    onClose()
  }

  const inputStyle = {
    width: '100%',
    background: 'var(--surface-container-low)',
    border: '1px solid rgba(171,173,174,0.15)',
    borderRadius: '0.75rem',
    padding: '0.5rem 0.75rem',
    fontSize: '0.875rem',
    color: 'var(--on-surface)',
    fontFamily: 'var(--font-body)',
    outline: 'none',
    transition: 'border-color 0.15s, box-shadow 0.15s',
  }

  const labelStyle = {
    display: 'block',
    fontSize: '0.75rem',
    fontWeight: 500,
    color: 'var(--on-surface-variant)',
    marginBottom: '0.375rem',
    fontFamily: 'var(--font-body)',
  }

  function handleFocus(e) {
    e.target.style.borderColor = 'rgba(182,0,79,0.4)'
    e.target.style.boxShadow = '0 0 0 3px rgba(182,0,79,0.08)'
  }
  function handleBlur(e) {
    e.target.style.borderColor = 'rgba(171,173,174,0.15)'
    e.target.style.boxShadow = 'none'
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Glassmorphism overlay */}
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(44,47,48,0.3)', backdropFilter: 'blur(8px)' }}
        onClick={onClose}
      />

      {/* Modal panel */}
      <div
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto"
        style={{
          background: 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(20px)',
          borderRadius: '1.25rem',
          boxShadow: CARD_SHADOW,
          border: '1px solid rgba(171,173,174,0.15)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-5"
          style={{ borderBottom: '1px solid rgba(171,173,174,0.12)' }}
        >
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: '1.125rem',
              color: 'var(--on-surface)',
              margin: 0,
            }}
          >
            {editDM ? 'Edit DM' : 'Log New DM'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: 'var(--on-surface-variant)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-container-high)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Duplicate warning */}
          {isDuplicate && (
            <div
              className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs"
              style={{
                background: 'rgba(245,158,11,0.1)',
                border: '1px solid rgba(245,158,11,0.3)',
                color: '#92530d',
              }}
            >
              <AlertTriangle size={13} className="flex-shrink-0" />
              <span>You've already DM'd <strong>@{form.username.trim()}</strong>. You can still save this.</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={labelStyle}>Username *</label>
              <input
                type="text"
                value={form.username}
                onChange={e => set('username', e.target.value)}
                placeholder="@username"
                required
                style={inputStyle}
                onFocus={handleFocus}
                onBlur={handleBlur}
              />
            </div>
            <div>
              <label style={labelStyle}>Nickname</label>
              <input
                type="text"
                value={form.nickname}
                onChange={e => set('nickname', e.target.value)}
                placeholder="Optional"
                style={inputStyle}
                onFocus={handleFocus}
                onBlur={handleBlur}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={labelStyle}>Platform *</label>
              <select
                value={form.platform}
                onChange={e => set('platform', e.target.value)}
                style={inputStyle}
                onFocus={handleFocus}
                onBlur={handleBlur}
              >
                {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Status *</label>
              <select
                value={form.status}
                onChange={e => set('status', e.target.value)}
                style={inputStyle}
                onFocus={handleFocus}
                onBlur={handleBlur}
              >
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Pickup Line *</label>
            <select
              value={isCustomLine ? '__custom__' : form.pickupLineId}
              onChange={handleLineSelect}
              style={inputStyle}
              onFocus={handleFocus}
              onBlur={handleBlur}
            >
              <option value="">Select a line…</option>
              {lines.map(l => (
                <option key={l.id} value={l.id}>{truncate(l.text, 60)}</option>
              ))}
              <option value="__custom__">+ Type a new one…</option>
            </select>

            {isCustomLine && (
              <div className="mt-2 space-y-2">
                <textarea
                  value={newLineText}
                  onChange={handleCustomLineChange}
                  placeholder="Type your pickup line…"
                  rows={2}
                  style={{ ...inputStyle, resize: 'none' }}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                />
                {offerSaveLine && (
                  <button
                    type="button"
                    onClick={handleSaveLine}
                    className="flex items-center gap-1.5 text-xs transition-colors"
                    style={{ color: 'var(--primary)', fontFamily: 'var(--font-body)' }}
                  >
                    <Plus size={13} /> Save to pickup lines library
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={labelStyle}>Sent At</label>
              <input
                type="datetime-local"
                value={form.sentAt}
                onChange={e => set('sentAt', e.target.value)}
                style={inputStyle}
                onFocus={handleFocus}
                onBlur={handleBlur}
              />
            </div>
            <div>
              <label style={labelStyle}>Follow-up Date</label>
              <input
                type="date"
                value={form.followUpDate || ''}
                onChange={e => set('followUpDate', e.target.value)}
                style={inputStyle}
                onFocus={handleFocus}
                onBlur={handleBlur}
              />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Notes</label>
            <textarea
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              placeholder="Optional notes…"
              rows={2}
              style={{ ...inputStyle, resize: 'none' }}
              onFocus={handleFocus}
              onBlur={handleBlur}
            />
          </div>

          {/* Status History (edit mode only) */}
          {editDM && editDM.statusHistory && editDM.statusHistory.length > 0 && (
            <div>
              <label
                className="flex items-center gap-1.5 mb-2"
                style={{ ...labelStyle, marginBottom: '0.5rem' }}
              >
                <Clock size={12} /> Status History
              </label>
              <div
                className="space-y-1.5 rounded-xl p-3"
                style={{
                  background: 'var(--surface-container-low)',
                  border: '1px solid rgba(171,173,174,0.12)',
                }}
              >
                {editDM.statusHistory.map((entry, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span style={{ color: 'var(--on-surface-variant)' }}>{entry.status}</span>
                    <span style={{ color: 'var(--on-surface-muted)' }}>{formatFullDate(entry.at)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            {/* Cancel — secondary */}
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-full px-4 py-2.5 text-sm font-medium transition-colors"
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
            {/* Submit — primary gradient */}
            <button
              type="submit"
              className="flex-1 rounded-full px-4 py-2.5 text-sm font-medium transition-opacity"
              style={{
                background: 'linear-gradient(135deg, var(--primary), var(--primary-container))',
                color: 'var(--on-primary)',
                border: 'none',
                fontFamily: 'var(--font-body)',
                fontWeight: 600,
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              {editDM ? 'Save Changes' : 'Log DM'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
