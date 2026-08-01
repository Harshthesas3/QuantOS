import { useEffect, useState } from 'react'
import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Settings as SettingsIcon,
  Sun,
  Moon,
  Save,
  Download,
  Upload,
  AlertTriangle,
  CheckCircle,
  Database,
  Lock,
  User,
  LogOut,
} from 'lucide-react'
import { useCurriculumStore } from '../stores/curriculumStore'
import { usePlannerStore } from '../stores/plannerStore'
import { useStudySessionStore } from '../stores/studySessionStore'
import { useSpacedRepetitionStore } from '../stores/spacedRepetitionStore'
import { useUserStore } from '../stores/userStore'
import { usePersistenceStore } from '../stores/persistenceStore'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card'
import { toastSuccess, toastError } from '../lib/toast'
import {
  replaceAllCurriculumNodes,
  upsertStudySession,
} from '../services/repository'
import type { ExportPayload } from '../types'

type Theme = 'dark' | 'light'
const STORAGE_THEME = 'quantos.settings.theme'
const STORAGE_NOTIFICATIONS = 'quantos.settings.notifications'
const STORAGE_DAILY_REMINDER = 'quantos.settings.dailyReminders'

export default function Settings() {
  const navigate = useNavigate()
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(STORAGE_THEME) as Theme | null) ?? 'dark',
  )
  const [notifications, setNotifications] = useState(() => localStorage.getItem(STORAGE_NOTIFICATIONS) !== 'false')
  const [dailyReminders, setDailyReminders] = useState(() => localStorage.getItem(STORAGE_DAILY_REMINDER) ?? '18:00')
  const [resetConfirm, setResetConfirm] = useState('')
  const [exportStatus, setExportStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const { nodes } = useCurriculumStore()
  const { tasks, logs, activeTimer } = usePlannerStore()
  const { sessions } = useStudySessionStore()
  const { cards } = useSpacedRepetitionStore()
  const { user, changePassword } = useUserStore()
  const persistenceStatus = usePersistenceStore((state) => state.status)
  const persistenceReason = usePersistenceStore((state) => state.reason)

  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [pwBusy, setPwBusy] = useState(false)
  const importInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    document.body.classList.remove('theme-dark', 'theme-light')
    document.body.classList.add(theme === 'light' ? 'theme-light' : 'theme-dark')
    document.documentElement.dataset.theme = theme
    localStorage.setItem(STORAGE_THEME, theme)
  }, [theme])

  useEffect(() => {
    localStorage.setItem(STORAGE_NOTIFICATIONS, String(notifications))
  }, [notifications])

  useEffect(() => {
    localStorage.setItem(STORAGE_DAILY_REMINDER, dailyReminders)
  }, [dailyReminders])

  const handleSave = () => {
    localStorage.setItem(STORAGE_NOTIFICATIONS, String(notifications))
    localStorage.setItem(STORAGE_DAILY_REMINDER, dailyReminders)
    toastSuccess('Settings saved successfully!')
  }

  const handleExport = () => {
    try {
      const exportData: ExportPayload = {
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        user,
        curriculum: { nodes: { ...nodes } },
        planner: { tasks: { ...tasks }, logs: { ...logs } },
        studySessions: { sessions: { ...sessions } },
        spacedRepetition: { cards: { ...cards } },
      }
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `quantos-backup-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      setExportStatus('success')
      setTimeout(() => setExportStatus('idle'), 3000)
      toastSuccess('Data exported successfully!')
    } catch {
      setExportStatus('error')
      toastError('Export failed', 'Could not export data.')
    }
  }

  const handleImportClick = () => {
    importInputRef.current?.click()
  }

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string) as ExportPayload
        if (data.curriculum?.nodes) {
          useCurriculumStore.getState()._hydrate({ nodes: data.curriculum.nodes })
          if (persistenceStatus === 'ready') {
            void replaceAllCurriculumNodes(data.curriculum.nodes)
          }
        }
        if (data.planner) {
          usePlannerStore.getState()._hydrate({
            tasks: data.planner.tasks ?? {},
            logs: data.planner.logs ?? {},
          })
        }
        if (data.studySessions?.sessions) {
          useStudySessionStore.getState()._hydrate({ sessions: data.studySessions.sessions })
          if (persistenceStatus === 'ready') {
            for (const session of Object.values(data.studySessions.sessions)) {
              void upsertStudySession(session)
            }
          }
        }
        if (data.spacedRepetition?.cards) {
          useSpacedRepetitionStore.getState()._hydrate({ cards: data.spacedRepetition.cards })
        }
        if (data.user) {
          useUserStore.getState().setUser(data.user)
        }
        setImportStatus('success')
        toastSuccess('Data imported successfully!')
        setTimeout(() => setImportStatus('idle'), 3000)
      } catch {
        setImportStatus('error')
        toastError('Import failed', 'Invalid backup file.')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const handleResetProgress = () => {
    if (resetConfirm !== 'RESET') return
    useCurriculumStore.getState()._hydrate({ nodes: {} })
    usePlannerStore.getState()._hydrate({ tasks: {}, logs: {} })
    useStudySessionStore.getState()._hydrate({ sessions: {} })
    useSpacedRepetitionStore.getState()._hydrate({ cards: {} })
    setResetConfirm('')
    toastSuccess('All progress has been reset.')
  }

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault()
    void doChangePassword()
  }

  const doChangePassword = async () => {
    if (newPw.length < 6) {
      toastError('Password too short', 'New password must be at least 6 characters.')
      return
    }
    setPwBusy(true)
    try {
      const result = await changePassword(currentPw, newPw)
      if (!result.ok) {
        toastError('Could not change password', result.error ?? '')
        return
      }
      toastSuccess('Password updated.')
      setCurrentPw('')
      setNewPw('')
    } finally {
      setPwBusy(false)
    }
  }

  const storageKeys = [
    'quantos-curriculum-storage',
    'quantos-planner-storage',
    'quantos-study-session-storage',
    'quantos-spaced-repetition-storage',
    'user-storage',
    STORAGE_THEME,
    STORAGE_NOTIFICATIONS,
    STORAGE_DAILY_REMINDER,
  ]

  const getStorageSize = () => {
    let total = 0
    for (const key of storageKeys) {
      const val = localStorage.getItem(key)
      if (val) total += val.length
    }
    return (total / 1024).toFixed(2)
  }

  return (
    <div className="flex-1 p-6 max-w-4xl mx-auto w-full space-y-6 text-[#FAFAFA]">
      <header className="pb-4 border-b border-[#27272A]">
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <SettingsIcon className="w-7 h-7 text-[#38BDF8]" />
          Settings
        </h1>
        <p className="text-sm text-[#A1A1AA] mt-1">Configure your workspace and manage data.</p>
      </header>

      {persistenceStatus !== 'ready' && (
        <Card variant="glass" className="border-yellow-500/30">
          <CardContent className="space-y-2 py-4">
            <div className="flex items-center gap-2 text-yellow-300 text-sm font-semibold">
              <AlertTriangle className="w-4 h-4" />
              {persistenceStatus === 'failed' ? 'Local persistence failed' : 'Checking local persistence'}
            </div>
            <p className="text-xs text-[#A1A1AA]">
              {persistenceStatus === 'failed'
                ? persistenceReason ?? 'The SQLite database could not be opened during startup.'
                : 'Opening the SQLite database and syncing local stores.'}
            </p>
          </CardContent>
        </Card>
      )}

      <Card variant="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-4 h-4 text-[#38BDF8]" /> Account
          </CardTitle>
          <CardDescription>Signed in as {user?.username ?? 'unknown user'}.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-3 max-w-md">
            <div>
              <label htmlFor="settings-current-pw" className="text-xs text-[#A1A1AA] uppercase tracking-wider font-semibold block mb-1">
                Current password
              </label>
              <input
                id="settings-current-pw"
                type="password"
                value={currentPw}
                onChange={(e) => setCurrentPw(e.target.value)}
                className="w-full bg-[#0d0e12] border border-[#27272A] px-3 py-2 rounded text-sm text-white focus:outline-none focus:border-[#38BDF8]"
                autoComplete="current-password"
                required
              />
            </div>
            <div>
              <label htmlFor="settings-new-pw" className="text-xs text-[#A1A1AA] uppercase tracking-wider font-semibold block mb-1">
                New password
              </label>
              <input
                id="settings-new-pw"
                type="password"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                className="w-full bg-[#0d0e12] border border-[#27272A] px-3 py-2 rounded text-sm text-white focus:outline-none focus:border-[#38BDF8]"
                autoComplete="new-password"
                minLength={6}
                required
              />
            </div>
            <Button type="submit" variant="primary" size="sm" disabled={pwBusy} className="flex items-center gap-2">
              <Lock className="w-3.5 h-3.5" /> {pwBusy ? 'Saving...' : 'Change password'}
            </Button>
          </form>
          <div className="mt-4 pt-4 border-t border-[#27272A]/50">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                useUserStore.getState().clearUser()
                navigate('/login', { replace: true })
              }}
              className="flex items-center gap-2"
            >
              <LogOut className="w-3.5 h-3.5" /> Sign out
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card variant="glass">
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
          <CardDescription>Manage your workspace and notification settings.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-between items-center py-3 border-b border-[#27272A]/50">
            <div className="flex items-center gap-3">
              {theme === 'dark' ? <Moon className="w-5 h-5 text-[#A1A1AA]" /> : <Sun className="w-5 h-5 text-[#A1A1AA]" />}
              <span className="text-sm font-medium text-white">Theme</span>
            </div>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value as Theme)}
              aria-label="Theme"
              className="bg-[#0d0e12] border border-[#27272A] px-3 py-1.5 rounded text-sm text-white focus:outline-none focus:border-[#38BDF8]"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>

          <div className="flex justify-between items-center py-3 border-b border-[#27272A]/50">
            <div>
              <span className="text-sm font-medium text-white">In-app notifications</span>
              <p className="text-xs text-[#A1A1AA] mt-1">Show study reminders and progress toasts.</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={notifications}
              onClick={() => setNotifications((v) => !v)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                notifications ? 'bg-[#38BDF8]' : 'bg-[#27272A]'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                  notifications ? 'translate-x-5' : 'translate-x-1'
                } mt-0.5`}
              />
            </button>
          </div>

          <div className="flex justify-between items-center py-3 border-b border-[#27272A]/50">
            <div className="space-y-1">
              <span className="text-sm font-medium text-white">Daily reminder time</span>
              <p className="text-xs text-[#A1A1AA]">Used by future scheduled reminders.</p>
            </div>
            <input
              type="time"
              value={dailyReminders}
              onChange={(e) => setDailyReminders(e.target.value)}
              className="bg-[#0d0e12] border border-[#27272A] px-3 py-1.5 rounded text-sm text-white focus:outline-none focus:border-[#38BDF8]"
            />
          </div>
        </CardContent>
      </Card>

      <Card variant="glass">
        <CardHeader>
          <CardTitle>Data Management</CardTitle>
          <CardDescription>Export, import, or reset your learning data.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3 flex-wrap">
            <Button variant="secondary" onClick={handleExport} className="flex items-center gap-2">
              <Download className="w-4 h-4" /> Export Data
            </Button>
            <Button
              variant="secondary"
              onClick={handleImportClick}
              className="flex items-center gap-2"
            >
              <Upload className="w-4 h-4" /> Import Data
            </Button>
            <input
              ref={importInputRef}
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
              aria-hidden="true"
            />
          </div>

          {exportStatus === 'success' && (
            <div className="flex items-center gap-2 text-xs text-green-400">
              <CheckCircle className="w-3.5 h-3.5" /> Export completed successfully
            </div>
          )}
          {importStatus === 'success' && (
            <div className="flex items-center gap-2 text-xs text-green-400">
              <CheckCircle className="w-3.5 h-3.5" /> Import completed successfully
            </div>
          )}
          {importStatus === 'error' && (
            <div className="flex items-center gap-2 text-xs text-red-400">
              <AlertTriangle className="w-3.5 h-3.5" /> Import failed. Please check the file format.
            </div>
          )}

          <div className="pt-4 border-t border-[#27272A]/50 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-white">Reset All Progress</span>
                <p className="text-xs text-[#A1A1AA] mt-1">
                  Permanently delete all curriculum data, tasks, logs, and flashcards.
                </p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  if (resetConfirm === 'RESET') {
                    handleResetProgress()
                  } else if (resetConfirm === 'CLICK') {
                    setResetConfirm('RESET')
                  } else {
                    setResetConfirm('CLICK')
                    setTimeout(() => setResetConfirm(''), 5000)
                  }
                }}
              >
                {resetConfirm === 'RESET' ? 'Confirm Reset (type)' : resetConfirm === 'CLICK' ? 'Click again to confirm' : 'Reset Progress'}
              </Button>
            </div>
            {resetConfirm === 'RESET' && (
              <input
                value={resetConfirm}
                onChange={(e) => setResetConfirm(e.target.value)}
                placeholder="Type RESET to confirm"
                aria-label="Type RESET to confirm"
                className="w-full bg-[#0d0e12] border border-[#27272A] px-3 py-1.5 rounded text-sm text-white focus:outline-none focus:border-[#38BDF8]"
              />
            )}
          </div>
        </CardContent>
      </Card>

      <Card variant="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5 text-[#38BDF8]" /> Database Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-xs text-[#A1A1AA] uppercase tracking-wider font-semibold block">Storage Engine</span>
              <span className="text-white font-mono">SQLite (better-sqlite3)</span>
            </div>
            <div>
              <span className="text-xs text-[#A1A1AA] uppercase tracking-wider font-semibold block">LocalStorage Size</span>
              <span className="text-white font-mono">~{getStorageSize()} KB</span>
            </div>
            <div>
              <span className="text-xs text-[#A1A1AA] uppercase tracking-wider font-semibold block">Curriculum Nodes</span>
              <span className="text-white font-mono">{Object.keys(nodes).length}</span>
            </div>
            <div>
              <span className="text-xs text-[#A1A1AA] uppercase tracking-wider font-semibold block">Daily Tasks</span>
              <span className="text-white font-mono">{Object.keys(tasks).length}</span>
            </div>
            <div>
              <span className="text-xs text-[#A1A1AA] uppercase tracking-wider font-semibold block">Study Logs</span>
              <span className="text-white font-mono">{Object.keys(logs).length}</span>
            </div>
            <div>
              <span className="text-xs text-[#A1A1AA] uppercase tracking-wider font-semibold block">Flashcards</span>
              <span className="text-white font-mono">{Object.keys(cards).length}</span>
            </div>
            <div>
              <span className="text-xs text-[#A1A1AA] uppercase tracking-wider font-semibold block">Active Timer</span>
              <span className="text-white font-mono">{activeTimer ? 'Running' : 'Idle'}</span>
            </div>
            <div>
              <span className="text-xs text-[#A1A1AA] uppercase tracking-wider font-semibold block">User</span>
              <span className="text-white font-mono">{user?.username || 'Not signed in'}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} className="flex items-center gap-2">
          <Save className="w-4 h-4" /> Save Settings
        </Button>
      </div>
    </div>
  )
}
