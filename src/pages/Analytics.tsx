import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, CartesianGrid } from 'recharts'
import { Activity, Flame, BookOpen, TrendingUp, Target, Calendar, Award, Zap, Clock, Timer, Layers, Tag } from 'lucide-react'
import { useCurriculumStore } from '../stores/curriculumStore'
import { useStudySessionStore } from '../stores/studySessionStore'
import { useSpacedRepetitionStore } from '../stores/spacedRepetitionStore'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card'
import { ProgressBar } from '../components/ui/progress'
import {
  getTotalStudyHours,
  getSessionMetrics,
  getStudyStreak,
  getSessionDateKey,
  groupSessionMinutesByDate,
  groupSessionMinutesByPhase,
  groupSessionMinutesByTopic,
  getDateKey,
  getProjectedStudyMinutes,
} from '../lib/studyMetrics'

export default function Analytics() {
  const { nodes } = useCurriculumStore()
  const { sessions } = useStudySessionStore()
  const { cards } = useSpacedRepetitionStore()

  const sessionList = Object.values(sessions)

  // ---- Curriculum-based completion ----
  const totalHours = Object.values(nodes).reduce((acc, n) => acc + n.estimatedHours, 0)
  const completedHours = Object.values(nodes).filter(n => n.status === 'COMPLETED' || n.status === 'MASTERED').reduce((acc, n) => acc + n.estimatedHours, 0)
  const overallProgress = totalHours > 0 ? Math.round((completedHours / totalHours) * 100) : 0

  const phasesMap: Record<string, { completed: number; total: number; hours: number; completedHours: number }> = {}
  Object.values(nodes).forEach(n => {
    if (!phasesMap[n.phaseId]) {
      phasesMap[n.phaseId] = { completed: 0, total: 0, hours: 0, completedHours: 0 }
    }
    phasesMap[n.phaseId].total += 1
    phasesMap[n.phaseId].hours += n.estimatedHours
    if (n.status === 'COMPLETED' || n.status === 'MASTERED') {
      phasesMap[n.phaseId].completed += 1
      phasesMap[n.phaseId].completedHours += n.estimatedHours
    }
  })

  const phaseData = Object.entries(phasesMap).map(([id, val]) => ({
    name: id.replace('PHASE_', 'P'),
    completed: val.completed,
    total: val.total,
    percent: val.total > 0 ? Math.round((val.completed / val.total) * 100) : 0,
    hours: val.completedHours,
    totalHours: val.hours,
  }))

  // ---- Session-powered metrics ----
  const metrics = getSessionMetrics(sessionList)
  const totalStudyHours = getTotalStudyHours(sessionList)
  const currentStreak = getStudyStreak(sessionList)

  const avgSessionMinutes = metrics.averageMinutes
  const longestMinutes = metrics.longestMinutes
  const todayMinutes = metrics.todayMinutes
  const weekMinutes = metrics.weekMinutes
  const monthMinutes = metrics.monthMinutes

  const formatMins = (mins: number) => {
    if (mins <= 0) return '0m'
    if (mins < 60) return `${Math.round(mins)}m`
    const h = Math.floor(mins / 60)
    const m = Math.round(mins % 60)
    return m > 0 ? `${h}h ${String(m).padStart(2, '0')}m` : `${h}h`
  }

  // Daily study minutes over last 30 days (from sessions).
  const minutesByDate = groupSessionMinutesByDate(sessionList)
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (29 - i))
    return getDateKey(d)
  })

  const dailyData = last30Days.map(date => ({
    date: date.slice(5),
    hours: parseFloat(((minutesByDate[date] ?? 0) / 60).toFixed(2)),
  }))

  // Weekly hours over last 4 weeks (Mon-Sun buckets).
  const weeklyData = Array.from({ length: 4 }, (_, i) => {
    const end = new Date()
    end.setDate(end.getDate() - (3 - i) * 7)
    // Find the Sunday of that week.
    const sunday = new Date(end)
    const day = (end.getDay() + 6) % 7
    sunday.setDate(end.getDate() + (6 - day))
    const monday = new Date(sunday)
    monday.setDate(sunday.getDate() - 6)
    const weekMinutesTotal = sessionList.reduce((acc, s) => {
      const anchor = s.endTime ?? s.startTime ?? s.createdAt
      if (anchor >= monday.getTime() && anchor <= sunday.getTime() + 86_399_999) {
        return acc + (s.elapsedSeconds / 60)
      }
      return acc
    }, 0)
    return {
      week: `W${i + 1}`,
      hours: parseFloat((weekMinutesTotal / 60).toFixed(1)),
    }
  })

  // Monthly hours over last 3 months.
  const monthlyData = Array.from({ length: 3 }, (_, i) => {
    const monthStart = new Date()
    monthStart.setMonth(monthStart.getMonth() - (2 - i))
    const monthStr = monthStart.toISOString().slice(0, 7)
    const monthMinutesTotal = sessionList.reduce((acc, s) => {
      const anchor = s.endTime ?? s.startTime ?? s.createdAt
      const d = new Date(anchor)
      if (d.toISOString().slice(0, 7) === monthStr) {
        return acc + (s.elapsedSeconds / 60)
      }
      return acc
    }, 0)
    return {
      month: monthStart.toLocaleString('default', { month: 'short' }),
      hours: parseFloat((monthMinutesTotal / 60).toFixed(1)),
    }
  })

  // Longest streak (historical).
  const activityDates = Array.from(new Set(sessionList.map(getSessionDateKey))).sort()
  let longestStreak = 0
  let run = 0
  let prev: Date | null = null
  for (const dateStr of activityDates) {
    const curr = new Date(dateStr)
    if (prev) {
      const diffDays = Math.round((curr.getTime() - prev.getTime()) / 86_400_000)
      run = diffDays === 1 ? run + 1 : 1
    } else {
      run = 1
    }
    longestStreak = Math.max(longestStreak, run)
    prev = curr
  }

  // ---- Per-phase and per-topic breakdowns ----
  const phaseMinutes = groupSessionMinutesByPhase(sessionList)
  const hoursPerPhase = Object.entries(phaseMinutes)
    .map(([phaseId, minutes]) => ({
      phaseId,
      label: phaseId.replace('PHASE_', 'Phase '),
      hours: minutes / 60,
    }))
    .sort((a, b) => b.hours - a.hours)

  const topicMinutes = groupSessionMinutesByTopic(sessionList)
  const hoursPerTopic = Object.entries(topicMinutes)
    .map(([topicId, minutes]) => ({
      topicId,
      title: nodes[topicId]?.title ?? topicId,
      hours: minutes / 60,
    }))
    .sort((a, b) => b.hours - a.hours)
    .slice(0, 10)

  // ---- Forecast from session velocity ----
  const forecastDays = 30
  const projectedTotal = getProjectedStudyMinutes(sessionList, forecastDays)
  const dailyAverage = metrics.activeDays > 0 ? metrics.totalMinutes / metrics.activeDays : 0
  const forecastData = Array.from({ length: forecastDays }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() + i)
    return {
      date: d.toISOString().slice(5),
      projected: parseFloat((dailyAverage * (i + 1) / 60).toFixed(2)),
    }
  })

  // ---- Heatmap (12 weeks, session-based) ----
  const heatmapWeeks = Array.from({ length: 12 }, (_, i) => i)
  const heatmapDays = Array.from({ length: 7 }, (_, i) => i)
  const today = new Date()
  const getHeatmapDate = (weekIdx: number, dayIdx: number) => {
    const d = new Date(today)
    d.setDate(d.getDate() - (12 - weekIdx) * 7 + (6 - dayIdx))
    return getDateKey(d)
  }

  const getHeatmapIntensity = (dateStr: string) => {
    const minutes = minutesByDate[dateStr] ?? 0
    const hours = minutes / 60
    if (hours === 0) return 0
    if (hours < 0.5) return 1
    if (hours < 1) return 2
    if (hours < 2) return 3
    return 4
  }

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

  // ---- SM-2 ----
  const cardsList = Object.values(cards)
  const efDistribution: Record<string, number> = { '1.3-1.7': 0, '1.8-2.2': 0, '2.3-2.5': 0, '2.6+': 0 }
  cardsList.forEach(c => {
    if (c.easeFactor <= 1.7) efDistribution['1.3-1.7'] += 1
    else if (c.easeFactor <= 2.2) efDistribution['1.8-2.2'] += 1
    else if (c.easeFactor <= 2.5) efDistribution['2.3-2.5'] += 1
    else efDistribution['2.6+'] += 1
  })

  const efData = Object.entries(efDistribution).map(([range, count]) => ({
    name: range,
    value: count
  }))

  const COLORS = ['#C8BFAF', '#7C7870', '#52525B', '#2A2E36']

  const totalFlashcards = cardsList.length
  const dueToday = cardsList.filter(c => c.nextReviewDate <= today.toISOString().split('T')[0]).length
  const avgEF = cardsList.length > 0
    ? cardsList.reduce((acc, c) => acc + c.easeFactor, 0) / cardsList.length
    : 0

  return (
    <div className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-6 text-[#F4F1EA]">
      <header className="pb-4 border-b border-[#2A2E36]">
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <Activity className="w-7 h-7 text-[#C8BFAF]" />
          Analytics Dashboard
        </h1>
        <p className="text-sm text-[#A9A39A] mt-1">Data-driven insights from your study patterns and progress.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card variant="glass" className="flex items-center gap-4 p-5">
          <div className="p-3 bg-orange-500/10 text-orange-400 rounded-lg">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-[#A9A39A] font-semibold uppercase tracking-wider block">Current Streak</span>
            <span className="text-2xl font-bold font-mono mt-1 block">{currentStreak} days</span>
          </div>
        </Card>

        <Card variant="glass" className="flex items-center gap-4 p-5">
          <div className="p-3 bg-[#C8BFAF]/10 text-[#C8BFAF] rounded-lg">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-[#A9A39A] font-semibold uppercase tracking-wider block">Overall Progress</span>
            <span className="text-2xl font-bold font-mono mt-1 block">{overallProgress}%</span>
          </div>
        </Card>

        <Card variant="glass" className="flex items-center gap-4 p-5">
          <div className="p-3 bg-green-500/10 text-green-400 rounded-lg">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-[#A9A39A] font-semibold uppercase tracking-wider block">Total Hours</span>
            <span className="text-2xl font-bold font-mono mt-1 block">{totalStudyHours.toFixed(1)}h</span>
          </div>
        </Card>

        <Card variant="glass" className="flex items-center gap-4 p-5">
          <div className="p-3 bg-purple-500/10 text-purple-400 rounded-lg">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-[#A9A39A] font-semibold uppercase tracking-wider block">Flashcards Active</span>
            <span className="text-2xl font-bold font-mono mt-1 block">{totalFlashcards}</span>
            <span className="text-xs text-[#A9A39A] block">{dueToday} due today · avg EF {avgEF.toFixed(1)}</span>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card variant="glass" className="flex items-center gap-4 p-5">
          <div className="p-3 bg-[#C8BFAF]/10 text-[#C8BFAF] rounded-lg">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-[#A9A39A] font-semibold uppercase tracking-wider block">Avg Session</span>
            <span className="text-2xl font-bold font-mono mt-1 block">{formatMins(avgSessionMinutes)}</span>
          </div>
        </Card>

        <Card variant="glass" className="flex items-center gap-4 p-5">
          <div className="p-3 bg-yellow-500/10 text-yellow-400 rounded-lg">
            <Timer className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-[#A9A39A] font-semibold uppercase tracking-wider block">Longest Session</span>
            <span className="text-2xl font-bold font-mono mt-1 block">{formatMins(longestMinutes)}</span>
          </div>
        </Card>

        <Card variant="glass" className="flex items-center gap-4 p-5">
          <div className="p-3 bg-red-500/10 text-red-400 rounded-lg">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-[#A9A39A] font-semibold uppercase tracking-wider block">Longest Streak</span>
            <span className="text-2xl font-bold font-mono mt-1 block">{longestStreak} days</span>
          </div>
        </Card>

        <Card variant="glass" className="flex items-center gap-4 p-5">
          <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-lg">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-[#A9A39A] font-semibold uppercase tracking-wider block">This Month</span>
            <span className="text-2xl font-bold font-mono mt-1 block">{formatMins(monthMinutes)}</span>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card variant="glass">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#C8BFAF]" /> Daily Study Hours (30 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyData}>
                  <defs>
                    <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#C8BFAF" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#C8BFAF" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2A2E36" />
                  <XAxis dataKey="date" stroke="#A9A39A" fontSize={10} tickLine={false} />
                  <YAxis stroke="#A9A39A" fontSize={10} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#111318', borderColor: '#2A2E36', color: '#F4F1EA' }} />
                  <Area type="monotone" dataKey="hours" stroke="#C8BFAF" strokeWidth={2} fillOpacity={1} fill="url(#colorHours)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card variant="glass">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#C8BFAF]" /> Weekly Hours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2A2E36" />
                  <XAxis dataKey="week" stroke="#A9A39A" fontSize={10} tickLine={false} />
                  <YAxis stroke="#A9A39A" fontSize={10} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#111318', borderColor: '#2A2E36', color: '#F4F1EA' }} />
                  <Bar dataKey="hours" fill="#22C55E" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card variant="glass">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#C8BFAF]" /> Monthly Hours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2A2E36" />
                  <XAxis dataKey="month" stroke="#A9A39A" fontSize={10} tickLine={false} />
                  <YAxis stroke="#A9A39A" fontSize={10} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#111318', borderColor: '#2A2E36', color: '#F4F1EA' }} />
                  <Bar dataKey="hours" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card variant="glass">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#C8BFAF]" /> This Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <span className="text-5xl font-bold font-mono text-white">{formatMins(weekMinutes)}</span>
              <span className="text-xs text-[#A9A39A] block mt-2">studied this week</span>
            </div>
            <div className="flex justify-between text-xs text-[#A9A39A] pt-4 border-t border-[#2A2E36]/50">
              <span>Today: {formatMins(todayMinutes)}</span>
              <span>{metrics.activeDays} active day{metrics.activeDays !== 1 ? 's' : ''}</span>
              <span>{metrics.completedCount} completed</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card variant="glass">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#C8BFAF]" /> Hours Per Phase
            </CardTitle>
            <CardDescription>Total study time recorded per curriculum phase</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {hoursPerPhase.length > 0 ? (
              hoursPerPhase.map((entry) => (
                <div key={entry.phaseId} className="flex items-center gap-3">
                  <span className="text-xs font-mono text-[#A9A39A] w-20 truncate">{entry.label}</span>
                  <div className="flex-1">
                    <ProgressBar
                      value={entry.hours}
                      max={Math.max(1, hoursPerPhase[0]?.hours ?? 1)}
                      size="sm"
                      showLabel={false}
                    />
                  </div>
                  <span className="text-xs font-mono text-white w-16 text-right">{entry.hours.toFixed(1)}h</span>
                </div>
              ))
            ) : (
              <div className="text-sm text-[#A9A39A] py-4 text-center">No session data yet.</div>
            )}
          </CardContent>
        </Card>

        <Card variant="glass">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
              <Tag className="w-5 h-5 text-[#C8BFAF]" /> Hours Per Topic
            </CardTitle>
            <CardDescription>Top topics by recorded study time</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {hoursPerTopic.length > 0 ? (
              hoursPerTopic.map((entry) => (
                <div key={entry.topicId} className="flex items-center gap-3">
                  <span className="text-xs font-mono text-[#A9A39A] w-14 truncate">{entry.topicId}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-white truncate">{entry.title}</div>
                    <ProgressBar
                      value={entry.hours}
                      max={Math.max(1, hoursPerTopic[0]?.hours ?? 1)}
                      size="sm"
                      showLabel={false}
                    />
                  </div>
                  <span className="text-xs font-mono text-white w-16 text-right">{entry.hours.toFixed(1)}h</span>
                </div>
              ))
            ) : (
              <div className="text-sm text-[#A9A39A] py-4 text-center">No session data yet.</div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card variant="glass">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-white">Phase Completion</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {phaseData.map((phase) => (
              <div key={phase.name} className="flex items-center gap-3">
                <span className="text-xs font-mono text-[#A9A39A] w-8">{phase.name}</span>
                <div className="flex-1">
                  <ProgressBar value={phase.percent} max={100} size="sm" showLabel={false} />
                </div>
                <span className="text-xs font-mono text-white w-12 text-right">{phase.completed}/{phase.total}</span>
                <span className="text-xs text-[#A9A39A] w-16 text-right">{phase.hours.toFixed(1)}h</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card variant="glass">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-white">SM-2 Ease Factor Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row justify-around items-center gap-6">
              <div className="h-48 w-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={efData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {efData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm text-[#A9A39A]">
                {efData.map((d, index) => (
                  <div key={d.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                    <span className="font-semibold text-white">{d.name}</span>
                    <span className="font-mono">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card variant="glass">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#C8BFAF]" /> 30-Day Study Forecast
          </CardTitle>
          <CardDescription>
            Projected study hours from your session velocity
            {metrics.activeDays > 0
              ? ` · ~${formatMins(dailyAverage)}/day → ~${(projectedTotal / 60).toFixed(1)}h in ${forecastDays} days`
              : ' · start a few sessions to unlock the forecast'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={forecastData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2A2E36" />
                <XAxis dataKey="date" stroke="#A9A39A" fontSize={10} tickLine={false} />
                <YAxis stroke="#A9A39A" fontSize={10} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#111318', borderColor: '#2A2E36', color: '#F4F1EA' }} />
                <Line type="monotone" dataKey="projected" stroke="#C8BFAF" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card variant="glass">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-white">Study Heatmap (12 Weeks)</CardTitle>
          <CardDescription>Recorded study-session minutes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-1 overflow-x-auto pb-2">
            {heatmapWeeks.map((week) => (
              <div key={week} className="flex flex-col gap-1">
                {heatmapDays.map((day) => {
                  const dateStr = getHeatmapDate(week, day)
                  const intensity = getHeatmapIntensity(dateStr)
                  return (
                    <div
                      key={day}
                      className={`w-3 h-3 rounded-sm ${getHeatmapColor(intensity)}`}
                      title={`${dateStr}: ${minutesByDate[dateStr] ? Math.round(minutesByDate[dateStr]) : 0} min`}
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

