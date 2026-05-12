/** Split long text into overlapping chunks for embedding. */
export function chunkText(text: string, maxLen = 1200, overlap = 200): string[] {
  const normalized = text.replace(/\r\n/g, '\n').trim()
  if (!normalized) return []
  if (normalized.length <= maxLen) return [normalized]

  const chunks: string[] = []
  let start = 0
  while (start < normalized.length) {
    const end = Math.min(start + maxLen, normalized.length)
    let slice = normalized.slice(start, end)
    if (end < normalized.length) {
      const lastPara = slice.lastIndexOf('\n\n')
      const lastPeriod = slice.lastIndexOf('. ')
      const cut = Math.max(lastPara, lastPeriod)
      if (cut > maxLen * 0.4) {
        slice = slice.slice(0, cut + 1)
      }
    }
    chunks.push(slice.trim())
    if (end >= normalized.length) break
    const advance = Math.max(1, slice.length - overlap)
    start += advance
  }
  return chunks.filter(Boolean)
}
