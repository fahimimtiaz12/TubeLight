import { useState } from 'react'
import { CREDIT_LINE } from '../config/credits'
import { resendVerification, signInWithPassword, signUp, useAuth, verifyEmail } from '../context/AuthContext'

export function AuthScreen() {
  const { refresh } = useAuth()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [otp, setOtp] = useState('')
  const [pendingVerify, setPendingVerify] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      if (pendingVerify) {
        const { error: vErr } = await verifyEmail(email, otp)
        if (vErr) throw vErr
        await refresh()
        setPendingVerify(false)
        setMode('signin')
        return
      }
      if (mode === 'signin') {
        const { error: sErr } = await signInWithPassword(email, password)
        if (sErr) throw sErr
        await refresh()
        return
      }
      const { data, error: uErr } = await signUp(email, password, name || email.split('@')[0]!)
      if (uErr) throw uErr
      if (data?.requireEmailVerification) {
        setPendingVerify(true)
        return
      }
      if (data?.accessToken) {
        await refresh()
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong'
      setError(msg)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-16">
      <div className="mb-10 text-center">
        <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-400 to-indigo-600 text-2xl shadow-xl shadow-teal-500/25">
          💡
        </div>
        <h1 className="font-display text-4xl font-semibold tracking-tight text-white">TubeLight</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-400">
          One calm desk for multi-model chat and your own documents.
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        className="glass-panel w-full max-w-md space-y-4 rounded-2xl p-8 sm:p-9"
      >
        <div className="flex gap-1 rounded-xl bg-slate-950/80 p-1 ring-1 ring-white/[0.06]">
          <button
            type="button"
            onClick={() => {
              setMode('signin')
              setPendingVerify(false)
              setError(null)
            }}
            className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition ${
              mode === 'signin' && !pendingVerify
                ? 'bg-gradient-to-r from-teal-600/40 to-indigo-600/30 text-white shadow-md ring-1 ring-white/10'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup')
              setPendingVerify(false)
              setError(null)
            }}
            className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition ${
              mode === 'signup' && !pendingVerify
                ? 'bg-gradient-to-r from-teal-600/40 to-indigo-600/30 text-white shadow-md ring-1 ring-white/10'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign up
          </button>
        </div>

        {pendingVerify ? (
          <div className="space-y-3">
            <p className="text-sm text-slate-300">
              Enter the 6-digit code sent to <span className="font-medium text-teal-200">{email}</span>.
            </p>
            <input
              className="focus-ring w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-3 text-center text-lg tracking-[0.35em] text-white"
              placeholder="••••••"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              autoComplete="one-time-code"
            />
            <button
              type="button"
              className="text-xs font-medium text-teal-400/90 hover:text-teal-300"
              onClick={() => void resendVerification(email)}
            >
              Resend code
            </button>
          </div>
        ) : (
          <>
            {mode === 'signup' && (
              <input
                className="focus-ring w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white placeholder:text-slate-500"
                placeholder="Display name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            )}
            <input
              className="focus-ring w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white placeholder:text-slate-500"
              placeholder="Email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              className="focus-ring w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white placeholder:text-slate-500"
              placeholder="Password"
              type="password"
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </>
        )}

        {error && <p className="rounded-lg border border-rose-500/25 bg-rose-950/40 px-3 py-2 text-sm text-rose-200">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-xl bg-gradient-to-r from-teal-500 via-teal-400 to-cyan-500 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-teal-500/25 transition hover:brightness-105 disabled:opacity-50"
        >
          {busy ? 'Please wait…' : pendingVerify ? 'Verify email' : mode === 'signin' ? 'Sign in' : 'Create account'}
        </button>
      </form>

      <p className="mt-10 max-w-md text-center text-[11px] leading-relaxed text-slate-500">
        <span className="font-medium text-slate-400">{CREDIT_LINE}</span>
      </p>
    </div>
  )
}
