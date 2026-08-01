import { useMemo, useState } from 'react'
import { FolderKanban, Search, Play, ArrowRight, CheckCircle2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useCurriculumStore } from '../stores/curriculumStore'
import { usePlannerStore } from '../stores/plannerStore'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Input } from '../components/ui/input'
import { ProgressBar } from '../components/ui/progress'
import { EmptyState } from '../components/ui/empty-state'
import { toastSuccess } from '../lib/toast'

export default function Projects() {
  const { nodes, updateNodeStatus } = useCurriculumStore()
  const { addTask, startTimer } = usePlannerStore()
  const [search, setSearch] = useState('')

  const projects = useMemo(() => {
    return Object.values(nodes)
      .filter((node) => node.phaseId === 'PHASE_10')
      .filter((node) => {
        const query = search.trim().toLowerCase()
        if (!query) return true
        return [node.id, node.title, node.description, node.status].join(' ').toLowerCase().includes(query)
      })
      .sort((a, b) => a.id.localeCompare(b.id))
  }, [nodes, search])

  return (
    <div className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-6 text-[#FAFAFA]">
      <header className="pb-4 border-b border-[#27272A]">
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <FolderKanban className="w-7 h-7 text-[#38BDF8]" />
          Projects
        </h1>
        <p className="text-sm text-[#A1A1AA] mt-1">Portfolio workstreams tied to the final phase of the curriculum.</p>
      </header>

      <Card variant="glass">
        <CardContent className="pt-4">
          <div className="relative max-w-xl">
            <Search className="w-4 h-4 text-[#A1A1AA] absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects by id, title, or status..."
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {projects.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {projects.map((project) => {
            const progress = project.estimatedHours > 0 ? Math.min(100, Math.round((project.actualHours / project.estimatedHours) * 100)) : 0
            return (
              <Card key={project.id} variant="glass">
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-base text-white">{project.title}</CardTitle>
                      <CardDescription>{project.id} · {project.estimatedHours}h estimated</CardDescription>
                    </div>
                    <Badge status={project.status === 'MASTERED' || project.status === 'COMPLETED' ? 'success' : project.status === 'IN_PROGRESS' ? 'info' : 'default'} variant="outline">
                      {project.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-[#A1A1AA] leading-relaxed">{project.description}</p>
                  <ProgressBar value={progress} max={100} size="sm" showLabel />
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button
                      size="sm"
                      onClick={() => {
                        const taskId = addTask(`Project work: ${project.id} ${project.title}`, 90, project.id, 'high')
                        startTimer(taskId)
                        updateNodeStatus(project.id, project.status === 'COMPLETED' ? 'MASTERED' : 'IN_PROGRESS')
                        toastSuccess('Project session started')
                      }}
                      className="flex items-center gap-1.5"
                    >
                      <Play className="w-3.5 h-3.5" /> Start session
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        updateNodeStatus(project.id, project.status === 'MASTERED' ? 'LOCKED' : 'COMPLETED')
                        toastSuccess('Project status updated')
                      }}
                      className="flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Toggle completion
                    </Button>
                    <Link
                      to={`/topic/${project.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#38BDF8] border border-[#38BDF8]/30 rounded-md hover:bg-[#38BDF8]/10"
                    >
                      Open topic <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <EmptyState
          title="No projects match your search"
          description="Portfolio nodes live in the final curriculum phase. Clear the search to browse them."
          icon={<FolderKanban className="w-6 h-6 text-[#A1A1AA]" />}
        />
      )}
    </div>
  )
}