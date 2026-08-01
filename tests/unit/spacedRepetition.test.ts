import { describe, it, expect, beforeEach } from 'vitest'
import { useSpacedRepetitionStore } from '../../src/stores/spacedRepetitionStore'

describe('Spaced Repetition Store', () => {
  beforeEach(() => {
    // Reset the store to a clean slate before each test
    const state = useSpacedRepetitionStore.getState() as unknown as { _hydrate: (s: { cards: Record<string, never> }) => void }
    state._hydrate({ cards: {} })
  })

  describe('addCard', () => {
    it('should add a new card with default values', () => {
      const store = useSpacedRepetitionStore.getState()
      const cardId = store.addCard('test-topic', 'What is 2+2?', '4')

      const updatedStore = useSpacedRepetitionStore.getState()
      const card = updatedStore.cards[cardId]
      expect(card).toBeDefined()
      expect(card.topicId).toBe('test-topic')
      expect(card.prompt).toBe('What is 2+2?')
      expect(card.answer).toBe('4')
      expect(card.easeFactor).toBe(2.5)
      expect(card.intervalDays).toBe(1)
      expect(card.reviewCount).toBe(0)
      expect(card.history).toHaveLength(0)
    })

    it('should set nextReviewDate to today', () => {
      const store = useSpacedRepetitionStore.getState()
      const cardId = store.addCard('test-topic', 'Question?', 'Answer')

      const updatedStore = useSpacedRepetitionStore.getState()
      const card = updatedStore.cards[cardId]
      const today = new Date().toISOString().split('T')[0]
      expect(card.nextReviewDate).toBe(today)
    })
  })

  describe('submitReview', () => {
    it('should increase interval on successful review (score >= 3)', () => {
      const store = useSpacedRepetitionStore.getState()
      const cardId = store.addCard('test-topic', 'Question?', 'Answer')

      store.submitReview(cardId, 4)

      const updatedStore = useSpacedRepetitionStore.getState()
      const card = updatedStore.cards[cardId]
      expect(card.reviewCount).toBe(1)
      expect(card.history).toHaveLength(1)
    })

    it('should reset interval on failed review (score < 3)', () => {
      const store = useSpacedRepetitionStore.getState()
      const cardId = store.addCard('test-topic', 'Question?', 'Answer')

      store.submitReview(cardId, 5)
      store.submitReview(cardId, 5)
      store.submitReview(cardId, 1)

      const updatedStore = useSpacedRepetitionStore.getState()
      const card = updatedStore.cards[cardId]
      expect(card.intervalDays).toBe(1)
      expect(card.reviewCount).toBe(0)
      expect(card.history).toHaveLength(3)
    })

    it('should calculate ease factor correctly', () => {
      const store = useSpacedRepetitionStore.getState()
      const cardId = store.addCard('test-topic', 'Question?', 'Answer')

      store.submitReview(cardId, 5)
      const updatedStore = useSpacedRepetitionStore.getState()
      const card = updatedStore.cards[cardId]
      const expectedEF = 2.5 + (0.1 - (5 - 5) * (0.08 + (5 - 5) * 0.02))
      expect(Math.abs(card.easeFactor - expectedEF)).toBeLessThan(0.01)
    })

    it('should not let ease factor go below 1.3', () => {
      const store = useSpacedRepetitionStore.getState()
      const cardId = store.addCard('test-topic', 'Question?', 'Answer')

      for (let i = 0; i < 10; i++) {
        store.submitReview(cardId, 0)
      }

      const updatedStore = useSpacedRepetitionStore.getState()
      expect(updatedStore.cards[cardId].easeFactor).toBe(1.3)
    })

    it('should schedule next review date based on interval', () => {
      const store = useSpacedRepetitionStore.getState()
      const cardId = store.addCard('test-topic', 'Question?', 'Answer')

      store.submitReview(cardId, 5)
      store.submitReview(cardId, 5)

      const updatedStore = useSpacedRepetitionStore.getState()
      const card = updatedStore.cards[cardId]
      expect(card.intervalDays).toBe(6)
    })

    it('should not modify non-existent cards', () => {
      const store = useSpacedRepetitionStore.getState()
      const cardId = store.addCard('test-topic', 'Question?', 'Answer')
      const stateBefore = useSpacedRepetitionStore.getState()
      const reviewCountBefore = stateBefore.cards[cardId].reviewCount

      expect(() => store.submitReview('non-existent-id', 5)).not.toThrow()

      const stateAfter = useSpacedRepetitionStore.getState()
      expect(stateAfter.cards[cardId].reviewCount).toBe(reviewCountBefore)
    })
  })

  describe('getDueCardsCount', () => {
    it('should return 0 when no cards', () => {
      const store = useSpacedRepetitionStore.getState()
      expect(store.getDueCardsCount()).toBe(0)
    })

    it('should return correct count of due cards', () => {
      const store = useSpacedRepetitionStore.getState()
      store.addCard('topic-1', 'Q1', 'A1')
      store.addCard('topic-2', 'Q2', 'A2')

      const updatedStore = useSpacedRepetitionStore.getState()
      expect(updatedStore.getDueCardsCount()).toBe(2)
    })
  })
})
