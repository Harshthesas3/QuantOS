import type { StudySession } from '../stores/studySessionStore'

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------

export function getDateKey(date: Date): string {
  return date.toISOString().split('T')[0]
}

/**
 * The date a session belongs to. Finished sessions are bucketed by their end
 * date; in-progress (active/paused) sessions by their start date.
 */
export function getSessionDateKey(session: StudySession): string {
  const anchor = session.endTime ?? session.startTime ?? session.createdAt
  return getDateKey(new Date(anchor))
}

export function getSessionElapsedSeconds(session: StudySession): number {
  if (session.status === 'active') {
    return session.elapsedSeconds + Math.max(0, Math.floor((Date.now() - session.startTime) / 1000))
  }

  return session.elapsedSeconds
}

export function getSessionMinutes(session: StudySession): number {
  return getSessionElapsedSeconds(session) / 60
}

/** Human-readable duration, e.g. "45m" or "2h 05m", from a session. */
export function formatSessionMinutes(session: StudySession): string {
  const totalSeconds = getSessionElapsedSeconds(session)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.round((totalSeconds % 3600) / 60)
  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${String(minutes).padStart(2, '0')}m` : `${hours}h`
  }
  return `${Math.max(1, minutes)}m`
}

/** Only count meaningful (completed or partial) sessions toward totals. */
export function isStudyActivity(session: StudySession): boolean {
  return session.status === 'finished' || session.elapsedSeconds >= 60
}

function startOfDay(date: Date): number {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

function startOfWeek(date: Date): number {
  const d = startOfDay(date)
  // Monday as the first day of the week.
  const day = (new Date(d).getDay() + 6) % 7
  return d - day * 86_400_000
}

function startOfMonth(date: Date): number {
  const d = new Date(date)
  d.setDate(1)
  return startOfDay(d)
}

function isWithin(session: StudySession, startMs: number, endMs: number): boolean {
  const anchor = session.endTime ?? session.startTime ?? session.createdAt
  return anchor >= startMs && anchor < endMs
}

// ---------------------------------------------------------------------------
// Aggregations
// ---------------------------------------------------------------------------

export function groupSessionMinutesByDate(sessions: StudySession[]): Record<string, number> {
  return sessions.reduce((acc, session) => {
    const key = getSessionDateKey(session)
    acc[key] = (acc[key] ?? 0) + getSessionMinutes(session)
    return acc
  }, {} as Record<string, number>)
}

export function getTodayStudyMinutes(sessions: StudySession[]): number {
  const dayStart = startOfDay(new Date())
  const tomorrow = dayStart + 86_400_000
  return sessions
    .filter((s) => isStudyActivity(s) && isWithin(s, dayStart, tomorrow))
    .reduce((sum, s) => sum + getSessionMinutes(s), 0)
}

export function getWeekStudyMinutes(sessions: StudySession[]): number {
  const weekStart = startOfWeek(new Date())
  const nextWeek = weekStart + 7 * 86_400_000
  return sessions
    .filter((s) => isStudyActivity(s) && isWithin(s, weekStart, nextWeek))
    .reduce((sum, s) => sum + getSessionMinutes(s), 0)
}

export function getMonthStudyMinutes(sessions: StudySession[]): number {
  const monthStart = startOfMonth(new Date())
  const now = Date.now()
  return sessions
    .filter((s) => isStudyActivity(s) && isWithin(s, monthStart, now))
    .reduce((sum, s) => sum + getSessionMinutes(s), 0)
}

export function getTotalStudyMinutes(sessions: StudySession[]): number {
  return sessions
    .filter(isStudyActivity)
    .reduce((sum, s) => sum + getSessionMinutes(s), 0)
}

export function getTotalStudyHours(sessions: StudySession[]): number {
  return getTotalStudyMinutes(sessions) / 60
}

export function groupSessionMinutesByPhase(sessions: StudySession[]): Record<string, number> {
  return sessions.filter(isStudyActivity).reduce((acc, session) => {
    acc[session.phaseId] = (acc[session.phaseId] ?? 0) + getSessionMinutes(session)
    return acc
  }, {} as Record<string, number>)
}

export function groupSessionMinutesByTopic(sessions: StudySession[]): Record<string, number> {
  return sessions.filter(isStudyActivity).reduce((acc, session) => {
    acc[session.topicId] = (acc[session.topicId] ?? 0) + getSessionMinutes(session)
    return acc
  }, {} as Record<string, number>)
}

/** Aggregate session metrics for the dashboard / analytics. */
export function getSessionMetrics(sessions: StudySession[]) {
  const active = sessions.filter(isStudyActivity)
  const completed = active.filter((s) => s.status === 'finished')

  const averageMinutes = active.length === 0 ? 0 : getAverageStudyMinutes(active)
  const longestMinutes = getLongestStudyMinutes(active)
  const latest = getLatestSession(active)

  return {
    totalMinutes: getTotalStudyMinutes(active),
    todayMinutes: getTodayStudyMinutes(active),
    weekMinutes: getWeekStudyMinutes(active),
    monthMinutes: getMonthStudyMinutes(active),
    averageMinutes,
    longestMinutes,
    latestSession: latest,
    completedCount: completed.length,
    activeDays: new Set(active.map(getSessionDateKey)).size,
  }
}

// ---------------------------------------------------------------------------
// Session-derived conveniences
// ---------------------------------------------------------------------------

export function getLatestSession(sessions: StudySession[]): StudySession | null {
  if (sessions.length === 0) return null
  return [...sessions].sort((a, b) => b.updatedAt - a.updatedAt)[0] ?? null
}

export function getStudyStreak(sessions: StudySession[]): number {
  const activityDates = new Set<string>()
  for (const session of sessions) {
    if (getSessionMinutes(session) > 0) {
      activityDates.add(getSessionDateKey(session))
    }
  }

  let streak = 0
  const cursor = new Date()
  while (true) {
    const dateStr = getDateKey(cursor)
    if (!activityDates.has(dateStr)) break
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }

  return streak
}

export function getAverageStudyMinutes(sessions: StudySession[]): number {
  const meaningfulMinutes = sessions
    .filter((session) => getSessionMinutes(session) > 0)
    .map((session) => getSessionMinutes(session))

  if (meaningfulMinutes.length === 0) return 0
  return meaningfulMinutes.reduce((sum, minutes) => sum + minutes, 0) / meaningfulMinutes.length
}

export function getLongestStudyMinutes(sessions: StudySession[]): number {
  return sessions.reduce((max, session) => Math.max(max, getSessionMinutes(session)), 0)
}

// ---------------------------------------------------------------------------
// Completion forecast
// ---------------------------------------------------------------------------

/**
 * Projected study minutes within `periodDays` based on the average daily
 * velocity observed over the session history (minimum one active day).
 */
export function getProjectedStudyMinutes(sessions: StudySession[], periodDays: number): number {
  const metrics = getSessionMetrics(sessions)
  if (metrics.activeDays === 0) return 0

  const total = metrics.totalMinutes
  const dailyAverage = total / metrics.activeDays
  return dailyAverage * periodDays
}
