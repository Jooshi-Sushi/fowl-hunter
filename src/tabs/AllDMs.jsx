import { useState, useMemo } from 'react'
import { Plus, Trash2, Pencil, ChevronDown } from 'lucide-react'
import StatusBadge from '../components/StatusBadge'
import PlatformDot from '../components/PlatformDot'
import Avatar from '../components/Avatar'
import LogDMModal from '../components/LogDMModal'
import { STATUSES, PLATFORMS } from '../constants'
import { formatRelativeTime, formatFullDate, truncate } from '../utils'

export default function AllDMs({ dms, lines, onAdd, onEdit, onDelete, onSaveLine }) {
  const [showModal, setShowModal] = useState(false)
  const [editDM, setEditDM] = useState(null)
  const [filterPlatform, setFilterPlatform] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [sortBy, setSortBy] = useState('date')
  const [confirmDelete, setConfirmDelete] = useState(null)

  const filtered = useMemo(() => {
    let list = [...dms]
    if (filterPlatform) list = list.filter(d => d.platform === filterPlatform)
    if (filterStatus) list = list.filter(d => d.status === filterStatus)
    list.sort((a, b) => {
      if (sortBy === 'date') return new Date(b.sentAt) - new Date(a.sentAt)
      if (sortBy === 'status') return a.status.localeCompare(b.status)
      if (sortBy === 'platform') return a.platform.localeCompare(b.platform)
      return 0
    })
    return list
  }, [dms, filterPlatform, filterStatus, sortBy])

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

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-2">
          <select
            value={filterPlatform}
            onChange={e => setFilterPlatform(e.target.value)}
            className="bg-[#1a1d27] border border-slate-700/50 rounded-lg px-3 py-1.5 text-sm text-slate-300 focus:outline-none focus:border-violet-500/50"
          >
            <option value="">All Platforms</option>
            {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="bg-[#1a1d27] border border-slate-700/50 rounded-lg px-3 py-1.5 text-sm text-slate-300 focus:outline-none focus:border-violet-500/50"
          >
            <option value="">All Statuses</option>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="bg-[#1a1d27] border border-slate-700/50 rounded-lg px-3 py-1.5 text-sm text-slate-300 focus:outline-none focus:border-violet-500/50"
          >
            <option value="date">Sort: Date</option>
            <option value="status">Sort: Status</option>
            <option value="platform">Sort: Platform</option>
          </select>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors"
        >
          <Plus size={15} /> Log New DM
        </button>
      </div>

      {/* Table */}
      <div className="bg-[#1a1d27] border border-slate-700/50 rounded-xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-500 text-sm">
            {dms.length === 0
              ? 'No DMs yet. Hit "Log New DM" to get started.'
              : 'No DMs match your filters.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700/50">
                  <th className="text-left text-xs font-medium text-slate-500 px-5 py-3">User</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-3 py-3 hidden sm:table-cell">Platform</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-3 py-3 hidden md:table-cell">Pickup Line</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-3 py-3">Status</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-3 py-3 hidden sm:table-cell">Sent</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-3 py-3 hidden lg:table-cell">Notes</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {filtered.map(dm => (
                  <tr key={dm.id} className="hover:bg-slate-800/20 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar username={dm.username} size="sm" />
                        <div>
                          <div className="text-sm font-medium text-white">{dm.username}</div>
                          {dm.nickname && <div className="text-xs text-slate-500">{dm.nickname}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 hidden sm:table-cell">
                      <PlatformDot platform={dm.platform} />
                    </td>
                    <td className="px-3 py-3 hidden md:table-cell">
                      <span className="text-xs text-slate-400">{truncate(dm.pickupLineText, 40)}</span>
                    </td>
                    <td className="px-3 py-3">
                      <StatusBadge status={dm.status} />
                    </td>
                    <td className="px-3 py-3 hidden sm:table-cell">
                      <span
                        className="text-xs text-slate-500 cursor-default whitespace-nowrap"
                        title={formatFullDate(dm.sentAt)}
                      >
                        {formatRelativeTime(dm.sentAt)}
                      </span>
                    </td>
                    <td className="px-3 py-3 hidden lg:table-cell">
                      <span className="text-xs text-slate-500">{truncate(dm.notes, 30) || '—'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEdit(dm)}
                          className="p-1.5 rounded-md hover:bg-slate-700/50 text-slate-500 hover:text-slate-300 transition-colors"
                          title="Edit"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => setConfirmDelete(dm.id)}
                          className="p-1.5 rounded-md hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-colors"
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

      <div className="text-xs text-slate-600">
        {filtered.length} of {dms.length} DMs
      </div>

      {/* Confirm Delete */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setConfirmDelete(null)} />
          <div className="relative bg-[#1a1d27] border border-slate-700/50 rounded-xl p-6 w-full max-w-sm shadow-2xl text-center">
            <div className="text-red-400 mb-1">
              <Trash2 size={24} className="mx-auto mb-3" />
            </div>
            <h3 className="text-white font-semibold mb-1">Delete this DM?</h3>
            <p className="text-sm text-slate-400 mb-5">This action cannot be undone.</p>
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

      {showModal && (
        <LogDMModal
          onClose={closeModal}
          onSave={handleSave}
          onSaveLine={onSaveLine}
          lines={lines}
          editDM={editDM}
        />
      )}
    </div>
  )
}
