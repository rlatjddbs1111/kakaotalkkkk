export type ConversationMessage = {
  number: number
  sender: string
  text: string
  timestamp?: string
  isMine?: boolean
  isSystem?: boolean
}

export type Conversation = {
  dateLabel?: string
  messages: ConversationMessage[]
}

// Original scripts supplied for the project. Preserve message wording and order.
export const conversations: Record<string, Conversation> = {
  room_1: {
    dateLabel: '2026년 10월 28일 수요일',
    messages: [
      { number: 1, sender: '시스템', text: '김성윤님이 입장하셨습니다.', isSystem: true },
      { number: 2, sender: '김철수', text: '다들 오늘 인간공학 수업 고생하셨습니다.', timestamp: '오후 1:00' },
      { number: 3, sender: '이영희', text: '네 교수님이 말씀하신 팀 과제 지침 다들 확인하셨나요?', timestamp: '오후 1:05' },
      { number: 4, sender: '최동현', text: '네 4~5개 과업 범위 통제하라는 거 맞죠?', timestamp: '오후 1:10' },
      { number: 5, sender: '김철수', text: '맞아요. 그리고 이번 주 발표 준비 모임은 [수요일 19시, 학교 정문 앞 투썸플레이스]에서 진행하겠습니다.', timestamp: '오후 1:15' },
      { number: 6, sender: '김철수', text: "보고서 제출할 때 파일명은 '인간공학_4조_최종안.pdf'로 올려야 감점 안 당합니다.", timestamp: '오후 1:16' },
      { number: 7, sender: '이영희', text: '네 확인했습니다! 투썸 2층에서 봬요.', timestamp: '오후 1:20' },
      { number: 8, sender: '최동현', text: '저 10분 정도 늦을 수도 있는데 먼저 진행하고 계세요 ㅠㅠ', timestamp: '오후 1:22' },
      { number: 9, sender: '김철수', text: '알겠습니다. 오실 때 노트북 챙겨오세요.', timestamp: '오후 1:25' },
      { number: 10, sender: '이영희', text: '혹시 지난주 조사했던 관찰법 가이드라인 공유 좀 해주실 분?', timestamp: '오후 1:30' },
      { number: 11, sender: '최동현', text: '드라이브 3번 폴더에 올려뒀습니다.', timestamp: '오후 1:35' },
      { number: 12, sender: '이영희', text: '감사합니다! 확인해 볼게요.', timestamp: '오후 1:40' },
      { number: 13, sender: '김철수', text: '아 그리고 설문지 문항 수정된 거 반영해야 합니다.', timestamp: '오후 2:00' },
      { number: 14, sender: '최동현', text: '어떤 문항 수정해야 하나요?', timestamp: '오후 2:05' },
      { number: 15, sender: '김철수', text: 'SUS 척도 5번 문항 문구 조금 바꿨어요.', timestamp: '오후 2:08' },
      { number: 16, sender: '이영희', text: '네 그럼 수요일 모임 전까지 PPT 가안 다듬어 놓을게요.', timestamp: '오후 2:10' },
      { number: 17, sender: '김철수', text: '다들 자료조사 부분 정리 다 되셨으면 톡 남겨주세요.', timestamp: '오후 2:13' },
      { number: 18, sender: '김철수', text: '수요일에 뵐게요~', timestamp: '오후 2:14' },
    ],
  },
  room_2: {
    messages: [
      { number: 1, sender: '점장', text: '이번 주 매장 청소 상태 양호합니다. 다들 수고했어요.', timestamp: '오후 1:20' },
      { number: 2, sender: '알바생A', text: '감사합니다!', timestamp: '오후 1:22' },
      { number: 3, sender: '점장', text: '다음 주 수요일 야간 대타 가능하신 분 있나요?', timestamp: '오후 1:28' },
      { number: 4, sender: '알바생A', text: '저 수요일에 수업 있어서 힘들 것 같습니다 ㅠㅠ', timestamp: '오후 1:29' },
      { number: 5, sender: '점장', text: '수요일 스케줄 변경하실 분 연락주세요. 매장 대기실 청소도 부탁합니다.', timestamp: '오후 1:30' },
    ],
  },
  room_3: {
    dateLabel: '어제',
    messages: [
      { number: 1, sender: '이영희', text: 'IR 발표 자료 최종본 드라이브에 올렸습니다.', timestamp: '오전 11:20' },
      { number: 2, sender: '박민수', text: '피드백 반영된 버전 맞죠? 확인했습니다.', timestamp: '오전 11:25' },
      { number: 3, sender: '김성윤', text: '네 확인했습니다. 수고하셨습니다!', timestamp: '오전 11:30', isMine: true },
    ],
  },
  room_4: {
    dateLabel: '어제',
    messages: [
      { number: 1, sender: '최동현', text: '다들 경제성공학 과제 다 하심?', timestamp: '오후 6:00' },
      { number: 2, sender: '정수진', text: '아직 시작도 못함 ㅋㅋㅋ 솔루션 있는 사람?', timestamp: '오후 6:05' },
      { number: 3, sender: '박민수', text: '이번 주 금요일 족보 가지고 계신 분 계신가요?', timestamp: '오후 6:10' },
      { number: 4, sender: '박민수', text: '이산수학 4장 솔루션 구합니다 ㅠㅠ', timestamp: '오후 6:11' },
      { number: 5, sender: '최동현', text: '단톡방 공지 확인하고 회식 참석 여부 투표하셈', timestamp: '오후 6:15' },
    ],
  },
  room_5: {
    dateLabel: '10월 25일',
    messages: [
      { number: 1, sender: '회장', text: '11월 정기 총회 장소 투표 부탁드립니다.' },
      { number: 2, sender: '회장', text: '톡캘린더에 일정 등록해 두었으니 확인 후 일시 체크해 주세요!' },
      { number: 3, sender: '부회장', text: '회비 미납되신 분들은 이번 주까지 입금 부탁드립니다.' },
    ],
  },
  room_6: {
    dateLabel: '10월 24일',
    messages: [
      { number: 1, sender: '엄마', text: '성윤아 오늘 몇 시에 들어오니?', timestamp: '오후 5:10' },
      { number: 2, sender: '김성윤', text: '저 알바 끝나고 10시쯤 들어갈 것 같아요.', timestamp: '오후 5:12', isMine: true },
      { number: 3, sender: '엄마', text: '들어올 때 두부랑 우유 사가지고 들어와~ 사골국 끓여놨다.', timestamp: '오후 5:15' },
    ],
  },
}
