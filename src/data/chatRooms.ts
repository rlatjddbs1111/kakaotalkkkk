export type ChatRoomListItem = {
  id: string
  name: string
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
  noticeTitle: string
}

// Values below come directly from the supplied room list and the final message
// in each supplied conversation script. Keep source order and wording intact.
export const chatRooms: ChatRoomListItem[] = [
  {
    id: 'room_1',
    name: '인간공학 4조',
    lastMessage: '수요일에 뵐게요~',
    lastMessageTime: '오후 2:14',
    unreadCount: 2,
    noticeTitle: '이번 주 조별과제 모임 및 제출 마감 안내',
  },
  {
    id: 'room_2',
    name: '컴포즈 알바 공지방',
    lastMessage: '대타 다시 구했습니다. 이제 괜찮습니다.',
    lastMessageTime: '오후 1:35',
    unreadCount: 1,
    noticeTitle: '11월 근무 스케줄표 및 수요일 대타 확인 건',
  },
  {
    id: 'room_3',
    name: '미래기술 스타트업',
    lastMessage: '네 확인했습니다. 수고하셨습니다!',
    lastMessageTime: '어제 오전 11:30',
    unreadCount: 0,
    noticeTitle: '스타트업 기획서 중간 검토 제출 안내',
  },
  {
    id: 'room_4',
    name: '산업공학과 23학번',
    lastMessage: '이산수학 4장 솔루션 구합니다 ㅠㅠ',
    lastMessageTime: '어제 오후 6:11',
    unreadCount: 5,
    noticeTitle: '중간고사 족보 공유 및 단체 회식 공지',
  },
  {
    id: 'room_5',
    name: '중앙 동아리 정모',
    lastMessage: '회비 미납되신 분들은 이번 주까지 입금 부탁드립니다.',
    lastMessageTime: '10월 25일',
    unreadCount: 0,
    noticeTitle: '11월 정기 총회 및 MT 장소 투표',
  },
  {
    id: 'room_6',
    name: '엄마',
    lastMessage: '아들 조심히 와.',
    lastMessageTime: '10월 24일 오후 5:15',
    unreadCount: 0,
    noticeTitle: '집 비밀번호 및 장보기 메모',
  },
]

export const taskOneExtraRoom: ChatRoomListItem = {
  id: 'room_0',
  name: '윤진효',
  lastMessage: 'ㄱㄱ',
  lastMessageTime: '',
  unreadCount: 0,
  noticeTitle: '',
}

export const diceRoom: ChatRoomListItem = {
  id: 'room_dice',
  name: "보드게임 중앙동아리 '다이스'",
  lastMessage: '오케이 이번엔 진짜 안 늦는다 ㅋㅋㅋ',
  lastMessageTime: '',
  unreadCount: 0,
  noticeTitle: '',
}
