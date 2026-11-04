const weekdays = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일']

function parseIsoDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) throw new Error(`Invalid experiment reference date: ${value}`)
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const result = new Date(Date.UTC(year, month - 1, day))
  if (result.getUTCFullYear() !== year || result.getUTCMonth() !== month - 1 || result.getUTCDate() !== day) {
    throw new Error(`Invalid experiment reference date: ${value}`)
  }
  return result
}

export function getSeoulDate(value: string | Date) {
  const date = typeof value === 'string' ? new Date(value) : value
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(date)
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return `${values.year}-${values.month}-${values.day}`
}

function addDays(value: string, days: number) {
  const date = parseIsoDate(value)
  date.setUTCDate(date.getUTCDate() + days)
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function formatExperimentDateLabel(value: string) {
  const date = parseIsoDate(value)
  const year = date.getUTCFullYear()
  const month = date.getUTCMonth() + 1
  const day = date.getUTCDate()
  return `${year}년 ${month}월 ${day}일 ${weekdays[date.getUTCDay()]}`
}

export function getExperimentDates(referenceDate: string) {
  const start = parseIsoDate(referenceDate)
  const task2Date = addDays(referenceDate, 1)
  const daysUntilSaturday = (6 - start.getUTCDay() + 7) % 7 || 7
  const task3Date = addDays(referenceDate, daysUntilSaturday)
  return {
    referenceDate,
    task2Date,
    task2DateLabel: formatExperimentDateLabel(task2Date),
    task2UploadDate: addDays(referenceDate, 2),
    task2UploadDateLabel: formatExperimentDateLabel(addDays(referenceDate, 2)),
    task2InterviewDate: addDays(referenceDate, 3),
    task2InterviewDateLabel: formatExperimentDateLabel(addDays(referenceDate, 3)),
    task3Date,
    task3DateLabel: formatExperimentDateLabel(task3Date),
  }
}
