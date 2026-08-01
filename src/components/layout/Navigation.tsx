import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, Compass, Calendar, BarChart2, Settings, Square, LibraryBig, FolderKanban, NotebookPen, BrainCircuit } from 'lucide-react'
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
    { path: '/study', label: 'Study', icon: BrainCircuit },
    { path: '/planner', label: 'Planner', icon: Calendar },
    { path: '/analytics', label: 'Analytics', icon: BarChart2 },
    { path: '/settings', label: 'Settings', icon: Settings },
  ]

  return (
    <nav className="w-full bg-[#111318] border-b border-[#2A2E36] px-6 py-4 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-8">
        <Link to="/" className="text-xl font-bold text-[#C8BFAF] flex items-center gap-2 tracking-wider">
          <Compass className="w-6 h-6 text-[#C8BFAF]" />
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
                    ? 'bg-[#2A2E36] text-[#F4F1EA]'
                    : 'text-[#A9A39A] hover:text-[#F4F1EA] hover:bg-[#2A2E36]/50'
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
          <div className="bg-[#D98A8A]/10 border border-[#D98A8A]/20 px-4 py-2 rounded-md flex items-center gap-3">
            <span className="text-xs text-[#D98A8A] font-mono">
              {formatTime(elapsedSeconds)}
            </span>
            <button
              onClick={() => stopTimer()}
              className="p-1 bg-[#D98A8A] hover:bg-[#D98A8A]/80 text-[#0B0C10] rounded-full transition-colors duration-150"
            >
              <Square className="w-3.5 h-3.5 fill-[#0B0C10]" />
            </button>
          </div>
        )}
        <div className="flex items-center gap-2 text-xs text-[#A9A39A] bg-[#2A2E36] px-3 py-1.5 rounded-md border border-[#2A2E36]">
          <span className="w-2 h-2 bg-[#A8C69F] rounded-full animate-pulse" />
          <span>v1.0.0 Production</span>
        </div>
      </div>
    </nav>
  )
}
