import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  CalendarClock,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Flame,
  History,
  Layers,
  LayoutGrid,
  Minus,
  Quote,
  RefreshCw,
  StickyNote,
  Target,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { useCurriculumStore } from '../stores/curriculumStore'
import { useSpacedRepetitionStore } from '../stores/spacedRepetitionStore'
import { useStudySessionStore } from '../stores/studySessionStore'
import { useUserStore } from '../stores/userStore'
import {
  formatSessionMinutes,
  getDateKey,
  getSessionDateKey,
  getSessionMinutes,
  getStudyStreak,
  getTodayStudyMinutes,
  getWeekStudyMinutes,
  groupSessionMinutesByDate,
  groupSessionMinutesByTopic,
  isStudyActivity,
} from '../lib/studyMetrics'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { ProgressBar } from '../components/ui/progress'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../components/ui/tooltip'
import quotes from '../data/marcusAureliusQuotes.json'

type QuoteEntry = { book: string; chapter: string; text: string }

const DAY_MS = 86_400_000
const HEATMAP_WEEKS = 26
const HEAT_CELL = 9
const HEAT_PITCH = HEAT_CELL + 3

const cardBase =
  'rounded-[10px] border border-[#2A2E36] bg-[#111318] transition-colors duration-150 hover:border-[#3A3F46]'

