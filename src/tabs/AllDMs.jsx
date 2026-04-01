import { useState, useMemo } from 'react'
import { Plus, Trash2, Pencil, Search, Download, Calendar, CheckSquare, Square, X } from 'lucide-react'
import StatusBadge from '../components/StatusBadge'
import PlatformDot from '../components/PlatformDot'
import Avatar from '../components/Avatar'
import LogDMModal from '../components/LogDMModal'
import { STATUSES, PLATFORMS } from '../constants'
import { formatRelativeTime, formatFullDate, truncate } from '../utils'

const CARD_SHADOW = '0 2px 40px -5px rgba(44,47,48,0.06), 0 1px 8px -2px rgba(44,47,48,0.04)'
const MODAL_SHADOW = '0 8px 60px -10px rgba(44,47,48,0.12)'

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

const selectStyle = {
  background: 'var(--surface-container-low)',
  border: '1px solid rgba(171,173,174,0.15)',
  borderRadius: '0.75rem',
  padding: '0.375rem 0.75rem',
  fontSize: '0.875rem',
  color: 'var(--on-surface)',
  fontFamily: 'var(--font-body)',
  outline: 'none',
}

export default function AllDMs({ dms, lines, onAdd, onEdit, onDelete, onSaveLine }) {
  const [showModal, setShowModal] = useState(false)
  const [editDM, setEditDM] = useState(null)
  const [filterPlatform, setFilterPlatform] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [sortBy, setSortBy] = useState('date')
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [search, setSearch] = useState('')
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

  return (
    <div className="space-y-4">
      {/* ── Controls ── */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-2 items-center">
          {/* Search */}
          <div className="relative">
            <Search
              size={13}
              className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--on-surface-muted)' }}
            />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search username…"
              style={{
                ...selectStyle,
                paddingLeft: '2rem',
                width: '10rem',
              }}
            />
          </div>
          <select
            value={filterPlatform}
            onChange={e => setFilterPlatform(e.target.value)}
            style={selectStyle}
          >
            <option value="">All Platforms</option>
            {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            style={selectStyle}
          >
            <option value="">All Statuses</option>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            style={selectStyle}
          >
            <option value="date">Sort: Date</option>
            <option value="status">Sort: Status</option>
            <option value="platform">Sort: Platform</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          {/* Export CSV — secondary button */}
          <button
            onClick={() => exportCSV(filtered)}
            className="flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium transition-opacity"
            style={{
              background: 'var(--surface-container-high)',
              color: 'var(--primary)',
              border: 'none',
              fontFamily: 'var(--font-body)',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            title="Export to CSV"
          >
            <Download size={13} /> Export CSV
          </button>

          {/* Log New DM — primary gradient */}
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-opacity"
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
            <Plus size={15} /> Log New DM
          </button>
        </div>
      </div>

      {/* ── Table ── */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: 'var(--surface-container-lowest)',
          boxShadow: CARD_SHADOW,
        }}
      >
        {filtered.length === 0 ? (
          <div
            className="text-center py-16 text-sm"
            style={{ color: 'var(--on-surface-muted)', fontFamily: 'var(--font-body)' }}
          >
            {dms.length === 0
              ? 'No DMs yet. Hit "Log New DM" to get started.'
              : 'No DMs match your filters.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(171,173,174,0.12)' }}>
                  <th className="px-4 py-3">
                    <button
                      onClick={toggleSelectAll}
                      className="transition-colors"
                      style={{ color: 'var(--on-surface-muted)' }}
                    >
                      {selected.size === filtered.length && filtered.length > 0
                        ? <CheckSquare size={14} style={{ color: 'var(--primary)' }} />
                        : <Square size={14} />}
                    </button>
                  </th>
                  <th
                    className="text-left text-xs font-medium px-3 py-3"
                    style={{ color: 'var(--on-surface-muted)', fontFamily: 'var(--font-body)' }}
                  >
                    User
                  </th>
                  <th
                    className="text-left text-xs font-medium px-3 py-3 hidden sm:table-cell"
                    style={{ color: 'var(--on-surface-muted)', fontFamily: 'var(--font-body)' }}
                  >
                    Platform
                  </th>
                  <th
                    className="text-left text-xs font-medium px-3 py-3 hidden md:table-cell"
                    style={{ color: 'var(--on-surface-muted)', fontFamily: 'var(--font-body)' }}
                  >
                    Pickup Line
                  </th>
                  <th
                    className="text-left text-xs font-medium px-3 py-3"
                    style={{ color: 'var(--on-surface-muted)', fontFamily: 'var(--font-body)' }}
                  >
                    Status
                  </th>
                  <th
                    className="text-left text-xs font-medium px-3 py-3 hidden sm:table-cell"
                    style={{ color: 'var(--on-surface-muted)', fontFamily: 'var(--font-body)' }}
                  >
                    Sent
                  </th>
                  <th
                    className="text-left text-xs font-medium px-3 py-3 hidden lg:table-cell"
                    style={{ color: 'var(--on-surface-muted)', fontFamily: 'var(--font-body)' }}
                  >
                    Notes
                  </th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((dm, idx) => {
                  const isOverdue = dm.followUpDate && dm.followUpDate < today
                  const hasFollowUp = !!dm.followUpDate
                  const url = profileUrl(dm.platform, dm.username)
                  const isSelected = selected.has(dm.id)

                  const rowBg = isSelected
                    ? 'rgba(182,0,79,0.06)'
                    : idx % 2 === 0
                      ? 'transparent'
                      : 'rgba(239,241,242,0.4)'

                  return (
                    <tr
                      key={dm.id}
                      className="transition-colors"
                      style={{ background: rowBg }}
                      onMouseEnter={e => {
                        if (!isSelected) e.currentTarget.style.background = 'var(--surface-container-low)'
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = rowBg
                      }}
                    >
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleSelect(dm.id)}
                          style={{ color: isSelected ? 'var(--primary)' : 'var(--on-surface-muted)' }}
                        >
                          {isSelected
                            ? <CheckSquare size={14} style={{ color: 'var(--primary)' }} />
                            : <Square size={14} />}
                        </button>
                      </td>
                      <td className="px-3 py-3" style={{ padding: '0.875rem 0.75rem' }}>
                        <div className="flex items-center gap-2.5">
                          <Avatar username={dm.username} size="sm" />
                          <div>
                            {url ? (
                              <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm font-medium transition-colors"
                                style={{
                                  color: 'var(--on-surface)',
                                  fontFamily: 'var(--font-body)',
                                  textDecoration: 'none',
                                }}
                                onMouseEnter={e => e.currentTarget.style.color = 'var(--primary)'}
                                onMouseLeave={e => e.currentTarget.style.color = 'var(--on-surface)'}
                              >
                                {dm.username}
                              </a>
                            ) : (
                              <div
                                className="text-sm font-medium"
                                style={{ color: 'var(--on-surface)', fontFamily: 'var(--font-body)' }}
                              >
                                {dm.username}
                              </div>
                            )}
                            {dm.nickname && (
                              <div
                                className="text-xs"
                                style={{ color: 'var(--on-surface-muted)', fontFamily: 'var(--font-body)' }}
                              >
                                {dm.nickname}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 hidden sm:table-cell">
                        <PlatformDot platform={dm.platform} />
                      </td>
                      <td className="px-3 py-3 hidden md:table-cell">
                        <span
                          className="text-xs"
                          style={{ color: 'var(--on-surface-variant)', fontFamily: 'var(--font-body)' }}
                        >
                          {truncate(dm.pickupLineText, 40)}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <StatusBadge status={dm.status} />
                      </td>
                      <td className="px-3 py-3 hidden sm:table-cell">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="text-xs cursor-default whitespace-nowrap"
                            style={{ color: 'var(--on-surface-muted)', fontFamily: 'var(--font-body)' }}
                            title={formatFullDate(dm.sentAt)}
                          >
                            {formatRelativeTime(dm.sentAt)}
                          </span>
                          {hasFollowUp && (
                            <span
                              title={`Follow-up: ${dm.followUpDate}`}
                              className="inline-flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded-lg"
                              style={{
                                background: isOverdue ? 'rgba(186,26,26,0.1)' : 'rgba(59,130,246,0.1)',
                                color: isOverdue ? 'var(--error)' : '#3b82f6',
                                border: isOverdue ? '1px solid rgba(186,26,26,0.2)' : '1px solid rgba(59,130,246,0.2)',
                                fontFamily: 'var(--font-body)',
                              }}
                            >
                              <Calendar size={10} />
                              {dm.followUpDate}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3 hidden lg:table-cell">
                        <span
                          className="text-xs"
                          style={{ color: 'var(--on-surface-muted)', fontFamily: 'var(--font-body)' }}
                        >
                          {truncate(dm.notes, 30) || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openEdit(dm)}
                            className="p-1.5 rounded-lg transition-colors"
                            style={{ color: 'var(--on-surface-muted)' }}
                            onMouseEnter={e => {
                              e.currentTarget.style.background = 'var(--surface-container-high)'
                              e.currentTarget.style.color = 'var(--on-surface-variant)'
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.background = 'transparent'
                              e.currentTarget.style.color = 'var(--on-surface-muted)'
                            }}
                            title="Edit"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={() => setConfirmDelete(dm.id)}
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
        {filtered.length} of {dms.length} DMs
        {selected.size > 0 && (
          <span style={{ marginLeft: '0.5rem', color: 'var(--primary)' }}>
            · {selected.size} selected
          </span>
        )}
      </div>

      {/* ── Bulk Action Bar — glassmorphism ── */}
      {selected.size > 0 && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 px-4 py-3 rounded-2xl"
          style={{
            background: 'rgba(255,255,255,0.85)',
            backdropFilter: 'blur(20px)',
            boxShadow: MODAL_SHADOW,
            border: '1px solid rgba(171,173,174,0.15)',
          }}
        >
          <span
            className="text-sm font-medium"
            style={{ color: 'var(--on-surface)', fontFamily: 'var(--font-body)' }}
          >
            {selected.size} selected
          </span>
          <select
            value={bulkStatus}
            onChange={e => setBulkStatus(e.target.value)}
            style={selectStyle}
          >
            <option value="">Change status to…</option>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button
            onClick={applyBulkStatus}
            disabled={!bulkStatus}
            className="rounded-full px-3 py-1.5 text-sm font-medium transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: 'linear-gradient(135deg, var(--primary), var(--primary-container))',
              color: 'var(--on-primary)',
              border: 'none',
              fontFamily: 'var(--font-body)',
            }}
          >
            Apply
          </button>
          <button
            onClick={() => setSelected(new Set())}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: 'var(--on-surface-variant)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-container-high)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <X size={14} />
          </button>
        </div>
      )}

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
            <div style={{ color: 'var(--error)', marginBottom: '0.75rem' }}>
              <Trash2 size={24} className="mx-auto" />
            </div>
            <h3
              className="font-semibold mb-1"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--on-surface)' }}
            >
              Delete this DM?
            </h3>
            <p
              className="text-sm mb-5"
              style={{ color: 'var(--on-surface-variant)', fontFamily: 'var(--font-body)' }}
            >
              This action cannot be undone.
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
