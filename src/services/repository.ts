import { getDbAsync } from './db'
import { useCurriculumStore } from '../stores/curriculumStore'
import { usePlannerStore } from '../stores/plannerStore'
import { useStudySessionStore } from '../stores/studySessionStore'
import { useSpacedRepetitionStore } from '../stores/spacedRepetitionStore'
import { useUserStore } from '../stores/userStore'
import type { CurriculumNode } from '../stores/curriculumStore'
import type { DailyTask } from '../stores/plannerStore'
import type { StudySession } from '../stores/studySessionStore'
import type { SM2Card } from '../stores/spacedRepetitionStore'
import type { User } from '../stores/userStore'

interface CurriculumNodeRow {
  id: string
  phase_id: string
  title: string
  description: string
  status: CurriculumNode['status']
  estimated_hours: number
  actual_hours: number
  notes: string
  mastery_criteria_json: string
  resources_json: string
  prerequisites_json: string
  updated_at: number
}

interface PlannerTaskRow {
  id: string
  title: string
  completed: number
  estimated_minutes: number | null
  actual_minutes: number
  node_id: string | null
  date: string
  priority: 'low' | 'medium' | 'high'
  notes: string
  sort_order: number
  updated_at: number
}

interface PlannerLogRow {
  date: string
  focus_rating: number
  reflection: string
  updated_at: number
}

interface StudySessionRow {
  id: string
  topic_id: string
  phase_id: string
  start_time: number
  end_time: number | null
  duration_minutes: number
  status: StudySession['status']
  completed: number
  notes: string
  created_at: number
  updated_at: number
  elapsed_seconds: number
}

interface SM2CardRow {
  id: string
  topic_id: string
  prompt: string
  answer: string
  ease_factor: number
  interval_days: number
  review_count: number
  next_review_date: string
  history_json: string
  updated_at: number
}

interface UserRow {
  id: string
  username: string
  email: string | null
  password_hash: string | null
  created_at: number
  updated_at: number
}

function parseJson<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

// ----- Curriculum -----

export async function loadAllCurriculumNodes(): Promise<Record<string, CurriculumNode> | null> {
  try {
    const db = await getDbAsync()
    const rows = db.prepare('SELECT * FROM curriculum_node').all() as CurriculumNodeRow[]
    const out: Record<string, CurriculumNode> = {}
    for (const row of rows) {
      out[row.id] = {
        id: row.id,
        phaseId: row.phase_id,
        title: row.title,
        description: row.description,
        status: row.status,
        estimatedHours: row.estimated_hours,
        actualHours: row.actual_hours,
        notes: row.notes,
        masteryCriteria: parseJson<string[]>(row.mastery_criteria_json, []),
        resources: parseJson<CurriculumNode['resources']>(row.resources_json, []),
        prerequisites: parseJson<string[]>(row.prerequisites_json, []),
      }
    }
    return out
  } catch {
    return null
  }
}

export async function upsertCurriculumNode(node: CurriculumNode): Promise<void> {
  try {
    const db = await getDbAsync()
    db.prepare(`
      INSERT INTO curriculum_node (
        id, phase_id, title, description, status,
        estimated_hours, actual_hours, notes,
        mastery_criteria_json, resources_json, prerequisites_json,
        updated_at
      ) VALUES (@id, @phaseId, @title, @description, @status,
                @estimatedHours, @actualHours, @notes,
                @masteryCriteriaJson, @resourcesJson, @prerequisitesJson,
                @updatedAt)
      ON CONFLICT(id) DO UPDATE SET
        phase_id = excluded.phase_id,
        title = excluded.title,
        description = excluded.description,
        status = excluded.status,
        estimated_hours = excluded.estimated_hours,
        actual_hours = excluded.actual_hours,
        notes = excluded.notes,
        mastery_criteria_json = excluded.mastery_criteria_json,
        resources_json = excluded.resources_json,
        prerequisites_json = excluded.prerequisites_json,
        updated_at = excluded.updated_at
    `).run({
      id: node.id,
      phaseId: node.phaseId,
      title: node.title,
      description: node.description,
      status: node.status,
      estimatedHours: node.estimatedHours,
      actualHours: node.actualHours,
      notes: node.notes,
      masteryCriteriaJson: JSON.stringify(node.masteryCriteria),
      resourcesJson: JSON.stringify(node.resources),
      prerequisitesJson: JSON.stringify(node.prerequisites),
      updatedAt: Date.now(),
    })
  } catch {
    // best-effort
  }
}

