import test from 'node:test'
import assert from 'node:assert/strict'
import { getExperimentDates } from '../src/data/experimentDates.ts'

const cases = [
  {
    referenceDate: '2026-11-04',
    task2Date: '2026-11-05',
    task2Label: '2026년 11월 5일 목요일',
    task3Date: '2026-11-07',
    task3Label: '2026년 11월 7일 토요일',
  },
  {
    referenceDate: '2026-11-07',
    task2Date: '2026-11-08',
    task2Label: '2026년 11월 8일 일요일',
    task3Date: '2026-11-14',
    task3Label: '2026년 11월 14일 토요일',
  },
  {
    referenceDate: '2026-12-31',
    task2Date: '2027-01-01',
    task2Label: '2027년 1월 1일 금요일',
    task3Date: '2027-01-02',
    task3Label: '2027년 1월 2일 토요일',
  },
]

for (const scenario of cases) {
  test(`실험 기준일 ${scenario.referenceDate}의 Task 2·3 날짜와 요일`, () => {
    const dates = getExperimentDates(scenario.referenceDate)
    assert.equal(dates.task2Date, scenario.task2Date)
    assert.equal(dates.task2DateLabel, scenario.task2Label)
    assert.equal(dates.task3Date, scenario.task3Date)
    assert.equal(dates.task3DateLabel, scenario.task3Label)
  })
}
