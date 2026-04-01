import { PLATFORM_CONFIG } from '../constants'

export default function PlatformDot({ platform, showLabel = true }) {
  const cfg = PLATFORM_CONFIG[platform] || { dot: 'bg-slate-500', text: 'text-slate-400' }
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
      {showLabel && <span className={`text-sm ${cfg.text}`}>{platform}</span>}
    </span>
  )
}
