import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Cpu, LogIn, UserPlus, Eye, EyeOff } from 'lucide-react'
import { useUserStore } from '../stores/userStore'
import { toastSuccess, toastError } from '../lib/toast'

export default function Login() {
  const navigate = useNavigate()
  const userStore = useUserStore()
  const { user, hasAccount, createAccount, signIn, signInUsernameOnly } = userStore

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [mode, setMode] = useState<'create' | 'signin'>(hasAccount ? 'signin' : 'create')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (hasAccount && mode === 'create') setMode('signin')
  }, [hasAccount, mode])

  useEffect(() => {
    if (user) navigate('/', { replace: true })
  }, [user, navigate])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    void doSubmit()
  }

  const doSubmit = async () => {
    setError(null)
    if (!username.trim()) {
      setError('Username is required.')
      return
    }
    if (mode === 'create' && password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    setBusy(true)
    try {
      if (mode === 'create') {
        const result = await createAccount(username, password)
        if (!result.ok) {
          setError(result.error ?? 'Could not create account.')
          toastError('Could not create account', result.error ?? '')
          return
        }
        toastSuccess('Welcome to QuantOS!', `Account created for ${username.trim()}.`)
      } else {
        const result = await signIn(password)
        if (!result.ok) {
          setError(result.error ?? 'Could not sign in.')
          toastError('Sign-in failed', result.error ?? '')
          return
        }
        toastSuccess(`Welcome back, ${username.trim() || 'student'}!`)
      }
      navigate('/', { replace: true })
    } finally {
      setBusy(false)
    }
  }

  const handleFallback = () => {
    if (!username.trim()) {
      setError('Username is required.')
      return
    }
    signInUsernameOnly(username)
    navigate('/', { replace: true })
  }

  const switchMode = () => {
    setError(null)
    setPassword('')
    setMode((m) => (m === 'create' ? 'signin' : 'create'))
  }

  return (
    <div className="flex min-h-screen bg-[#0D0E12] items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Cpu className="w-10 h-10 text-[#38BDF8] animate-pulse" />
            <span className="text-3xl font-bold text-[#38BDF8]">QuantOS</span>
          </div>
          <h1 className="text-2xl font-bold text-white">
            {mode === 'create' ? 'Create your local account' : 'Welcome back'}
          </h1>
          <p className="text-sm text-[#A1A1AA] mt-2">
            {mode === 'create'
              ? 'Credentials are stored locally with Argon2id hashing. No remote service is involved.'
              : 'Enter the password you set when you created this workspace.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" aria-label={mode === 'create' ? 'Create account' : 'Sign in'}>
          <div>
            <label
              htmlFor="login-username"
              className="text-xs text-[#A1A1AA] uppercase tracking-wider font-semibold block mb-1.5"
            >
              Username
            </label>
            <input
              id="login-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Choose a username"
              className="w-full bg-[#121318] border border-[#27272A] px-4 py-2.5 rounded text-sm text-white placeholder-[#A1A1AA] focus:outline-none focus:border-[#38BDF8] transition-colors"
              autoComplete="username"
              required
              autoFocus
            />
          </div>

          <div>
            <label
              htmlFor="login-password"
              className="text-xs text-[#A1A1AA] uppercase tracking-wider font-semibold block mb-1.5"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'create' ? 'At least 6 characters' : 'Your workspace password'}
                className="w-full bg-[#121318] border border-[#27272A] px-4 py-2.5 pr-10 rounded text-sm text-white placeholder-[#A1A1AA] focus:outline-none focus:border-[#38BDF8] transition-colors"
                autoComplete={mode === 'create' ? 'new-password' : 'current-password'}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[#A1A1AA] hover:text-white"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div role="alert" className="text-xs text-red-400 border border-red-500/30 bg-red-500/10 rounded px-3 py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full py-2.5 bg-[#38BDF8] text-[#0D0E12] font-semibold rounded hover:bg-[#38BDF8]/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {mode === 'create' ? (
              <>
                <UserPlus className="w-4 h-4" /> Create Account
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" /> Enter Workspace
              </>
            )}
          </button>
        </form>

        <div className="text-center space-y-2">
          <button
            type="button"
            onClick={switchMode}
            className="text-xs text-[#A1A1AA] hover:text-[#38BDF8] transition-colors"
          >
            {mode === 'create'
              ? 'Already have a workspace? Sign in'
              : "First time here? Create a local account"}
          </button>
          {mode === 'signin' && (
            <button
              type="button"
              onClick={handleFallback}
              className="block w-full text-xs text-[#71717A] hover:text-[#A1A1AA]"
            >
              Forgot your password? Use username-only fallback
            </button>
          )}
        </div>

        <div className="text-center text-xs text-[#71717A]">
          Local-first. No remote authentication. No telemetry.
        </div>
      </div>
    </div>
  )
}
