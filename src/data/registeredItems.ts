export type ScheduleStatus = 'planned' | 'past' | 'cancelled'
export type TodoStatus = 'inProgress' | 'completed' | 'notNeeded'
export type ValidityReviewStatus = 'notRequested' | 'pending' | 'stillValid' | 'notNeeded'

export type RegisteredSchedule = {
  id: string
  roomId: string
  kind: 'schedule'
  title: string
  createdAt: string
  date: string
  time: string
  endDate: string
  endTime: string
  allDay: boolean
  calendar: boolean
  location: string
  description: string
  reminderMinutes: number | null
  status: ScheduleStatus
}

export type RegisteredTodo = {
  id: string
  roomId: string
  kind: 'todo'
  title: string
  createdAt: string
  dueAt: string | null
  status: TodoStatus
  validityReviewStatus: ValidityReviewStatus
  reviewPromptShownAt: string | null
  repeat: string
  challengeTracking: boolean
  reminderMinutes: number | null
}

export type RegisteredItem = RegisteredSchedule | RegisteredTodo

const STORAGE_KEY = 'kakao-study-registered-items-v1'
const scheduleStatuses: ScheduleStatus[] = ['planned', 'past', 'cancelled']
const todoStatuses: TodoStatus[] = ['inProgress', 'completed', 'notNeeded']
const reviewStatuses: ValidityReviewStatus[] = ['notRequested', 'pending', 'stillValid', 'notNeeded']

function localDateString(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function endOfLocalDayIso(date: string) {
  const [year, month, day] = date.split('-').map(Number)
  return new Date(year, month - 1, day, 23, 59, 59).toISOString()
}

function normalizeItem(value: unknown): RegisteredItem | null {
  if (!value || typeof value !== 'object') return null
  const item = value as Record<string, unknown>
  if ((item.kind !== 'schedule' && item.kind !== 'todo') || typeof item.id !== 'string' || typeof item.roomId !== 'string' || typeof item.title !== 'string') return null
  const createdAt = typeof item.createdAt === 'string' ? item.createdAt : new Date().toISOString()

  if (item.kind === 'schedule') {
    const date = typeof item.date === 'string' ? item.date : typeof item.startDate === 'string' ? item.startDate : localDateString()
    const time = typeof item.time === 'string' ? item.time : typeof item.startTime === 'string' ? item.startTime : ''
    const status = scheduleStatuses.includes(item.status as ScheduleStatus) ? item.status as ScheduleStatus : 'planned'
    return {
      id: item.id, roomId: item.roomId, kind: 'schedule', title: item.title, createdAt,
      date, time,
      endDate: typeof item.endDate === 'string' ? item.endDate : date,
      endTime: typeof item.endTime === 'string' ? item.endTime : time,
      allDay: item.allDay === true,
      calendar: item.calendar !== false,
      location: typeof item.location === 'string' ? item.location : '',
      description: typeof item.description === 'string' ? item.description : '',
      reminderMinutes: typeof item.reminderMinutes === 'number' ? item.reminderMinutes : null,
      status,
    }
  }

  const legacyDueAt = typeof item.dueDate === 'string' && item.dueDate
    ? endOfLocalDayIso(item.dueDate)
    : null
  const status = todoStatuses.includes(item.status as TodoStatus)
    ? item.status as TodoStatus
    : item.completed === true ? 'completed' : 'inProgress'
  return {
    id: item.id, roomId: item.roomId, kind: 'todo', title: item.title, createdAt,
    dueAt: typeof item.dueAt === 'string' ? item.dueAt : legacyDueAt,
    status,
    validityReviewStatus: reviewStatuses.includes(item.validityReviewStatus as ValidityReviewStatus)
      ? item.validityReviewStatus as ValidityReviewStatus : 'notRequested',
    reviewPromptShownAt: typeof item.reviewPromptShownAt === 'string' ? item.reviewPromptShownAt : null,
    repeat: typeof item.repeat === 'string' ? item.repeat : '반복 안 함',
    challengeTracking: item.challengeTracking === true,
    reminderMinutes: typeof item.reminderMinutes === 'number' ? item.reminderMinutes : null,
  }
}

export function readRegisteredItems(): RegisteredItem[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.map(normalizeItem).filter((item): item is RegisteredItem => item !== null)
  } catch {
    return []
  }
}

export function writeRegisteredItems(items: RegisteredItem[]): boolean {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    return true
  } catch {
    return false
  }
}

export function getEffectiveScheduleStatus(item: RegisteredSchedule, now = new Date()): ScheduleStatus {
  if (item.status === 'cancelled') return 'cancelled'
  const date = item.endDate || item.date
  const time = item.allDay ? '23:59' : item.endTime || item.time || '23:59'
  const endAt = new Date(`${date}T${time}:00`)
  return !Number.isNaN(endAt.getTime()) && endAt.getTime() < now.getTime() ? 'past' : 'planned'
}

export function dueDateTimeIso(date: string, time: string) {
  if (!date) return null
  const [year, month, day] = date.split('-').map(Number)
  const [hour, minute] = time ? time.split(':').map(Number) : [23, 59]
  const dueAt = new Date(year, month - 1, day, hour, minute, 0)
  return Number.isNaN(dueAt.getTime()) ? null : dueAt.toISOString()
}

export function formatDueAt(dueAt: string | null) {
  if (!dueAt) return '기한 없음'
  const due = new Date(dueAt)
  if (Number.isNaN(due.getTime())) return '기한 없음'
  return `${localDateString(due)}${due.getHours() === 23 && due.getMinutes() === 59 ? '' : ` · ${String(due.getHours()).padStart(2, '0')}:${String(due.getMinutes()).padStart(2, '0')}`}`
}
