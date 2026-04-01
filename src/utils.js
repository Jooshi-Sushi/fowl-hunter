export function formatRelativeTime(isoString) {
  const now = new Date()
  const date = new Date(isoString)
  const diff = now - date
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (seconds < 60) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString()
}

export function formatFullDate(isoString) {
  return new Date(isoString).toLocaleString()
}

export function initials(username) {
  if (!username) return '??'
  return username.slice(0, 2).toUpperCase()
}

export function truncate(str, len = 40) {
  if (!str) return ''
  return str.length > len ? str.slice(0, len) + '…' : str
}

export function generateId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}
