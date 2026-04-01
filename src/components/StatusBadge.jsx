import { STATUS_CONFIG } from '../constants'

export default function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || {}
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${cfg.bg} ${cfg.text} ${cfg.border}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {status}
    </span>
  )
}
