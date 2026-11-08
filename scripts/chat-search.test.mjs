import assert from 'node:assert/strict'
import test from 'node:test'
import { searchMessages } from '../src/data/searchMessages.ts'

const rooms = [
  { id: 'room_a', name: '현재 방' },
  { id: 'room_b', name: '다른 방' },
]
const conversations = {
  room_a: { dateLabel: '오늘', messages: [
    { number: 2, sender: '민지', text: '현재 방 전용 키워드와 공통 단어' },
  ] },
  room_b: { dateLabel: '어제', messages: [
    { number: 7, sender: '준호', text: '다른 방 전용 단어와 공통 단어' },
  ] },
}

test('room-scoped search finds a term present only in the open room', () => {
  const hits = searchMessages('전용 키워드', rooms, conversations, 'room_a')
  assert.deepEqual(hits.map(({ roomId, message }) => [roomId, message.number]), [['room_a', 2]])
})

test('room-scoped search returns no hits for a term present only in another room', () => {
  assert.deepEqual(searchMessages('다른 방 전용', rooms, conversations, 'room_a'), [])
})

test('a term shared across rooms returns only hits from the open room', () => {
  const hits = searchMessages('공통 단어', rooms, conversations, 'room_a')
  assert.deepEqual(hits.map(({ roomId, message }) => [roomId, message.number]), [['room_a', 2]])
})

test('selected search hit retains the room and message number needed for navigation', () => {
  const [hit] = searchMessages('현재 방 전용', rooms, conversations, 'room_a')
  assert.equal(hit.roomId, 'room_a')
  assert.equal(hit.message.number, 2)
})

test('omitting a room scope preserves cross-room search for callers that need it', () => {
  const hits = searchMessages('공통 단어', rooms, conversations)
  assert.deepEqual(hits.map(({ roomId }) => roomId), ['room_a', 'room_b'])
})
