import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useCurriculumStore } from '../../src/stores/curriculumStore'

describe('Curriculum Store', () => {
  beforeEach(async () => {
    vi.resetModules()
    const mod = await import('../../src/stores/curriculumStore')
    const seed = mod.generateCurriculumNodes()
    useCurriculumStore.setState({ nodes: seed })
  })

  describe('getCriticalPath', () => {
    it('returns the longest uncompleted path', () => {
      const store = useCurriculumStore.getState()
      const criticalPath = store.getCriticalPath()

      expect(criticalPath).toContain('P0-1')
      expect(criticalPath.length).toBeGreaterThan(0)
    })

    it('does not include completed nodes after invalidation', async () => {
      vi.resetModules()
      const mod = await import('../../src/stores/curriculumStore')
      const seed = mod.generateCurriculumNodes()
      useCurriculumStore.setState({ nodes: seed })
      const ids = ['P0-1','P0-2','P0-3','P0-4','P0-5','P0-6','P0-7','P0-8']
      for (const id of ids) {
        useCurriculumStore.getState().updateNodeStatus(id, 'COMPLETED')
      }
      const path = useCurriculumStore.getState().getCriticalPath()

      expect(path).not.toContain('P0-1')
      expect(path).not.toContain('P0-2')
    })
  })

  describe('updateNodeStatus', () => {
    it('updates the node status', () => {
      const store = useCurriculumStore.getState()
      store.updateNodeStatus('P0-1', 'IN_PROGRESS')

      const updatedStore = useCurriculumStore.getState()
      const node = updatedStore.nodes['P0-1']
      expect(node.status).toBe('IN_PROGRESS')
    })

    it('unlocks dependent nodes when prerequisites are completed', async () => {
      vi.resetModules()
      const mod = await import('../../src/stores/curriculumStore')
      const seed = mod.generateCurriculumNodes()
      useCurriculumStore.setState({ nodes: seed })

      useCurriculumStore.getState().updateNodeStatus('P0-1', 'IN_PROGRESS')
      useCurriculumStore.getState().updateNodeStatus('P0-1', 'COMPLETED')
      useCurriculumStore.getState().updateNodeStatus('P0-2', 'COMPLETED')

      const node3 = useCurriculumStore.getState().nodes['P0-3']
      expect(node3.status).toBe('UNLOCKED')
    })
  })

  describe('toggleMasteryCriterion', () => {
    it('toggles a mastery criterion', () => {
      const initialState = useCurriculumStore.getState()
      const initial = { ...initialState.nodes['P0-1'].masteryCriteria }

      const store = useCurriculumStore.getState()
      store.toggleMasteryCriterion('P0-1', 0)
      const toggled = useCurriculumStore.getState().nodes['P0-1'].masteryCriteria

      expect(toggled[0]).not.toBe(initial[0])
      expect(toggled[0]).toContain('[x]')
    })

    it('untoggles a checked criterion', () => {
      const store = useCurriculumStore.getState()

      store.toggleMasteryCriterion('P0-1', 0)
      const checked = useCurriculumStore.getState().nodes['P0-1'].masteryCriteria[0]

      store.toggleMasteryCriterion('P0-1', 0)
      const unchecked = useCurriculumStore.getState().nodes['P0-1'].masteryCriteria[0]

      expect(checked).toContain('[x]')
      expect(unchecked).not.toContain('[x]')
    })
  })

  describe('removeResource', () => {
    it('removes a resource from the node', () => {
      const before = useCurriculumStore.getState().nodes['P0-1'].resources.length
      useCurriculumStore.getState().removeResource('P0-1', 'res-1')
      const after = useCurriculumStore.getState().nodes['P0-1'].resources.length
      expect(after).toBe(before - 1)
    })
  })
})
