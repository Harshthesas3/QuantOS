import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, LayoutDashboard, Calendar, BarChart2, Compass, Settings, CornerDownLeft, LibraryBig, FolderKanban, NotebookPen, BrainCircuit } from 'lucide-react'
import { useCurriculumStore } from '../stores/curriculumStore'
import { Badge } from './ui/badge'

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const navigate = useNavigate()
  const { nodes } = useCurriculumStore()
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen((prev) => !prev)
        setSearch('')
      } else if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const staticCommands = [
    { type: 'Navigation', title: 'Go to Dashboard', path: '/', icon: LayoutDashboard },
    { type: 'Navigation', title: 'Go to Curriculum Roadmap', path: '/roadmap', icon: Compass },
    { type: 'Navigation', title: 'Go to Resources', path: '/resources', icon: LibraryBig },
    { type: 'Navigation', title: 'Go to Projects', path: '/projects', icon: FolderKanban },
    { type: 'Navigation', title: 'Go to Notes', path: '/notes', icon: NotebookPen },
    { type: 'Navigation', title: 'Open Study Session', path: '/study', icon: BrainCircuit },
    { type: 'Navigation', title: 'Go to Daily Planner', path: '/planner', icon: Calendar },
    { type: 'Navigation', title: 'Go to Analytics', path: '/analytics', icon: BarChart2 },
    { type: 'Navigation', title: 'Go to Settings', path: '/settings', icon: Settings },
  ]

  const matchedNodes = Object.values(nodes)
    .filter(
      (node) =>
        node.title.toLowerCase().includes(search.toLowerCase()) ||
        node.id.toLowerCase().includes(search.toLowerCase())
    )
    .slice(0, 5)
    .map((node) => ({
      type: 'Curriculum Node',
      title: `${node.id}: ${node.title}`,
      path: `/topic/${node.id}`,
      icon: Compass,
      status: node.status,
    }))

  const allItems = [...staticCommands, ...matchedNodes]

  useEffect(() => {
    const handleListKeys = (e: KeyboardEvent) => {
      if (!isOpen) return
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((prev) => (prev + 1) % allItems.length)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((prev) => (prev - 1 + allItems.length) % allItems.length)
      } else if (e.key === 'Enter') {
        e.preventDefault()
        const selected = allItems[selectedIndex]
        if (selected) {
          navigate(selected.path)
          setIsOpen(false)
        }
      }
    }
    window.addEventListener('keydown', handleListKeys)
    return () => window.removeEventListener('keydown', handleListKeys)
  }, [isOpen, selectedIndex, allItems, navigate])

  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.querySelector('[data-active="true"]')
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' })
      }
    }
  }, [selectedIndex])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center pt-[15vh]">
      <div className="w-full max-w-xl bg-[#121318] border border-[#27272A] rounded-lg shadow-2xl overflow-hidden flex flex-col">
        <div className="flex items-center gap-3 px-4 border-b border-[#27272A] py-3.5">
          <Search className="w-5 h-5 text-[#A1A1AA]" />
          <input
            type="text"
            placeholder="Type a command or study topic name..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setSelectedIndex(0)
            }}
            className="flex-1 bg-transparent text-sm text-white placeholder-[#A1A1AA] focus:outline-none"
            autoFocus
          />
          <kbd className="px-2 py-0.5 bg-[#27272A] text-[#A1A1AA] border border-[#27272A] rounded text-[10px] uppercase font-mono font-bold">
            esc
          </kbd>
        </div>

        <div ref={listRef} className="max-h-[300px] overflow-y-auto p-2 space-y-1">
          {allItems.length > 0 ? (
            allItems.map((item, index) => {
              const Icon = item.icon
              const isActive = index === selectedIndex
              const status = (item as { status?: string }).status

              return (
                <button
                  key={index}
                  data-active={isActive}
                  onClick={() => {
                    navigate(item.path)
                    setIsOpen(false)
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-md flex items-center justify-between text-xs transition-colors ${
                    isActive ? 'bg-[#27272A] text-white' : 'text-[#A1A1AA] hover:bg-[#27272A]/40'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#38BDF8]' : 'text-[#A1A1AA]'}`} />
                    <div>
                      <span className="block text-white font-medium">{item.title}</span>
                      <span className="text-[10px] text-[#A1A1AA] font-mono mt-0.5 block flex items-center gap-1">
                        {item.type}
                        {status && (
                          <Badge
                            status={
                              status === 'MASTERED'
                                ? 'success'
                                : status === 'COMPLETED'
                                  ? 'success'
                                  : status === 'IN_PROGRESS'
                                    ? 'info'
                                    : status === 'UNLOCKED'
                                      ? 'default'
                                      : 'error'
                            }
                            variant="outline"
                            className="text-[8px] px-1 py-0"
                          >
                            {status}
                          </Badge>
                        )}
                      </span>
                    </div>
                  </div>

                  {isActive && (
                    <span className="flex items-center gap-1 text-[9px] text-[#38BDF8] font-bold font-mono">
                      select <CornerDownLeft className="w-3 h-3" />
                    </span>
                  )}
                </button>
              )
            })
          ) : (
            <div className="text-xs text-[#A1A1AA] text-center py-6">No matching queries found.</div>
          )}
        </div>
      </div>
    </div>
  )
}
