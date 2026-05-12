import { useAuth } from './context/AuthContext'
import { AuthScreen } from './components/AuthScreen'
import { Workspace } from './components/Workspace'

export default function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-11 w-11 animate-spin rounded-full border-2 border-teal-500/30 border-t-teal-400" />
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Loading</p>
        </div>
      </div>
    )
  }

  if (!user) return <AuthScreen />

  return <Workspace />
}
