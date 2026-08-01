import { describe, it, expect, beforeEach } from 'vitest'
import { usePlannerStore } from '../../src/stores/plannerStore'

describe('Planner Store', () => {
  beforeEach(() => {
    usePlannerStore.setState({
      tasks: {},
      logs: {},
      activeTimer: null,
    })
  })

  describe('addTask', () => {
    it('creates a task with sensible defaults', () => {
      const id = usePlannerStore.getState().addTask('Solve 5 PDEs', 30)
      const task = usePlannerStore.getState().tasks[id]
      expect(task).toBeDefined()
      expect(task.title).toBe('Solve 5 PDEs')
      expect(task.estimatedMinutes).toBe(30)
      expect(task.priority).toBe('medium')
      expect(task.completed).toBe(false)
      expect(task.actualMinutes).toBe(0)
      const today = new Date().toISOString().split('T')[0]
      expect(task.date).toBe(today)
    })
  })

  describe('toggleTaskCompleted', () => {
    it('flips the completed flag', () => {
      const id = usePlannerStore.getState().addTask('Read Avellaneda')
      usePlannerStore.getState().toggleTaskCompleted(id)
      expect(usePlannerStore.getState().tasks[id].completed).toBe(true)
      usePlannerStore.getState().toggleTaskCompleted(id)
      expect(usePlannerStore.getState().tasks[id].completed).toBe(false)
    })

    it('does nothing for unknown ids', () => {
      const before = usePlannerStore.getState().tasks
      usePlannerStore.getState().toggleTaskCompleted('does-not-exist')
      expect(usePlannerStore.getState().tasks).toBe(before)
    })
  })

  describe('priority', () => {
    it('updates priority', () => {
      const id = usePlannerStore.getState().addTask('Backtest', 60, undefined, 'low')
      usePlannerStore.getState().updateTaskPriority(id, 'high')
      expect(usePlannerStore.getState().tasks[id].priority).toBe('high')
    })
  })

  describe('reorderTasks', () => {
    it('moves a task up', () => {
      const a = usePlannerStore.getState().addTask('A')
      const b = usePlannerStore.getState().addTask('B')
      usePlannerStore.getState().reorderTasks(b, 'up')
      const ids = Object.keys(usePlannerStore.getState().tasks)
      expect(ids.indexOf(b)).toBeLessThan(ids.indexOf(a))
    })

    it('no-ops when moving the first task up', () => {
      const a = usePlannerStore.getState().addTask('A')
      const before = usePlannerStore.getState().tasks
      usePlannerStore.getState().reorderTasks(a, 'up')
      expect(usePlannerStore.getState().tasks).toBe(before)
    })
  })

  describe('timer', () => {
    it('startTimer sets activeTimer and stopTimer clears it', () => {
      const id = usePlannerStore.getState().addTask('Study')
      usePlannerStore.getState().startTimer(id)
      expect(usePlannerStore.getState().activeTimer?.taskId).toBe(id)

      usePlannerStore.getState().stopTimer()
      expect(usePlannerStore.getState().activeTimer).toBeNull()
    })

    it('stopTimer folds elapsed minutes into actualMinutes', () => {
      const id = usePlannerStore.getState().addTask('Study')
      usePlannerStore.getState().startTimer(id)
      // Fake 4 minute duration by manually patching startTime
      usePlannerStore.setState((state) => ({
        ...state,
        activeTimer: state.activeTimer
          ? { ...state.activeTimer, startTime: Date.now() - 4 * 60 * 1000 }
          : null,
      }))
      usePlannerStore.getState().stopTimer()
      const finalTask = usePlannerStore.getState().tasks[id]
      expect(finalTask.actualMinutes).toBeGreaterThanOrEqual(3)
    })

    it('deleteTask while timer is running clears the timer', () => {
      const id = usePlannerStore.getState().addTask('Study')
      usePlannerStore.getState().startTimer(id)
      usePlannerStore.getState().deleteTask(id)
      expect(usePlannerStore.getState().activeTimer).toBeNull()
    })
  })

  describe('carryOverUnfinishedTasks', () => {
    it('moves unfinished past tasks to today', () => {
      const id = usePlannerStore.getState().addTask('Yesterday')
      // mutate the task date to yesterday
      const tasks = { ...usePlannerStore.getState().tasks }
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0]
      tasks[id] = { ...tasks[id], date: yesterday, completed: false }
      usePlannerStore.setState({ tasks })

      usePlannerStore.getState().carryOverUnfinishedTasks()
      const today = new Date().toISOString().split('T')[0]
      expect(usePlannerStore.getState().tasks[id].date).toBe(today)
    })

    it('does not touch completed tasks', () => {
      const id = usePlannerStore.getState().addTask('Yesterday')
      const tasks = { ...usePlannerStore.getState().tasks }
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0]
      tasks[id] = { ...tasks[id], date: yesterday, completed: true }
      usePlannerStore.setState({ tasks })

      usePlannerStore.getState().carryOverUnfinishedTasks()
      expect(usePlannerStore.getState().tasks[id].date).toBe(yesterday)
    })
  })

  describe('daily log', () => {
    it('writes a log for today', () => {
      usePlannerStore.getState().setDailyLog(4, 'productive morning')
      const today = new Date().toISOString().split('T')[0]
      const log = usePlannerStore.getState().logs[today]
      expect(log?.focusRating).toBe(4)
      expect(log?.reflection).toBe('productive morning')
    })
  })
})
