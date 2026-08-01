import { toastSuccess, toastWarning } from '../lib/toast'
import { useState, useEffect } from 'react'
import { Calendar, Play, Square, CheckCircle, Trash2, Star, Edit2, Save, X, ArrowUp, ArrowDown, Plus, ChevronLeft, ChevronRight } from 'lucide-react'
import { usePlannerStore, type DailyTask } from '../stores/plannerStore'
import { useSpacedRepetitionStore, SM2Card } from '../stores/spacedRepetitionStore'
import { useCurriculumStore } from '../stores/curriculumStore'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Input } from '../components/ui/input'
import { Select } from '../components/ui/select'
import { useTimerTicker, formatTime } from '../hooks/useTimerTicker'

export default function DailyPlanner() {
  const todayStr = new Date().toISOString().split('T')[0]
  const { logs, activeTimer, addTask, toggleTaskCompleted, deleteTask, updateTaskTitle, updateTaskPriority, updateTaskNotes, updateTaskEstimatedMinutes, reorderTasks, setDailyLog, startTimer, stopTimer, carryOverUnfinishedTasks, getTasksForDate } = usePlannerStore()
  const { cards, submitReview } = useSpacedRepetitionStore()
  const { nodes } = useCurriculumStore()
  const elapsedSeconds = useTimerTicker()

  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskEst, setNewTaskEst] = useState(30)
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high'>('medium')
  const [reflectionText, setReflectionText] = useState('')
  const [focusRating, setFocusRating] = useState(5)
  const [editingTask, setEditingTask] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editEst, setEditEst] = useState(30)
  const [editPriority, setEditPriority] = useState<'low' | 'medium' | 'high'>('medium')
  const [editNotes, setEditNotes] = useState('')
  const [taskPage, setTaskPage] = useState(0)
  const tasksPerPage = 10
  const [revisionMode, setRevisionMode] = useState(false)
  const [currentCard, setCurrentCard] = useState<SM2Card | null>(null)
  const [showAnswer, setShowAnswer] = useState(false)

  useEffect(() => {
    carryOverUnfinishedTasks()
  }, [])

  useEffect(() => {
    const todayLog = logs[todayStr]
    if (todayLog) {
      setReflectionText(todayLog.reflection || '')
      setFocusRating(todayLog.focusRating || 5)
    }
  }, [logs, todayStr])

  const todayTasks = getTasksForDate(todayStr)
  const totalPages = Math.ceil(todayTasks.length / tasksPerPage)
  const paginatedTasks = todayTasks.slice(taskPage * tasksPerPage, (taskPage + 1) * tasksPerPage)

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault()
    if (newTaskTitle.trim()) {
      addTask(newTaskTitle.trim(), newTaskEst, undefined, newTaskPriority)
      setNewTaskTitle('')
      setNewTaskEst(30)
      setNewTaskPriority('medium')
      toastSuccess('Task added')
    }
  }

  const handleSaveLog = () => {
    setDailyLog(focusRating, reflectionText)
    toastSuccess('Reflection log saved!')
  }

  const handleStartEdit = (task: DailyTask) => {
    setEditingTask(task.id)
    setEditTitle(task.title)
    setEditEst(task.estimatedMinutes || 30)
    setEditPriority(task.priority || 'medium')
    setEditNotes(task.notes || '')
  }

  const handleSaveEdit = (taskId: string) => {
    updateTaskTitle(taskId, editTitle.trim())
    updateTaskEstimatedMinutes(taskId, editEst)
    updateTaskPriority(taskId, editPriority)
    updateTaskNotes(taskId, editNotes)
    setEditingTask(null)
    toastSuccess('Task updated')
  }

  const handleCancelEdit = () => {
    setEditingTask(null)
  }

  const dueCards = Object.values(cards).filter((c) => c.nextReviewDate <= todayStr)

  const handleStartRevision = () => {
    if (dueCards.length > 0) {
      setCurrentCard(dueCards[0])
      setShowAnswer(false)
      setRevisionMode(true)
    } else {
      toastWarning('No flashcards due for review today!')
    }
  }

  const handleReviewScore = (score: number) => {
    if (currentCard) {
      submitReview(currentCard.id, score)
      const remainingDue = Object.values(useSpacedRepetitionStore.getState().cards)
        .filter((c) => c.nextReviewDate <= todayStr && c.id !== currentCard.id)

      if (remainingDue.length > 0) {
        setCurrentCard(remainingDue[0])
        setShowAnswer(false)
      } else {
        setCurrentCard(null)
        setRevisionMode(false)
        toastSuccess('Revision session completed successfully!')
      }
    }
  }

  const runningTask = activeTimer && todayTasks.find((t) => t.id === activeTimer.taskId)

  const priorityColors = {
    low: 'text-green-400 bg-green-500/10',
    medium: 'text-yellow-400 bg-yellow-500/10',
    high: 'text-red-400 bg-red-500/10',
  }

  return (
    <div className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-6 text-[#FAFAFA]">
      <header className="pb-4 border-b border-[#27272A] flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Calendar className="w-7 h-7 text-[#38BDF8]" />
            Daily Planner
          </h1>
          <p className="text-sm text-[#A1A1AA] mt-1">Manage daily objectives, track time, and review flashcards.</p>
        </div>
        <Button onClick={handleStartRevision} variant="secondary" className="!text-xs" disabled={dueCards.length === 0}>
            Review Due Cards ({dueCards.length})
          </Button>
      </header>

      {activeTimer && (
        <Card variant="glass" className="border-[#38BDF8]/40">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white text-sm font-medium">
                  Studying: {runningTask?.title || 'Unknown task'}
                </CardTitle>
                <CardDescription className="text-[#A1A1AA] mt-1">
                  Elapsed: <span className="font-mono text-[#38BDF8]">{formatTime(elapsedSeconds)}</span>
                </CardDescription>
              </div>
              <Button onClick={() => stopTimer()} variant="destructive" size="sm">
                <Square className="w-3.5 h-3.5 fill-white" />
                Stop
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {revisionMode && currentCard && (
        <Card variant="glass" className="border-[#38BDF8]/40">
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <Badge status="info" variant="solid">
                Topic: {nodes[currentCard.topicId]?.title || currentCard.topicId}
              </Badge>
              <button
                onClick={() => { setRevisionMode(false); setCurrentCard(null) }}
                className="text-xs text-[#A1A1AA] hover:text-[#FAFAFA]"
              >
                Exit Session
              </button>
            </div>

            <div className="space-y-4 text-center py-6">
              <h3 className="text-xl font-bold text-white">{currentCard.prompt}</h3>
              {showAnswer ? (
                <div className="p-4 bg-[#0d0e12] rounded border border-[#27272A] font-mono text-sm text-green-400 mt-4">
                  {currentCard.answer}
                </div>
              ) : (
                <Button onClick={() => setShowAnswer(true)} variant="secondary" className="!text-xs">
                  Reveal Solution
                </Button>
              )}
            </div>

            {showAnswer && (
              <div className="space-y-3">
                <span className="text-xs text-[#A1A1AA] block text-center">Rate your recall quality (0: Forgot, 5: Perfect)</span>
                <div className="flex justify-center gap-2">
                  {[0, 1, 2, 3, 4, 5].map((score) => (
                    <button
                      key={score}
                      onClick={() => handleReviewScore(score)}
                      className="px-4 py-2 bg-[#27272A] hover:bg-[#38BDF8] hover:text-[#0D0E12] border border-[#27272A] rounded text-xs font-bold font-mono transition-colors"
                    >
                      {score}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card variant="glass">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-white">Today's Tasks</CardTitle>
              <CardDescription>
                {todayTasks.length} task{todayTasks.length !== 1 ? 's' : ''} for today
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleAddTask} className="flex gap-3 flex-wrap">
                <Input
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="Add daily task objective..."
                  className="flex-1 min-w-[200px]"
                />
                <Input
                  type="number"
                  value={newTaskEst}
                  onChange={(e) => setNewTaskEst(parseInt(e.target.value) || 30)}
                  placeholder="Mins"
                  className="w-20"
                  min="1"
                />
                <Select value={newTaskPriority} onChange={(e) => setNewTaskPriority(e.target.value as 'low' | 'medium' | 'high')}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </Select>
                <Button type="submit" size="sm" className="!px-3">
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add
                </Button>
              </form>

              {paginatedTasks.length > 0 ? (
                <ul className="space-y-3">
                  {paginatedTasks.map((task) => {
                    const isRunning = activeTimer && activeTimer.taskId === task.id
                    const priorityClass = priorityColors[task.priority || 'medium']

                    if (editingTask === task.id) {
                      return (
                        <li key={task.id} className="p-4 bg-[#0d0e12] border border-[#27272A] rounded-lg space-y-3">
                          <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="!text-sm" />
                          <div className="flex gap-2 items-center">
                            <Input type="number" value={editEst} onChange={(e) => setEditEst(parseInt(e.target.value) || 30)} className="w-20 !text-xs" min="1" />
                            <Select value={editPriority} onChange={(e) => setEditPriority(e.target.value as 'low' | 'medium' | 'high')}>
                              <option value="low">Low</option>
                              <option value="medium">Medium</option>
                              <option value="high">High</option>
                            </Select>
                          </div>
                          <textarea
                            value={editNotes}
                            onChange={(e) => setEditNotes(e.target.value)}
                            placeholder="Task notes..."
                            className="w-full min-h-[60px] bg-[#121318] border border-[#27272A] p-2 rounded text-xs text-white placeholder-[#A1A1AA] focus:outline-none focus:border-[#38BDF8] resize-y"
                          />
                          <div className="flex gap-2">
                            <Button size="sm" variant="secondary" onClick={() => handleSaveEdit(task.id)}><Save className="w-3 h-3" /></Button>
                            <Button size="sm" variant="ghost" onClick={handleCancelEdit}><X className="w-3 h-3" /></Button>
                          </div>
                        </li>
                      )
                    }

                    return (
                      <li key={task.id} className="p-4 bg-[#0d0e12] border border-[#27272A] rounded-lg">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => toggleTaskCompleted(task.id)}
                            className={`w-5 h-5 border rounded flex items-center justify-center transition-colors flex-shrink-0 ${
                              task.completed ? 'bg-green-600 border-green-600 text-white' : 'border-[#27272A]'
                            }`}
                          >
                            {task.completed && <CheckCircle className="w-3.5 h-3.5 fill-white" />}
                          </button>
                          <div className="flex-1 min-w-0">
                            <span className={`text-sm ${task.completed ? 'line-through text-[#A1A1AA]' : 'text-white'}`}>{task.title}</span>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${priorityClass}`}>{task.priority}</span>
                              {task.estimatedMinutes && (
                                <span className="text-[10px] text-[#A1A1AA] font-mono">{task.estimatedMinutes}m est.</span>
                              )}
                              <span className="text-[10px] text-[#A1A1AA] font-mono">{task.actualMinutes}m actual</span>
                            </div>
                            {task.notes && (
                              <p className="text-[10px] text-[#71717A] mt-1 line-clamp-1">{task.notes}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button onClick={() => reorderTasks(task.id, 'up')} className="p-1 text-[#A1A1AA] hover:text-white disabled:opacity-30" disabled={taskPage === 0 && paginatedTasks.indexOf(task) === 0}>
                              <ArrowUp className="w-3 h-3" />
                            </button>
                            <button onClick={() => reorderTasks(task.id, 'down')} className="p-1 text-[#A1A1AA] hover:text-white disabled:opacity-30" disabled={taskPage === totalPages - 1 && paginatedTasks.indexOf(task) === paginatedTasks.length - 1}>
                              <ArrowDown className="w-3 h-3" />
                            </button>
                            <button onClick={() => handleStartEdit(task)} className="p-1 text-[#A1A1AA] hover:text-white" title="Edit">
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            {isRunning ? (
                              <button onClick={() => stopTimer()} className="p-1 text-red-400 hover:text-red-500" title="Stop timer">
                                <Square className="w-3.5 h-3.5 fill-current" />
                              </button>
                            ) : (
                              <button onClick={() => startTimer(task.id)} className="p-1 text-[#A1A1AA] hover:text-white" title="Start timer">
                                <Play className="w-3.5 h-3.5 fill-current" />
                              </button>
                            )}
                            <button onClick={() => deleteTask(task.id)} className="p-1 text-red-400 hover:text-red-500" title="Delete">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              ) : (
                <div className="text-sm text-[#A1A1AA] py-8 text-center">No tasks for today. Add one above!</div>
              )}

              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-2 border-t border-[#27272A]/50">
                  <span className="text-xs text-[#A1A1AA]">Page {taskPage + 1} of {totalPages}</span>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => setTaskPage(p => Math.max(0, p - 1))} disabled={taskPage === 0}>
                      <ChevronLeft className="w-3 h-3" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setTaskPage(p => Math.min(totalPages - 1, p + 1))} disabled={taskPage >= totalPages - 1}>
                      <ChevronRight className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card variant="glass">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-white">Daily Log & Reflection</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs text-[#A1A1AA] uppercase tracking-wider font-semibold">Focus Rating (1-5)</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((stars) => (
                    <button key={stars} onClick={() => setFocusRating(stars)} className="p-1">
                      <Star className={`w-6 h-6 ${stars <= focusRating ? 'text-[#38BDF8] fill-[#38BDF8]' : 'text-[#27272A]'}`} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-[#A1A1AA] uppercase tracking-wider font-semibold">Qualitative reflection notes</label>
                <textarea
                  value={reflectionText}
                  onChange={(e) => setReflectionText(e.target.value)}
                  placeholder="Log your state, obstacles faced, or breakthroughs achieved today..."
                  className="w-full min-h-[120px] bg-[#0d0e12] border border-[#27272A] p-3 rounded text-xs text-white placeholder-[#A1A1AA] focus:outline-none focus:border-[#38BDF8]"
                />
              </div>

              <Button onClick={handleSaveLog} variant="secondary" className="w-full !text-xs">
                Save Daily Log
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}