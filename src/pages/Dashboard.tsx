import { Link } from 'react-router-dom'
import { Cpu, Clock, Activity, BookOpen, ArrowRight, Flame, Target, TrendingUp, Calendar, CheckCircle } from 'lucide-react'
import { useCurriculumStore } from '../stores/curriculumStore'
import { useSpacedRepetitionStore } from '../stores/spacedRepetitionStore'
import { usePlannerStore } from '../stores/plannerStore'
import { useUserStore } from '../stores/userStore'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { ProgressBar } from '../components/ui/progress'

export default function Dashboard() {
  const { nodes, getCriticalPath } = useCurriculumStore()
  const { getDueCardsCount } = useSpacedRepetitionStore()
  const { getTasksForDate, toggleTaskCompleted, logs, tasks } = usePlannerStore()
  const { user } = useUserStore()

  const criticalPath = getCriticalPath().slice(0, 3)
  const focusNodes = criticalPath.map((id) => nodes[id]).filter(Boolean)

  const dueCardsCount = getDueCardsCount()

  const totalNodes = Object.values(nodes)
  const completedNodesCount = totalNodes.filter(n => n.status === 'COMPLETED' || n.status === 'MASTERED').length
  const totalHours = totalNodes.reduce((acc, curr) => acc + curr.estimatedHours, 0)
  const completedHours = totalNodes
    .filter(n => n.status === 'COMPLETED' || n.status === 'MASTERED')
    .reduce((acc, curr) => acc + curr.estimatedHours, 0)
  const progressPercent = Math.round((completedHours / totalHours) * 100) || 0

  const todayStr = new Date().toISOString().split('T')[0]
  const todayTasks = getTasksForDate(todayStr)
  const todayMinutes = todayTasks.reduce((acc, curr) => acc + curr.actualMinutes, 0)
  const todayHours = (todayMinutes / 60).toFixed(1)

  const studyStreak = (() => {
    const activityDates = new Set<string>(Object.keys(logs))
    Object.values(tasks).forEach((task) => {
      if (task.actualMinutes > 0 || task.completed) {
        activityDates.add(task.date)
      }
    })

    if (activityDates.size === 0) return 0

    let streak = 0
    const cursor = new Date()
    while (true) {
      const dateStr = cursor.toISOString().split('T')[0]
      if (!activityDates.has(dateStr)) break
      streak += 1
      cursor.setDate(cursor.getDate() - 1)
    }

    return streak
  })()

  const weeklyHours = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - i)
    return d.toISOString().split('T')[0]
  }).reverse()

  const weeklyData = weeklyHours.map(date => {
    const dayTasks = getTasksForDate(date)
    const minutes = dayTasks.reduce((acc, curr) => acc + curr.actualMinutes, 0)
    return { date: date.slice(5), hours: parseFloat((minutes / 60).toFixed(1)) }
  })

  const weeklyTotalHours = weeklyData.reduce((acc, d) => acc + d.hours, 0)

  const phaseProgress = Object.values(nodes).reduce((acc, n) => {
    if (!acc[n.phaseId]) acc[n.phaseId] = { completed: 0, total: 0 }
    acc[n.phaseId].total += 1
    if (n.status === 'COMPLETED' || n.status === 'MASTERED') acc[n.phaseId].completed += 1
    return acc
  }, {} as Record<string, { completed: number; total: number }>)

  const phases = Object.entries(phaseProgress).map(([id, val]) => ({
    id,
    title: id.replace('PHASE_', 'Phase '),
    ...val,
  })).sort((a, b) => a.id.localeCompare(b.id))

  const currentPhase = phases.find(p => p.completed < p.total) || phases[phases.length - 1]
  const currentNode = focusNodes[0] || totalNodes.find(n => n.status === 'UNLOCKED')

  const getHeatmapColor = (level: number) => {
    switch (level) {
      case 0: return 'bg-[#18181B]'
      case 1: return 'bg-[#27272A]'
      case 2: return 'bg-[#3F3F46]'
      case 3: return 'bg-[#52525B]'
      case 4: return 'bg-[#38BDF8]/30'
      default: return 'bg-[#18181B]'
    }
  }

  const getHeatmapIntensity = (dateStr: string) => {
    const dayTasks = getTasksForDate(dateStr)
    const minutes = dayTasks.reduce((acc, curr) => acc + curr.actualMinutes, 0)
    const hours = minutes / 60
    if (hours === 0) return 0
    if (hours < 0.5) return 1
    if (hours < 1) return 2
    if (hours < 2) return 3
    return 4
  }

  const weeks = Array.from({ length: 52 }, (_, i) => i)
  const days = Array.from({ length: 7 }, (_, i) => i)
  const today = new Date()
  const getHeatmapDate = (weekIdx: number, dayIdx: number) => {
    const d = new Date(today)
    d.setDate(d.getDate() - (52 - weekIdx) * 7 + (6 - dayIdx))
    return d.toISOString().split('T')[0]
  }

  const recentActivity = todayTasks
    .sort((a, b) => b.actualMinutes - a.actualMinutes)
    .slice(0, 5)

  return (
    <div className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-6 text-[#FAFAFA]">
      <header className="flex justify-between items-end pb-4 border-b border-[#27272A]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Cpu className="w-7 h-7 text-[#38BDF8]" />
            Learning Workspace
          </h1>
          <p className="text-sm text-[#A1A1AA] mt-1">
            {user ? `Welcome back, ${user.username}` : 'Mastering quantitative finance research'}
          </p>
        </div>
        <Button asChild>
          <Link to="/planner">Start Timer</Link>
        </Button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Target className="w-3.5 h-3.5" />}
          label="Completion"
          value={`${progressPercent}%`}
          progress={progressPercent}
          footer={`${completedNodesCount} of ${totalNodes.length} nodes`}
        />
        <StatCard
          icon={<Clock className="w-3.5 h-3.5" />}
          label="Hours Today"
          value={`${todayHours}h`}
          progress={Math.min(100, (todayMinutes / 120) * 100)}
          footer="target: 2.0h / day"
        />
        <StatCard
          icon={<Flame className="w-3.5 h-3.5" />}
          label="Study Streak"
          value={`${studyStreak}d`}
          footer="consecutive days"
        />
        <StatCard
          icon={<Activity className="w-3.5 h-3.5" />}
          label="Weekly Hours"
          value={`${weeklyTotalHours.toFixed(1)}h`}
          footer={`${weeklyData.filter(d => d.hours > 0).length} active days`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card variant="glass" className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#38BDF8]" /> Today's Goal
            </CardTitle>
            <CardDescription>
              {currentNode ? `Continue with ${currentNode.id}: ${currentNode.title}` : 'No active nodes. Start a new topic!'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {currentNode ? (
              <div className="flex items-center justify-between p-4 bg-[#18181B] border border-[#27272A] rounded-lg">
                <div className="flex items-center gap-3">
                  <Badge status={currentNode.status === 'MASTERED' ? 'success' : currentNode.status === 'COMPLETED' ? 'success' : currentNode.status === 'IN_PROGRESS' ? 'info' : 'default'} variant="solid" className="text-[10px]">
                    {currentNode.status}
                  </Badge>
                  <div>
                    <div className="text-sm font-semibold text-white">{currentNode.title}</div>
                    <div className="text-xs text-[#A1A1AA]">{currentNode.id} · {currentNode.estimatedHours}h est.</div>
                  </div>
                </div>
                <Link to={`/topic/${currentNode.id}`} className="px-3 py-1.5 bg-[#38BDF8] text-[#0D0E12] text-xs font-semibold rounded hover:bg-[#38BDF8]/90 transition-colors">
                  Continue
                </Link>
              </div>
            ) : (
              <div className="text-sm text-[#A1A1AA] py-4 text-center">All nodes completed or locked. Explore the roadmap!</div>
            )}
          </CardContent>
        </Card>

        <Card variant="glass">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#38BDF8]" /> Current Phase
            </CardTitle>
          </CardHeader>
          <CardContent>
            {currentPhase ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-white">{currentPhase.title}</span>
                  <span className="text-xs font-mono text-[#A1A1AA]">{currentPhase.completed}/{currentPhase.total}</span>
                </div>
                <ProgressBar value={currentPhase.total > 0 ? Math.round((currentPhase.completed / currentPhase.total) * 100) : 0} max={100} size="sm" showLabel={true} />
                <Link to="/roadmap" className="text-xs text-[#38BDF8] hover:underline flex items-center gap-1">
                  View Roadmap <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            ) : (
              <div className="text-sm text-[#A1A1AA] py-4 text-center">All phases complete!</div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card variant="glass" className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#38BDF8]" /> Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity.length > 0 ? (
              <ul className="space-y-3">
                {recentActivity.map((task) => (
                  <li key={task.id} className="flex items-center justify-between p-3 bg-[#18181B] border border-[#27272A] rounded-lg">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleTaskCompleted(task.id)}
                        className={`w-5 h-5 border rounded flex items-center justify-center transition-colors ${
                          task.completed ? 'bg-green-600 border-green-600 text-white' : 'border-[#27272A]'
                        }`}
                      >
                        {task.completed && <CheckCircle className="w-3.5 h-3.5 fill-white" />}
                      </button>
                      <div>
                        <span className={`text-sm ${task.completed ? 'line-through text-[#A1A1AA]' : 'text-white'}`}>{task.title}</span>
                        <span className="text-xs text-[#A1A1AA] ml-2 font-mono">{task.actualMinutes}m</span>
                      </div>
                    </div>
                    <Link to="/planner" className="text-xs text-[#38BDF8] hover:underline">View</Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-sm text-[#A1A1AA] py-4 text-center">No activity today. Add a task to get started!</div>
            )}
          </CardContent>
        </Card>

        <Card variant="glass">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
              <Flame className="w-5 h-5 text-[#38BDF8]" /> Study Streak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4">
              <span className="text-4xl font-bold font-mono text-[#38BDF8]">{studyStreak}</span>
              <span className="text-xs text-[#A1A1AA] block mt-1">days in a row</span>
            </div>
            {dueCardsCount > 0 && (
              <Button asChild variant="secondary" className="w-full !text-xs">
                <Link to="/planner">Review {dueCardsCount} Cards</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      <Card variant="glass">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-white">Phase Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {phases.map((phase) => (
              <div key={phase.id} className="p-4 bg-[#18181B] border border-[#27272A] rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-semibold text-white">{phase.title}</span>
                  <span className="text-xs font-mono text-[#A1A1AA]">{phase.completed}/{phase.total}</span>
                </div>
                <ProgressBar value={phase.total > 0 ? Math.round((phase.completed / phase.total) * 100) : 0} max={100} size="sm" showLabel={false} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card variant="glass">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-white">Study Intensity Heatmap</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-1 overflow-x-auto pb-2">
            {weeks.map((week) => (
              <div key={week} className="flex flex-col gap-1">
                {days.map((day) => {
                  const dateStr = getHeatmapDate(week, day)
                  const intensity = getHeatmapIntensity(dateStr)
                  return (
                    <div
                      key={day}
                      className={`w-3 h-3 rounded-sm ${getHeatmapColor(intensity)}`}
                      title={`${dateStr}: Level ${intensity} study activity`}
                    />
                  )
                })}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 justify-end text-xs text-[#A1A1AA] mt-3">
            <span>Less</span>
            <div className="w-2.5 h-2.5 rounded-sm bg-[#18181B]" />
            <div className="w-2.5 h-2.5 rounded-sm bg-[#27272A]" />
            <div className="w-2.5 h-2.5 rounded-sm bg-[#52525B]" />
            <div className="w-2.5 h-2.5 rounded-sm bg-[#71717A]" />
            <div className="w-2.5 h-2.5 rounded-sm bg-[#38BDF8]/30" />
            <span>More</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: string
  progress?: number
  footer?: React.ReactNode
}

function StatCard({ icon, label, value, progress, footer }: StatCardProps) {
  return (
    <Card variant="glass" className="flex flex-col justify-between p-5">
      <span className="text-xs text-[#A1A1AA] font-medium uppercase tracking-wider flex items-center gap-1.5">
        {icon} {label}
      </span>
      <div className="mt-3">
        <span className="text-2xl font-bold font-mono">{value}</span>
        {progress !== undefined && (
          <ProgressBar value={progress} max={100} size="sm" showLabel={false} className="mt-2" />
        )}
      </div>
      <span className="text-xs text-[#A1A1AA] mt-2 block">{footer}</span>
    </Card>
  )
}