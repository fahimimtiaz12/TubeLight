const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'])

export function isImageFile(file: File): boolean {
  if (file.type && IMAGE_TYPES.has(file.type)) return true
  const n = file.name.toLowerCase()
  return /\.(jpe?g|png|webp|gif|svg)$/i.test(n)
}

export function isImageMimeType(mimeType: string | null): boolean {
  return mimeType ? IMAGE_TYPES.has(mimeType) : false
}

export function isTextLikeFile(file: File): boolean {
  const n = file.name.toLowerCase()
  if (n.endsWith('.txt') || n.endsWith('.md') || n.endsWith('.csv')) return true
  if (file.type?.includes('pdf')) return true
  return n.endsWith('.pdf')
}