export async function replaceAllCurriculumNodes(nodes: Record<string, CurriculumNode>): Promise<void> {
  try {
    const db = await getDbAsync()
    const tx = db.transaction((list: CurriculumNode[]) => {
      db.prepare('DELETE FROM curriculum_node').run()
      for (const node of list) {
        db.prepare(`
          INSERT INTO curriculum_node (
            id, phase_id, title, description, status,
            estimated_hours, actual_hours, notes,
            mastery_criteria_json, resources_json, prerequisites_json,
            updated_at
          ) VALUES (@id, @phaseId, @title, @description, @status,
                    @estimatedHours, @actualHours, @notes,
                    @masteryCriteriaJson, @resourcesJson, @prerequisitesJson,
                    @updatedAt)
        `).run({
          id: node.id,
          phaseId: node.phaseId,
          title: node.title,
          description: node.description,
          status: node.status,
          estimatedHours: node.estimatedHours,
          actualHours: node.actualHours,
          notes: node.notes,
          masteryCriteriaJson: JSON.stringify(node.masteryCriteria),
          resourcesJson: JSON.stringify(node.resources),
          prerequisitesJson: JSON.stringify(node.prerequisites),
          updatedAt: Date.now(),
        })
      }
    })
    tx(Object.values(nodes))
  } catch {
    // best-effort
  }
}

// ----- Planner -----

export async function loadAllPlannerTasks(): Promise<Record<string, DailyTask> | null> {
  try {
    const db = await getDbAsync()
    const rows = db
      .prepare('SELECT * FROM planner_task ORDER BY sort_order ASC')
      .all() as PlannerTaskRow[]
    const out: Record<string, DailyTask> = {}
    for (const row of rows) {
      out[row.id] = {
        id: row.id,
        title: row.title,
        completed: !!row.completed,
        estimatedMinutes: row.estimated_minutes ?? undefined,
        actualMinutes: row.actual_minutes,
        nodeId: row.node_id ?? undefined,
        date: row.date,
        priority: row.priority,
        notes: row.notes,
      }
    }
    return out
  } catch {
    return null
  }
}

export async function upsertPlannerTask(task: DailyTask, sortOrder: number): Promise<void> {
  try {
    const db = await getDbAsync()
    db.prepare(`
      INSERT INTO planner_task (
        id, title, completed, estimated_minutes, actual_minutes,
        node_id, date, priority, notes, sort_order, updated_at
      ) VALUES (@id, @title, @completed, @estimatedMinutes, @actualMinutes,
                @nodeId, @date, @priority, @notes, @sortOrder, @updatedAt)
      ON CONFLICT(id) DO UPDATE SET
        title = excluded.title,
        completed = excluded.completed,
        estimated_minutes = excluded.estimated_minutes,
        actual_minutes = excluded.actual_minutes,
        node_id = excluded.node_id,
        date = excluded.date,
        priority = excluded.priority,
        notes = excluded.notes,
        sort_order = excluded.sort_order,
        updated_at = excluded.updated_at
    `).run({
      id: task.id,
      title: task.title,
      completed: task.completed ? 1 : 0,
      estimatedMinutes: task.estimatedMinutes ?? null,
      actualMinutes: task.actualMinutes,
      nodeId: task.nodeId ?? null,
      date: task.date,
      priority: task.priority,
      notes: task.notes,
      sortOrder,
      updatedAt: Date.now(),
    })
  } catch {
    // best-effort
  }
}

export async function deletePlannerTask(id: string): Promise<void> {
  try {
    const db = await getDbAsync()
    db.prepare('DELETE FROM planner_task WHERE id = ?').run(id)
  } catch {
    // best-effort
  }
}

export async function loadAllPlannerLogs(): Promise<Record<string, { date: string; focusRating: number; reflection: string }> | null> {
  try {
    const db = await getDbAsync()
    const rows = db.prepare('SELECT * FROM planner_log').all() as PlannerLogRow[]
    const out: Record<string, { date: string; focusRating: number; reflection: string }> = {}
    for (const row of rows) {
      out[row.date] = {
        date: row.date,
        focusRating: row.focus_rating,
        reflection: row.reflection,
      }
    }
    return out
  } catch {
    return null
  }
}

export async function upsertPlannerLog(log: { date: string; focusRating: number; reflection: string }): Promise<void> {
  try {
    const db = await getDbAsync()
    db.prepare(`
      INSERT INTO planner_log (date, focus_rating, reflection, updated_at)
      VALUES (@date, @focusRating, @reflection, @updatedAt)
      ON CONFLICT(date) DO UPDATE SET
        focus_rating = excluded.focus_rating,
        reflection = excluded.reflection,
        updated_at = excluded.updated_at
    `).run({
      date: log.date,
      focusRating: log.focusRating,
      reflection: log.reflection,
      updatedAt: Date.now(),
    })
  } catch {
    // best-effort
  }
}

// ----- Study sessions -----

