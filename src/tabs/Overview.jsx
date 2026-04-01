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

const CARD_SHADOW = '0 2px 40px -5px rgba(44,47,48,0.06), 0 1px 8px -2px rgba(44,47,48,0.04)'

// Metric Bloom card
function StatCard({ icon: Icon, label, value, sub, bloomColor = 'rgba(182,0,79,0.08)' }) {
  return (
    <div
      className="flex flex-col gap-1 min-w-[140px] p-6 rounded-2xl relative overflow-hidden flex-shrink-0"
      style={{
        background: 'var(--surface-container-lowest)',
        boxShadow: CARD_SHADOW,
      }}
    >
      {/* Bloom gradient behind number */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '120px',
          height: '120px',
          background: `radial-gradient(ellipse at center, ${bloomColor} 0%, transparent 70%)`,
          pointerEvents: 'none',
        }}
      />

      {/* Label */}
      <div
        className="flex items-center gap-1.5 text-xs font-medium relative z-10"
        style={{ color: 'var(--on-surface-muted)', fontFamily: 'var(--font-body)' }}
      >
        <Icon size={12} />
        {label}
      </div>

      {/* Giant metric value */}
      <div
        className="relative z-10"
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 800,
          fontSize: '3rem',
          lineHeight: 1,
          color: 'var(--on-surface)',
          letterSpacing: '-0.02em',
        }}
      >
        {value}
      </div>

      {/* Sub-text */}
      {sub && (
        <div
          className="text-xs relative z-10"
          style={{ color: 'var(--on-surface-muted)', fontFamily: 'var(--font-body)' }}
        >
          {sub}
        </div>
      )}
    </div>
  )
}

function SectionCard({ children, className = '' }) {
  return (
    <div
      className={`rounded-2xl overflow-hidden ${className}`}
      style={{
        background: 'var(--surface-container-lowest)',
        boxShadow: CARD_SHADOW,
      }}
    >
      {children}
    </div>
  )
}

function SectionHeader({ icon: Icon, title, action }) {
  return (
    <div
      className="flex items-center justify-between px-5 py-4"
      style={{ borderBottom: '1px solid rgba(171,173,174,0.12)' }}
    >
      <div className="flex items-center gap-2">
        {Icon && <Icon size={15} style={{ color: 'var(--primary)' }} />}
        <h3
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 600,
            fontSize: '0.9rem',
            color: 'var(--on-surface)',
            margin: 0,
          }}
        >
          {title}
        </h3>
      </div>
      {action}
    </div>
  )
}

function EmptyState({ message }) {
  return (
    <div
      className="text-center py-12 text-sm"
      style={{ color: 'var(--on-surface-muted)', fontFamily: 'var(--font-body)' }}
    >
      {message}
    </div>
  )
}

function computeStreak(dms) {
  if (!dms.length) return 0
  const daySet = new Set(dms.map(d => d.sentAt.slice(0, 10)))
  const today = new Date()
  let streak = 0
  let cursor = new Date(today)
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
    <div
      className="rounded-xl px-3 py-2 text-xs"
      style={{
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(171,173,174,0.15)',
        boxShadow: '0 4px 20px rgba(44,47,48,0.1)',
        color: 'var(--on-surface)',
        fontFamily: 'var(--font-body)',
      }}
    >
      <div style={{ color: 'var(--on-surface-muted)', marginBottom: '0.2rem' }}>{label}:00</div>
      <div style={{ color: 'var(--on-surface)' }}>{payload[0]?.value} DMs</div>
      {payload[0]?.payload?.rate != null && (
        <div style={{ color: '#10b981' }}>{payload[0].payload.rate}% success</div>
      )}
    </div>
  )
}

function CustomLineTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div
      className="rounded-xl px-3 py-2 text-xs"
      style={{
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(171,173,174,0.15)',
        boxShadow: '0 4px 20px rgba(44,47,48,0.1)',
        color: 'var(--on-surface)',
        fontFamily: 'var(--font-body)',
      }}
    >
      <div style={{ color: 'var(--on-surface-muted)', marginBottom: '0.2rem' }}>Week of {label}</div>
      <div style={{ color: 'var(--primary)' }}>{payload[0]?.value}% success rate</div>
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

  const weeklyData = useMemo(() => {
    if (!dms.length) return []
    const sorted = [...dms].sort((a, b) => new Date(a.sentAt) - new Date(b.sentAt))

    function getWeekKey(dateStr) {
      const d = new Date(dateStr)
      const day = d.getDay() || 7
      d.setDate(d.getDate() - (day - 1))
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
      {/* ── Metric Bloom Stat Cards ── */}
      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
        <StatCard
          icon={MessageCircle}
          label="Total DMs"
          value={stats.total}
          bloomColor="rgba(59,130,246,0.1)"
        />
        <StatCard
          icon={Zap}
          label="Good Energy Rate"
          value={`${stats.goodRate}%`}
          sub={`${stats.successes} DMs`}
          bloomColor="rgba(16,185,129,0.1)"
        />
        <StatCard
          icon={Phone}
          label="Got the Number"
          value={stats.numbers}
          bloomColor="rgba(59,130,246,0.1)"
        />
        <StatCard
          icon={Ghost}
          label="Ghosted"
          value={stats.ghosted}
          sub="Read + Delivered"
          bloomColor="rgba(249,115,22,0.1)"
        />
        <StatCard
          icon={AlertTriangle}
          label="Bad Energy Rate"
          value={`${stats.badRate}%`}
          bloomColor="rgba(186,26,26,0.1)"
        />
        <StatCard
          icon={Flame}
          label="Day Streak"
          value={streak}
          sub={streak === 1 ? '1 day' : streak > 1 ? `${streak} days` : 'No streak yet'}
          bloomColor="rgba(249,115,22,0.12)"
        />
      </div>

      {/* ── Best Time to DM ── */}
      <SectionCard>
        <SectionHeader icon={Clock} title="Best Time to DM" />
        {dms.length === 0 ? (
          <EmptyState message="Log some DMs to see hourly patterns." />
        ) : (
          <div className="p-5">
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={hourData} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
                <XAxis
                  dataKey="hour"
                  tick={{ fontSize: 10, fill: 'var(--on-surface-muted)', fontFamily: 'var(--font-body)' }}
                  tickFormatter={h => h % 6 === 0 ? `${h}h` : ''}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: 'var(--on-surface-muted)', fontFamily: 'var(--font-body)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomBarTooltip />} cursor={{ fill: 'rgba(182,0,79,0.06)' }} />
                <Bar
                  dataKey="count"
                  radius={[4, 4, 0, 0]}
                  fill="rgba(182,0,79,0.35)"
                  shape={(props) => {
                    const { x, y, width, height, count, rate } = props
                    const opacity = count === 0 ? 0.1
                      : rate === null ? 0.35
                      : 0.25 + (rate / 100) * 0.65
                    return (
                      <rect
                        x={x} y={y} width={width} height={height}
                        fill={`rgba(182,0,79,${opacity})`}
                        rx={4} ry={4}
                      />
                    )
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
            <p
              className="text-xs mt-1"
              style={{ color: 'var(--on-surface-muted)', fontFamily: 'var(--font-body)' }}
            >
              Bar height = DM count · Color intensity = success rate
            </p>
          </div>
        )}
      </SectionCard>

      {/* ── Running Success Rate ── */}
      {weeklyData.length > 1 && (
        <SectionCard>
          <SectionHeader icon={TrendingUp} title="Running Success Rate" />
          <div className="p-5">
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={weeklyData} margin={{ top: 0, right: 10, left: -30, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(171,173,174,0.2)" />
                <XAxis
                  dataKey="week"
                  tick={{ fontSize: 10, fill: 'var(--on-surface-muted)', fontFamily: 'var(--font-body)' }}
                  tickFormatter={w => w.slice(5)}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: 'var(--on-surface-muted)', fontFamily: 'var(--font-body)' }}
                  axisLine={false}
                  tickLine={false}
                  domain={[0, 100]}
                  tickFormatter={v => `${v}%`}
                />
                <Tooltip content={<CustomLineTooltip />} />
                <Line
                  type="monotone"
                  dataKey="rate"
                  stroke="var(--primary)"
                  strokeWidth={2}
                  dot={{ fill: 'var(--primary)', r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      )}

      {/* ── Recent DMs ── */}
      <SectionCard>
        <SectionHeader
          title="Recent DMs"
          action={dms.length > 5 ? (
            <button
              onClick={onViewAll}
              className="text-xs transition-colors"
              style={{ color: 'var(--primary)', fontFamily: 'var(--font-body)' }}
            >
              View all →
            </button>
          ) : null}
        />
        {recent.length === 0 ? (
          <EmptyState message="No DMs logged yet. Log your first one!" />
        ) : (
          <div>
            {recent.map((dm, idx) => (
              <div
                key={dm.id}
                className="flex items-center gap-3 transition-colors"
                style={{
                  padding: '0.875rem 1.25rem',
                  background: idx % 2 === 0 ? 'transparent' : 'rgba(239,241,242,0.5)',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-container-low)'}
                onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? 'transparent' : 'rgba(239,241,242,0.5)'}
              >
                <Avatar username={dm.username} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className="text-sm font-medium truncate"
                      style={{ color: 'var(--on-surface)', fontFamily: 'var(--font-body)' }}
                    >
                      {dm.username}
                    </span>
                    {dm.nickname && (
                      <span
                        className="text-xs"
                        style={{ color: 'var(--on-surface-muted)' }}
                      >
                        ({dm.nickname})
                      </span>
                    )}
                  </div>
                  <div
                    className="text-xs truncate"
                    style={{ color: 'var(--on-surface-muted)', fontFamily: 'var(--font-body)' }}
                  >
                    {truncate(dm.pickupLineText, 45)}
                  </div>
                </div>
                <PlatformDot platform={dm.platform} showLabel={false} />
                <StatusBadge status={dm.status} />
                <span
                  className="text-xs whitespace-nowrap cursor-default hidden sm:block"
                  style={{ color: 'var(--on-surface-muted)', fontFamily: 'var(--font-body)' }}
                  title={formatFullDate(dm.sentAt)}
                >
                  {formatRelativeTime(dm.sentAt)}
                </span>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* ── Pickup Line Performance ── */}
      <SectionCard>
        <SectionHeader icon={TrendingUp} title="Pickup Line Performance" />
        {linePerf.length === 0 ? (
          <EmptyState message="Log some DMs to see pickup line stats." />
        ) : (
          <div className="p-5 space-y-4">
            {linePerf.map((item) => (
              <div key={item.id} className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <span
                    className="text-xs truncate flex-1 pr-3"
                    style={{ color: 'var(--on-surface-variant)', fontFamily: 'var(--font-body)' }}
                  >
                    {truncate(item.text, 50)}
                  </span>
                  <span
                    className="text-xs font-semibold flex-shrink-0"
                    style={{ color: 'var(--primary)', fontFamily: 'var(--font-display)' }}
                  >
                    {item.rate}%
                  </span>
                </div>
                <div
                  className="w-full rounded-full h-1.5"
                  style={{ background: 'var(--surface-container-high)' }}
                >
                  <div
                    className="h-1.5 rounded-full transition-all duration-500"
                    style={{
                      width: `${item.rate}%`,
                      background: 'linear-gradient(90deg, var(--primary), var(--primary-container))',
                    }}
                  />
                </div>
                <div
                  className="text-xs"
                  style={{ color: 'var(--on-surface-muted)', fontFamily: 'var(--font-body)' }}
                >
                  {item.used} use{item.used !== 1 ? 's' : ''}
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* ── Platform Breakdown ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {platforms.map(p => {
          const cfg = PLATFORM_CONFIG[p.platform]
          return (
            <div
              key={p.platform}
              className="rounded-2xl p-5"
              style={{
                background: 'var(--surface-container-lowest)',
                boxShadow: CARD_SHADOW,
              }}
            >
              <div className="flex items-center gap-2 mb-4">
                <span className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
                <span
                  className="font-semibold"
                  style={{ fontFamily: 'var(--font-display)', color: 'var(--on-surface)' }}
                >
                  {p.platform}
                </span>
                <span
                  className="text-xs ml-auto"
                  style={{ color: 'var(--on-surface-muted)', fontFamily: 'var(--font-body)' }}
                >
                  {p.total} DMs
                </span>
              </div>
              <div className="space-y-2.5">
                <div className="flex justify-between text-sm">
                  <span style={{ color: 'var(--on-surface-variant)', fontFamily: 'var(--font-body)' }}>
                    Good Energy Rate
                  </span>
                  <span style={{ color: '#10b981', fontWeight: 600 }}>{p.goodRate}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: 'var(--on-surface-variant)', fontFamily: 'var(--font-body)' }}>
                    Got Number Rate
                  </span>
                  <span style={{ color: '#3b82f6', fontWeight: 600 }}>{p.numberRate}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: 'var(--on-surface-variant)', fontFamily: 'var(--font-body)' }}>
                    Bad Energy Rate
                  </span>
                  <span style={{ color: 'var(--error)', fontWeight: 600 }}>{p.badRate}%</span>
                </div>
              </div>
              {p.total === 0 && (
                <div
                  className="text-xs mt-2"
                  style={{ color: 'var(--on-surface-muted)', fontFamily: 'var(--font-body)' }}
                >
                  No data yet
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
