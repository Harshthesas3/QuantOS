import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Search, Eye, ChevronDown, ChevronRight, Clock, Filter } from 'lucide-react'
import { useCurriculumStore, NodeStatus } from '../stores/curriculumStore'
import { Card } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Input } from '../components/ui/input'
import { Select } from '../components/ui/select'
import { ProgressBar } from '../components/ui/progress'

const PHASES = [
  { id: 'PHASE_0', title: 'JEE Mathematics Review', domain: 'Calculus, Matrices, Vectors, Probability, ODEs' },
  { id: 'PHASE_1', title: 'Advanced Mathematics', domain: 'Real Analysis, Linear Algebra, Measure Theory, Convex Optimization' },
  { id: 'PHASE_2', title: 'Computational Python', domain: 'NumPy Vectorization, Pandas, Concurrency, Cython/PyBIND11' },
  { id: 'PHASE_3', title: 'Machine Learning', domain: 'Statistical Learning, Regression, Trees, PyTorch, Model Validation' },
  { id: 'PHASE_4', title: 'Time Series Analysis', domain: 'ARMA/ARIMA, GARCH, Cointegration, Kalman Filters' },
  { id: 'PHASE_5', title: 'Financial Economics', domain: 'MPT, CAPM, Fama-French, Market Microstructure, Fixed Income' },
  { id: 'PHASE_6', title: 'Quantitative Finance', domain: 'Stochastic Calculus, BSM PDE, Volatility Surface, Monte Carlo' },
  { id: 'PHASE_7', title: 'Alpha Research', domain: 'Signal Extraction, Orthogonalization, Backtesting, Risk Models' },
  { id: 'PHASE_8', title: 'Research Engineering', domain: 'Modern C++20, Low Latency, Lock-Free SPSC, L3 Order Book' },
  { id: 'PHASE_9', title: 'Research Papers', domain: 'Canonical Paper Replications (Fama, Black-Scholes, Avellaneda, etc.)' },
  { id: 'PHASE_10', title: 'Portfolio Projects', domain: 'Production Alpha Framework, C++ Engine, Volatility Arbitrage' },
]

