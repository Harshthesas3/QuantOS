import { useEffect } from 'react'
import { toastInfo } from '../lib/toast'

const STORAGE_NOTIFICATIONS = 'quantos.settings.notifications'
const STORAGE_DAILY_REMINDER = 'quantos.settings.dailyReminders'
const STORAGE_LAST_REMINDER = 'quantos.settings.dailyReminders.lastFired'

function readDailyReminder(): string {
  try {
    return localStorage.getItem(STORAGE_DAILY_REMINDER) ?? '18:00'
  } catch {
    return '18:00'
  }
}

function notificationsEnabled(): boolean {
  try {
    return localStorage.getItem(STORAGE_NOTIFICATIONS) !== 'false'
  } catch {
    return true
  }
}

function shouldFireReminder(now: Date, reminderTime: string): boolean {
  const [hoursText, minutesText] = reminderTime.split(':')
  const hours = Number.parseInt(hoursText ?? '18', 10)
  const minutes = Number.parseInt(minutesText ?? '0', 10)

  if (Number.isNaN(hours) || Number.isNaN(minutes)) return false

  const target = new Date(now)
  target.setHours(hours, minutes, 0, 0)

  return now >= target
}

export function useDailyReminder(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return

    const checkReminder = () => {
      if (!notificationsEnabled()) return

      const reminderTime = readDailyReminder()
      const now = new Date()
      const today = now.toISOString().split('T')[0]

      if (!shouldFireReminder(now, reminderTime)) return

      try {
        const lastFired = localStorage.getItem(STORAGE_LAST_REMINDER)
        if (lastFired === today) return
        localStorage.setItem(STORAGE_LAST_REMINDER, today)
      } catch {
        // ignore localStorage failures and keep the app usable
      }

      toastInfo('Daily reminder', `Scheduled check-in for ${reminderTime}.`)
    }

    checkReminder()
    const interval = window.setInterval(checkReminder, 60_000)

    return () => window.clearInterval(interval)
  }, [enabled])
}