import { format, formatDistanceToNow, isAfter, isBefore, addDays, differenceInDays, parseISO } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'

export function formatDate(date, fmt = 'dd MMM yyyy') {
  if (!date) return '-'
  try {
    const d = typeof date === 'string' ? parseISO(date) : date
    return format(d, fmt, { locale: idLocale })
  } catch {
    return '-'
  }
}

export function formatDateTime(date) {
  return formatDate(date, 'dd MMM yyyy, HH:mm')
}

export function formatRelative(date) {
  if (!date) return '-'
  try {
    const d = typeof date === 'string' ? parseISO(date) : date
    return formatDistanceToNow(d, { addSuffix: true, locale: idLocale })
  } catch {
    return '-'
  }
}

export function getDaysUntilExpiry(validUntil) {
  if (!validUntil) return null
  const d = typeof validUntil === 'string' ? parseISO(validUntil) : validUntil
  return differenceInDays(d, new Date())
}

export function getExpiryStatus(validUntil) {
  if (!validUntil) return 'no_expiry'
  const days = getDaysUntilExpiry(validUntil)
  if (days < 0) return 'expired'
  if (days <= 30) return 'critical'
  if (days <= 90) return 'warning'
  return 'active'
}

export function formatFileSize(bytes) {
  if (!bytes) return '-'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
}

export function getFileExtension(filename) {
  if (!filename) return ''
  return filename.split('.').pop()?.toLowerCase() || ''
}

export function isPreviewable(mimeType, filename) {
  const ext = getFileExtension(filename)
  const previewableTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
  const previewableExts = ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg']
  return previewableTypes.includes(mimeType) || previewableExts.includes(ext)
}

export function truncate(str, length = 40) {
  if (!str) return ''
  return str.length > length ? str.slice(0, length) + '…' : str
}

export function generateSlug(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export const PARTICIPANT_STATUS_LABELS = {
  pendaftar: 'Pendaftar',
  aktif: 'Aktif',
  pelatihan: 'Pelatihan',
  lolos: 'Lolos',
  persiapan_keberangkatan: 'Persiapan Keberangkatan',
  berangkat: 'Berangkat',
  selesai: 'Selesai',
  alumni: 'Alumni',
}

export const JO_STATUS_LABELS = {
  draft: 'Draft',
  aktif: 'Aktif',
  recruitment: 'Recruitment',
  selesai: 'Selesai',
  dibatalkan: 'Dibatalkan',
}

export const DOC_STATUS_LABELS = {
  aktif: 'Aktif',
  tidak_aktif: 'Tidak Aktif',
  kedaluwarsa: 'Kedaluwarsa',
  draft: 'Draft',
}

export const SECURITY_LEVEL_LABELS = {
  internal: 'Internal',
  confidential: 'Confidential',
  highly_confidential: 'Highly Confidential',
}

export function getInitials(name) {
  if (!name) return '?'
  return name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase()
}

export function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}
