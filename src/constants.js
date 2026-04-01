export const STATUSES = [
  'Pending',
  'Got Good Energy',
  'Got the Number',
  'Got Left on Read',
  'Got Left on Delivered',
  'Got Bad Energy',
]

export const STATUS_CONFIG = {
  'Pending': {
    bg: 'bg-slate-500/20',
    text: 'text-slate-400',
    border: 'border-slate-500/30',
    dot: 'bg-slate-400',
  },
  'Got Good Energy': {
    bg: 'bg-green-500/20',
    text: 'text-green-400',
    border: 'border-green-500/30',
    dot: 'bg-green-400',
  },
  'Got the Number': {
    bg: 'bg-blue-500/20',
    text: 'text-blue-400',
    border: 'border-blue-500/30',
    dot: 'bg-blue-400',
  },
  'Got Left on Read': {
    bg: 'bg-yellow-500/20',
    text: 'text-yellow-400',
    border: 'border-yellow-500/30',
    dot: 'bg-yellow-400',
  },
  'Got Left on Delivered': {
    bg: 'bg-orange-500/20',
    text: 'text-orange-400',
    border: 'border-orange-500/30',
    dot: 'bg-orange-400',
  },
  'Got Bad Energy': {
    bg: 'bg-red-500/20',
    text: 'text-red-400',
    border: 'border-red-500/30',
    dot: 'bg-red-400',
  },
}

export const PLATFORMS = ['Instagram', 'TikTok']

export const PLATFORM_CONFIG = {
  Instagram: { dot: 'bg-pink-500', text: 'text-pink-400' },
  TikTok: { dot: 'bg-slate-300', text: 'text-slate-300' },
}

export function isSuccess(status) {
  return status === 'Got Good Energy' || status === 'Got the Number'
}
