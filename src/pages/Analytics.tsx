import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, CartesianGrid } from 'recharts'
import { Activity, Flame, BookOpen, TrendingUp, Target, Calendar, Award, Zap } from 'lucide-react'
import { useCurriculumStore } from '../stores/curriculumStore'
import { usePlannerStore } from '../stores/plannerStore'
import { useSpacedRepetitionStore } from '../stores/spacedRepetitionStore'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card'
import { ProgressBar } from '../components/ui/progress'

export default function Analytics() {
  const { nodes } = useCurriculumStore()
  const { tasks, logs } = usePlannerStore()
  const { cards } = useSpacedRepetitionStore()

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

  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (29 - i))
    return d.toISOString().split('T')[0]
  })

  const dailyData = last30Days.map(date => {
    const dayTasks = Object.values(tasks).filter(t => t.date === date)
    const minutes = dayTasks.reduce((acc, curr) => acc + curr.actualMinutes, 0)
    const log = logs[date]
    return {
      date: date.slice(5),
      hours: parseFloat((minutes / 60).toFixed(2)),
      focus: log?.focusRating || 0,
    }
  })

  const weeklyData = Array.from({ length: 4 }, (_, i) => {
    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - (21 - i * 7))
    const weekDates = Array.from({ length: 7 }, (_, j) => {
      const d = new Date(weekStart)
      d.setDate(d.getDate() + j)
      return d.toISOString().split('T')[0]
    })
    const weekMinutes = weekDates.reduce((acc, d) => {
      const dayTasks = Object.values(tasks).filter(t => t.date === d)
      return acc + dayTasks.reduce((a, c) => a + c.actualMinutes, 0)
    }, 0)
    return {
      week: `W${i + 1}`,
      hours: parseFloat((weekMinutes / 60).toFixed(1)),
    }
  })

  const monthlyData = Array.from({ length: 3 }, (_, i) => {
    const monthStart = new Date()
    monthStart.setMonth(monthStart.getMonth() - (2 - i))
    const monthStr = monthStart.toISOString().slice(0, 7)
    const monthTasks = Object.values(tasks).filter(t => t.date.startsWith(monthStr))
    const monthMinutes = monthTasks.reduce((acc, curr) => acc + curr.actualMinutes, 0)
    return {
      month: monthStart.toLocaleString('default', { month: 'short' }),
      hours: parseFloat((monthMinutes / 60).toFixed(1)),
    }
  })

  const sortedLogDates = Object.keys(logs).sort()
  let longestStreak = 0
  let currentStreak = 0
  let prevDate: Date | null = null

  sortedLogDates.forEach(dateStr => {
    const currDate = new Date(dateStr)
    if (prevDate === null) {
      currentStreak = 1
    } else {
      const diffTime = Math.abs(currDate.getTime() - prevDate.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      if (diffDays === 1) {
        currentStreak += 1
      } else if (diffDays > 1) {
        longestStreak = Math.max(longestStreak, currentStreak)
        currentStreak = 1
      }
    }
    prevDate = currDate
  })
  longestStreak = Math.max(longestStreak, currentStreak)

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

  const COLORS = ['#38BDF8', '#71717A', '#52525B', '#27272A']

  const avgDailyHours = dailyData.reduce((acc, d) => acc + d.hours, 0) / Math.max(1, dailyData.filter(d => d.hours > 0).length)
  const velocityData = dailyData.filter(d => d.hours > 0).slice(-14)
  const learningVelocity = velocityData.length > 0
    ? velocityData.reduce((acc, d) => acc + d.hours, 0) / velocityData.length
    : 0

  const forecastDays = 30
  const forecastData = Array.from({ length: forecastDays }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() + i)
    const projected = avgDailyHours * (1 + i * 0.01)
    return {
      date: d.toISOString().slice(5),
      projected: parseFloat(projected.toFixed(2)),
    }
  })

  const heatmapWeeks = Array.from({ length: 12 }, (_, i) => i)
  const heatmapDays = Array.from({ length: 7 }, (_, i) => i)
  const today = new Date()
  const getHeatmapDate = (weekIdx: number, dayIdx: number) => {
    const d = new Date(today)
    d.setDate(d.getDate() - (12 - weekIdx) * 7 + (6 - dayIdx))
    return d.toISOString().split('T')[0]
  }

  const getHeatmapIntensity = (dateStr: string) => {
    const dayTasks = Object.values(tasks).filter(t => t.date === dateStr)
    const minutes = dayTasks.reduce((acc, curr) => acc + curr.actualMinutes, 0)
    const hours = minutes / 60
    if (hours === 0) return 0
    if (hours < 0.5) return 1
    if (hours < 1) return 2
    if (hours < 2) return 3
    return 4
  }

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

  const totalFlashcards = cardsList.length
  const dueToday = cardsList.filter(c => c.nextReviewDate <= today.toISOString().split('T')[0]).length
  const avgEF = cardsList.length > 0
    ? cardsList.reduce((acc, c) => acc + c.easeFactor, 0) / cardsList.length
    : 0

  return (
    <div className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-6 text-[#FAFAFA]">
      <header className="pb-4 border-b border-[#27272A]">
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <Activity className="w-7 h-7 text-[#38BDF8]" />
          Analytics Dashboard
        </h1>
        <p className="text-sm text-[#A1A1AA] mt-1">Data-driven insights from your study patterns and progress.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card variant="glass" className="flex items-center gap-4 p-5">
          <div className="p-3 bg-orange-500/10 text-orange-400 rounded-lg">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-[#A1A1AA] font-semibold uppercase tracking-wider block">Longest Streak</span>
            <span className="text-2xl font-bold font-mono mt-1 block">{longestStreak} days</span>
          </div>
        </Card>

        <Card variant="glass" className="flex items-center gap-4 p-5">
          <div className="p-3 bg-[#38BDF8]/10 text-[#38BDF8] rounded-lg">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-[#A1A1AA] font-semibold uppercase tracking-wider block">Overall Progress</span>
            <span className="text-2xl font-bold font-mono mt-1 block">{overallProgress}%</span>
          </div>
        </Card>

        <Card variant="glass" className="flex items-center gap-4 p-5">
          <div className="p-3 bg-green-500/10 text-green-400 rounded-lg">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-[#A1A1AA] font-semibold uppercase tracking-wider block">Learning Velocity</span>
            <span className="text-2xl font-bold font-mono mt-1 block">{learningVelocity.toFixed(1)}h/day</span>
          </div>
        </Card>

        <Card variant="glass" className="flex items-center gap-4 p-5">
          <div className="p-3 bg-purple-500/10 text-purple-400 rounded-lg">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-[#A1A1AA] font-semibold uppercase tracking-wider block">Flashcards Active</span>
            <span className="text-2xl font-bold font-mono mt-1 block">{totalFlashcards}</span>
            <span className="text-xs text-[#A1A1AA] block">{dueToday} due today · avg EF {avgEF.toFixed(1)}</span>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card variant="glass">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#38BDF8]" /> Daily Study Hours (30 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyData}>
                  <defs>
                    <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#38BDF8" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#38BDF8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272A" />
                  <XAxis dataKey="date" stroke="#A1A1AA" fontSize={10} tickLine={false} />
                  <YAxis stroke="#A1A1AA" fontSize={10} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#121318', borderColor: '#27272A', color: '#FAFAFA' }} />
                  <Area type="monotone" dataKey="hours" stroke="#38BDF8" strokeWidth={2} fillOpacity={1} fill="url(#colorHours)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card variant="glass">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#38BDF8]" /> Learning Velocity (14-Day Avg)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={velocityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272A" />
                  <XAxis dataKey="date" stroke="#A1A1AA" fontSize={10} tickLine={false} />
                  <YAxis stroke="#A1A1AA" fontSize={10} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#121318', borderColor: '#27272A', color: '#FAFAFA' }} />
                  <Bar dataKey="hours" fill="#38BDF8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card variant="glass">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
              <BarChart className="w-5 h-5 text-[#38BDF8]" /> Weekly Hours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272A" />
                  <XAxis dataKey="week" stroke="#A1A1AA" fontSize={10} tickLine={false} />
                  <YAxis stroke="#A1A1AA" fontSize={10} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#121318', borderColor: '#27272A', color: '#FAFAFA' }} />
                  <Bar dataKey="hours" fill="#22C55E" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card variant="glass">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-[#38BDF8]" /> Monthly Hours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272A" />
                  <XAxis dataKey="month" stroke="#A1A1AA" fontSize={10} tickLine={false} />
                  <YAxis stroke="#A1A1AA" fontSize={10} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#121318', borderColor: '#27272A', color: '#FAFAFA' }} />
                  <Bar dataKey="hours" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
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
                <span className="text-xs font-mono text-[#A1A1AA] w-8">{phase.name}</span>
                <div className="flex-1">
                  <ProgressBar value={phase.percent} max={100} size="sm" showLabel={false} />
                </div>
                <span className="text-xs font-mono text-white w-12 text-right">{phase.completed}/{phase.total}</span>
                <span className="text-xs text-[#A1A1AA] w-16 text-right">{phase.hours.toFixed(1)}h</span>
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
              <div className="grid grid-cols-2 gap-3 text-sm text-[#A1A1AA]">
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
            <TrendingUp className="w-5 h-5 text-[#38BDF8]" /> 30-Day Forecast
          </CardTitle>
          <CardDescription>Projected study hours based on current learning velocity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={forecastData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272A" />
                <XAxis dataKey="date" stroke="#A1A1AA" fontSize={10} tickLine={false} />
                <YAxis stroke="#A1A1AA" fontSize={10} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#121318', borderColor: '#27272A', color: '#FAFAFA' }} />
                <Line type="monotone" dataKey="projected" stroke="#38BDF8" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card variant="glass">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-white">Study Heatmap (12 Weeks)</CardTitle>
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
                      title={`${dateStr}: Level ${intensity}`}
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