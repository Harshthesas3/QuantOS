import { useEffect } from 'react'
import './App.css'
import { BrowserRouter, useLocation } from 'react-router-dom'
import { useUserStore } from './stores/userStore'
import Navigation from './components/layout/Navigation'
import CommandPalette from './components/CommandPalette'
import { ErrorBoundary } from './components/ErrorBoundary'
import { ToastContainer } from './components/ui/toast'
import { TooltipProvider } from './components/ui/tooltip'
import { bootstrap } from './services/bootstrap'
import { TaskTimeBridge } from './services/taskTimeBridge'
import { StudySessionBridge } from './services/studySessionBridge'
import Routes from './routes'
import { useDailyReminder } from './hooks/useDailyReminder'

function AppContent() {
  const location = useLocation()
  const isLoginPage = location.pathname === '/login'

  useDailyReminder(isLoginPage)

  return (
    <div className="App min-h-screen flex flex-col bg-[#0D0E12]">
      {!isLoginPage && <Navigation />}
      <main className="flex-1">
        <Routes />
      </main>
      {!isLoginPage && <CommandPalette />}
      <ToastContainer />
      <TaskTimeBridge />
      <StudySessionBridge />
    </div>
  )
}

function App() {
  const initializeUser = useUserStore((s) => s.initializeUser)

  useEffect(() => {
    const storedTheme = localStorage.getItem('quantos.settings.theme')
    const theme = storedTheme === 'light' ? 'light' : 'dark'
    document.body.classList.remove('theme-dark', 'theme-light')
    document.body.classList.add(theme === 'light' ? 'theme-light' : 'theme-dark')
    document.documentElement.dataset.theme = theme

    void bootstrap()
    initializeUser()
  }, [initializeUser])

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <TooltipProvider>
          <AppContent />
        </TooltipProvider>
      </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App
