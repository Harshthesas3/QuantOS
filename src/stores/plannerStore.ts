import { create } from 'zustand'

export interface DailyTask {
  id: string
  title: string
  completed: boolean
  estimatedMinutes?: number
  actualMinutes: number
  nodeId?: string
  date: string
  priority: 'low' | 'medium' | 'high'
  notes: string
}

export interface DailyLog {
  date: string
  focusRating: number
  reflection: string
}

interface PlannerState {
  tasks: Record<string, DailyTask>
  logs: Record<string, DailyLog>
  activeTimer: { taskId: string; startTime: number } | null
  addTask: (title: string, estimatedMinutes?: number, nodeId?: string, priority?: 'low' | 'medium' | 'high') => string
  toggleTaskCompleted: (id: string) => void
  deleteTask: (id: string) => void
  updateTaskTitle: (id: string, title: string) => void
  updateTaskDuration: (id: string, minutes: number) => void
  updateTaskPriority: (id: string, priority: 'low' | 'medium' | 'high') => void
  updateTaskNotes: (id: string, notes: string) => void
  updateTaskEstimatedMinutes: (id: string, minutes: number) => void
  reorderTasks: (taskId: string, direction: 'up' | 'down') => void
  setDailyLog: (focusRating: number, reflection: string) => void
  startTimer: (taskId: string) => void
  stopTimer: () => void
  carryOverUnfinishedTasks: () => void
  getTasksForDate: (date: string) => DailyTask[]
  getLogForDate: (date: string) => DailyLog | null
  getElapsedSeconds: () => number
  /** Replace the entire state on hydration. Bypasses persistence. */
  _hydrate: (state: Partial<Pick<PlannerState, 'tasks' | 'logs'>>) => void
}

export const usePlannerStore = create<PlannerState>()((set, get) => ({
  tasks: {},
  logs: {},
  activeTimer: null,

  addTask: (title, estimatedMinutes, nodeId, priority = 'medium') => {
    const id = `task-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const todayStr = new Date().toISOString().split('T')[0]
    const newTask: DailyTask = {
      id,
      title,
      completed: false,
      estimatedMinutes,
      actualMinutes: 0,
      nodeId,
      date: todayStr,
      priority,
      notes: '',
    }
    set((state) => ({
      tasks: { ...state.tasks, [id]: newTask },
    }))
    return id
  },

  toggleTaskCompleted: (id) =>
    set((state) => {
      const task = state.tasks[id]
      if (!task) return state
      return {
        tasks: {
          ...state.tasks,
          [id]: { ...task, completed: !task.completed },
        },
      }
    }),

  deleteTask: (id) =>
    set((state) => {
      const newTasks = { ...state.tasks }
      delete newTasks[id]
      let activeTimer = state.activeTimer
      if (activeTimer && activeTimer.taskId === id) {
        activeTimer = null
      }
      return { tasks: newTasks, activeTimer }
    }),

  updateTaskTitle: (id, title) =>
    set((state) => {
      const task = state.tasks[id]
      if (!task) return state
      return { tasks: { ...state.tasks, [id]: { ...task, title } } }
    }),

  updateTaskDuration: (id, minutes) =>
    set((state) => {
      const task = state.tasks[id]
      if (!task) return state
      return {
        tasks: {
          ...state.tasks,
          [id]: { ...task, actualMinutes: task.actualMinutes + minutes },
        },
      }
    }),

  updateTaskPriority: (id, priority) =>
    set((state) => {
      const task = state.tasks[id]
      if (!task) return state
      return { tasks: { ...state.tasks, [id]: { ...task, priority } } }
    }),

  updateTaskNotes: (id, notes) =>
    set((state) => {
      const task = state.tasks[id]
      if (!task) return state
      return { tasks: { ...state.tasks, [id]: { ...task, notes } } }
    }),

  updateTaskEstimatedMinutes: (id, minutes) =>
    set((state) => {
      const task = state.tasks[id]
      if (!task) return state
      return {
        tasks: { ...state.tasks, [id]: { ...task, estimatedMinutes: minutes } },
      }
    }),

  reorderTasks: (taskId, direction) =>
    set((state) => {
      const taskIds = Object.keys(state.tasks)
      const idx = taskIds.indexOf(taskId)
      if (idx === -1) return state
      const newIdx = direction === 'up' ? idx - 1 : idx + 1
      if (newIdx < 0 || newIdx >= taskIds.length) return state
      const newTasks = { ...state.tasks }
      const taskKeys = Object.keys(newTasks)
      const temp = taskKeys[idx]
      taskKeys[idx] = taskKeys[newIdx]
      taskKeys[newIdx] = temp
      const reordered: Record<string, DailyTask> = {}
      taskKeys.forEach((key) => {
        reordered[key] = newTasks[key]
      })
      return { tasks: reordered }
    }),

  setDailyLog: (focusRating, reflection) =>
    set(() => {
      const todayStr = new Date().toISOString().split('T')[0]
      return {
        logs: {
          ...get().logs,
          [todayStr]: { date: todayStr, focusRating, reflection },
        },
      }
    }),

  startTimer: (taskId) =>
    set(() => ({
      activeTimer: { taskId, startTime: Date.now() },
    })),

  stopTimer: () => {
    const state = get()
    const { activeTimer } = state
    if (!activeTimer) return
    const task = state.tasks[activeTimer.taskId]
    if (!task) {
      set({ activeTimer: null })
      return
    }
    const elapsedMs = Date.now() - activeTimer.startTime
    const elapsedMinutes = Math.max(1, Math.round(elapsedMs / 60000))
    set({
      tasks: {
        ...state.tasks,
        [activeTimer.taskId]: {
          ...task,
          actualMinutes: task.actualMinutes + elapsedMinutes,
        },
      },
      activeTimer: null,
    })
  },

  carryOverUnfinishedTasks: () =>
    set((state) => {
      const todayStr = new Date().toISOString().split('T')[0]
      const updatedTasks = { ...state.tasks }
      Object.keys(updatedTasks).forEach((key) => {
        const task = updatedTasks[key]
        if (!task.completed && task.date < todayStr) {
          task.date = todayStr
        }
      })
      return { tasks: updatedTasks }
    }),

  getTasksForDate: (date: string) => {
    return Object.values(get().tasks).filter((task) => task.date === date)
  },

  getLogForDate: (date: string) => {
    return get().logs[date] || null
  },

  getElapsedSeconds: () => {
    const timer = get().activeTimer
    if (!timer) return 0
    return Math.floor((Date.now() - timer.startTime) / 1000)
  },

  _hydrate: (slice) =>
    set((state) => ({
      ...state,
      ...(slice.tasks ? { tasks: slice.tasks } : {}),
      ...(slice.logs ? { logs: slice.logs } : {}),
    })),
}))
