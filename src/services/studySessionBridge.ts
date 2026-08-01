import { useEffect } from 'react'
import { useCurriculumStore } from '../stores/curriculumStore'
import { useStudySessionStore } from '../stores/studySessionStore'

export function StudySessionBridge() {
  useEffect(() => {
    const unsubscribe = useStudySessionStore.subscribe((state, prev) => {
      const prevSession = prev.activeSessionId ? prev.sessions[prev.activeSessionId] : null
      const nextSession = state.activeSessionId ? state.sessions[state.activeSessionId] : null

      if (prevSession?.status !== 'finished' && nextSession?.status === 'finished' && nextSession.completed) {
        const hours = nextSession.durationMinutes / 60
        if (hours > 0) {
          useCurriculumStore.getState().addActualHours(nextSession.topicId, hours)
        }
      }
    })

    return () => unsubscribe()
  }, [])

  return null
}