function toStudySession(row: StudySessionRow): StudySession {
  return {
    id: row.id,
    topicId: row.topic_id,
    phaseId: row.phase_id,
    startTime: row.start_time,
    endTime: row.end_time,
    durationMinutes: row.duration_minutes,
    status: row.status,
    completed: row.completed === 1,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    elapsedSeconds: row.elapsed_seconds,
  }
}

export async function loadAllStudySessions(): Promise<Record<string, StudySession> | null> {
  try {
    const db = await getDbAsync()
    const rows = db.prepare('SELECT * FROM study_session ORDER BY updated_at DESC').all() as StudySessionRow[]
    const out: Record<string, StudySession> = {}
    for (const row of rows) {
      out[row.id] = toStudySession(row)
    }
    return out
  } catch {
    return null
  }
}

export async function upsertStudySession(session: StudySession): Promise<void> {
  try {
    const db = await getDbAsync()
    db.prepare(
      `
      INSERT INTO study_session (
        id, topic_id, phase_id, start_time, end_time,
        duration_minutes, status, completed, notes,
        created_at, updated_at, elapsed_seconds
      ) VALUES (@id, @topicId, @phaseId, @startTime, @endTime,
                @durationMinutes, @status, @completed, @notes,
                @createdAt, @updatedAt, @elapsedSeconds)
      ON CONFLICT(id) DO UPDATE SET
        topic_id = excluded.topic_id,
        phase_id = excluded.phase_id,
        start_time = excluded.start_time,
        end_time = excluded.end_time,
        duration_minutes = excluded.duration_minutes,
        status = excluded.status,
        completed = excluded.completed,
        notes = excluded.notes,
        created_at = excluded.created_at,
        updated_at = excluded.updated_at,
        elapsed_seconds = excluded.elapsed_seconds
    `,
    ).run({
      id: session.id,
      topicId: session.topicId,
      phaseId: session.phaseId,
      startTime: session.startTime,
      endTime: session.endTime,
      durationMinutes: session.durationMinutes,
      status: session.status,
      completed: session.completed ? 1 : 0,
      notes: session.notes,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      elapsedSeconds: session.elapsedSeconds,
    })
  } catch {
    // best-effort
  }
}

// ----- SM2 -----

export async function loadAllSM2Cards(): Promise<Record<string, SM2Card> | null> {
  try {
    const db = await getDbAsync()
    const rows = db.prepare('SELECT * FROM sm2_card').all() as SM2CardRow[]
    const out: Record<string, SM2Card> = {}
    for (const row of rows) {
      out[row.id] = {
        id: row.id,
        topicId: row.topic_id,
        prompt: row.prompt,
        answer: row.answer,
        easeFactor: row.ease_factor,
        intervalDays: row.interval_days,
        reviewCount: row.review_count,
        nextReviewDate: row.next_review_date,
        history: parseJson<SM2Card['history']>(row.history_json, []),
      }
    }
    return out
  } catch {
    return null
  }
}

export async function upsertSM2Card(card: SM2Card): Promise<void> {
  try {
    const db = await getDbAsync()
    db.prepare(`
      INSERT INTO sm2_card (
        id, topic_id, prompt, answer,
        ease_factor, interval_days, review_count,
        next_review_date, history_json, updated_at
      ) VALUES (@id, @topicId, @prompt, @answer,
                @easeFactor, @intervalDays, @reviewCount,
                @nextReviewDate, @historyJson, @updatedAt)
      ON CONFLICT(id) DO UPDATE SET
        topic_id = excluded.topic_id,
        prompt = excluded.prompt,
        answer = excluded.answer,
        ease_factor = excluded.ease_factor,
        interval_days = excluded.interval_days,
        review_count = excluded.review_count,
        next_review_date = excluded.next_review_date,
        history_json = excluded.history_json,
        updated_at = excluded.updated_at
    `).run({
      id: card.id,
      topicId: card.topicId,
      prompt: card.prompt,
      answer: card.answer,
      easeFactor: card.easeFactor,
      intervalDays: card.intervalDays,
      reviewCount: card.reviewCount,
      nextReviewDate: card.nextReviewDate,
      historyJson: JSON.stringify(card.history),
      updatedAt: Date.now(),
    })
  } catch {
    // best-effort
  }
}

// ----- User -----

export async function loadUser(): Promise<User | null> {
  try {
    const db = await getDbAsync()
    const row = db.prepare('SELECT * FROM user LIMIT 1').get() as UserRow | undefined
    if (!row) return null
    return {
      id: row.id,
      username: row.username,
      email: row.email ?? `${row.username}@quantos.local`,
    }
  } catch {
    return null
  }
}

