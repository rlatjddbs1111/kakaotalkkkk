import { useEffect, useRef, useState } from 'react'
import { dueDateTimeIso, type RegisteredItem, type RegisteredSchedule, type RegisteredTodo } from '../data/registeredItems'

type RegistrationKind = RegisteredItem['kind']

function isValidDateInput(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const [year, month, day] = value.split('-').map(Number)
  const parsed = new Date(Date.UTC(year, month - 1, day))
  return parsed.getUTCFullYear() === year && parsed.getUTCMonth() === month - 1 && parsed.getUTCDate() === day
}

function CloseIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 5 14 14M19 5 5 19" /></svg>
}

function ClockIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l4 2" /></svg>
}

function scheduleDefaults() {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date())
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  const year = Number(values.year)
  const month = Number(values.month)
  const day = Number(values.day)
  const hour = Number(values.hour)
  const minute = Number(values.minute)
  const end = new Date(Date.UTC(year, month - 1, day, hour, minute) + 60 * 60 * 1000)
  const pad = (value: number) => String(value).padStart(2, '0')
  return {
    date: `${year}-${pad(month)}-${pad(day)}`,
    time: `${pad(hour)}:${pad(minute)}`,
    endDate: `${end.getUTCFullYear()}-${pad(end.getUTCMonth() + 1)}-${pad(end.getUTCDate())}`,
    endTime: `${pad(end.getUTCHours())}:${pad(end.getUTCMinutes())}`,
  }
}

function scheduleEndAfterOneHour(date: string, time: string) {
  if (!date || !time) return null
  const [year, month, day] = date.split('-').map(Number)
  const [hour, minute] = time.split(':').map(Number)
  const end = new Date(Date.UTC(year, month - 1, day, hour, minute) + 60 * 60 * 1000)
  const pad = (value: number) => String(value).padStart(2, '0')
  return {
    date: `${end.getUTCFullYear()}-${pad(end.getUTCMonth() + 1)}-${pad(end.getUTCDate())}`,
    time: `${pad(end.getUTCHours())}:${pad(end.getUTCMinutes())}`,
  }
}

export function RegistrationFlow({ roomId, initialKind, initialDate, onClose, onSave, onOpen }: {
  roomId: string
  initialKind?: RegistrationKind | null
  initialDate?: string
  onClose: () => void
  onSave: (item: RegisteredItem) => boolean | void
  onOpen?: () => void
}) {
  const onOpenRef = useRef(onOpen)
  const didRecordOpenRef = useRef(false)
  onOpenRef.current = onOpen
  const [kind, setKind] = useState<RegistrationKind | null>(initialKind ?? null)

  useEffect(() => {
    if (didRecordOpenRef.current) return
    didRecordOpenRef.current = true
    onOpenRef.current?.()
  }, [])

  return (
    <div className="registration-overlay" role="presentation">
      {kind === null ? (
        <section className="registration-type-sheet" role="dialog" aria-modal="true" aria-label="등록 유형 선택">
          <button type="button" className="registration-type-option" onClick={() => setKind('schedule')}>일정 등록</button>
          <button type="button" className="registration-type-option" onClick={() => setKind('todo')}>할 일 등록</button>
          <button type="button" className="registration-cancel" onClick={onClose}>취소</button>
        </section>
      ) : (
        <RegistrationForm kind={kind} roomId={roomId} initialDate={initialDate} onClose={onClose} onSave={onSave} />
      )}
    </div>
  )
}

