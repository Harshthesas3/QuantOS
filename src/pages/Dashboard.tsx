import { Link } from 'react-router-dom'
import { Cpu, Clock, Activity, BookOpen, ArrowRight, Flame, Target, TrendingUp, Calendar, Timer, Quote, RefreshCw } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useCurriculumStore } from '../stores/curriculumStore'
import { useSpacedRepetitionStore } from '../stores/spacedRepetitionStore'
import { useStudySessionStore } from '../stores/studySessionStore'
import { useUserStore } from '../stores/userStore'
import {
  getTodayStudyMinutes,
  getWeekStudyMinutes,
  getStudyStreak,
  getLatestSession,
  groupSessionMinutesByDate,
  getSessionDateKey,
  formatSessionMinutes,
} from '../lib/studyMetrics'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { ProgressBar } from '../components/ui/progress'
import quotes from '../data/marcusAureliusQuotes.json'

type QuoteEntry = { book: string; chapter: string; text: string }

export default function Dashboard() {
  const { nodes, getCriticalPath } = useCurriculumStore()
  const { getDueCardsCount } = useSpacedRepetitionStore()
  const { sessions } = useStudySessionStore()
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

  const sessionList = useMemo(() => Object.values(sessions), [sessions])
  const todayMinutes = getTodayStudyMinutes(sessionList)
  const todayHours = (todayMinutes / 60).toFixed(1)
  const weekMinutes = getWeekStudyMinutes(sessionList)
  const weekHours = (weekMinutes / 60).toFixed(1)
  const studyStreak = getStudyStreak(sessionList)
  const lastSession = getLatestSession(sessionList)

  const activeDays = new Set(sessionList.map(getSessionDateKey)).size

  const weeklyData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    const dateStr = d.toISOString().split('T')[0]
    const minutes = sessionList.reduce((acc, s) => {
      if (getSessionDateKey(s) === dateStr) {
        return acc + (s.elapsedSeconds / 60)
      }
      return acc
    }, 0)
    return { date: dateStr.slice(5), hours: parseFloat((minutes / 60).toFixed(1)) }
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

  // Heatmap from study-session minutes.
  const sessionMinutesByDate = useMemo(() => groupSessionMinutesByDate(sessionList), [sessionList])

  const getHeatmapColor = (level: number) => {
    switch (level) {
      case 0: return 'bg-[#1F2229]'
      case 1: return 'bg-[#2A2E36]'
      case 2: return 'bg-[#3A3F46]'
      case 3: return 'bg-[#52525B]'
      case 4: return 'bg-[#C8BFAF]/30'
      default: return 'bg-[#1F2229]'
    }
  }

  const getHeatmapIntensity = (dateStr: string) => {
    const minutes = sessionMinutesByDate[dateStr] ?? 0
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

  // Recent activity from latest sessions (finished or in-progress).
  const recentSessions = [...sessionList]
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, 5)

  const [quote, setQuote] = useState(() => {
    const source = quotes as QuoteEntry[]
    const seed = new Date().toISOString().slice(0, 10)
    let hash = 0
    for (const char of seed) {
      hash = (hash * 31 + char.charCodeAt(0)) >>> 0
    }
    return source[hash % source.length]
  })
  const refreshQuote = () => {
    const source = quotes as QuoteEntry[]
    setQuote(source[Math.floor(Math.random() * source.length)])
  }

  const formatLastSession = (session: typeof lastSession) => {
    if (!session) return 'No sessions yet'
    const mins = formatSessionMinutes(session)
    const date = new Date(session.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    return `${mins} · ${date}`
  }

  return (
    <div className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-6 text-[#F4F1EA]">
      <header className="flex justify-between items-end pb-4 border-b border-[#2A2E36]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Cpu className="w-7 h-7 text-[#C8BFAF]" />
            Learning Workspace
          </h1>
          <p className="text-sm text-[#A9A39A] mt-1">
            {user ? `Welcome back, ${user.username}` : 'Mastering quantitative finance research'}
          </p>
          <p className="text-sm text-[#A9A39A] mt-2 italic leading-6 max-w-2xl">
            <Quote className="w-3.5 h-3.5 inline text-[#C8BFAF] mr-1" />
            “{quote.text}”
            <span className="text-xs text-[#7C7870] not-italic ml-2">— Meditations {quote.book}.{quote.chapter}</span>
            <button
              type="button"
              onClick={refreshQuote}
              title="Get a new quote"
              className="group align-middle ml-2 inline-flex rounded-full border border-[#2A2E36] bg-white/5 p-1.5 text-[#A9A39A] transition-colors hover:border-[#D9B98A]/40 hover:text-[#D9B98A]"
            >
              <RefreshCw className="w-3 h-3 transition-transform duration-300 group-active:rotate-180" />
            </button>
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
              <BookOpen className="w-5 h-5 text-[#C8BFAF]" /> Today's Goal
            </CardTitle>
            <CardDescription>
              {currentNode ? `Continue with ${currentNode.id}: ${currentNode.title}` : 'No active nodes. Start a new topic!'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {currentNode ? (
              <div className="flex items-center justify-between p-4 bg-[#1F2229] border border-[#2A2E36] rounded-lg">
                <div className="flex items-center gap-3">
                  <Badge status={currentNode.status === 'MASTERED' ? 'success' : currentNode.status === 'COMPLETED' ? 'success' : currentNode.status === 'IN_PROGRESS' ? 'info' : 'default'} variant="solid" className="text-[10px]">
                    {currentNode.status}
                  </Badge>
                  <div>
                    <div className="text-sm font-semibold text-white">{currentNode.title}</div>
                    <div className="text-xs text-[#A9A39A]">{currentNode.id} · {currentNode.estimatedHours}h est.</div>
                  </div>
                </div>
                <Link to={`/topic/${currentNode.id}`} className="px-3 py-1.5 bg-[#C8BFAF] text-[#0B0C10] text-xs font-semibold rounded hover:bg-[#C8BFAF]/90 transition-colors">
                  Continue
                </Link>
              </div>
            ) : (
              <div className="text-sm text-[#A9A39A] py-4 text-center">All nodes completed or locked. Explore the roadmap!</div>
            )}
          </CardContent>
        </Card>

        <Card variant="glass">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#C8BFAF]" /> Current Phase
            </CardTitle>
          </CardHeader>
          <CardContent>
            {currentPhase ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-white">{currentPhase.title}</span>
                  <span className="text-xs font-mono text-[#A9A39A]">{currentPhase.completed}/{currentPhase.total}</span>
                </div>
                <ProgressBar value={currentPhase.total > 0 ? Math.round((currentPhase.completed / currentPhase.total) * 100) : 0} max={100} size="sm" showLabel={true} />
                <Link to="/roadmap" className="text-xs text-[#C8BFAF] hover:underline flex items-center gap-1">
                  View Roadmap <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            ) : (
              <div className="text-sm text-[#A9A39A] py-4 text-center">All phases complete!</div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card variant="glass" className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#C8BFAF]" /> Recent Activity
            </CardTitle>
            <CardDescription>Your latest study sessions</CardDescription>
          </CardHeader>
          <CardContent>
            {recentSessions.length > 0 ? (
              <ul className="space-y-3">
                {recentSessions.map((session) => {
                  const node = nodes[session.topicId]
                  const title = node ? `${node.id}: ${node.title}` : session.topicId
                  const mins = formatSessionMinutes(session)
                  const when = new Date(session.updatedAt).toLocaleString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                  return (
                    <li key={session.id} className="flex items-center justify-between p-3 bg-[#1F2229] border border-[#2A2E36] rounded-lg">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${session.status === 'finished' ? 'bg-green-400' : session.status === 'active' ? 'bg-[#C8BFAF] animate-pulse' : 'bg-[#7C7870]'}`} />
                        <div className="min-w-0">
                          <div className="text-sm text-white truncate">{title}</div>
                          <div className="text-xs text-[#A9A39A]">{session.phaseId.replace('PHASE_', 'Phase ')} · {when}</div>
                        </div>
                      </div>
                      <span className="text-xs font-mono text-[#A9A39A] ml-3 flex-shrink-0">{mins}</span>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <div className="text-sm text-[#A9A39A] py-4 text-center">No study sessions yet. Open a topic and start a session!</div>
            )}
          </CardContent>
        </Card>

        <Card variant="glass">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
              <Flame className="w-5 h-5 text-[#C8BFAF]" /> Study Streak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4">
              <span className="text-4xl font-bold font-mono text-[#C8BFAF]">{studyStreak}</span>
              <span className="text-xs text-[#A9A39A] block mt-1">days in a row</span>
            </div>
            {dueCardsCount > 0 && (
              <Button asChild variant="secondary" className="w-full !text-xs">
                <Link to="/planner">Review {dueCardsCount} Cards</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card variant="glass">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
              <Timer className="w-5 h-5 text-[#C8BFAF]" /> Last Session
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lastSession ? (
              <div className="text-center py-3">
                <span className="text-3xl font-bold font-mono text-white">{formatLastSession(lastSession)}</span>
                <span className="text-xs text-[#A9A39A] block mt-1">
                  {lastSession.status === 'finished' ? 'Completed' : lastSession.status} · {lastSession.completed ? 'goal met' : 'partial'}
                </span>
              </div>
            ) : (
              <div className="text-sm text-[#A9A39A] py-4 text-center">No sessions yet</div>
            )}
          </CardContent>
        </Card>

        <Card variant="glass" className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-[#C8BFAF]" /> Weekly Hours
            </CardTitle>
            <CardDescription>{weekHours}h total · {activeDays} active day{activeDays !== 1 ? 's' : ''}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2 h-28">
              {weeklyData.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] font-mono text-[#A9A39A]">{d.hours > 0 ? d.hours.toFixed(1) : ''}</span>
                  <div
                    className={`w-full rounded-t ${d.hours > 0 ? 'bg-[#C8BFAF]/70' : 'bg-[#2A2E36]'}`}
                    style={{ height: `${Math.max(4, (d.hours / Math.max(1, Math.max(...weeklyData.map(x => x.hours)))) * 100)}%` }}
                  />
                  <span className="text-[10px] text-[#7C7870]">{d.date.slice(3)}</span>
                </div>
              ))}
            </div>
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
              <div key={phase.id} className="p-4 bg-[#1F2229] border border-[#2A2E36] rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-semibold text-white">{phase.title}</span>
                  <span className="text-xs font-mono text-[#A9A39A]">{phase.completed}/{phase.total}</span>
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
          <CardDescription>Based on recorded study-session time</CardDescription>
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
                      title={`${dateStr}: ${sessionMinutesByDate[dateStr] ? Math.round(sessionMinutesByDate[dateStr]) : 0} min of study`}
                    />
                  )
                })}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 justify-end text-xs text-[#A9A39A] mt-3">
            <span>Less</span>
            <div className="w-2.5 h-2.5 rounded-sm bg-[#1F2229]" />
            <div className="w-2.5 h-2.5 rounded-sm bg-[#2A2E36]" />
            <div className="w-2.5 h-2.5 rounded-sm bg-[#52525B]" />
            <div className="w-2.5 h-2.5 rounded-sm bg-[#7C7870]" />
            <div className="w-2.5 h-2.5 rounded-sm bg-[#C8BFAF]/30" />
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
      <span className="text-xs text-[#A9A39A] font-medium uppercase tracking-wider flex items-center gap-1.5">
        {icon} {label}
      </span>
      <div className="mt-3">
        <span className="text-2xl font-bold font-mono">{value}</span>
        {progress !== undefined && (
          <ProgressBar value={progress} max={100} size="sm" showLabel={false} className="mt-2" />
        )}
      </div>
      <span className="text-xs text-[#A9A39A] mt-2 block">{footer}</span>
    </Card>
  )
}

