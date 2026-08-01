import React, { useEffect } from 'react'
import { useStudySessionStore } from '../stores/studySessionStore'

export function useStudySessionTicker() {
  const { getElapsedSeconds, activeSessionId } = useStudySessionStore()
  const [, setTick] = React.useState(0)

  useEffect(() => {
    if (!activeSessionId) return
    const interval = setInterval(() => {
      setTick((n) => n + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [activeSessionId])

  return getElapsedSeconds()
}

export function formatSessionTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hours > 0) {
    return `${hours}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  return `${mins}:${String(secs).padStart(2, '0')}`
}