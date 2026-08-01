import { create } from 'zustand'

export interface SM2Card {
  id: string
  topicId: string
  prompt: string
  answer: string
  easeFactor: number
  intervalDays: number
  reviewCount: number
  nextReviewDate: string // YYYY-MM-DD
  history: { date: string; score: number; interval: number; easeFactor: number }[]
}

interface SpacedRepetitionState {
  cards: Record<string, SM2Card>
  addCard: (topicId: string, prompt: string, answer: string) => string
  submitReview: (id: string, score: number) => void
  getDueCardsCount: () => number
  _hydrate: (state: { cards: Record<string, SM2Card> }) => void
}

export const useSpacedRepetitionStore = create<SpacedRepetitionState>()((set, get) => ({
  cards: {},

  addCard: (topicId, prompt, answer) => {
    const id = `card-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
    const newCard: SM2Card = {
      id,
      topicId,
      prompt,
      answer,
      easeFactor: 2.5,
      intervalDays: 1,
      reviewCount: 0,
      nextReviewDate: new Date().toISOString().split('T')[0],
      history: [],
    }
    set((state) => ({
      cards: { ...state.cards, [id]: newCard },
    }))
    return id
  },

  submitReview: (id, score) =>
    set((state) => {
      const card = state.cards[id]
      if (!card) return state

      let { easeFactor, intervalDays, reviewCount } = card
      const q = score

      // SM-2 mathematical formulation
      if (q >= 3) {
        if (reviewCount === 0) {
          intervalDays = 1
        } else if (reviewCount === 1) {
          intervalDays = 6
        } else {
          intervalDays = Math.round(intervalDays * easeFactor)
        }
        reviewCount += 1
        easeFactor = Math.max(
          1.3,
          easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)),
        )
      } else {
        intervalDays = 1
        reviewCount = 0
        easeFactor = Math.max(1.3, easeFactor - 0.16)
      }

      const todayStr = new Date().toISOString().split('T')[0]
      const nextReviewDate = new Date(
        Date.now() + intervalDays * 24 * 60 * 60 * 1000,
      )
        .toISOString()
        .split('T')[0]

      const updatedCard: SM2Card = {
        ...card,
        easeFactor,
        intervalDays,
        reviewCount,
        nextReviewDate,
        history: [
          ...card.history,
          {
            date: todayStr,
            score: q,
            interval: intervalDays,
            easeFactor,
          },
        ],
      }

      return {
        cards: { ...state.cards, [id]: updatedCard },
      }
    }),

  getDueCardsCount: () => {
    const todayStr = new Date().toISOString().split('T')[0]
    return Object.values(get().cards).filter(
      (card) => card.nextReviewDate <= todayStr,
    ).length
  },

  _hydrate: (slice) => set({ cards: slice.cards }),
}))