function RegistrationForm({ kind, roomId, initialDate, onClose, onSave }: {
  kind: RegistrationKind
  roomId: string
  initialDate?: string
  onClose: () => void
  onSave: (item: RegisteredItem) => boolean | void
}) {
  const [defaults] = useState(scheduleDefaults)
  const [title, setTitle] = useState('')
  const [date, setDate] = useState(() => initialDate === undefined ? defaults.date : initialDate)
  const [startTime, setStartTime] = useState(defaults.time)
  const [endDate, setEndDate] = useState(() => initialDate === undefined ? defaults.endDate : initialDate)
  const [endTime, setEndTime] = useState(defaults.endTime)
  const [endDateEdited, setEndDateEdited] = useState(false)
  const [endTimeEdited, setEndTimeEdited] = useState(false)
  const [dueDate, setDueDate] = useState('')
  const [dueTime, setDueTime] = useState('')
  const [allDay, setAllDay] = useState(false)
  const [calendar, setCalendar] = useState(true)
  const [location, setLocation] = useState('')
  const [description, setDescription] = useState('')
  const [reminder, setReminder] = useState('')
  const [repeat, setRepeat] = useState('반복 안 함')
  const [challengeTracking, setChallengeTracking] = useState(false)

  const validScheduleDate = kind !== 'schedule' || (isValidDateInput(date) && (allDay || /^([01]\d|2[0-3]):[0-5]\d$/.test(startTime)))
  const canSave = Boolean(title.trim()) && validScheduleDate

  function syncEndDateTime(nextDate: string, nextTime: string) {
    const nextEnd = scheduleEndAfterOneHour(nextDate, nextTime)
    if (!nextEnd) return
    if (!endDateEdited) setEndDate(nextEnd.date)
    if (!endTimeEdited) setEndTime(nextEnd.time)
  }

  function save() {
    if (!canSave) return
    const common = { id: crypto.randomUUID(), roomId, title: title.trim(), createdAt: new Date().toISOString() }
    const reminderMinutes = reminder ? Number(reminder) : null
    if (kind === 'schedule') {
      const item: RegisteredSchedule = {
        ...common, kind, date, time: allDay ? '' : startTime,
        endDate: endDate || date, endTime: allDay ? '' : endTime, allDay, calendar,
        location: location.trim(), description: description.trim(), reminderMinutes, status: 'planned',
      }
      if (onSave(item) === false) return
    } else {
      const item: RegisteredTodo = {
        ...common, kind, dueAt: dueDateTimeIso(dueDate, dueTime), status: 'inProgress',
        validityReviewStatus: 'notRequested', reviewPromptShownAt: null,
        reminderMinutes, repeat, challengeTracking,
      }
      onSave(item)
    }
  }

  return (
    <section className="registration-form-screen" role="dialog" aria-modal="true" aria-label={kind === 'schedule' ? '일정 등록' : '할 일 등록'}>
      <header className="registration-header">
        <button type="button" onClick={onClose} aria-label="등록 닫기"><CloseIcon /></button>
        <span />
        <button type="button" className={canSave ? 'can-save' : ''} disabled={!canSave} onClick={save}>저장</button>
      </header>
      <div className="registration-form-scroll">
        <label className="registration-title-row">
          <span className={`registration-kind-dot ${kind}`} aria-hidden="true">{kind === 'todo' ? '○' : ''}</span>
          <input autoFocus required value={title} onChange={(event) => setTitle(event.target.value)} placeholder={kind === 'schedule' ? '일정 제목을 입력해 주세요.' : '할 일을 입력해 주세요.'} aria-label={kind === 'schedule' ? '일정 제목 (필수)' : '할 일 제목 (필수)'} maxLength={100} />
        </label>
        {kind === 'schedule' ? (
          <>
            <div className="registration-field-group">
              <div className="registration-field-row registration-field-icon"><ClockIcon /><input type="date" value={date} onChange={(event) => { const nextDate = event.currentTarget.value; setDate(nextDate); syncEndDateTime(nextDate, startTime) }} aria-label="일정 날짜" /><input type="time" value={startTime} onChange={(event) => { const nextTime = event.currentTarget.value; setStartTime(nextTime); syncEndDateTime(date, nextTime) }} aria-label="일정 시간" /></div>
              <div className="registration-field-row registration-field-indent"><input type="date" value={endDate} onChange={(event) => { setEndDateEdited(true); setEndDate(event.currentTarget.value) }} aria-label="종료 날짜" /><input type="time" value={endTime} onChange={(event) => { setEndTimeEdited(true); setEndTime(event.currentTarget.value) }} aria-label="종료 시간" /></div>
              <button type="button" className="registration-setting-row" onClick={() => setAllDay(!allDay)}><span>하루 종일</span><span className={`registration-switch${allDay ? ' is-on' : ''}`}><i /></span></button>
              <button type="button" className="registration-setting-row muted" onClick={() => setCalendar(!calendar)}><span>내 캘린더</span><span className={`registration-check${calendar ? ' is-on' : ''}`}>{calendar ? '✓' : ''}</span></button>
              <label className="registration-setting-row"><span>장소</span><input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="장소" aria-label="장소" /></label>
              <label className="registration-description-row"><span>설명</span><textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="설명 추가" aria-label="일정 설명" rows={3} /></label>
              <label className="registration-setting-row"><span>알림</span><select value={reminder} onChange={(event) => setReminder(event.target.value)} aria-label="알림"><option value="">알림 추가</option><option value="0">정각</option><option value="5">5분 전</option><option value="15">15분 전</option><option value="30">30분 전</option><option value="60">1시간 전</option></select></label>
              <div className="registration-setting-row muted" aria-disabled="true"><span>친구 태그</span><span className="registration-subtext">참고 화면 항목</span></div>
            </div>
          </>
        ) : (
          <div className="registration-field-group todo-fields">
              <div className="registration-setting-row registration-field-icon todo-due-row"><ClockIcon /><span>기한</span><input type="date" value={dueDate} onChange={(event) => setDueDate(event.currentTarget.value)} aria-label="할 일 기한 날짜" /><input type="time" value={dueTime} onChange={(event) => setDueTime(event.currentTarget.value)} aria-label="할 일 기한 시간" /></div>
            <label className="registration-setting-row"><span>알림</span><select value={reminder} onChange={(event) => setReminder(event.target.value)} aria-label="알림"><option value="">알림 추가</option><option value="0">정각</option><option value="5">5분 전</option><option value="15">15분 전</option><option value="30">30분 전</option><option value="60">1시간 전</option></select></label>
            <label className="registration-setting-row"><span>반복</span><select value={repeat} onChange={(event) => setRepeat(event.target.value)} aria-label="반복"><option>반복 안 함</option><option>매일</option><option>매주</option><option>매월</option></select></label>
            <button type="button" className="registration-setting-row" onClick={() => setChallengeTracking(!challengeTracking)}><span>도전 기록 보기</span><span className={`registration-switch${challengeTracking ? ' is-on' : ''}`}><i /></span></button>
          </div>
        )}
      </div>
    </section>
  )
}
