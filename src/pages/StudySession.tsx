import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, Clock3, Play, Pause, Square, Shield, Sparkles, PencilLine, Quote, Target, RefreshCw, Info, Compass } from 'lucide-react'
import { useCurriculumStore } from '../stores/curriculumStore'
import { useStudySessionStore } from '../stores/studySessionStore'
import { useStudySessionTicker, formatSessionTime } from '../hooks/useStudySessionTicker'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card'
import quotes from '../data/marcusAureliusQuotes.json'

type QuoteEntry = { book: string; chapter: string; text: string }

const STATUS_TEXT: Record<string, string> = {
  active: 'Running',
  paused: 'Paused',
  finished: 'Completed',
  cancelled: 'Cancelled',
}

export default function StudySession() {
  const navigate = useNavigate()
  const { topicId } = useParams<{ topicId?: string }>()
  const { nodes } = useCurriculumStore()
  const sessions = useStudySessionStore((state) => state.sessions)
  const activeSessionId = useStudySessionStore((state) => state.activeSessionId)
  const startSession = useStudySessionStore((state) => state.startSession)
  const pauseSession = useStudySessionStore((state) => state.pauseSession)
  const resumeSession = useStudySessionStore((state) => state.resumeSession)
  const finishSession = useStudySessionStore((state) => state.finishSession)
  const cancelSession = useStudySessionStore((state) => state.cancelSession)
  const updateNotes = useStudySessionStore((state) => state.updateNotes)
  const elapsedSeconds = useStudySessionTicker()
  const [mode, setMode] = useState<'stopwatch' | 'countdown'>('stopwatch')
  const [targetMinutes, setTargetMinutes] = useState(50)

  const activeSession = activeSessionId ? sessions[activeSessionId] ?? null : null
  const topicNode = topicId ? nodes[topicId] ?? null : null
  const currentSession = activeSession ?? (topicId ? Object.values(sessions).find((session) => session.topicId === topicId) ?? null : null)

  // A session that belongs to a different topic is still controllable; the
  // page surfaces it instead of silently disabling every control.
  const foreignSession = topicNode && activeSession && activeSession.topicId !== topicNode.id ? activeSession : null
  const foreignTopic = foreignSession ? nodes[foreignSession.topicId] ?? null : null

  // Session goal (minutes). The session may carry a goalMinutes; otherwise the
  // user's countdown target acts as the in-memory goal.
  const goalMinutes = activeSession?.goalMinutes ?? targetMinutes
  const hasGoal = goalMinutes > 0

  useEffect(() => {
    if (!topicNode) return
    if (!activeSession) {
      startSession(topicNode.id, topicNode.phaseId, targetMinutes)
    }
  }, [activeSession, startSession, topicNode, targetMinutes])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === ' ' && topicNode) {
        event.preventDefault()
        if (!activeSession) {
          startSession(topicNode.id, topicNode.phaseId, targetMinutes)
          return
        }
        if (activeSession.status === 'active') {
          pauseSession()
        } else if (activeSession.status === 'paused') {
          resumeSession()
        }
      }

      if (event.key === 'Enter' && activeSession) {
        event.preventDefault()
        finishSession(true)
      }

      if (event.key === 'Escape') {
        if (activeSession && window.confirm('Cancel this study session?')) {
          event.preventDefault()
          cancelSession()
          navigate(topicNode ? `/topic/${topicNode.id}` : '/')
        } else if (!activeSession) {
          navigate(topicNode ? `/topic/${topicNode.id}` : '/')
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeSession, cancelSession, finishSession, navigate, pauseSession, resumeSession, startSession, targetMinutes, topicNode])

  const [quote, setQuote] = useState<QuoteEntry>(() => {
    const source = quotes as QuoteEntry[]
    const seed = new Date().toISOString().slice(0, 10)
    let hash = 0
    for (const char of seed) {
      hash = (hash * 31 + char.charCodeAt(0)) >>> 0
    }
    return source[hash % source.length]
  })
  const refreshQuote = () => {
    const source = quotes as QuoteEntry[]
    setQuote(source[Math.floor(Math.random() * source.length)])
  }

  const displaySeconds = currentSession ? (activeSession ? elapsedSeconds : currentSession.elapsedSeconds) : 0
  const countdownSeconds = Math.max(0, targetMinutes * 60 - displaySeconds)
  const overtimeSeconds = Math.max(0, displaySeconds - targetMinutes * 60)
  const timerSeconds = mode === 'countdown' ? countdownSeconds : displaySeconds
  const phaseLabel = currentSession ? currentSession.phaseId.replace('PHASE_', 'Phase ') : topicNode?.phaseId.replace('PHASE_', 'Phase ') ?? 'No topic selected'
  const statusLabel = currentSession ? (STATUS_TEXT[currentSession.status] ?? 'Idle') : 'Idle'

  const goalProgress = hasGoal ? Math.min(100, (displaySeconds / (goalMinutes * 60)) * 100) : 0

  const statusTone =
    currentSession?.status === 'active'
      ? 'border-[#A8C69F]/20 bg-[#A8C69F]/10 text-[#A8C69F]'
      : currentSession?.status === 'paused'
        ? 'border-[#D9B98A]/20 bg-[#D9B98A]/10 text-[#D9B98A]'
        : currentSession?.status === 'finished'
          ? 'border-[#C8BFAF]/20 bg-[#C8BFAF]/10 text-[#C8BFAF]'
          : 'border-white/10 bg-white/5 text-[#B6B0A4]'

  return (
    <div className="relative flex-1 overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(200,191,175,0.06),_transparent_30%),linear-gradient(180deg,_#0B0C10_0%,_#111318_100%)] text-[#F4F1EA]">
      <div className="absolute inset-0 opacity-30 pointer-events-none bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:56px_56px]" />
      <div className="relative max-w-7xl mx-auto px-6 py-8 space-y-6">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <Button variant="ghost" size="sm" onClick={() => navigate(topicNode ? `/topic/${topicNode.id}` : '/')}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.3em] text-[#A9A39A]">
                Study session
              </span>
              <span className={`rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.3em] ${statusTone}`}>
                {statusLabel}
              </span>
            </div>
            <div>
              <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-[#F4F1EA]">
                {topicNode ? topicNode.title : 'Select a topic to begin'}
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-[#B6B0A4]">
                {topicNode
                  ? 'A focused, SQLite-backed study space with pause, resume, finish, and session notes.'
                  : 'Open a topic from the roadmap, then start a dedicated session from there.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs text-[#A9A39A]">
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 font-mono">{phaseLabel}</span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 font-mono">
              {currentSession ? formatSessionTime(displaySeconds) : '00:00'} elapsed
            </span>
          </div>
        </header>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.8fr)]">
          <Card className="border-white/10 bg-[#111318]/85 shadow-[0_24px_80px_rgba(0,0,0,0.4)] backdrop-blur-xl">
            <CardContent className="p-6 sm:p-8 space-y-8">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-[#A9A39A]">Timer mode</p>
                  <div className="mt-2 inline-flex rounded-full border border-white/10 bg-white/5 p-1">
                    <button
                      className={`rounded-full px-4 py-2 text-sm transition-colors ${mode === 'stopwatch' ? 'bg-[#C8BFAF] text-[#111318]' : 'text-[#A9A39A] hover:text-[#F4F1EA]'}`}
                      onClick={() => setMode('stopwatch')}
                    >
                      Stopwatch
                    </button>
                    <button
                      className={`rounded-full px-4 py-2 text-sm transition-colors ${mode === 'countdown' ? 'bg-[#C8BFAF] text-[#111318]' : 'text-[#A9A39A] hover:text-[#F4F1EA]'}`}
                      onClick={() => setMode('countdown')}
                    >
                      Countdown
                    </button>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-xs uppercase tracking-[0.28em] text-[#A9A39A]">Goal</p>
                  <div className="mt-2 flex items-center gap-2 justify-end">
                    <input
                      type="number"
                      min={5}
                      step={5}
                      value={targetMinutes}
                      onChange={(e) => setTargetMinutes(Number(e.target.value) || 50)}
                      className="w-24 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-right text-sm text-[#F4F1EA] outline-none focus:border-[#C8BFAF]/50"
                    />
                    <span className="text-sm text-[#A9A39A]">min</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center gap-6 rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.06),_transparent_55%)] px-6 py-12 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                <div className="flex items-center gap-2 text-sm uppercase tracking-[0.35em] text-[#A9A39A]">
                  <Clock3 className="w-4 h-4" />
                  {mode === 'countdown' ? 'Time remaining' : 'Focused time'}
                </div>
                <div className="font-mono text-7xl sm:text-8xl font-semibold tracking-tight text-[#F4F1EA] tabular-nums">
                  {formatSessionTime(timerSeconds)}
                </div>
                {hasGoal && (
                  <div className="w-full max-w-sm">
                    <div className="flex items-center justify-between text-xs text-[#A9A39A] mb-1.5">
                      <span className="flex items-center gap-1 uppercase tracking-[0.2em]">
                        <Target className="w-3.5 h-3.5" /> Goal
                      </span>
                      <span className="font-mono">{formatSessionTime(Math.round(goalMinutes * 60))}</span>
                    </div>
                    <div className="h-1 w-full rounded-full bg-white/10 overflow-hidden">
                      <div className="h-full rounded-full bg-[#C8BFAF]/70 transition-all duration-500" style={{ width: `${goalProgress}%` }} />
                    </div>
                    {goalProgress >= 100 && (
                      <p className="text-xs text-[#A8C69F] mt-2">Goal reached — excellent focus.</p>
                    )}
                  </div>
                )}
                {mode === 'countdown' && overtimeSeconds > 0 && (
                  <p className="text-sm text-[#D9B98A]">Overtime {formatSessionTime(overtimeSeconds)}</p>
                )}
                {foreignSession && (
                  <div className="flex items-center gap-2 rounded-2xl border border-[#D9B98A]/25 bg-[#D9B98A]/10 px-4 py-3 text-sm text-[#D9B98A] text-left">
                    <Info className="w-4 h-4 shrink-0" />
                    <span>
                      A session for “{foreignTopic?.title ?? 'another topic'}” is still running — finish or
                      cancel it to start a session for {topicNode?.title}.
                    </span>
                  </div>
                )}
                <div className="flex flex-wrap items-center justify-center gap-3">
                  {!activeSession ? (
                    !topicNode ? (
                      <Button className="px-6" onClick={() => navigate('/roadmap')}>
                        <Compass className="w-4 h-4 mr-2" /> Browse the roadmap
                      </Button>
                    ) : (
                      <Button className="px-6" onClick={() => topicNode && startSession(topicNode.id, topicNode.phaseId, targetMinutes)}>
                        <Play className="w-4 h-4 mr-2" /> Start session
                      </Button>
                    )
                  ) : activeSession.status === 'active' ? (
                    <Button className="px-6" onClick={() => pauseSession()}>
                      <Pause className="w-4 h-4 mr-2" /> Pause
                    </Button>
                  ) : (
                    <Button className="px-6" onClick={() => resumeSession()}>
                      <Play className="w-4 h-4 mr-2" /> Resume
                    </Button>
                  )}
                  <Button variant="secondary" className="px-6" onClick={() => finishSession(true)} disabled={!activeSession}>
                    <CheckCircle2 className="w-4 h-4 mr-2" /> Finish
                  </Button>
                  <Button variant="destructive" className="px-6" onClick={() => {
                    if (window.confirm('Cancel this study session?')) {
                      cancelSession()
                      navigate(topicNode ? `/topic/${topicNode.id}` : '/')
                    }
                  }} disabled={!activeSession}>
                    <Square className="w-4 h-4 mr-2" /> Cancel
                  </Button>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-[11px] uppercase tracking-[0.28em] text-[#A9A39A]">Topic</p>
                  <p className="mt-2 text-sm text-[#F4F1EA]">{topicNode ? topicNode.title : 'No topic selected'}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-[11px] uppercase tracking-[0.28em] text-[#A9A39A]">Phase</p>
                  <p className="mt-2 text-sm text-[#F4F1EA]">{phaseLabel}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-[11px] uppercase tracking-[0.28em] text-[#A9A39A]">Mode</p>
                  <p className="mt-2 text-sm text-[#F4F1EA] capitalize">{mode}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border-white/10 bg-[#111318]/85 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[#F4F1EA]">
                  <PencilLine className="w-4 h-4 text-[#C8BFAF]" /> Session notes
                </CardTitle>
                <CardDescription className="text-[#A9A39A]">Capture the exact friction, insight, or next action while it is fresh.</CardDescription>
              </CardHeader>
              <CardContent>
                <textarea
                  value={currentSession?.notes ?? ''}
                  onChange={(e) => updateNotes(e.target.value)}
                  rows={10}
                  placeholder="What did you notice? What needs to happen next?"
                  className="w-full resize-none rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-[#F4F1EA] outline-none placeholder:text-[#6F736F] focus:border-[#C8BFAF]/50"
                  disabled={!activeSession}
                />
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-[#111318]/85 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div className="space-y-1.5">
                  <CardTitle className="flex items-center gap-2 text-[#F4F1EA]">
                    <Quote className="w-4 h-4 text-[#D9B98A]" /> Marcus Aurelius
                  </CardTitle>
                  <CardDescription className="text-[#A9A39A]">One reminder per day, selected from a local Meditations quote set.</CardDescription>
                </div>
                <button
                  type="button"
                  onClick={refreshQuote}
                  title="Get a new quote"
                  className="group shrink-0 rounded-full border border-white/10 bg-white/5 p-2 text-[#A9A39A] transition-colors hover:border-[#D9B98A]/40 hover:text-[#D9B98A]"
                >
                  <RefreshCw className="w-4 h-4 transition-transform duration-300 group-active:rotate-180" />
                </button>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="font-display text-sm leading-7 text-[#F4F1EA]">“{quote.text}”</p>
                <p className="text-xs uppercase tracking-[0.28em] text-[#A9A39A]">
                  Meditations {quote.book}.{quote.chapter}
                </p>
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-[#111318]/85 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
              <CardContent className="space-y-3 p-5 text-sm text-[#A9A39A]">
                <div className="flex items-center gap-2 text-[#F4F1EA]">
                  <Sparkles className="w-4 h-4 text-[#C8BFAF]" />
                  Keyboard shortcuts
                </div>
                <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                  <span>Space</span>
                  <span>Start / pause / resume</span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                  <span>Enter</span>
                  <span>Finish session</span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                  <span>Esc</span>
                  <span>Cancel / exit</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-[#111318]/85 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
              <CardContent className="flex items-center gap-3 p-5 text-sm text-[#A9A39A]">
                <Shield className="w-4 h-4 text-[#A8C69F]" />
                Session records are written to SQLite and become part of your daily dashboard and analytics.
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

