export const getLocalISODate = (input = new Date()) => {
  const date = input instanceof Date ? input : new Date(input)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const toLocalDateKey = (value) => {
  if (!value) return ''

  if (typeof value === 'string') {
    // Keep plain YYYY-MM-DD values as-is to avoid timezone shifts.
    const trimmed = value.trim()
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return ''
  return getLocalISODate(parsed)
}
