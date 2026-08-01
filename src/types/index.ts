import type { CurriculumNode } from '../stores/curriculumStore'
import type { DailyTask } from '../stores/plannerStore'
import type { SM2Card } from '../stores/spacedRepetitionStore'
import type { User } from '../stores/userStore'

export interface ExportPayload {
  version: string
  exportedAt: string
  user: User | null
  curriculum: { nodes: Record<string, CurriculumNode> }
  planner: {
    tasks: Record<string, DailyTask>
    logs: Record<string, { date: string; focusRating: number; reflection: string }>
  }
  spacedRepetition: { cards: Record<string, SM2Card> }
}

export type {
  CurriculumNode,
  DailyTask,
  SM2Card,
  User,
}
