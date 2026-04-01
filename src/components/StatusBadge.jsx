// Status badge — no dot, colored left border + soft background, 0.75rem radius

const STATUS_STYLES = {
  'Pending': {
    background: 'rgba(116,119,127,0.12)',
    color: '#44474f',
    borderLeft: '3px solid #74777f',
  },
  'Got Good Energy': {
    background: 'rgba(16,185,129,0.12)',
    color: '#0d7a56',
    borderLeft: '3px solid #10b981',
  },
  'Got the Number': {
    background: 'rgba(59,130,246,0.12)',
    color: '#1d5fa8',
    borderLeft: '3px solid #3b82f6',
  },
  'Got Left on Read': {
    background: 'rgba(245,158,11,0.12)',
    color: '#92530d',
    borderLeft: '3px solid #f59e0b',
  },
  'Got Left on Delivered': {
    background: 'rgba(249,115,22,0.12)',
    color: '#9a3e0d',
    borderLeft: '3px solid #f97316',
  },
  'Got Bad Energy': {
    background: 'rgba(186,26,26,0.12)',
    color: '#ba1a1a',
    borderLeft: '3px solid #ba1a1a',
  },
}

const STATUS_STYLES_DARK = {
  'Pending': {
    background: 'rgba(116,119,127,0.18)',
    color: '#94a3b8',
    borderLeft: '3px solid #64748b',
  },
  'Got Good Energy': {
    background: 'rgba(16,185,129,0.15)',
    color: '#34d399',
    borderLeft: '3px solid #10b981',
  },
  'Got the Number': {
    background: 'rgba(96,165,250,0.15)',
    color: '#60a5fa',
    borderLeft: '3px solid #3b82f6',
  },
  'Got Left on Read': {
    background: 'rgba(251,191,36,0.15)',
    color: '#fbbf24',
    borderLeft: '3px solid #f59e0b',
  },
  'Got Left on Delivered': {
    background: 'rgba(251,146,60,0.15)',
    color: '#fb923c',
    borderLeft: '3px solid #f97316',
  },
  'Got Bad Energy': {
    background: 'rgba(248,113,113,0.15)',
    color: '#f87171',
    borderLeft: '3px solid #ef4444',
  },
}

export default function StatusBadge({ status }) {
  // Pick light styles by default; dark mode will inherit via CSS cascade if needed
  const style = STATUS_STYLES[status] || {
    background: 'rgba(116,119,127,0.12)',
    color: '#44474f',
    borderLeft: '3px solid #74777f',
  }

  return (
    <span
      style={{
        display: 'inline-block',
        padding: '0.2rem 0.6rem 0.2rem 0.5rem',
        borderRadius: '0.75rem',
        fontSize: '0.7rem',
        fontWeight: 600,
        fontFamily: 'var(--font-body)',
        whiteSpace: 'nowrap',
        letterSpacing: '0.01em',
        ...style,
      }}
    >
      {status}
    </span>
  )
}
