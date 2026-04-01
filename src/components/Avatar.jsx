import { initials } from '../utils'

const COLORS = [
  'bg-violet-500',
  'bg-pink-500',
  'bg-cyan-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-indigo-500',
  'bg-teal-500',
]

function colorFor(username) {
  let hash = 0
  for (let c of (username || '')) hash = (hash * 31 + c.charCodeAt(0)) & 0xffffffff
  return COLORS[Math.abs(hash) % COLORS.length]
}

export default function Avatar({ username, size = 'md' }) {
  const sz = size === 'sm' ? 'w-7 h-7 text-xs' : 'w-9 h-9 text-sm'
  return (
    <div className={`${sz} ${colorFor(username)} rounded-full flex items-center justify-center font-semibold text-white flex-shrink-0`}>
      {initials(username)}
    </div>
  )
}
