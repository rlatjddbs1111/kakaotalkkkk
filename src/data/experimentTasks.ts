import { chatRooms, diceRoom, taskOneExtraRoom, type ChatRoomListItem } from './chatRooms'
import { conversations, type Conversation, type ConversationMessage } from './conversations'
import type { ExperimentSession, ExperimentTaskId } from './experimentTypes'
import { formatExperimentDateLabel, getExperimentDates, getSeoulDate } from './experimentDates'

export const experimentTaskOrder: ExperimentTaskId[] = ['task_1', 'task_2', 'task_3']

export const taskInstructions: Record<ExperimentTaskId, { title: string; prompt: string }> = {
  task_1: { title: '과업 1 · 채팅방 탐색', prompt: '할 일이 남아 있는 채팅방을 찾아 선택해 주세요.' },
  task_2: { title: '과업 2 · 일정 등록', prompt: '다음 대화에서 예정된 일정을 확인하고, 해당 일정을 카카오톡에 등록해 주세요. 일정 등록을 완료했다고 판단하면 과업을 종료해 주세요.' },
  task_3: { title: '과업 3 · 대화 탐색', prompt: '대화에서 조원들이 함께 만나기로 한 날짜와 시간을 확인해 주세요.' },
}

function sessionReferenceDate(session: ExperimentSession) {
  return session.referenceDate ?? getSeoulDate(session.startedAt)
}

export function createExperimentRooms(taskId: ExperimentTaskId): ChatRoomListItem[] {
  if (taskId === 'task_1') {
    return [taskOneExtraRoom, ...chatRooms.filter((room) => room.id !== 'room_5')]
  }
  if (taskId === 'task_3') return [...chatRooms, diceRoom]
  return chatRooms
}

function diceMessages(participantName: string, meetingDateLabel: string): ConversationMessage[] {
  const script: Array<[string, string]> = [
    ['지훈', '다들 이번 주 동아리 정모 일정 어떻게 되시나요?'],
    ['민서', '저는 금요일 저녁이나 주말 다 가능해요!'],
    ['성현', '저 금요일은 과 알바 때문에 힘들고 주말이 편합니다.'],
    ['유진', '저도 토요일이 제일 좋은 것 같아요.'],
    ['지훈', `OK 그럼 이번 미팅은 ${meetingDateLabel} 오후 3시 동아리방으로 고정하고, 신입부원 환영 겸 새로 들어온 보드게임들 먼저 설명해 드릴게요!`],
    ['민서', "나이스!! 이번에 들어온 '카르카손' 확장판 드디어 해보는 건가요 ㅋㅋㅋ"],
    ['유진', '대박 진짜 기대된다... 저 그거 유튜브로 룰 설명 영상만 3번 넘게 봤어요 ㅋㅋㅋ'],
    ['성현', '오 유진이 룰 마스터했네 ㅋㅋㅋ 그럼 이번에 튜토리얼은 유진이가 설명해주는 걸로?'],
    ['유진', '아 안 돼요 ㅋㅋㅋ 저 말주변 없어서 듣다가 다들 졸지도 몰라요'],
    ['지훈', 'ㅋㅋㅋ 괜찮음 틀리면 성현이가 옆에서 커버 쳐주겠지~ 아 그리고 정모 때 먹을 간식거리 사갈 건데 다들 먹고 싶은 거 있음?'],
    ['민서', '저요저요!! 저 지난번에 먹었던 그 크림 찹쌀떡 또 먹고 싶어요!!'],
    ['성현', '아 거기 정문 앞에 있는 떡집 말하는 건가? 거기 일요일엔 문 닫는데 토요일은 열려나?'],
    ['지훈', '토요일은 5시까지 영업하니까 내가 정모 오기 전에 들러서 사갈게! 음료는 뭐 사갈까?'],
    ['유진', '저는 제로 콜라나 탄산수면 다 좋습니다!'],
    ['성현', '저도 제로 음료요 ㅋㅋㅋ 요즘 다이어트 중이라...'],
    ['민서', '성현이 형 어제 인스타 스토리 보니까 밤 12시에 야식으로 족발 먹었던데 ㅋㅋㅋ?'],
    ['성현', '아... 그거는 어제 시험 공부하다가 너무 배고파서 어쩔 수 없었어... 오늘부터 다시 다이어트 1일차임'],
    ['지훈', 'ㅋㅋㅋㅋㅋㅋㅋㅋ 다이어트 1일차 며칠째냐'],
    ['유진', 'ㅋㅋㅋㅋㅋㅋ 저번에 보니까 한 달 전에도 다이어트 1일차라고 하셨던 것 같은데요'],
    ['성현', '아 진짜 이번엔 진심이라니까... 토요일에 동방 올 때 걸어서 갈 거임!!'],
    ['민서', '올~ 숭실대 언덕길 걸어 올라오면 인정해 드림 ㅋㅋㅋ'],
    ['지훈', '암튼 간식은 찹쌀떡이랑 제로 음료 위주로 사둘 테니까 다들 토요일에 늦지 말고 오세요~'],
    ['유진', '네! 토요일에 뵐게요!'],
    ['성현', '오케이 이번엔 진짜 안 늦는다 ㅋㅋㅋ'],
  ]
  return script.map(([sender, text], index) => ({
    number: index + 1,
    sender: sender === '참가자' ? participantName : sender,
    text,
  }))
}

