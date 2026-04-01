import { useMemo } from 'react'
import { MessageCircle, Zap, Phone, Ghost, AlertTriangle, TrendingUp } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts'
import StatusBadge from '../components/StatusBadge'
import PlatformDot from '../components/PlatformDot'
import Avatar from '../components/Avatar'
import { isSuccess, PLATFORM_CONFIG } from '../constants'
import { formatRelativeTime, formatFullDate, truncate } from '../utils'

function StatCard({ icon: Icon, label, value, sub, color = 'text-white' }) {
  return (
    <div className="bg-[#1a1d27] border border-slate-700/50 rounded-xl p-4 flex flex-col gap-2 min-w-[130px]">
      <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
        <Icon size={13} />
        {label}
      </div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      {sub && <div className="text-xs text-slate-500">{sub}</div>}
    </div>
  )
}

function EmptyState({ message }) {
  return (
    <div className="text-center py-12 text-slate-500 text-sm">{message}</div>
  )
}

export default function Overview({ dms, lines, onViewAll }) {
  const stats = useMemo(() => {
    const total = dms.length
    const successes = dms.filter(d => isSuccess(d.status))
    const numbers = dms.filter(d => d.status === 'Got the Number')
    const ghosted = dms.filter(d => d.status === 'Got Left on Read' || d.status === 'Got Left on Delivered')
    const bad = dms.filter(d => d.status === 'Got Bad Energy')
    const goodRate = total ? Math.round((successes.length / total) * 100) : 0
    const badRate = total ? Math.round((bad.length / total) * 100) : 0
    return { total, successes: successes.length, numbers: numbers.length, ghosted: ghosted.length, goodRate, badRate }
  }, [dms])

  const recent = useMemo(() => [...dms].sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt)).slice(0, 5), [dms])

  const linePerf = useMemo(() => {
    return lines
      .map(line => {
        const used = dms.filter(d => d.pickupLineId === line.id || d.pickupLineText === line.text)
        if (!used.length) return null
        const wins = used.filter(d => isSuccess(d.status)).length
        return {
          id: line.id,
          text: line.text,
          rate: Math.round((wins / used.length) * 100),
          used: used.length,
        }
      })
      .filter(Boolean)
      .sort((a, b) => b.rate - a.rate)
  }, [dms, lines])

  const platforms = useMemo(() => {
    return ['Instagram', 'TikTok'].map(p => {
      const pdms = dms.filter(d => d.platform === p)
      const total = pdms.length
      const good = pdms.filter(d => isSuccess(d.status)).length
      const numbers = pdms.filter(d => d.status === 'Got the Number').length
      const bad = pdms.filter(d => d.status === 'Got Bad Energy').length
      return {
        platform: p,
        total,
        goodRate: total ? Math.round((good / total) * 100) : 0,
        numberRate: total ? Math.round((numbers / total) * 100) : 0,
        badRate: total ? Math.round((bad / total) * 100) : 0,
      }
    })
  }, [dms])

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
        <StatCard icon={MessageCircle} label="Total DMs" value={stats.total} />
        <StatCard icon={Zap} label="Good Energy Rate" value={`${stats.goodRate}%`} color="text-green-400" sub={`${stats.successes} DMs`} />
        <StatCard icon={Phone} label="Got the Number" value={stats.numbers} color="text-blue-400" />
        <StatCard icon={Ghost} label="Ghosted" value={stats.ghosted} color="text-orange-400" sub="Read + Delivered" />
        <StatCard icon={AlertTriangle} label="Bad Energy Rate" value={`${stats.badRate}%`} color="text-red-400" />
      </div>

      {/* Recent DMs */}
      <div className="bg-[#1a1d27] border border-slate-700/50 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/50">
          <h3 className="text-sm font-semibold text-white">Recent DMs</h3>
          {dms.length > 5 && (
            <button onClick={onViewAll} className="text-xs text-violet-400 hover:text-violet-300 transition-colors">
              View all →
            </button>
          )}
        </div>
        {recent.length === 0 ? (
          <EmptyState message="No DMs logged yet. Log your first one!" />
        ) : (
          <div className="divide-y divide-slate-700/30">
            {recent.map(dm => (
              <div key={dm.id} className="flex items-center gap-3 px-5 py-3">
                <Avatar username={dm.username} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white truncate">{dm.username}</span>
                    {dm.nickname && <span className="text-xs text-slate-500">({dm.nickname})</span>}
                  </div>
                  <div className="text-xs text-slate-500 truncate">{truncate(dm.pickupLineText, 45)}</div>
                </div>
                <PlatformDot platform={dm.platform} showLabel={false} />
                <StatusBadge status={dm.status} />
                <span
                  className="text-xs text-slate-500 whitespace-nowrap cursor-default hidden sm:block"
                  title={formatFullDate(dm.sentAt)}
                >
                  {formatRelativeTime(dm.sentAt)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pickup Line Performance */}
      <div className="bg-[#1a1d27] border border-slate-700/50 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-700/50 flex items-center gap-2">
          <TrendingUp size={15} className="text-violet-400" />
          <h3 className="text-sm font-semibold text-white">Pickup Line Performance</h3>
        </div>
        {linePerf.length === 0 ? (
          <EmptyState message="Log some DMs to see pickup line stats." />
        ) : (
          <div className="p-5 space-y-3">
            {linePerf.map((item, i) => (
              <div key={item.id} className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-300 truncate flex-1 pr-3">{truncate(item.text, 50)}</span>
                  <span className="text-xs font-semibold text-violet-300 flex-shrink-0">{item.rate}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5">
                  <div
                    className="bg-violet-500 h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${item.rate}%` }}
                  />
                </div>
                <div className="text-xs text-slate-600">{item.used} use{item.used !== 1 ? 's' : ''}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Platform Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {platforms.map(p => {
          const cfg = PLATFORM_CONFIG[p.platform]
          return (
            <div key={p.platform} className="bg-[#1a1d27] border border-slate-700/50 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <span className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
                <span className="font-semibold text-white">{p.platform}</span>
                <span className="text-xs text-slate-500 ml-auto">{p.total} DMs</span>
              </div>
              <div className="space-y-2.5">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Good Energy Rate</span>
                  <span className="text-green-400 font-medium">{p.goodRate}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Got Number Rate</span>
                  <span className="text-blue-400 font-medium">{p.numberRate}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Bad Energy Rate</span>
                  <span className="text-red-400 font-medium">{p.badRate}%</span>
                </div>
              </div>
              {p.total === 0 && (
                <div className="text-xs text-slate-600 mt-2">No data yet</div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
