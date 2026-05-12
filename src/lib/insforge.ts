import { createClient, type InsForgeClient } from '@insforge/sdk'

let client: InsForgeClient | null = null

export function getInsforge(): InsForgeClient {
  if (client) return client
  const baseUrl = import.meta.env.VITE_INSFORGE_URL
  const anonKey = import.meta.env.VITE_INSFORGE_ANON_KEY
  if (!baseUrl || !anonKey) {
    throw new Error('Missing VITE_INSFORGE_URL or VITE_INSFORGE_ANON_KEY')
  }
  client = createClient({ baseUrl, anonKey })
  return client
}

export function appOrigin(): string {
  const fromEnv = import.meta.env.VITE_APP_ORIGIN
  if (fromEnv) return fromEnv.replace(/\/$/, '')
  if (typeof window !== 'undefined') return window.location.origin
  return 'http://localhost:5173'
}
