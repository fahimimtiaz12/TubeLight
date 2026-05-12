import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { CHAT_MODEL_OPTIONS, EMBEDDING_MODEL, type ChatModelId } from '../config/models'
import { CREDIT_LINE } from '../config/credits'
import { useAuth } from '../context/AuthContext'
import { chunkText } from '../lib/chunkText'
import { extractTextFromFile } from '../lib/extractText'
import { getInsforge } from '../lib/insforge'
import { isImageFile, isImageMimeType, isTextLikeFile } from '../lib/mime'
import { SourceThumb } from './SourceThumb'

type ChatRow = {
  id: string
  title: string | null
  model_id: string
  created_at: string
  updated_at: string
}

type MessageRow = {
  id: string
  chat_id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  created_at: string
}

type SourceRow = {
  id: string
  filename: string
  storage_key: string
  mime_type: string | null
  created_at: string
}

export function Workspace() {
  const { user, signOut } = useAuth()
  const insforge = useMemo(() => getInsforge(), [])

  const [chats, setChats] = useState<ChatRow[]>([])
  const [activeChatId, setActiveChatId] = useState<string | null>(null)
  const [messages, setMessages] = useState<MessageRow[]>([])
  const [modelId, setModelId] = useState<ChatModelId>(CHAT_MODEL_OPTIONS[0]!.id)
  const [useDocs, setUseDocs] = useState(true)
  const [sources, setSources] = useState<SourceRow[]>([])
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [uploadBusy, setUploadBusy] = useState(false)
  const [modelSearch, setModelSearch] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const uploadInFlight = useRef(false)
  const filteredModels = useMemo(() => {
    if (!modelSearch.trim()) return CHAT_MODEL_OPTIONS
    const query = modelSearch.toLowerCase()
    return CHAT_MODEL_OPTIONS.filter(
      (m) =>
        m.label.toLowerCase().includes(query) ||
        m.provider.toLowerCase().includes(query) ||
        m.id.toLowerCase().includes(query)
    )
  }, [modelSearch])

  const loadChats = useCallback(async () => {
    if (!user) return
    const { data, error: e } = await insforge.database
      .from('tubelight_chats')
      .select()
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
    if (e) return
    setChats((data as ChatRow[]) ?? [])
  }, [insforge, user])

  const loadSources = useCallback(async () => {
    if (!user) return
    const { data, error: e } = await insforge.database
      .from('tubelight_document_sources')
      .select('id, filename, storage_key, mime_type, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    if (e) {
      console.error('loadSources', e)
      setSources([])
      return
    }
    setSources((data as SourceRow[]) ?? [])
  }, [insforge, user])

  useEffect(() => {
    void loadChats()
    void loadSources()
  }, [loadChats, loadSources])

  const loadMessages = useCallback(
    async (chatId: string) => {
      const { data, error: e } = await insforge.database
        .from('tubelight_messages')
        .select()
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true })
      if (e) {
        setError(e.message)
        return
      }
      setMessages((data as MessageRow[]) ?? [])
    },
    [insforge],
  )

  useEffect(() => {
    if (!activeChatId) {
      setMessages([])
      return
    }
    const chat = chats.find((c) => c.id === activeChatId)
    if (chat?.model_id) setModelId(chat.model_id as ChatModelId)
    void loadMessages(activeChatId)
  }, [activeChatId, chats, loadMessages])

  const createChat = async () => {
    if (!user) return
    setError(null)
    const { data, error: e } = await insforge.database
      .from('tubelight_chats')
      .insert([
        {
          user_id: user.id,
          title: 'New chat',
          model_id: modelId,
        },
      ])
      .select()
      .single()
    if (e) {
      setError(e.message)
      return
    }
    const row = data as ChatRow
    setChats((prev) => [row, ...prev])
    setActiveChatId(row.id)
    setMessages([])
  }

  const persistModel = async (chatId: string, next: ChatModelId) => {
    await insforge.database.from('tubelight_chats').update({ model_id: next }).eq('id', chatId)
    setChats((prev) => prev.map((c) => (c.id === chatId ? { ...c, model_id: next } : c)))
  }

  const sendMessage = async () => {
    const text = draft.trim()
    if (!text || !user || busy) return

    let chatId = activeChatId
    setError(null)
    setBusy(true)
    setDraft('')

    try {
      if (!chatId) {
        const { data, error: ce } = await insforge.database
          .from('tubelight_chats')
          .insert([{ user_id: user.id, title: text.slice(0, 80), model_id: modelId }])
          .select()
          .single()
        if (ce) throw ce
        const row = data as ChatRow
        chatId = row.id
        setChats((prev) => [row, ...prev])
        setActiveChatId(chatId)
      } else if (chats.find((c) => c.id === chatId)?.model_id !== modelId) {
        await persistModel(chatId, modelId)
      }

      const { error: insUserErr } = await insforge.database.from('tubelight_messages').insert([
        { chat_id: chatId, user_id: user.id, role: 'user', content: text },
      ])
      if (insUserErr) throw insUserErr

      const { data: allMsgs, error: loadErr } = await insforge.database
        .from('tubelight_messages')
        .select()
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true })
      if (loadErr) throw loadErr

      const transcript = ((allMsgs as MessageRow[]) ?? [])
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .map((m) => ({ role: m.role, content: m.content }))

      let docContext = ''
      if (useDocs) {
        const embQ = await insforge.ai.embeddings.create({
          model: EMBEDDING_MODEL,
          input: text,
        })
        const qVec = embQ.data?.[0]?.embedding
        if (!qVec) throw new Error('No embedding returned')

        let rows = [] as { content: string; filename?: string }[]

        const { data: strictHits, error: strictErr } = await insforge.database.rpc('match_tubelight_chunks', {
          query_embedding: qVec,
          match_count: 14,
          match_threshold: 0.45,
        })
        if (strictErr) throw strictErr
        rows = (strictHits ?? []) as { content: string; filename?: string }[]

        if (rows.length < 4) {
          const { data: nearHits, error: nearErr } = await insforge.database.rpc('match_tubelight_chunks_nearest', {
            query_embedding: qVec,
            match_count: 24,
          })
          if (nearErr) throw nearErr
          const near = (nearHits ?? []) as { content: string; filename?: string }[]
          const seen = new Set(rows.map((r) => r.content))
          for (const r of near) {
            if (!seen.has(r.content)) {
              seen.add(r.content)
              rows.push(r)
            }
          }
          rows = rows.slice(0, 24)
        }

        if (rows.length) {
          docContext = rows
            .map((r, i) => `[${i + 1}] (${r.filename ?? 'doc'})\n${r.content}`)
            .join('\n\n---\n\n')
        }
      }

      const systemParts: string[] = [
        'You are TubeLight, a concise assistant. Use markdown when helpful.',
      ]

      const selectedModel = CHAT_MODEL_OPTIONS.find((m) => m.id === modelId)
      const supportsImages = selectedModel?.input.includes('Image')

      const imageUrls: string[] = []
      if (supportsImages) {
        // Only include images if user asks about them
        const mentionsImage = /\b(image|picture|screenshot|photo|visual|see|look|what|describe)\b/i.test(text)
        if (mentionsImage) {
          const imageSources = sources.filter((s) => isImageMimeType(s.mime_type))
          // Limit to first 1 image to avoid overwhelming the backend
          for (const source of imageSources.slice(0, 1)) {
            const url = insforge.storage.from('tubelight-docs').getPublicUrl(source.storage_key)
            if (typeof url === 'string' && url.trim()) {
              imageUrls.push(url)
            }
          }
        }
      }

      if (useDocs) {
        systemParts.push(
          docContext
            ? `The user enabled "documents only" for this reply. Use ONLY the excerpts below — including copyright lines, title pages, prefaces, and contributor lists where the author often appears. Do not use general web or training knowledge. If the author (or answer) is not stated in these excerpts, say it is not visible in the retrieved pages and suggest they ask about a specific chapter or paste a snippet. Do not mention model training cutoffs.\n\n---\n${docContext}\n---`
            : 'The user enabled "documents only" but no document chunks could be retrieved (empty library or retrieval error). Reply in one short sentence that you have no indexed excerpts to read — do NOT answer from general knowledge, training data, or "knowledge base" phrasing, and do NOT mention training cutoffs.',
        )
      }

      const userMessage = transcript[transcript.length - 1]?.content || text
      const messages: Array<{ role: string; content: any }> = [
        { role: 'system', content: systemParts.join('\n\n') },
        ...transcript.slice(0, -1).map((t) => ({ role: t.role, content: t.content })),
      ]

      // Add user message with images if available
      if (imageUrls.length > 0) {
        messages.push({
          role: 'user',
          content: [
            { type: 'text', text: userMessage },
            ...imageUrls.map((url) => ({ type: 'image_url', image_url: { url } })),
          ],
        })
      } else {
        messages.push({ role: 'user', content: userMessage })
      }

      console.log('[TubeLight] Request payload:', {
        model: modelId,
        hasImages: imageUrls.length > 0,
        imageCount: imageUrls.length,
        imageUrls: imageUrls.slice(0, 1), // Log first URL as sample
        messageCount: messages.length,
      })

      const completion = await insforge.ai.chat.completions.create({
        model: modelId,
        messages: messages as any,
        maxTokens: 2048,
        temperature: 0.4,
      })

      const reply =
        completion.choices?.[0]?.message?.content?.trim() ||
        'Sorry, the model returned an empty reply.'

      const { error: insAsstErr } = await insforge.database.from('tubelight_messages').insert([
        { chat_id: chatId, user_id: user.id, role: 'assistant', content: reply },
      ])
      if (insAsstErr) throw insAsstErr

      await insforge.database
        .from('tubelight_chats')
        .update({ updated_at: new Date().toISOString(), title: text.slice(0, 80) })
        .eq('id', chatId)

      await loadMessages(chatId)
      void loadChats()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setError(msg)
      setDraft(text)
    } finally {
      setBusy(false)
    }
  }

  const onUpload: React.ChangeEventHandler<HTMLInputElement> = async (ev) => {
    const file = ev.target.files?.[0]
    ev.target.value = ''
    if (!file || !user) return
    if (uploadInFlight.current) return
    uploadInFlight.current = true
    setUploadBusy(true)
    setError(null)
    try {
      const safe = file.name.replace(/[^\w.\-]+/g, '_')
      const key = `${user.id}/${crypto.randomUUID()}-${safe}`
      const { data: up, error: upErr } = await insforge.storage.from('tubelight-docs').upload(key, file)
      if (upErr) throw upErr

      if (isImageFile(file)) {
        const { error: srcErr } = await insforge.database.from('tubelight_document_sources').insert([
          {
            user_id: user.id,
            filename: file.name,
            storage_key: up?.key ?? key,
            mime_type: file.type || 'application/octet-stream',
            byte_size: file.size,
          },
        ])
        if (srcErr) throw srcErr
        await loadSources()
        return
      }

      if (!isTextLikeFile(file)) {
        throw new Error('Unsupported file. Use images (JPEG, PNG, WebP, GIF, SVG) or documents (.txt, .md, .pdf).')
      }

      const raw = await extractTextFromFile(file)
      const chunks = chunkText(raw, 1400, 180)
      if (!chunks.length) throw new Error('No extractable text in file.')

      const { data: srcRow, error: srcErr } = await insforge.database
        .from('tubelight_document_sources')
        .insert([
          {
            user_id: user.id,
            filename: file.name,
            storage_key: up?.key ?? key,
            mime_type: file.type || null,
            byte_size: file.size,
          },
        ])
        .select()
        .single()
      if (srcErr) throw srcErr

      const source = srcRow as SourceRow

      const batchSize = 12
      for (let i = 0; i < chunks.length; i += batchSize) {
        const slice = chunks.slice(i, i + batchSize)
        const emb = await insforge.ai.embeddings.create({
          model: EMBEDDING_MODEL,
          input: slice,
        })
        const rows = slice.map((content, j) => {
          const embedding = emb.data?.[j]?.embedding
          if (!embedding) throw new Error('Embedding batch failed')
          return {
            user_id: user.id,
            source_id: source.id,
            chunk_index: i + j,
            content,
            embedding,
          }
        })
        const { error: chErr } = await insforge.database.from('tubelight_chunks').insert(rows)
        if (chErr) throw chErr
      }

      await loadSources()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      uploadInFlight.current = false
      setUploadBusy(false)
    }
  }

  const deleteSource = async (id: string, storageKey: string) => {
    setError(null)
    const { error: rmErr } = await insforge.storage.from('tubelight-docs').remove(storageKey)
    if (rmErr) setError(rmErr.message)
    await insforge.database.from('tubelight_document_sources').delete().eq('id', id)
    await loadSources()
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex min-h-0 flex-1 gap-3 p-3 sm:gap-4 sm:p-4">
        {/* Sidebar */}
        <aside className={`glass-panel fixed left-3 top-3 z-50 flex h-[calc(100vh-1.5rem)] w-[min(100%,288px)] shrink-0 flex-col overflow-hidden rounded-2xl transition-transform lg:static lg:z-auto lg:h-auto lg:translate-x-0 lg:transform-none ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } sm:w-72`}>
          <div className="border-b border-white/[0.06] bg-gradient-to-br from-slate-900/90 to-slate-950/90 px-4 py-5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-teal-400 to-indigo-500 text-lg shadow-lg shadow-teal-500/20">
                    💡
                  </span>
                  <div>
                    <h1 className="font-display text-lg font-semibold tracking-tight text-white">TubeLight</h1>
                    <p className="truncate text-[11px] font-medium uppercase tracking-wider text-slate-500">Made by Fahim</p>
                  </div>
                </div>
                <p className="mt-3 truncate text-xs text-slate-400">{user?.email}</p>
              </div>
              <button
                type="button"
                onClick={() => void signOut()}
                className="shrink-0 rounded-lg border border-white/10 bg-slate-950/50 px-2.5 py-1.5 text-[11px] font-medium text-slate-300 transition hover:border-rose-500/30 hover:bg-rose-950/30 hover:text-rose-200"
              >
                Sign out
              </button>
            </div>
          </div>

          <div className="px-3 pb-3 pt-4">
            <button
              type="button"
              onClick={() => void createChat()}
              className="w-full rounded-xl bg-gradient-to-r from-teal-500 via-teal-400 to-cyan-500 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-teal-500/25 transition hover:brightness-105 active:scale-[0.99]"
            >
              New chat
            </button>
          </div>

          <div className="flex min-h-0 flex-1 flex-col px-3">
            <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Chats</p>
            <div className="flex flex-1 flex-col gap-1 overflow-y-auto rounded-xl bg-slate-950/30 p-1 ring-1 ring-white/[0.04]">
              {chats.length === 0 && (
                <p className="px-3 py-6 text-center text-xs text-slate-500">No chats yet — start one on the right.</p>
              )}
              {chats.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setActiveChatId(c.id)}
                  className={`truncate rounded-lg px-3 py-2.5 text-left text-sm transition ${
                    c.id === activeChatId
                      ? 'bg-gradient-to-r from-teal-500/15 to-indigo-500/10 font-medium text-white ring-1 ring-teal-500/25'
                      : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200'
                  }`}
                >
                  {c.title || 'Untitled'}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-auto border-t border-white/[0.06] bg-slate-950/40 px-3 py-4">
            <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Library</p>
            <label className="mb-3 flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-teal-500/25 bg-teal-500/[0.04] px-3 py-4 text-center transition hover:border-teal-400/40 hover:bg-teal-500/[0.07]">
              <span className="text-xs font-medium text-teal-200/90">
                {uploadBusy ? 'Uploading…' : 'Drop files or click to upload'}
              </span>
              <span className="mt-1 text-[10px] leading-relaxed text-slate-500">
                PDF · TXT · MD · JPEG · PNG · WebP · GIF · SVG
              </span>
              <input
                type="file"
                accept=".txt,.md,.pdf,.csv,image/jpeg,image/png,image/webp,image/gif,image/svg+xml,text/plain,text/markdown,application/pdf"
                className="hidden"
                onChange={onUpload}
                disabled={uploadBusy}
              />
            </label>
            <p className="mb-2 px-1 text-[10px] text-slate-600">
              Images are stored in your library. Text Q&amp;A uses chunks from PDFs and text files.
            </p>
            <ul className="max-h-36 space-y-1.5 overflow-y-auto pr-0.5">
              {sources.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center gap-2 rounded-lg border border-white/[0.05] bg-slate-900/50 px-2 py-1.5 transition hover:border-white/10"
                >
                  <SourceThumb storageKey={s.storage_key} mimeType={s.mime_type} />
                  <span className="min-w-0 flex-1 truncate text-xs text-slate-300">{s.filename}</span>
                  <button
                    type="button"
                    className="shrink-0 rounded-md p-1 text-slate-500 transition hover:bg-rose-500/15 hover:text-rose-300"
                    title="Remove"
                    aria-label="Remove file"
                    onClick={() => void deleteSource(s.id, s.storage_key)}
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* Main */}
        <main className="glass-panel flex min-w-0 flex-1 flex-col overflow-hidden rounded-2xl">
          <header className="shrink-0 border-b border-white/[0.06] bg-slate-950/50 px-4 py-4 sm:px-6">
            <div className="flex items-center justify-between lg:hidden">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="rounded-lg border border-white/10 bg-slate-950/50 px-3 py-2 text-sm font-medium text-slate-300 transition hover:border-teal-500/30 hover:bg-teal-950/30 hover:text-teal-200"
              >
                ☰ Menu
              </button>
            </div>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <label className="group flex max-w-xl cursor-pointer items-center gap-3 rounded-xl border border-white/[0.08] bg-slate-900/40 px-4 py-3 transition hover:border-teal-500/25 hover:bg-slate-900/60">
                <span className="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full bg-slate-700 transition has-[:checked]:bg-teal-600">
                  <input
                    type="checkbox"
                    checked={useDocs}
                    onChange={(e) => setUseDocs(e.target.checked)}
                    className="peer absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                  />
                  <span className="pointer-events-none absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-md transition-transform duration-200 ease-out peer-checked:translate-x-5" />
                </span>
                <span className="text-sm leading-snug text-slate-200">
                  <span className="font-medium text-white">Documents only</span>
                  <span className="mt-0.5 block text-xs font-normal text-slate-500">
                    Ground answers in your uploaded PDFs and text — not the open web.
                  </span>
                </span>
              </label>

              <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Model</span>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search models..."
                    value={modelSearch}
                    onChange={(e) => setModelSearch(e.target.value)}
                    className="mb-2 w-full rounded-lg border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-teal-500/30 focus:outline-none"
                  />
                  <select
                    title="Select AI model"
                    value={modelId}
                    onChange={(e) => {
                      const v = e.target.value as ChatModelId
                      setModelId(v)
                      if (activeChatId) void persistModel(activeChatId, v)
                    }}
                    className="focus-ring cursor-pointer appearance-none rounded-xl border border-white/10 bg-slate-950/80 py-2.5 pl-3 pr-10 text-sm font-medium text-slate-100 transition hover:border-teal-500/30"
                  >
                    {filteredModels.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.label} ({m.provider})
                      </option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute bottom-2.5 right-3 text-slate-500">▾</span>
                </div>
              </div>
            </div>
            <div className="mt-4 h-px w-full bg-gradient-to-r from-transparent via-teal-500/25 to-transparent" />
          </header>

          <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-8">
              <div className="mx-auto max-w-3xl space-y-5">
                {messages.length === 0 && (
                  <div className="rounded-2xl border border-white/[0.07] bg-gradient-to-br from-slate-900/80 to-slate-950/80 p-8 text-center shadow-inner shadow-black/20">
                    <p className="font-display text-2xl font-semibold text-gradient-brand">Welcome</p>
                    <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-400">
                      Choose a model, upload PDFs, notes, or images, and turn on <strong className="text-slate-300">Documents only</strong> for
                      answers tied to your files. Multimodal models can analyze uploaded images. Add <code className="rounded bg-slate-800 px-1.5 py-0.5 text-xs">google/gemini-2.0-flash-001</code> in
                      InsForge AI settings if the Gemini option is not enabled yet.
                    </p>
                  </div>
                )}
                {messages.map((m) => (
                  <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[min(100%,42rem)] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-lg sm:px-5 sm:py-4 ${
                        m.role === 'user'
                          ? 'border border-teal-500/25 bg-gradient-to-br from-teal-600/25 via-teal-600/15 to-cyan-900/20 text-slate-100'
                          : 'border border-white/[0.07] bg-slate-950/70 text-slate-100 shadow-black/20'
                      }`}
                    >
                      {m.role === 'assistant' ? (
                        <div className="prose prose-invert prose-sm max-w-none prose-p:my-2 prose-headings:my-2 prose-ul:my-1 prose-li:my-0.5">
                          <ReactMarkdown>{m.content}</ReactMarkdown>
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap">{m.content}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {error && (
              <div className="shrink-0 border-t border-rose-500/20 bg-rose-950/35 px-4 py-2.5 text-center text-sm text-rose-100 sm:px-8">
                {error}
              </div>
            )}

            <div className="shrink-0 border-t border-white/[0.06] bg-slate-950/80 px-4 py-4 backdrop-blur sm:px-8">
              <div className="mx-auto flex max-w-3xl gap-3">
                <textarea
                  className="focus-ring min-h-[56px] flex-1 resize-none rounded-2xl border border-white/[0.08] bg-slate-900/70 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 transition hover:border-white/15"
                  placeholder="Write a message… (Shift+Enter for newline)"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      void sendMessage()
                    }
                  }}
                  rows={2}
                />
                <button
                  type="button"
                  disabled={busy || !draft.trim()}
                  onClick={() => void sendMessage()}
                  className="self-end rounded-2xl bg-gradient-to-br from-teal-500 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-teal-500/20 transition hover:brightness-105 disabled:pointer-events-none disabled:opacity-35"
                >
                  {busy ? '…' : 'Send'}
                </button>
              </div>
              <p className="mx-auto mt-3 max-w-3xl text-center text-[11px] text-slate-500">
                {CHAT_MODEL_OPTIONS.find((m) => m.id === modelId)?.blurb}
              </p>
            </div>
          </div>
        </main>
      </div>

      <footer className="shrink-0 border-t border-white/[0.06] bg-slate-950/90 px-4 py-3 text-center backdrop-blur">
        <p className="text-[11px] text-slate-500">
          <span className="font-medium text-slate-400">{CREDIT_LINE}</span>
          <span className="mx-2 text-slate-700">·</span>
          <span>TubeLight · Made with love by Fahim</span>
        </p>
      </footer>
    </div>
  )
}
