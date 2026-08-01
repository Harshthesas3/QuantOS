import { useEffect } from 'react'
import { usePlannerStore } from '../stores/plannerStore'
import { useCurriculumStore } from '../stores/curriculumStore'

/**
 * Bridge: when a planner task timer is stopped, fold the elapsed minutes
 * into the linked curriculum node's `actualHours`.
 * Rendered once at the App root.
 */
export function TaskTimeBridge() {
  useEffect(() => {
    const unsubscribe = usePlannerStore.subscribe((state, prev) => {
      const prevTimer = prev.activeTimer
      const nextTimer = state.activeTimer

      // detect a timer that just stopped
      if (prevTimer && !nextTimer) {
        const task = prev.tasks[prevTimer.taskId]
        if (task?.nodeId && prevTimer.startTime) {
          const before = task.actualMinutes
          const after = state.tasks[task.id]?.actualMinutes ?? before
          const delta = after - before
          if (delta > 0 && delta <= 240) {
            useCurriculumStore.getState().addActualHours(task.nodeId, delta / 60)
          }
        }
      }
    })

    return () => unsubscribe()
  }, [])

  return null
}
