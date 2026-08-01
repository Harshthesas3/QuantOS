import React, { useEffect } from 'react'
import { usePlannerStore } from '../stores/plannerStore'

export function useTimerTicker() {
  const { activeTimer, getElapsedSeconds } = usePlannerStore()
  const [, setTick] = React.useState(0)

  useEffect(() => {
    if (!activeTimer) return
    const interval = setInterval(() => {
      setTick((n) => n + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [activeTimer])

  if (!activeTimer) return 0
  return getElapsedSeconds()
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${String(secs).padStart(2, '0')}`
}