export default function Dashboard() {
  const { nodes, getCriticalPath } = useCurriculumStore()
  const { getDueCardsCount, cards } = useSpacedRepetitionStore()
  const { sessions } = useStudySessionStore()
  const { user } = useUserStore()

  const sessionList = useMemo(() => Object.values(sessions), [sessions])

  const criticalPath = getCriticalPath().slice(0, 3)
  const focusNodes = criticalPath.map((id) => nodes[id]).filter(Boolean)

  const totalNodes = Object.values(nodes)
  const completedNodesCount = totalNodes.filter((n) => n.status === 'COMPLETED' || n.status === 'MASTERED').length
  const totalHours = totalNodes.reduce((acc, curr) => acc + curr.estimatedHours, 0)
  const completedHours = totalNodes
    .filter((n) => n.status === 'COMPLETED' || n.status === 'MASTERED')
    .reduce((acc, curr) => acc + curr.estimatedHours, 0)
  const progressPercent = Math.round((completedHours / totalHours) * 100) || 0
  const remainingHours = totalHours - completedHours

  const phaseProgress = totalNodes.reduce((acc, n) => {
    if (!acc[n.phaseId]) acc[n.phaseId] = { completed: 0, total: 0 }
    acc[n.phaseId].total += 1
    if (n.status === 'COMPLETED' || n.status === 'MASTERED') acc[n.phaseId].completed += 1
    return acc
  }, {} as Record<string, { completed: number; total: number }>)

  const phases = Object.entries(phaseProgress)
    .map(([id, val]) => ({ id, title: id.replace('PHASE_', 'Phase '), ...val }))
    .sort((a, b) => a.id.localeCompare(b.id))

  const currentPhase = phases.find((p) => p.completed < p.total) ?? phases[phases.length - 1]
  const currentNode = focusNodes[0] ?? totalNodes.find((n) => n.status === 'UNLOCKED')

  const todayMinutes = getTodayStudyMinutes(sessionList)
  const weekMinutes = getWeekStudyMinutes(sessionList)
  const studyStreak = getStudyStreak(sessionList)
  const sessionMinutesByDate = useMemo(() => groupSessionMinutesByDate(sessionList), [sessionList])
  const sessionMinutesByTopic = useMemo(() => groupSessionMinutesByTopic(sessionList), [sessionList])

  const yesterdayKey = getDateKey(new Date(Date.now() - DAY_MS))
  const yesterdayMinutes = sessionList
    .filter((s) => isStudyActivity(s) && getSessionDateKey(s) === yesterdayKey)
    .reduce((sum, s) => sum + getSessionMinutes(s), 0)

  const lastWeekMinutes = useMemo(() => {
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    const weekStart = now.getTime() - ((now.getDay() + 6) % 7) * DAY_MS
    const priorStart = weekStart - 7 * DAY_MS
    return sessionList
      .filter((s) => isStudyActivity(s) && (s.endTime ?? s.startTime ?? s.createdAt) >= priorStart)
      .filter((s) => (s.endTime ?? s.startTime ?? s.createdAt) < weekStart)
      .reduce((sum, s) => sum + getSessionMinutes(s), 0)
  }, [sessionList])

  const bestStreak = useMemo(() => {
    const dates = [
      ...new Set(sessionList.filter((s) => getSessionMinutes(s) > 0).map(getSessionDateKey)),
    ].sort()
    let best = 0
    let run = 0
    let prev: number | null = null
    for (const d of dates) {
      const t = new Date(`${d}T00:00:00`).getTime()
      run = prev !== null && t - prev === DAY_MS ? run + 1 : 1
      best = Math.max(best, run)
      prev = t
    }
    return best
  }, [sessionList])

  const weeklyData = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const now = new Date()
        now.setHours(0, 0, 0, 0)
        const monday = now.getTime() - ((now.getDay() + 6) % 7) * DAY_MS
        const key = getDateKey(new Date(monday + i * DAY_MS))
        const minutes = sessionList
          .filter((s) => isStudyActivity(s) && getSessionDateKey(s) === key)
          .reduce((sum, s) => sum + getSessionMinutes(s), 0)
        return { key, minutes }
      }),
    [sessionList],
  )
  const weeklyTotalMinutes = weeklyData.reduce((a, d) => a + d.minutes, 0)
  const maxDayMinutes = Math.max(1, ...weeklyData.map((d) => d.minutes))

  const velocityData = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => {
        const key = getDateKey(new Date(Date.now() - (13 - i) * DAY_MS))
        return { key, minutes: sessionMinutesByDate[key] ?? 0 }
      }),
    [sessionMinutesByDate],
  )
  const velocityTotalMinutes = velocityData.reduce((a, d) => a + d.minutes, 0)

  const sessionCountsByDate = useMemo(() => {
    const map: Record<string, number> = {}
    for (const s of sessionList) {
      const key = getSessionDateKey(s)
      map[key] = (map[key] ?? 0) + 1
    }
    return map
  }, [sessionList])

  const recentSessions = useMemo(
    () => [...sessionList].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 5),
    [sessionList],
  )

  const notedNodes = useMemo(() => totalNodes.filter((n) => n.notes.trim().length > 0).slice(0, 4), [totalNodes])

  const dueCardsCount = getDueCardsCount()
  const upcomingCards = useMemo(
    () => Object.values(cards).sort((a, b) => a.nextReviewDate.localeCompare(b.nextReviewDate)).slice(0, 3),
    [cards],
  )

  const projectNodes = useMemo(() => totalNodes.filter((n) => n.phaseId === 'PHASE_10'), [totalNodes])
  const completedProjects = projectNodes.filter(
    (n) => n.status === 'COMPLETED' || n.status === 'MASTERED',
  ).length

  const studiedHoursForTopic = currentNode ? (sessionMinutesByTopic[currentNode.id] ?? 0) / 60 : 0
  const missionProgressPct = currentNode
    ? Math.min(100, Math.round((studiedHoursForTopic / Math.max(0.1, currentNode.estimatedHours)) * 100))
    : 0
  const masteredCriteriaCount = currentNode
    ? currentNode.masteryCriteria.filter((c) => c.startsWith('[x] ')).length
    : 0

  const prereqs = useMemo(() => {
    if (!currentNode) return []
    return currentNode.prerequisites
      .map((id) => ({ id, node: nodes[id] }))
      .filter((p): p is { id: string; node: NonNullable<(typeof nodes)[string]> } => Boolean(p.node))
  }, [currentNode, nodes])

  const [quote, setQuote] = useState<QuoteEntry>(() => {
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

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const todayLabel = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  const todayDelta = todayMinutes - yesterdayMinutes
  const weekDelta = weekMinutes - lastWeekMinutes

  const heatStart = useMemo(() => {
    const t = new Date()
    t.setHours(0, 0, 0, 0)
    t.setDate(t.getDate() - (HEATMAP_WEEKS * 7 - 1))
    t.setDate(t.getDate() - ((t.getDay() + 6) % 7))
    return t.getTime()
  }, [])

  const cellDate = (week: number, day: number) => new Date(heatStart + (week * 7 + day) * DAY_MS)

  return (
    <TooltipProvider delayDuration={250}>
      <div className="flex-1 w-full max-w-7xl mx-auto px-6 lg:px-10 py-10 text-[#F4F1EA]">
        {/* ---------------------------------------------------------- Hero */}
        <section className="dash-enter">
          <p className="text-[13px] uppercase tracking-[0.22em] text-[#7C7870]">{todayLabel}</p>
          <h1 className="font-display text-4xl lg:text-[48px] font-medium leading-tight tracking-tight mt-3 text-[#F4F1EA]">
            {greeting}, {user?.username ?? 'there'}
          </h1>

          <div className="mt-5 flex items-start gap-3 max-w-2xl">
            <Quote className="w-4 h-4 text-[#C8BFAF] mt-1.5 flex-shrink-0" />
            <blockquote className="text-[16px] italic leading-relaxed text-[#B6B0A4]">
              “{quote.text}”
              <span className="text-[13px] not-italic text-[#7C7870] ml-2">
                — Meditations {quote.book}.{quote.chapter}
              </span>
            </blockquote>
            <button
              type="button"
              onClick={refreshQuote}
              title="Another quote"
              className="mt-1 rounded-md p-1.5 text-[#7C7870] transition-colors duration-150 hover:bg-white/5 hover:text-[#A9A39A]"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="mt-9 flex flex-wrap items-center gap-x-12 gap-y-5 border-y border-[#2A2E36] py-5">
            <HeroStat label="Current phase" value={currentPhase ? currentPhase.title : '—'} />
            <HeroStat
              label="Current topic"
              value={currentNode ? currentNode.title : 'Nothing unlocked yet'}
              className="max-w-[340px] truncate"
            />
            <HeroStat
              label="Study streak"
              value={`${studyStreak} day${studyStreak === 1 ? '' : 's'}`}
            />
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button size="lg" asChild>
              <Link to={`/study/${currentNode ? currentNode.id : ''}`}>
                Continue Studying
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button size="lg" variant="secondary" asChild>
              <Link to="/roadmap">Open Roadmap</Link>
            </Button>
          </div>
        </section>

        {/* --------------------------------------------------- Today's mission */}
        <section className="dash-enter mt-12" style={{ animationDelay: '60ms' }}>
          {currentNode ? (
            <div className={`${cardBase} p-6 lg:p-8`}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.22em] text-[#C8BFAF]">Today&rsquo;s mission</p>
                  <h2 className="font-display text-2xl lg:text-[28px] font-medium tracking-tight mt-2 text-[#F4F1EA]">
                    {currentNode.title}
                  </h2>
                  <p className="text-[13px] text-[#7C7870] mt-1">
                    {currentNode.phaseId.replace('PHASE_', 'Phase ')} · {currentNode.id}
                  </p>
                </div>
                <Badge
                  status={
                    currentNode.status === 'COMPLETED' || currentNode.status === 'MASTERED'
                      ? 'success'
                      : currentNode.status === 'IN_PROGRESS'
                        ? 'info'
                        : 'default'
                  }
                  variant="outline"
                >
                  {currentNode.status.replace('_', ' ')}
                </Badge>
              </div>

              <p className="mt-4 text-[15px] leading-relaxed text-[#B6B0A4] max-w-2xl">
                {currentNode.description}
              </p>

              <div className="mt-7 grid gap-7 lg:grid-cols-2">
                <div className="space-y-5">
                  <MetaRow label="Difficulty" value={difficultyLabel(currentNode.estimatedHours)} />
                  <MetaRow
                    label="Estimated hours"
                    value={`${currentNode.estimatedHours} hours`}
                  />
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.16em] text-[#7C7870] mb-2">
                      Prerequisites
                    </p>
                    {prereqs.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {prereqs.slice(0, 3).map(({ id, node }) => {
                          const done = node.status === 'COMPLETED' || node.status === 'MASTERED'
                          return (
                            <Link
                              key={id}
                              to={`/topic/${id}`}
                              className="inline-flex items-center gap-1.5 rounded-full border border-[#2A2E36] bg-[#1F2229] px-3 py-1.5 text-[12px] text-[#B6B0A4] transition-colors duration-150 hover:border-[#3A3F46] hover:text-[#F4F1EA]"
                            >
                              {done ? (
                                <Check className="w-3 h-3 text-[#A8C69F]" />
                              ) : (
                                <ChevronRight className="w-3 h-3 text-[#7C7870]" />
                              )}
                              {node.title}
                            </Link>
                          )
                        })}
                        {prereqs.length > 3 && (
                          <span className="inline-flex items-center rounded-full border border-[#2A2E36] px-3 py-1.5 text-[12px] text-[#7C7870]">
                            +{prereqs.length - 3} more
                          </span>
                        )}
                      </div>
                    ) : (
                      <p className="text-[13px] text-[#7C7870]">No prerequisites — you can begin now.</p>
                    )}
                  </div>
                </div>

                <div className="lg:border-l lg:border-[#2A2E36] lg:pl-7 space-y-5">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.16em] text-[#7C7870] mb-2">
                      Resources
                    </p>
                    <ul className="space-y-2">
                      {currentNode.resources.slice(0, 3).map((r) => (
                        <li key={r.id} className="flex items-center gap-2.5 text-[14px]">
                          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${resourceDot(r.status)}`} />
                          <span className="text-[#F4F1EA] truncate">{r.title}</span>
                          <span className="text-[12px] text-[#7C7870] flex-shrink-0">{r.type}</span>
                        </li>
                      ))}
                      {currentNode.resources.length === 0 && (
                        <li className="text-[13px] text-[#7C7870]">No resources assigned yet.</li>
                      )}
                    </ul>
                    <Link
                      to="/resources"
                      className="mt-3 inline-flex items-center gap-1 text-[13px] text-[#C8BFAF] transition-colors duration-150 hover:text-[#F4F1EA]"
                    >
                      Open resources <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>

                  <div>
                    <p className="text-[11px] uppercase tracking-[0.16em] text-[#7C7870] mb-2">
                      Portfolio projects
                    </p>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-[14px] text-[#F4F1EA]">
                        {projectNodes.length} projects · {completedProjects} complete
                      </span>
                      <Link
                        to="/projects"
                        className="inline-flex items-center gap-1 text-[13px] text-[#C8BFAF] transition-colors duration-150 hover:text-[#F4F1EA]"
                      >
                        View <ChevronRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-7 pt-6 border-t border-[#2A2E36] flex flex-wrap items-center justify-between gap-5">
                <div className="w-full sm:w-72">
                  <div className="flex justify-between text-[13px] mb-1.5">
                    <span className="text-[#A9A39A]">Progress</span>
                    <span className="tabular-nums text-[#F4F1EA]">{missionProgressPct}%</span>
                  </div>
                  <ProgressBar value={missionProgressPct} max={100} size="sm" showLabel={false} />
                  <p className="text-[12px] text-[#7C7870] mt-1.5">
                    {masteredCriteriaCount}/{currentNode.masteryCriteria.length} mastery criteria ·{' '}
                    {studiedHoursForTopic.toFixed(1)}h of {currentNode.estimatedHours}h studied
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Button size="lg" asChild>
                    <Link to={`/study/${currentNode.id}`}>
                      Continue Learning
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="secondary" asChild>
                    <Link to="/resources">Open Resources</Link>
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className={`${cardBase} p-10 text-center`}>
              <BookOpen className="w-6 h-6 text-[#7C7870] mx-auto" />
              <h2 className="font-display text-2xl font-medium tracking-tight mt-3 text-[#F4F1EA]">
                Nothing to study yet
              </h2>
              <p className="text-[14px] text-[#A9A39A] mt-1.5 max-w-md mx-auto">
                All topics are locked or complete. Open the roadmap to plan your next mission.
              </p>
              <Button asChild className="mt-5">
                <Link to="/roadmap">
                  Explore the roadmap <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          )}
        </section>

        {/* -------------------------------------------------------- Metrics */}
        <section className="dash-enter mt-12 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4" style={{ animationDelay: '120ms' }}>
          <MetricCard
            icon={<Target className="w-[14px] h-[14px]" />}
            label="Completion"
            value={`${progressPercent}%`}
            trend={{
              icon: <Clock className="w-3 h-3" />,
              text: `${remainingHours.toFixed(0)}h remaining`,
              tone: 'text-[#A9A39A]',
            }}
            description={`${completedNodesCount} of ${totalNodes.length} topics complete`}
          />
          <MetricCard
            icon={<Clock className="w-[14px] h-[14px]" />}
            label="Today's hours"
            value={`${(todayMinutes / 60).toFixed(1)}h`}
            trend={{
              icon: todayDelta > 5 ? <TrendingUp className="w-3 h-3" /> : todayDelta < -5 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />,
              text: `${todayDelta >= 0 ? '+' : ''}${(todayDelta / 60).toFixed(1)}h vs yesterday`,
              tone:
                todayDelta > 5 ? 'text-[#A8C69F]' : todayDelta < -5 ? 'text-[#D98A8A]' : 'text-[#A9A39A]',
            }}
            description="Focused study time today"
          />
          <MetricCard
            icon={<Flame className="w-[14px] h-[14px]" />}
            label="Current streak"
            value={`${studyStreak}d`}
            trend={{
              icon: <CheckCircle2 className="w-3 h-3" />,
              text: `Best ${bestStreak}d`,
              tone: 'text-[#A9A39A]',
            }}
            description="Consecutive study days"
          />
          <MetricCard
            icon={<CalendarDays className="w-[14px] h-[14px]" />}
            label="Weekly hours"
            value={`${(weekMinutes / 60).toFixed(1)}h`}
            trend={{
              icon: weekDelta > 5 ? <TrendingUp className="w-3 h-3" /> : weekDelta < -5 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />,
              text: `${weekDelta >= 0 ? '+' : ''}${(weekDelta / 60).toFixed(1)}h vs last week`,
              tone:
                weekDelta > 5 ? 'text-[#A8C69F]' : weekDelta < -5 ? 'text-[#D98A8A]' : 'text-[#A9A39A]',
            }}
            description="This week's focus time"
          />
        </section>

        {/* ------------------------------------------------- Section 4 */}
        <div className="dash-enter mt-12 grid gap-4 lg:grid-cols-3" style={{ animationDelay: '180ms' }}>
          <div className="space-y-4 lg:col-span-2">
            <SectionCard
              icon={<History className="w-[14px] h-[14px]" />}
              title="Recent study sessions"
              caption={recentSessions.length > 0 ? 'Last 5' : undefined}
            >
              {recentSessions.length > 0 ? (
                <ol>
                  {recentSessions.map((session, index) => {
                    const node = nodes[session.topicId]
                    const title = node ? node.title : session.topicId
                    const isLast = index === recentSessions.length - 1
                    const when = new Date(session.updatedAt).toLocaleString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                    return (
                      <li key={session.id} className="relative flex gap-4 pb-5 last:pb-0">
                        <span className="relative flex flex-col items-center">
                          <span
                            className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${
                              session.status === 'finished'
                                ? 'bg-[#A8C69F] ring-4 ring-[#A8C69F]/10'
                                : session.status === 'active'
                                  ? 'bg-[#C8BFAF] animate-pulse'
                                  : session.status === 'paused'
                                    ? 'bg-[#D9B98A]'
                                    : 'bg-[#7C7870]'
                            }`}
                          />
                          {!isLast && <span className="absolute top-[18px] bottom-0 w-px bg-[#2A2E36]" />}
                        </span>
                        <Link to={`/topic/${session.topicId}`} className="group flex flex-1 items-center justify-between gap-4 min-w-0">
                          <span className="min-w-0">
                            <span className="block text-[15px] font-medium text-[#F4F1EA] truncate transition-colors duration-150 group-hover:text-[#C8BFAF]">
                              {title}
                            </span>
                            <span className="block text-[13px] text-[#7C7870] mt-0.5">
                              {session.phaseId.replace('PHASE_', 'Phase ')} · {when}
                              {session.notes ? ' · noted' : ''}
                            </span>
                          </span>
                          <span className="text-[13px] font-mono tabular-nums text-[#A9A39A] flex-shrink-0">
                            {formatSessionMinutes(session)}
                          </span>
                        </Link>
                      </li>
                    )
                  })}
                </ol>
              ) : (
                <EmptyText>No sessions yet. Pick a topic and start studying.</EmptyText>
              )}
            </SectionCard>

            <div className="grid gap-4 sm:grid-cols-2">
              <SectionCard icon={<StickyNote className="w-[14px] h-[14px]" />} title="Recent notes">
                {notedNodes.length > 0 ? (
                  <ul className="space-y-3">
                    {notedNodes.map((n) => (
                      <li key={n.id}>
                        <Link
                          to="/notes"
                          className="block rounded-md border border-transparent p-2 -m-2 transition-colors duration-150 hover:border-[#2A2E36] hover:bg-[#1F2229]"
                        >
                          <span className="block text-[14px] font-medium text-[#F4F1EA] truncate">
                            {n.title}
                          </span>
                          <span className="block text-[13px] text-[#7C7870] mt-0.5 line-clamp-2 leading-snug">
                            {n.notes}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <EmptyText>Notes you write on topics will appear here.</EmptyText>
                )}
              </SectionCard>

              <SectionCard icon={<CalendarClock className="w-[14px] h-[14px]" />} title="Upcoming revision">
                {dueCardsCount > 0 && (
                  <div className="flex items-baseline gap-2">
                    <span className="text-[40px] font-semibold leading-none tracking-tight tabular-nums text-[#C8BFAF]">
                      {dueCardsCount}
                    </span>
                    <span className="text-[13px] text-[#A9A39A]">cards due today</span>
                  </div>
                )}
                <ul className="mt-3 space-y-2.5">
                  {upcomingCards.map((card) => {
                    const node = nodes[card.topicId]
                    return (
                      <li key={card.id} className="flex items-center justify-between gap-3">
                        <span className="text-[13px] text-[#B6B0A4] truncate">
                          {node ? node.title : card.topicId}
                        </span>
                        <span className={`text-[12px] tabular-nums flex-shrink-0 ${isDue(card.nextReviewDate) ? 'text-[#D9B98A]' : 'text-[#7C7870]'}`}>
                          {dueLabel(card.nextReviewDate)}
                        </span>
                      </li>
                    )
                  })}
                  {upcomingCards.length === 0 && (
                    <li className="text-[13px] text-[#7C7870]">No cards yet. Create cards from topics.</li>
                  )}
                </ul>
                {dueCardsCount > 0 && (
                  <Link
                    to="/planner"
                    className="mt-3 inline-flex items-center gap-1 text-[13px] text-[#C8BFAF] transition-colors duration-150 hover:text-[#F4F1EA]"
                  >
                    Review now <ChevronRight className="w-3 h-3" />
                  </Link>
                )}
              </SectionCard>
            </div>
          </div>

          <div className="space-y-4">
            <SectionCard icon={<Layers className="w-[14px] h-[14px]" />} title="Current phase">
              {currentPhase ? (
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[15px] font-medium text-[#F4F1EA] truncate">{currentPhase.title}</span>
                    <span className="text-[13px] font-mono tabular-nums text-[#A9A39A] flex-shrink-0">
                      {currentPhase.completed}/{currentPhase.total}
                    </span>
                  </div>
                  <ProgressBar
                    value={currentPhase.total > 0 ? Math.round((currentPhase.completed / currentPhase.total) * 100) : 0}
                    max={100}
                    size="sm"
                    showLabel={false}
                    className="mt-3"
                  />
                  <Link
                    to="/roadmap"
                    className="mt-3 inline-flex items-center gap-1 text-[13px] text-[#C8BFAF] transition-colors duration-150 hover:text-[#F4F1EA]"
                  >
                    View roadmap <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              ) : (
                <EmptyText>All phases complete.</EmptyText>
              )}
            </SectionCard>

            <SectionCard icon={<BarChart3 className="w-[14px] h-[14px]" />} title="Weekly activity">
              <div className="flex items-end gap-1.5 h-[88px]">
                {weeklyData.map((d) => {
                  const dayLabel = new Date(`${d.key}T00:00:00`).toLocaleDateString(undefined, {
                    weekday: 'short',
                  })
                  return (
                    <Tooltip key={d.key}>
                      <TooltipTrigger asChild>
                        <div className="flex-1 cursor-default">
                          <div
                            className={`w-full rounded-t-[3px] transition-colors duration-150 ${
                              d.minutes > 0 ? 'bg-[#C8BFAF]/70 hover:bg-[#C8BFAF]' : 'bg-[#2A2E36] hover:bg-[#3A3F46]'
                            }`}
                            style={{ height: `${Math.max(3, (d.minutes / maxDayMinutes) * 100)}%` }}
                          />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        {dayLabel} · {(d.minutes / 60).toFixed(1)}h
                      </TooltipContent>
                    </Tooltip>
                  )
                })}
              </div>
              <div className="flex gap-1.5 mt-2">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((label) => (
                  <span key={label} className="flex-1 text-center text-[10px] text-[#7C7870]">
                    {label[0]}
                  </span>
                ))}
              </div>
              <p className="text-[12px] text-[#7C7870] mt-2">
                {(weeklyTotalMinutes / 60).toFixed(1)}h this week · {weeklyData.filter((d) => d.minutes > 0).length} active days
              </p>
            </SectionCard>

            <SectionCard icon={<TrendingUp className="w-[14px] h-[14px]" />} title="Learning velocity">
              <VelocityChart data={velocityData} />
              <p className="text-[12px] text-[#7C7870] mt-2">
                {(velocityTotalMinutes / 60).toFixed(1)}h in 14 days ·{' '}
                {(velocityTotalMinutes / 14 / 60).toFixed(1)}h/day average
              </p>
            </SectionCard>

            <SectionCard
              icon={<LayoutGrid className="w-[14px] h-[14px]" />}
              title="Study heatmap"
              contentClassName="p-4"
            >
              <Heatmap
                start={heatStart}
                weeks={HEATMAP_WEEKS}
                minutesByDate={sessionMinutesByDate}
                countsByDate={sessionCountsByDate}
                isFuture={cellDate}
              />
            </SectionCard>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}

/* ------------------------------------------------------------- Components */

function HeroStat({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] uppercase tracking-[0.18em] text-[#7C7870]">{label}</span>
      <span className={`text-[16px] font-medium text-[#F4F1EA] ${className ?? ''}`}>{value}</span>
    </div>
  )
}

interface MetricCardProps {
  icon: ReactNode
  label: string
  value: string
  trend: { icon: ReactNode; text: string; tone: string }
  description: string
}

function MetricCard({ icon, label, value, trend, description }: MetricCardProps) {
  return (
    <div className={`${cardBase} p-5 flex flex-col`}>
      <div className="flex items-start justify-between">
        <span className="text-[13px] font-medium uppercase tracking-[0.14em] text-[#A9A39A]">{label}</span>
        <span className="text-[#7C7870] mt-0.5">{icon}</span>
      </div>
      <div className="mt-3 text-[40px] font-semibold leading-none tracking-tight tabular-nums text-[#F4F1EA]">
        {value}
      </div>
      <div className={`mt-3 flex items-center gap-1.5 text-[12px] ${trend.tone}`}>
        {trend.icon}
        <span>{trend.text}</span>
      </div>
      <p className="text-[13px] text-[#7C7870] mt-0.5">{description}</p>
    </div>
  )
}

function SectionCard({
  icon,
  title,
  caption,
  children,
  className,
  contentClassName,
}: {
  icon: ReactNode
  title: string
  caption?: string
  children: ReactNode
  className?: string
  contentClassName?: string
}) {
  return (
    <section className={`${cardBase} ${className ?? ''}`}>
      <header className="flex items-center justify-between px-5 pt-5 pb-3">
        <h3 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-[#F4F1EA]">
          <span className="text-[#C8BFAF]">{icon}</span>
          {title}
        </h3>
        {caption && <span className="text-[13px] text-[#7C7870]">{caption}</span>}
      </header>
      <div className={`px-5 pb-5 ${contentClassName ?? ''}`}>{children}</div>
    </section>
  )
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-6">
      <span className="text-[13px] text-[#7C7870]">{label}</span>
      <span className="text-[15px] font-medium text-[#F4F1EA]">{value}</span>
    </div>
  )
}

function EmptyText({ children }: { children: ReactNode }) {
  return <p className="text-[13px] text-[#7C7870] py-2">{children}</p>
}

function difficultyLabel(hours: number): string {
  if (hours >= 30) return 'Advanced'
  if (hours >= 20) return 'Intermediate'
  return 'Foundation'
}

function resourceDot(status: string): string {
  const s = status.toLowerCase()
  if (s.includes('completed') || s.includes('done')) return 'bg-[#A8C69F]'
  if (s.includes('progress')) return 'bg-[#C8BFAF]'
  return 'bg-[#7C7870]'
}

function isDue(dateStr: string): boolean {
  return dateStr <= new Date().toISOString().split('T')[0]
}

function dueLabel(dateStr: string): string {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(`${dateStr}T00:00:00`)
  const diffDays = Math.round((target.getTime() - today.getTime()) / DAY_MS)
  if (diffDays < 0) return 'overdue'
  if (diffDays === 0) return 'today'
  if (diffDays === 1) return 'tomorrow'
  return target.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function VelocityChart({ data }: { data: { key: string; minutes: number }[] }) {
  const width = 148
  const height = 40
  const pad = 3
  const maxMinutes = Math.max(1, ...data.map((d) => d.minutes))
  const points = data.map((d, i) => {
    const x = data.length === 1 ? pad : pad + (i / (data.length - 1)) * (width - pad * 2)
    const y = height - pad - (d.minutes / maxMinutes) * (height - pad * 2)
    return `${x.toFixed(1)},${y.toFixed(1)}`
  })
  const lastPoint = points[points.length - 1]
  const areaPoints = `${pad},${height - pad} ${points.join(' ')} ${width - pad},${height - pad}`

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-10" preserveAspectRatio="none" aria-hidden="true">
      <line x1={pad} x2={width - pad} y1={height - pad} y2={height - pad} stroke="#2A2E36" strokeWidth="1" />
      <polygon points={areaPoints} fill="#C8BFAF" opacity="0.05" />
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke="#C8BFAF"
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        opacity="0.85"
      />
      <circle cx={Number(lastPoint.split(',')[0])} cy={Number(lastPoint.split(',')[1])} r="2" fill="#C8BFAF" />
    </svg>
  )
}

function Heatmap({
  start,
  weeks,
  minutesByDate,
  countsByDate,
  isFuture,
}: {
  start: number
  weeks: number
  minutesByDate: Record<string, number>
  countsByDate: Record<string, number>
  isFuture: (week: number, day: number) => Date
}) {
  const monthLabels = useMemo(() => {
    const labels: { week: number; label: string }[] = []
    for (let w = 0; w < weeks; w++) {
      const d = new Date(start + w * 7 * DAY_MS)
      const prev = w === 0 ? null : new Date(start + (w - 1) * 7 * DAY_MS)
      if (!prev || d.getMonth() !== prev.getMonth() || d.getFullYear() !== prev.getFullYear()) {
        labels.push({ week: w, label: d.toLocaleDateString(undefined, { month: 'short' }) })
      }
    }
    return labels
  }, [start, weeks])

  const dayLabels = ['Mon', '', 'Wed', '', 'Fri', '', '']

  const cellClass = (level: number) =>
    `w-[9px] h-[9px] rounded-[2px] transition-colors duration-150 ${
      ['bg-[#1F2229]', 'bg-[#2A2E36]', 'bg-[#3A3F46]', 'bg-[#52525B]', 'bg-[#C8BFAF]'][level]
    }`

  return (
    <div>
      <div className="flex">
        <div className="w-6 flex flex-col gap-[3px] flex-shrink-0 pt-[18px]">
          {dayLabels.map((label, i) => (
            <div key={i} className="h-[9px] leading-[9px] text-[9px] text-[#7C7870]">
              {label}
            </div>
          ))}
        </div>
        <div className="flex-1 overflow-x-auto min-w-0 pb-1">
          <div className="relative" style={{ width: `${weeks * HEAT_PITCH - 3}px` }}>
            <div className="relative h-[18px] text-[9px] text-[#7C7870]">
              {monthLabels.map(({ week, label }) => (
                <span
                  key={week}
                  className="absolute top-0 whitespace-nowrap"
                  style={{ left: `${week * HEAT_PITCH}px` }}
                >
                  {label}
                </span>
              ))}
            </div>
            <div className="flex gap-[3px]">
              {Array.from({ length: weeks }, (_, w) => (
                <div key={w} className="flex flex-col gap-[3px]">
                  {Array.from({ length: 7 }, (_, d) => {
                    const date = isFuture(w, d)
                    if (date.getTime() > Date.now()) {
                      return <div key={d} className="w-[9px] h-[9px]" />
                    }
                    const key = getDateKey(date)
                    const minutes = minutesByDate[key] ?? 0
                    const level = minutes === 0 ? 0 : minutes < 30 ? 1 : minutes < 60 ? 2 : minutes < 120 ? 3 : 4
                    return (
                      <Tooltip key={d}>
                        <TooltipTrigger asChild>
                          <div className={`${cellClass(level)} hover:outline hover:outline-1 hover:outline-[#F4F1EA]/30 cursor-default`} />
                        </TooltipTrigger>
                        <TooltipContent>
                          {date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} ·{' '}
                          {minutes === 0 ? 'no study' : `${Math.round(minutes)} min`}
                          {minutes > 0 && (
                            <>
                              {' '}
                              · {countsByDate[key] ?? 0} session{countsByDate[key] === 1 ? '' : 's'}
                            </>
                          )}
                        </TooltipContent>
                      </Tooltip>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-end gap-1.5 mt-2 text-[11px] text-[#7C7870]">
        <span>Less</span>
        {['bg-[#1F2229]', 'bg-[#2A2E36]', 'bg-[#3A3F46]', 'bg-[#52525B]', 'bg-[#C8BFAF]'].map((c) => (
          <span key={c} className={`w-[9px] h-[9px] rounded-[2px] ${c}`} />
        ))}
        <span>More</span>
      </div>
    </div>
  )
}
