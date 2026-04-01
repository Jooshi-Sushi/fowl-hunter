import { useMemo } from 'react'
import {
  MessageCircle, Zap, Phone, Ghost, AlertTriangle, TrendingUp, Flame, Clock
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid,
} from 'recharts'
import StatusBadge from '../components/StatusBadge'
import PlatformDot from '../components/PlatformDot'
import Avatar from '../components/Avatar'
import { isSuccess, PLATFORM_CONFIG } from '../constants'
import { formatRelativeTime, formatFullDate, truncate } from '../utils'

function StatCard({ icon: Icon, label, value, sub, color = 'text-[var(--text-1)]' }) {
  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 flex flex-col gap-2 min-w-[130px]">
      <div className="flex items-center gap-2 text-[var(--text-4)] text-xs font-medium">
        <Icon size={13} />
        {label}
      </div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      {sub && <div className="text-xs text-[var(--text-4)]">{sub}</div>}
    </div>
  )
}

function EmptyState({ message }) {
  return (
    <div className="text-center py-12 text-[var(--text-4)] text-sm">{message}</div>
  )
}

// Compute streak: consecutive days ending today (or yesterday) with at least 1 DM
function computeStreak(dms) {
  if (!dms.length) return 0
  // Build a set of date strings (YYYY-MM-DD) that have at least 1 DM
  const daySet = new Set(dms.map(d => d.sentAt.slice(0, 10)))
  const today = new Date()
  let streak = 0
  let cursor = new Date(today)

  // If no DM today, start from yesterday
  const todayStr = today.toISOString().slice(0, 10)
  if (!daySet.has(todayStr)) {
    cursor.setDate(cursor.getDate() - 1)
  }

  while (true) {
    const dateStr = cursor.toISOString().slice(0, 10)
    if (!daySet.has(dateStr)) break
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

function CustomBarTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2 text-xs shadow-xl">
      <div className="text-[var(--text-3)] mb-1">{label}:00</div>
      <div className="text-[var(--text-1)]">{payload[0]?.value} DMs</div>
      {payload[0]?.payload?.rate != null && (
        <div className="text-green-400">{payload[0].payload.rate}% success</div>
      )}
    </div>
  )
}

function CustomLineTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2 text-xs shadow-xl">
      <div className="text-[var(--text-3)] mb-1">Week of {label}</div>
      <div className="text-violet-400">{payload[0]?.value}% success rate</div>
    </div>
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

  const streak = useMemo(() => computeStreak(dms), [dms])

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

  // Best time to DM: group by hour
  const hourData = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, h) => ({ hour: h, count: 0, successes: 0 }))
    dms.forEach(dm => {
      const h = new Date(dm.sentAt).getHours()
      hours[h].count++
      if (isSuccess(dm.status)) hours[h].successes++
    })
    return hours.map(h => ({
      hour: h.hour,
      count: h.count,
      rate: h.count ? Math.round((h.successes / h.count) * 100) : null,
    }))
  }, [dms])

  // Running success rate by week
  const weeklyData = useMemo(() => {
    if (!dms.length) return []
    const sorted = [...dms].sort((a, b) => new Date(a.sentAt) - new Date(b.sentAt))

    // Group by ISO week (Mon–Sun)
    function getWeekKey(dateStr) {
      const d = new Date(dateStr)
      const day = d.getDay() || 7 // Mon=1..Sun=7
      d.setDate(d.getDate() - (day - 1)) // back to Monday
      return d.toISOString().slice(0, 10)
    }

    const weekMap = {}
    sorted.forEach(dm => {
      const wk = getWeekKey(dm.sentAt)
      if (!weekMap[wk]) weekMap[wk] = { total: 0, successes: 0 }
      weekMap[wk].total++
      if (isSuccess(dm.status)) weekMap[wk].successes++
    })

    const weeks = Object.keys(weekMap).sort()
    let cumTotal = 0, cumSuccess = 0
    return weeks.map(wk => {
      cumTotal += weekMap[wk].total
      cumSuccess += weekMap[wk].successes
      return {
        week: wk,
        rate: Math.round((cumSuccess / cumTotal) * 100),
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
        <StatCard
          icon={Flame}
          label="Day Streak"
          value={streak}
          color={streak > 0 ? 'text-orange-400' : 'text-[var(--text-1)]'}
          sub={streak === 1 ? '1 day' : streak > 1 ? `${streak} days` : 'No streak yet'}
        />
      </div>

      {/* Best Time to DM */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--border)] flex items-center gap-2">
          <Clock size={15} className="text-violet-400" />
          <h3 className="text-sm font-semibold text-[var(--text-1)]">Best Time to DM</h3>
        </div>
        {dms.length === 0 ? (
          <EmptyState message="Log some DMs to see hourly patterns." />
        ) : (
          <div className="p-5">
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={hourData} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
                <XAxis
                  dataKey="hour"
                  tick={{ fontSize: 10, fill: 'var(--text-4)' }}
                  tickFormatter={h => h % 6 === 0 ? `${h}h` : ''}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis tick={{ fontSize: 10, fill: 'var(--text-4)' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomBarTooltip />} cursor={{ fill: 'rgba(124,58,237,0.1)' }} />
                <Bar
                  dataKey="count"
                  radius={[3, 3, 0, 0]}
                  fill="rgba(124,58,237,0.4)"
                  // per-bar color via shape prop
                  shape={(props) => {
                    const { x, y, width, height, count, rate } = props
                    const opacity = count === 0 ? 0.15
                      : rate === null ? 0.4
                      : 0.3 + (rate / 100) * 0.7
                    return (
                      <rect
                        x={x} y={y} width={width} height={height}
                        fill={`rgba(124,58,237,${opacity})`}
                        rx={3} ry={3}
                      />
                    )
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
            <p className="text-xs text-[var(--text-4)] mt-1">Bar height = DM count · Color intensity = success rate</p>
          </div>
        )}
      </div>

      {/* Running Success Rate */}
      {weeklyData.length > 1 && (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[var(--border)] flex items-center gap-2">
            <TrendingUp size={15} className="text-violet-400" />
            <h3 className="text-sm font-semibold text-[var(--text-1)]">Running Success Rate</h3>
          </div>
          <div className="p-5">
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={weeklyData} margin={{ top: 0, right: 10, left: -30, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                  dataKey="week"
                  tick={{ fontSize: 10, fill: 'var(--text-4)' }}
                  tickFormatter={w => w.slice(5)}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: 'var(--text-4)' }}
                  axisLine={false}
                  tickLine={false}
                  domain={[0, 100]}
                  tickFormatter={v => `${v}%`}
                />
                <Tooltip content={<CustomLineTooltip />} />
                <Line
                  type="monotone"
                  dataKey="rate"
                  stroke="#7c3aed"
                  strokeWidth={2}
                  dot={{ fill: '#7c3aed', r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Recent DMs */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          <h3 className="text-sm font-semibold text-[var(--text-1)]">Recent DMs</h3>
          {dms.length > 5 && (
            <button onClick={onViewAll} className="text-xs text-violet-400 hover:text-violet-300 transition-colors">
              View all →
            </button>
          )}
        </div>
        {recent.length === 0 ? (
          <EmptyState message="No DMs logged yet. Log your first one!" />
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {recent.map(dm => (
              <div key={dm.id} className="flex items-center gap-3 px-5 py-3">
                <Avatar username={dm.username} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-[var(--text-1)] truncate">{dm.username}</span>
                    {dm.nickname && <span className="text-xs text-[var(--text-4)]">({dm.nickname})</span>}
                  </div>
                  <div className="text-xs text-[var(--text-4)] truncate">{truncate(dm.pickupLineText, 45)}</div>
                </div>
                <PlatformDot platform={dm.platform} showLabel={false} />
                <StatusBadge status={dm.status} />
                <span
                  className="text-xs text-[var(--text-4)] whitespace-nowrap cursor-default hidden sm:block"
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
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--border)] flex items-center gap-2">
          <TrendingUp size={15} className="text-violet-400" />
          <h3 className="text-sm font-semibold text-[var(--text-1)]">Pickup Line Performance</h3>
        </div>
        {linePerf.length === 0 ? (
          <EmptyState message="Log some DMs to see pickup line stats." />
        ) : (
          <div className="p-5 space-y-3">
            {linePerf.map((item) => (
              <div key={item.id} className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-[var(--text-2)] truncate flex-1 pr-3">{truncate(item.text, 50)}</span>
                  <span className="text-xs font-semibold text-violet-400 flex-shrink-0">{item.rate}%</span>
                </div>
                <div className="w-full bg-[var(--surface-2)] rounded-full h-1.5">
                  <div
                    className="bg-violet-500 h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${item.rate}%` }}
                  />
                </div>
                <div className="text-xs text-[var(--text-4)]">{item.used} use{item.used !== 1 ? 's' : ''}</div>
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
            <div key={p.platform} className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <span className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
                <span className="font-semibold text-[var(--text-1)]">{p.platform}</span>
                <span className="text-xs text-[var(--text-4)] ml-auto">{p.total} DMs</span>
              </div>
              <div className="space-y-2.5">
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--text-3)]">Good Energy Rate</span>
                  <span className="text-green-400 font-medium">{p.goodRate}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--text-3)]">Got Number Rate</span>
                  <span className="text-blue-400 font-medium">{p.numberRate}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--text-3)]">Bad Energy Rate</span>
                  <span className="text-red-400 font-medium">{p.badRate}%</span>
                </div>
              </div>
              {p.total === 0 && (
                <div className="text-xs text-[var(--text-4)] mt-2">No data yet</div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
