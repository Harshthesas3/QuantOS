import { useMemo, useState } from 'react'
import { ExternalLink, Trash2, CheckCircle2, Search, LibraryBig } from 'lucide-react'
import { useCurriculumStore } from '../stores/curriculumStore'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Input } from '../components/ui/input'
import { Select } from '../components/ui/select'
import { EmptyState } from '../components/ui/empty-state'
import { toastSuccess } from '../lib/toast'

type ResourceRow = {
  nodeId: string
  nodeTitle: string
  phaseId: string
  resourceId: string
  title: string
  type: string
  url?: string
  status: string
}

export default function Resources() {
  const { nodes, updateResourceStatus, removeResource } = useCurriculumStore()
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')

  const resources = useMemo<ResourceRow[]>(() => {
    return Object.values(nodes).flatMap((node) =>
      node.resources.map((resource) => ({
        nodeId: node.id,
        nodeTitle: node.title,
        phaseId: node.phaseId,
        resourceId: resource.id,
        title: resource.title,
        type: resource.type,
        url: resource.url,
        status: resource.status,
      })),
    )
  }, [nodes])

  const filteredResources = resources.filter((resource) => {
    const query = search.trim().toLowerCase()
    const matchesSearch =
      query.length === 0 ||
      [resource.title, resource.type, resource.nodeTitle, resource.nodeId]
        .join(' ')
        .toLowerCase()
        .includes(query)
    const matchesType = typeFilter === 'ALL' || resource.type === typeFilter
    const matchesStatus = statusFilter === 'ALL' || resource.status === statusFilter
    return matchesSearch && matchesType && matchesStatus
  })

  const resourceTypes = Array.from(new Set(resources.map((resource) => resource.type))).sort()
  const resourceStatuses = Array.from(new Set(resources.map((resource) => resource.status))).sort()

  return (
    <div className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-6 text-[#FAFAFA]">
      <header className="pb-4 border-b border-[#27272A]">
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <LibraryBig className="w-7 h-7 text-[#38BDF8]" />
          Resources
        </h1>
        <p className="text-sm text-[#A1A1AA] mt-1">Browse every curated resource attached to the curriculum graph.</p>
      </header>

      <Card variant="glass">
        <CardContent className="pt-4 grid grid-cols-1 lg:grid-cols-[1fr_auto_auto] gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-[#A1A1AA] absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search resources, topics, or node ids..."
              className="pl-10"
            />
          </div>
          <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="ALL">All Types</option>
            {resourceTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </Select>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="ALL">All Statuses</option>
            {resourceStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </Select>
        </CardContent>
      </Card>

      {filteredResources.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredResources.map((resource) => (
            <Card key={`${resource.nodeId}-${resource.resourceId}`} variant="glass" className="h-full">
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-base text-white">{resource.title}</CardTitle>
                    <CardDescription>
                      {resource.nodeId}: {resource.nodeTitle}
                    </CardDescription>
                  </div>
                  <Badge status={resource.status === 'Completed' ? 'success' : 'default'} variant="outline">
                    {resource.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge status="info" variant="outline">
                    {resource.type}
                  </Badge>
                  <Badge status="default" variant="outline">
                    {resource.phaseId.replace('PHASE_', 'Phase ')}
                  </Badge>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {resource.url ? (
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#38BDF8] border border-[#38BDF8]/30 rounded-md hover:bg-[#38BDF8]/10"
                    >
                      Open <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="text-xs text-[#A1A1AA]">No URL attached</span>
                  )}

                  <Button
                    size="sm"
                    variant={resource.status === 'Completed' ? 'info' : 'secondary'}
                    onClick={() => {
                      updateResourceStatus(resource.nodeId, resource.resourceId, resource.status === 'Completed' ? 'Not Started' : 'Completed')
                      toastSuccess('Resource updated')
                    }}
                    className="flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {resource.status === 'Completed' ? 'Mark pending' : 'Mark done'}
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      removeResource(resource.nodeId, resource.resourceId)
                      toastSuccess('Resource removed')
                    }}
                    className="flex items-center gap-1.5 text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Remove
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No resources match your filters"
          description="Clear the filters or add new resource links from a topic page."
          icon={<LibraryBig className="w-6 h-6 text-[#A1A1AA]" />}
        />
      )}
    </div>
  )
}