export function getTaskConversation(taskId: ExperimentTaskId, session: ExperimentSession): Conversation | undefined {
  if (taskId === 'task_1') {
    const source = conversations.room_0
    return {
      ...source,
      messages: source.messages.map((message) => message.isMine ? { ...message, sender: session.participantName } : message),
    }
  }
  if (taskId === 'task_2') {
    const dates = getExperimentDates(sessionReferenceDate(session))
    const source = conversations.room_1
    return {
      dateLabel: formatExperimentDateLabel(dates.referenceDate),
      messages: source.messages.map((message) => message.number === 5
        ? { ...message, text: `맞아요. 그리고 발표 준비 모임은 [${dates.task2DateLabel} 오후 7시, 학교 정문 앞 투썸플레이스]에서 진행하겠습니다.` }
        : message.isSystem ? { ...message, text: `${session.participantName}님이 입장하셨습니다.` } : message),
    }
  }
  const dates = getExperimentDates(sessionReferenceDate(session))
  return { dateLabel: formatExperimentDateLabel(dates.referenceDate), messages: diceMessages(session.participantName, dates.task3DateLabel) }
}

export function getTaskConversationMap(taskId: ExperimentTaskId, session: ExperimentSession): Record<string, Conversation> {
  const conversation = getTaskConversation(taskId, session)
  const roomId = taskId === 'task_1' ? 'room_0' : taskId === 'task_2' ? 'room_1' : 'room_dice'
  return { ...conversations, [roomId]: conversation! }
}

export function getTaskExpectedResponse(taskId: ExperimentTaskId, session: ExperimentSession) {
  if (taskId === 'task_1') return { roomId: 'room_1' }
  const dates = getExperimentDates(sessionReferenceDate(session))
  if (taskId === 'task_2') {
    return { date: dates.task2Date, time: '19:00', location: '학교 정문 앞 투썸플레이스' }
  }
  return { roomId: 'room_dice', messageNumber: 5, date: dates.task3Date, time: '15:00', location: '동아리방' }
}

export function getExperimentRoomId(taskId: ExperimentTaskId) {
  return taskId === 'task_1' ? 'room_0' : taskId === 'task_2' ? 'room_1' : 'room_dice'
}

export function getTaskRoom(taskId: ExperimentTaskId, roomId: string) {
  return createExperimentRooms(taskId).find((room) => room.id === roomId)
}
