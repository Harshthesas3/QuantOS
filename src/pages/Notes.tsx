import { useEffect, useMemo, useState } from 'react'
import { BookText, Search, Save, NotebookPen, Clock3 } from 'lucide-react'
import { useCurriculumStore } from '../stores/curriculumStore'
import { usePlannerStore } from '../stores/plannerStore'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Input } from '../components/ui/input'
import { EmptyState } from '../components/ui/empty-state'
import { toastSuccess } from '../lib/toast'

export default function Notes() {
  const { nodes, updateNodeNotes } = useCurriculumStore()
  const { logs } = usePlannerStore()
  const [search, setSearch] = useState('')
  const [selectedNodeId, setSelectedNodeId] = useState<string>(() => Object.keys(nodes)[0] ?? '')
  const [draft, setDraft] = useState(nodes[selectedNodeId]?.notes ?? '')

  const noteNodes = useMemo(() => {
    return Object.values(nodes)
      .filter((node) => {
        const query = search.trim().toLowerCase()
        if (!query) return true
        return [node.id, node.title, node.notes, node.phaseId].join(' ').toLowerCase().includes(query)
      })
      .sort((a, b) => a.id.localeCompare(b.id))
  }, [nodes, search])

  const selectedNode = selectedNodeId ? nodes[selectedNodeId] : undefined
  const reflections = useMemo(() => {
    return Object.values(logs).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5)
  }, [logs])

  useEffect(() => {
    if (!selectedNodeId || !nodes[selectedNodeId]) {
      const firstNodeId = Object.keys(nodes)[0]
      if (firstNodeId) {
        setSelectedNodeId(firstNodeId)
        setDraft(nodes[firstNodeId]?.notes ?? '')
      }
      return
    }

    setDraft(nodes[selectedNodeId]?.notes ?? '')
  }, [nodes, selectedNodeId])

  return (
    <div className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-6 text-[#F4F1EA]">
      <header className="pb-4 border-b border-[#2A2E36]">
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <NotebookPen className="w-7 h-7 text-[#C8BFAF]" />
          Notes
        </h1>
        <p className="text-sm text-[#A9A39A] mt-1">A central notebook for curriculum notes and reflection logs.</p>
      </header>

      <Card variant="glass">
        <CardContent className="pt-4">
          <div className="relative max-w-xl">
            <Search className="w-4 h-4 text-[#A9A39A] absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search note titles, text, or phases..."
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-[320px_1fr] gap-4">
        <Card variant="glass" className="h-full">
          <CardHeader>
            <CardTitle className="text-base text-white">Topics</CardTitle>
            <CardDescription>Pick a curriculum node to edit its notes.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 max-h-[64vh] overflow-y-auto pr-1">
            {noteNodes.map((node) => (
              <button
                key={node.id}
                onClick={() => {
                  setSelectedNodeId(node.id)
                  setDraft(node.notes)
                }}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${selectedNodeId === node.id ? 'bg-[#1F2229] border-[#C8BFAF]/40' : 'bg-[#0B0C10] border-[#2A2E36] hover:border-[#3A3F46]'}`}
              >
                <div className="flex items-center justify-between gap-3 mb-1">
                  <span className="text-xs font-mono text-[#C8BFAF]">{node.id}</span>
                  <Badge status={node.notes.trim() ? 'success' : 'default'} variant="outline">
                    {node.notes.trim() ? 'Has notes' : 'Empty'}
                  </Badge>
                </div>
                <div className="text-sm font-semibold text-white line-clamp-1">{node.title}</div>
                <div className="text-[11px] text-[#A9A39A] mt-1 line-clamp-2">{node.notes || 'No notes yet.'}</div>
              </button>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-4">
          {selectedNode ? (
            <Card variant="glass">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-base text-white flex items-center gap-2">
                      <BookText className="w-4 h-4 text-[#C8BFAF]" /> {selectedNode.title}
                    </CardTitle>
                    <CardDescription>
                      {selectedNode.id} · {selectedNode.phaseId.replace('PHASE_', 'Phase ')}
                    </CardDescription>
                  </div>
                  <Badge status="info" variant="outline">
                    {selectedNode.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Write a structured note, derivation, or takeaway here..."
                  className="w-full min-h-[260px] bg-[#0B0C10] border border-[#2A2E36] p-4 rounded-md text-sm text-[#F4F1EA] focus:outline-none focus:border-[#C8BFAF] leading-relaxed resize-y"
                />
                <div className="flex items-center gap-3 flex-wrap">
                  <Button
                    onClick={() => {
                      updateNodeNotes(selectedNode.id, draft)
                      toastSuccess('Notes saved')
                    }}
                    className="flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" /> Save notes
                  </Button>
                  <span className="text-xs text-[#A9A39A]">
                    Autosave is manual here to keep changes explicit.
                  </span>
                </div>
              </CardContent>
            </Card>
          ) : (
            <EmptyState
              title="No topic selected"
              description="Choose a curriculum node from the list to begin writing notes."
              icon={<NotebookPen className="w-6 h-6 text-[#A9A39A]" />}
            />
          )}

          <Card variant="glass">
            <CardHeader>
              <CardTitle className="text-base text-white flex items-center gap-2">
                <Clock3 className="w-4 h-4 text-[#C8BFAF]" /> Recent Reflections
              </CardTitle>
              <CardDescription>Latest planner logs captured during study sessions.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {reflections.length > 0 ? (
                reflections.map((reflection) => (
                  <div key={reflection.date} className="p-3 rounded-lg bg-[#0B0C10] border border-[#2A2E36]">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <span className="text-xs font-mono text-[#C8BFAF]">{reflection.date}</span>
                      <Badge status="default" variant="outline">
                        Focus {reflection.focusRating}/5
                      </Badge>
                    </div>
                    <p className="text-sm text-[#A9A39A] leading-relaxed whitespace-pre-wrap">
                      {reflection.reflection || 'No reflection text saved.'}
                    </p>
                  </div>
                ))
              ) : (
                <EmptyState
                  title="No reflections yet"
                  description="Daily planner logs will show up here after you save a reflection."
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}