export async function loadPasswordHash(): Promise<string | null> {
  try {
    const db = await getDbAsync()
    const row = db.prepare('SELECT password_hash FROM user LIMIT 1').get() as
      | { password_hash: string | null }
      | undefined
    return row?.password_hash ?? null
  } catch {
    return null
  }
}

export async function upsertUser(user: User, passwordHash: string | null): Promise<void> {
  try {
    const db = await getDbAsync()
    const now = Date.now()
    const existing = await loadUser()
    if (!existing) {
      db.prepare(`
        INSERT INTO user (id, username, email, password_hash, created_at, updated_at)
        VALUES (@id, @username, @email, @passwordHash, @createdAt, @updatedAt)
      `).run({
        id: user.id,
        username: user.username,
        email: user.email,
        passwordHash,
        createdAt: now,
        updatedAt: now,
      })
    } else {
      db.prepare(`
        UPDATE user SET username = @username, email = @email,
          password_hash = @passwordHash, updated_at = @updatedAt
        WHERE id = @id
      `).run({
        id: user.id,
        username: user.username,
        email: user.email,
        passwordHash,
        updatedAt: now,
      })
    }
  } catch {
    // best-effort
  }
}

// ----- Bootstrap -----

/**
 * Hydrate the stores from SQLite on app boot.
 * Returns `true` if persistence is available, `false` if the underlying
 * native module is unavailable for any reason.
 */
export async function hydrateFromDb(): Promise<boolean> {
  let nodes: Record<string, CurriculumNode> | null = null
  let tasks: Record<string, DailyTask> | null = null
  let logs: Record<string, { date: string; focusRating: number; reflection: string }> | null = null
  let sessions: Record<string, StudySession> | null = null
  let cards: Record<string, SM2Card> | null = null
  let user: User | null = null

  try {
    nodes = await loadAllCurriculumNodes()
    tasks = await loadAllPlannerTasks()
    logs = await loadAllPlannerLogs()
    sessions = await loadAllStudySessions()
    cards = await loadAllSM2Cards()
    user = await loadUser()
  } catch {
    return false
  }

  if (nodes && Object.keys(nodes).length > 0) {
    useCurriculumStore.getState()._hydrate({ nodes })
  } else {
    try {
      await replaceAllCurriculumNodes(useCurriculumStore.getState().nodes)
    } catch {
      // best-effort
    }
  }
  if (tasks || logs) {
    usePlannerStore.getState()._hydrate({ tasks: tasks ?? {}, logs: logs ?? {} })
  }
  if (sessions && Object.keys(sessions).length > 0) {
    useStudySessionStore.getState()._hydrate({ sessions })
  }
  if (cards) {
    useSpacedRepetitionStore.getState()._hydrate({ cards })
  }
  if (user) {
    useUserStore.getState().setUser(user)
  }
  return true
}

/**
 * Subscribe each store so mutations persist automatically.
 * Call once after `hydrateFromDb`.
 */
export function installPersistence(): () => void {
  const unsubs: Array<() => void> = []

  unsubs.push(
    useCurriculumStore.subscribe((state, prev) => {
      if (state.nodes === prev.nodes) return
      const ids = Object.keys(state.nodes)
      for (const id of ids) {
        const node = state.nodes[id]
        const before = prev.nodes[id]
        if (before !== node) {
          void upsertCurriculumNode(node)
        }
      }
    }),
  )

  unsubs.push(
    usePlannerStore.subscribe((state, prev) => {
      if (state.tasks !== prev.tasks) {
        const next = state.tasks
        const ids = new Set<string>([...Object.keys(next), ...Object.keys(prev.tasks)])
        let order = 0
        for (const id of ids) {
          const task = next[id]
          if (task) {
            void upsertPlannerTask(task, order++)
          } else {
            void deletePlannerTask(id)
          }
        }
      }
      if (state.logs !== prev.logs) {
        for (const log of Object.values(state.logs)) {
          void upsertPlannerLog(log)
        }
      }
    }),
  )

  unsubs.push(
    useStudySessionStore.subscribe((state, prev) => {
      if (state.sessions === prev.sessions) return
      for (const session of Object.values(state.sessions)) {
        void upsertStudySession(session)
      }
    }),
  )

  unsubs.push(
    useSpacedRepetitionStore.subscribe((state, prev) => {
      if (state.cards === prev.cards) return
      for (const card of Object.values(state.cards)) {
        void upsertSM2Card(card)
      }
    }),
  )

  unsubs.push(
    useUserStore.subscribe((state, prev) => {
      if (state.user === prev.user) return
      if (!state.user) return
      void (async () => {
        const existing = await loadPasswordHash()
        await upsertUser(state.user!, existing)
      })()
    }),
  )

  return () => {
    for (const u of unsubs) u()
  }
}
