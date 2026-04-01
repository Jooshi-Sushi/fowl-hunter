import { useState, useEffect } from 'react'
import { X, Plus } from 'lucide-react'
import { STATUSES, PLATFORMS } from '../constants'
import { generateId, truncate } from '../utils'

export default function LogDMModal({ onClose, onSave, lines, onSaveLine, editDM }) {
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
      setForm({ ...editDM, sentAt: local })
      if (!lines.find(l => l.id === editDM.pickupLineId)) {
        setIsCustomLine(true)
        setNewLineText(editDM.pickupLineText)
      }
    }
  }, [editDM])

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
    const newLine = { id: generateId(), text: newLineText.trim(), createdAt: new Date().toISOString() }
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
    }
    onSave(dm)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#1a1d27] border border-slate-700/50 rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-slate-700/50">
          <h2 className="text-lg font-semibold text-white">{editDM ? 'Edit DM' : 'Log New DM'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Username *</label>
              <input
                type="text"
                value={form.username}
                onChange={e => set('username', e.target.value)}
                placeholder="@username"
                required
                className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Nickname</label>
              <input
                type="text"
                value={form.nickname}
                onChange={e => set('nickname', e.target.value)}
                placeholder="Optional"
                className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Platform *</label>
              <select
                value={form.platform}
                onChange={e => set('platform', e.target.value)}
                className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30"
              >
                {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Status *</label>
              <select
                value={form.status}
                onChange={e => set('status', e.target.value)}
                className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30"
              >
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Pickup Line *</label>
            <select
              value={isCustomLine ? '__custom__' : form.pickupLineId}
              onChange={handleLineSelect}
              className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30"
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
                  className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 resize-none"
                />
                {offerSaveLine && (
                  <button
                    type="button"
                    onClick={handleSaveLine}
                    className="flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 transition-colors"
                  >
                    <Plus size={13} /> Save to pickup lines library
                  </button>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Notes</label>
            <textarea
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              placeholder="Optional notes…"
              rows={2}
              className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Sent At</label>
            <input
              type="datetime-local"
              value={form.sentAt}
              onChange={e => set('sentAt', e.target.value)}
              className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-violet-600 hover:bg-violet-500 text-white rounded-lg px-4 py-2.5 text-sm font-medium transition-colors"
            >
              {editDM ? 'Save Changes' : 'Log DM'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
