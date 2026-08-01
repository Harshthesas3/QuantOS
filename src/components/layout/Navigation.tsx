import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, Compass, Calendar, BarChart2, Settings, Square, LibraryBig, FolderKanban, NotebookPen } from 'lucide-react'
import { usePlannerStore } from '../../stores/plannerStore'
import { useTimerTicker, formatTime } from '../../hooks/useTimerTicker'

export default function Navigation() {
  const location = useLocation()
  const { activeTimer, stopTimer } = usePlannerStore()
  const elapsedSeconds = useTimerTicker()

  const isActive = (path: string) => location.pathname === path

  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/roadmap', label: 'Roadmap', icon: Compass },
    { path: '/resources', label: 'Resources', icon: LibraryBig },
    { path: '/projects', label: 'Projects', icon: FolderKanban },
    { path: '/notes', label: 'Notes', icon: NotebookPen },
    { path: '/planner', label: 'Planner', icon: Calendar },
    { path: '/analytics', label: 'Analytics', icon: BarChart2 },
    { path: '/settings', label: 'Settings', icon: Settings },
  ]

  return (
    <nav className="w-full bg-[#121318] border-b border-[#27272A] px-6 py-4 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-8">
        <Link to="/" className="text-xl font-bold text-[#38BDF8] flex items-center gap-2 tracking-wider">
          <Compass className="w-6 h-6 text-[#38BDF8]" />
          QuantOS
        </Link>
        <div className="flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`relative flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  isActive(item.path)
                    ? 'bg-[#27272A] text-[#FAFAFA]'
                    : 'text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#27272A]/50'
                }`}
                title={item.label}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            )
          })}
        </div>
      </div>

      <div className="flex items-center gap-4">
        {activeTimer && (
          <div className="bg-red-500/10 border border-red-500/20 px-4 py-2 rounded-md flex items-center gap-3">
            <span className="text-xs text-red-400 font-mono">
              {formatTime(elapsedSeconds)}
            </span>
            <button
              onClick={() => stopTimer()}
              className="p-1 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors duration-150"
            >
              <Square className="w-3.5 h-3.5 fill-white" />
            </button>
          </div>
        )}
        <div className="flex items-center gap-2 text-xs text-[#A1A1AA] bg-[#27272A] px-3 py-1.5 rounded-md border border-[#27272A]">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span>v1.0.0 Production</span>
        </div>
      </div>
    </nav>
  )
}
