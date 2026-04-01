import { useState, useMemo } from 'react'
import { Plus, Trash2, Pencil, Search, Download, Calendar, CheckSquare, Square, X } from 'lucide-react'
import StatusBadge from '../components/StatusBadge'
import PlatformDot from '../components/PlatformDot'
import Avatar from '../components/Avatar'
import LogDMModal from '../components/LogDMModal'
import { STATUSES, PLATFORMS } from '../constants'
import { formatRelativeTime, formatFullDate, truncate } from '../utils'

function profileUrl(platform, username) {
  const u = username.replace(/^@/, '')
  if (platform === 'Instagram') return `https://instagram.com/${u}`
  if (platform === 'TikTok') return `https://tiktok.com/@${u}`
  return null
}

function exportCSV(rows) {
  const headers = ['username', 'nickname', 'platform', 'status', 'pickupLineText', 'notes', 'sentAt', 'followUpDate']
  const escape = v => `"${String(v ?? '').replace(/"/g, '""')}"`
  const lines = [
    headers.join(','),
    ...rows.map(d => headers.map(h => escape(d[h])).join(',')),
  ]
  const blob = new Blob([lines.join('\n')], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `fowl-hunter-dms-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function AllDMs({ dms, lines, onAdd, onEdit, onDelete, onSaveLine }) {
  const [showModal, setShowModal] = useState(false)
  const [editDM, setEditDM] = useState(null)
  const [filterPlatform, setFilterPlatform] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [sortBy, setSortBy] = useState('date')
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [search, setSearch] = useState('')

  // Bulk selection
  const [selected, setSelected] = useState(new Set())
  const [bulkStatus, setBulkStatus] = useState('')

  const today = new Date().toISOString().slice(0, 10)

  const filtered = useMemo(() => {
    let list = [...dms]
    if (filterPlatform) list = list.filter(d => d.platform === filterPlatform)
    if (filterStatus) list = list.filter(d => d.status === filterStatus)
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter(d => d.username.toLowerCase().includes(q) ||
        (d.nickname && d.nickname.toLowerCase().includes(q)))
    }
    list.sort((a, b) => {
      if (sortBy === 'date') return new Date(b.sentAt) - new Date(a.sentAt)
      if (sortBy === 'status') return a.status.localeCompare(b.status)
      if (sortBy === 'platform') return a.platform.localeCompare(b.platform)
      return 0
    })
    return list
  }, [dms, filterPlatform, filterStatus, sortBy, search])

  function handleSave(dm) {
    if (editDM) onEdit(dm)
    else onAdd(dm)
  }

  function openEdit(dm) {
    setEditDM(dm)
    setShowModal(true)
  }

  function closeModal() {
    setShowModal(false)
    setEditDM(null)
  }

  function toggleSelect(id) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    if (selected.size === filtered.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(filtered.map(d => d.id)))
    }
  }

  function applyBulkStatus() {
    if (!bulkStatus) return
    const now = new Date().toISOString()
    dms.forEach(dm => {
      if (selected.has(dm.id) && dm.status !== bulkStatus) {
        const statusHistory = [...(dm.statusHistory || []), { status: bulkStatus, at: now }]
        onEdit({ ...dm, status: bulkStatus, statusHistory })
      }
    })
    setSelected(new Set())
    setBulkStatus('')
  }

  const selectCls = "bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-1.5 text-sm text-[var(--text-2)] focus:outline-none focus:border-violet-500/50"

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-2 items-center">
          {/* Search */}
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-4)]" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search username…"
              className="bg-[var(--surface)] border border-[var(--border)] rounded-lg pl-8 pr-3 py-1.5 text-sm text-[var(--text-2)] placeholder-[var(--text-4)] focus:outline-none focus:border-violet-500/50 w-40"
            />
          </div>
          <select value={filterPlatform} onChange={e => setFilterPlatform(e.target.value)} className={selectCls}>
            <option value="">All Platforms</option>
            {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className={selectCls}>
            <option value="">All Statuses</option>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} className={selectCls}>
            <option value="date">Sort: Date</option>
            <option value="status">Sort: Status</option>
            <option value="platform">Sort: Platform</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportCSV(filtered)}
            className="flex items-center gap-1.5 bg-[var(--surface)] border border-[var(--border)] hover:bg-[var(--surface-2)] text-[var(--text-2)] rounded-lg px-3 py-2 text-sm font-medium transition-colors"
            title="Export to CSV"
          >
            <Download size={13} /> Export CSV
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors"
          >
            <Plus size={15} /> Log New DM
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-[var(--text-4)] text-sm">
            {dms.length === 0
              ? 'No DMs yet. Hit "Log New DM" to get started.'
              : 'No DMs match your filters.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="px-4 py-3">
                    <button onClick={toggleSelectAll} className="text-[var(--text-4)] hover:text-[var(--text-2)] transition-colors">
                      {selected.size === filtered.length && filtered.length > 0
                        ? <CheckSquare size={14} />
                        : <Square size={14} />}
                    </button>
                  </th>
                  <th className="text-left text-xs font-medium text-[var(--text-4)] px-3 py-3">User</th>
                  <th className="text-left text-xs font-medium text-[var(--text-4)] px-3 py-3 hidden sm:table-cell">Platform</th>
                  <th className="text-left text-xs font-medium text-[var(--text-4)] px-3 py-3 hidden md:table-cell">Pickup Line</th>
                  <th className="text-left text-xs font-medium text-[var(--text-4)] px-3 py-3">Status</th>
                  <th className="text-left text-xs font-medium text-[var(--text-4)] px-3 py-3 hidden sm:table-cell">Sent</th>
                  <th className="text-left text-xs font-medium text-[var(--text-4)] px-3 py-3 hidden lg:table-cell">Notes</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {filtered.map(dm => {
                  const isOverdue = dm.followUpDate && dm.followUpDate < today
                  const hasFollowUp = !!dm.followUpDate
                  const url = profileUrl(dm.platform, dm.username)
                  const isSelected = selected.has(dm.id)

                  return (
                    <tr
                      key={dm.id}
                      className={`transition-colors ${isSelected ? 'bg-violet-600/10' : 'hover:bg-[var(--surface-2)]'}`}
                    >
                      <td className="px-4 py-3">
                        <button onClick={() => toggleSelect(dm.id)} className="text-[var(--text-4)] hover:text-violet-400 transition-colors">
                          {isSelected ? <CheckSquare size={14} className="text-violet-400" /> : <Square size={14} />}
                        </button>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2.5">
                          <Avatar username={dm.username} size="sm" />
                          <div>
                            {url ? (
                              <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm font-medium text-[var(--text-1)] hover:text-violet-400 transition-colors"
                              >
                                {dm.username}
                              </a>
                            ) : (
                              <div className="text-sm font-medium text-[var(--text-1)]">{dm.username}</div>
                            )}
                            {dm.nickname && <div className="text-xs text-[var(--text-4)]">{dm.nickname}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 hidden sm:table-cell">
                        <PlatformDot platform={dm.platform} />
                      </td>
                      <td className="px-3 py-3 hidden md:table-cell">
                        <span className="text-xs text-[var(--text-3)]">{truncate(dm.pickupLineText, 40)}</span>
                      </td>
                      <td className="px-3 py-3">
                        <StatusBadge status={dm.status} />
                      </td>
                      <td className="px-3 py-3 hidden sm:table-cell">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="text-xs text-[var(--text-4)] cursor-default whitespace-nowrap"
                            title={formatFullDate(dm.sentAt)}
                          >
                            {formatRelativeTime(dm.sentAt)}
                          </span>
                          {hasFollowUp && (
                            <span
                              title={`Follow-up: ${dm.followUpDate}`}
                              className={`inline-flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded-md border ${
                                isOverdue
                                  ? 'bg-red-500/20 text-red-400 border-red-500/30'
                                  : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                              }`}
                            >
                              <Calendar size={10} />
                              {dm.followUpDate}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3 hidden lg:table-cell">
                        <span className="text-xs text-[var(--text-4)]">{truncate(dm.notes, 30) || '—'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openEdit(dm)}
                            className="p-1.5 rounded-md hover:bg-[var(--surface-2)] text-[var(--text-4)] hover:text-[var(--text-2)] transition-colors"
                            title="Edit"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={() => setConfirmDelete(dm.id)}
                            className="p-1.5 rounded-md hover:bg-red-500/20 text-[var(--text-4)] hover:text-red-400 transition-colors"
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

      <div className="text-xs text-[var(--text-4)]">
        {filtered.length} of {dms.length} DMs
        {selected.size > 0 && <span className="ml-2 text-violet-400">· {selected.size} selected</span>}
      </div>

      {/* Bulk Action Bar */}
      {selected.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3 shadow-2xl">
          <span className="text-sm text-[var(--text-2)] font-medium">{selected.size} selected</span>
          <select
            value={bulkStatus}
            onChange={e => setBulkStatus(e.target.value)}
            className="bg-[var(--input-bg)] border border-[var(--border)] rounded-lg px-3 py-1.5 text-sm text-[var(--text-2)] focus:outline-none focus:border-violet-500/50"
          >
            <option value="">Change status to…</option>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button
            onClick={applyBulkStatus}
            disabled={!bulkStatus}
            className="bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
          >
            Apply
          </button>
          <button
            onClick={() => setSelected(new Set())}
            className="p-1.5 rounded-lg hover:bg-[var(--surface-2)] text-[var(--text-3)] transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Confirm Delete */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setConfirmDelete(null)} />
          <div className="relative bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 w-full max-w-sm shadow-2xl text-center">
            <div className="text-red-400 mb-1">
              <Trash2 size={24} className="mx-auto mb-3" />
            </div>
            <h3 className="text-[var(--text-1)] font-semibold mb-1">Delete this DM?</h3>
            <p className="text-sm text-[var(--text-3)] mb-5">This action cannot be undone.</p>
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

      {showModal && (
        <LogDMModal
          onClose={closeModal}
          onSave={handleSave}
          onSaveLine={onSaveLine}
          lines={lines}
          editDM={editDM}
          dms={dms}
        />
      )}
    </div>
  )
}
