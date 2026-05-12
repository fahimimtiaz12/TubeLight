import { useEffect, useState } from 'react'
import { getInsforge } from '../lib/insforge'

export function SourceThumb({ storageKey, mimeType }: { storageKey: string; mimeType: string | null }) {
  const [src, setSrc] = useState<string | null>(null)

  useEffect(() => {
    if (!mimeType?.startsWith('image/')) return
    let cancelled = false
    let blobUrl: string | null = null
    ;(async () => {
      const insforge = getInsforge()
      const { data, error } = await insforge.storage.from('tubelight-docs').download(storageKey)
      if (cancelled || error || !data) return
      blobUrl = URL.createObjectURL(data)
      setSrc(blobUrl)
    })()
    return () => {
      cancelled = true
      if (blobUrl) URL.revokeObjectURL(blobUrl)
    }
  }, [storageKey, mimeType])

  if (!mimeType?.startsWith('image/')) {
    return (
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-800/90 text-xs font-medium text-teal-300/90 ring-1 ring-white/10">
        {mimeType?.includes('pdf') ? 'PDF' : 'TXT'}
      </span>
    )
  }

  if (!src) {
    return <div className="h-9 w-9 shrink-0 animate-pulse rounded-lg bg-slate-800/80 ring-1 ring-white/5" />
  }

  return (
    <img
      src={src}
      alt=""
      className="h-9 w-9 shrink-0 rounded-lg object-cover ring-1 ring-white/10"
    />
  )
}