const STATUS_FILTERS: { label: string; value: NodeStatus | 'ALL' }[] = [
  { label: 'All', value: 'ALL' },
  { label: 'Locked', value: 'LOCKED' },
  { label: 'Unlocked', value: 'UNLOCKED' },
  { label: 'In Progress', value: 'IN_PROGRESS' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Mastered', value: 'MASTERED' },
]

const DIFFICULTY_MAP: Record<string, { label: string; color: string }> = {
  'P0': { label: 'Beginner', color: 'text-green-400' },
  'P1': { label: 'Intermediate', color: 'text-yellow-400' },
  'P2': { label: 'Intermediate', color: 'text-yellow-400' },
  'P3': { label: 'Intermediate', color: 'text-yellow-400' },
  'P4': { label: 'Advanced', color: 'text-orange-400' },
  'P5': { label: 'Advanced', color: 'text-orange-400' },
  'P6': { label: 'Expert', color: 'text-red-400' },
  'P7': { label: 'Expert', color: 'text-red-400' },
  'P8': { label: 'Expert', color: 'text-red-400' },
  'P9': { label: 'Advanced', color: 'text-orange-400' },
  'P10': { label: 'Expert', color: 'text-red-400' },
}

export default function Roadmap() {
  const { nodes, updateNodeStatus, getCriticalPath } = useCurriculumStore()
  const [selectedPhase] = useState<string>('ALL')
  const [statusFilter, setStatusFilter] = useState<NodeStatus | 'ALL'>('ALL')
  const [difficultyFilter, setDifficultyFilter] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedPhases, setExpandedPhases] = useState<Record<string, boolean>>({})

  const criticalPath = getCriticalPath()

  const togglePhase = (phaseId: string) => {
    setExpandedPhases((prev) => ({ ...prev, [phaseId]: !prev[phaseId] }))
  }

  const filteredNodes = useMemo(() => {
    return Object.values(nodes).filter((node) => {
      const matchesPhase = selectedPhase === 'ALL' || node.phaseId === selectedPhase
      const matchesSearch = node.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        node.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        node.description.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus = statusFilter === 'ALL' || node.status === statusFilter
      const matchesDifficulty = difficultyFilter === 'ALL' || DIFFICULTY_MAP[node.phaseId]?.label === difficultyFilter
      return matchesPhase && matchesSearch && matchesStatus && matchesDifficulty
    })
  }, [nodes, selectedPhase, searchQuery, statusFilter, difficultyFilter])

  const phaseNodeCounts = useMemo(() => {
    const counts: Record<string, { total: number; completed: number }> = {}
    Object.values(nodes).forEach(n => {
      if (!counts[n.phaseId]) counts[n.phaseId] = { total: 0, completed: 0 }
      counts[n.phaseId].total += 1
      if (n.status === 'COMPLETED' || n.status === 'MASTERED') counts[n.phaseId].completed += 1
    })
    return counts
  }, [nodes])

  const getStatusBadge = (status: NodeStatus) => {
    switch (status) {
      case 'MASTERED': return <Badge status="success" variant="solid" className="text-[10px]">{status}</Badge>
      case 'COMPLETED': return <Badge status="success" variant="outline" className="text-[10px]">{status}</Badge>
      case 'IN_PROGRESS': return <Badge status="info" variant="solid" className="text-[10px]">{status}</Badge>
      case 'UNLOCKED': return <Badge status="default" variant="outline" className="text-[10px]">{status}</Badge>
      default: return <Badge status="error" variant="outline" className="text-[10px]">{status}</Badge>
    }
  }

  const handleStatusOverride = (nodeId: string, currentStatus: NodeStatus) => {
    const nextStatusMap: Record<NodeStatus, NodeStatus> = {
      'LOCKED': 'UNLOCKED',
      'UNLOCKED': 'IN_PROGRESS',
      'IN_PROGRESS': 'COMPLETED',
      'COMPLETED': 'MASTERED',
      'MASTERED': 'LOCKED'
    }
    updateNodeStatus(nodeId, nextStatusMap[currentStatus])
  }

  const isPhaseExpanded = (phaseId: string) => expandedPhases[phaseId] !== false

  return (
    <div className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-6 text-[#FAFAFA]">
      <header className="pb-4 border-b border-[#27272A]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <Eye className="w-7 h-7 text-[#38BDF8]" />
              Curriculum Roadmap
            </h1>
            <p className="text-sm text-[#A1A1AA] mt-1">
              {Object.keys(nodes).length} nodes across {PHASES.length} phases
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#A1A1AA]">
            <span className="w-2 h-2 bg-green-400 rounded-full" />
            <span>{criticalPath.length} nodes on critical path</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#A1A1AA] absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              placeholder="Search topics, nodes, descriptions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as NodeStatus | 'ALL')}>
              {STATUS_FILTERS.map(f => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </Select>
            <Select value={difficultyFilter} onChange={(e) => setDifficultyFilter(e.target.value)}>
              <option value="ALL">All Levels</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
              <option value="Expert">Expert</option>
            </Select>
          </div>
        </div>
      </header>

      <div className="space-y-4">
        {PHASES.map((phase) => {
          const phaseNodes = filteredNodes.filter(n => n.phaseId === phase.id)
          const counts = phaseNodeCounts[phase.id] || { total: 0, completed: 0 }
          const isExpanded = isPhaseExpanded(phase.id)
          const difficulty = DIFFICULTY_MAP[phase.id]

          if (phaseNodes.length === 0 && searchQuery) return null

          return (
            <div key={phase.id} className="border border-[#27272A] rounded-lg overflow-hidden">
              <button
                onClick={() => togglePhase(phase.id)}
                className="w-full flex items-center justify-between p-4 bg-[#121318] hover:bg-[#18181B] transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  {isExpanded ? <ChevronDown className="w-4 h-4 text-[#A1A1AA]" /> : <ChevronRight className="w-4 h-4 text-[#A1A1AA]" />}
                  <span className="text-sm font-semibold text-white">{phase.title}</span>
                  <Badge status="info" variant="outline" className="text-[9px]">{phase.id.replace('PHASE_', 'P')}</Badge>
                  {difficulty && (
                    <span className={`text-[10px] font-semibold ${difficulty.color}`}>{difficulty.label}</span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-[#A1A1AA]">{counts.completed}/{counts.total}</span>
                  {counts.total > 0 && (
                    <ProgressBar value={Math.round((counts.completed / counts.total) * 100)} max={100} size="sm" showLabel={false} className="w-20" />
                  )}
                </div>
              </button>

              {isExpanded && (
                <div className="p-4 space-y-3 bg-[#0D0E12]">
                  <p className="text-xs text-[#A1A1AA] mb-3">{phase.domain}</p>
                  {phaseNodes.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {phaseNodes.map((node) => {
                        const isCritical = criticalPath.includes(node.id)
                        return (
                          <Card
                            key={node.id}
                            variant={isCritical ? 'glass' : 'default'}
                            className={`p-4 transition-all hover:scale-[1.01] duration-150 ${isCritical ? 'ring-1 ring-[#38BDF8]/40' : ''}`}
                          >
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-mono px-1.5 py-0.5 bg-[#27272A] text-[#38BDF8] rounded">
                                  {node.id}
                                </span>
                                <h4 className="text-sm font-semibold text-white line-clamp-1">{node.title}</h4>
                              </div>
                              {isCritical && (
                                <Badge status="info" variant="solid" className="text-[8px] uppercase tracking-wide flex-shrink-0">
                                  Critical
                                </Badge>
                              )}
                            </div>

                            <div className="flex items-center gap-2 mb-2">
                              {getStatusBadge(node.status)}
                              <span className={`text-[10px] font-semibold ${difficulty?.color}`}>{difficulty?.label}</span>
                            </div>

                            <p className="text-xs text-[#A1A1AA] line-clamp-2 mb-3 leading-relaxed">{node.description}</p>

                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-[10px] text-[#A1A1AA]">
                                <Clock className="w-3 h-3" />
                                {node.estimatedHours}h
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleStatusOverride(node.id, node.status)}
                                  className="text-[10px] bg-[#27272A] hover:bg-[#3F3F46] px-2 py-0.5 rounded border border-[#27272A] text-[#A1A1AA] hover:text-[#FAFAFA] transition-colors"
                                  title="Cycle status"
                                >
                                  {node.status}
                                </button>
                                <Link
                                  to={`/topic/${node.id}`}
                                  className="flex items-center gap-1.5 px-2.5 py-1 bg-[#27272A] hover:bg-[#38BDF8] hover:text-[#0D0E12] text-xs font-semibold text-[#FAFAFA] rounded transition-all duration-150"
                                >
                                  <Eye className="w-3 h-3" /> Study
                                </Link>
                              </div>
                            </div>
                          </Card>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-[#A1A1AA] text-sm">
                      No topics match your filters in this phase.
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {filteredNodes.length === 0 && !searchQuery && (
        <div className="text-center py-12 text-[#A1A1AA]">
          <Filter className="w-8 h-8 mx-auto mb-3 text-[#27272A]" />
          <p>No topics match your current filters.</p>
        </div>
      )}
    </div>
  )
}