import { useEffect, useState } from 'react'
import { conversations, type Conversation } from '../data/conversations'
import type { ChatRoomListItem } from '../data/chatRooms'
import { formatDueAt, getEffectiveScheduleStatus, type RegisteredItem, type RegisteredTodo } from '../data/registeredItems'

function DrawerIcon({ name }: { name: string }) {
  const paths: Record<string, string> = {
    photo: 'M4 5h24v22H4z M7 23l6-7 4 4 4-6 5 9 M21 10h.1',
    file: 'M8 3h10l7 7v19H8z M18 3v8h7',
    link: 'M12 20l-2 2a5 5 0 0 1-7-7l5-5a5 5 0 0 1 7 0 M20 12l2-2a5 5 0 0 1 7 7l-5 5a5 5 0 0 1-7 0 M11 21l10-10',
    schedule: 'M6 7h20v21H6z M11 3v8M21 3v8M10 18l4 4 8-8',
    board: 'M5 5h22v22H5z M10 11h12M10 16h12M10 21h8',
    notice: 'M5 13v7h5l11 6V7l-11 6z M10 20l2 8 M24 12h3',
    vote: 'M5 4h22v25H5z M10 15l4 4 8-9',
    call: 'M9 4l5 5-3 4c2 4 4 6 8 8l4-3 5 5-3 4c-2 2-5 1-8 0C10 23 5 18 3 11 2 8 2 6 5 4z',
    bot: 'M16 3v5 M13 3h6 M7 11h18a4 4 0 0 1 4 4v12H3V15a4 4 0 0 1 4-4z M10 18h.1M22 18h.1M10 24h12',
    invite: 'M16 4v24M4 16h24',
  }

  return (
    <svg className={`drawer-icon drawer-icon-${name}`} viewBox="0 0 32 32" aria-hidden="true">
      <path d={paths[name]} />
    </svg>
  )
}

function DrawerHeader({ onBack }: { onBack: () => void }) {
  return (
    <header className="drawer-header">
      <button type="button" className="drawer-back" onClick={onBack} aria-label="채팅방으로 돌아가기">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 4-8 8 8 8" /></svg>
      </button>
      <div className="drawer-header-actions" aria-hidden="true">
        <svg viewBox="0 0 32 32"><path d="M8 23h16l-2-3v-6a6 6 0 0 0-12 0v6z M13 27h6" /></svg>
        <svg viewBox="0 0 32 32"><path d="m16 3 4 8 9 1-6.5 6 2 9-8.5-4.5L7.5 27l2-9L3 12l9-1z" /></svg>
        <svg viewBox="0 0 32 32"><path d="m13 3 1-1h4l1 1 1 3 2 1 3-1 2 3-1 3 1 2 3 2v4l-3 2-1 2 1 3-3 2-3-1-2 1-1 3h-4l-1-3-2-1-3 1-2-3 1-3-1-2-3-2v-4l3-2 1-2-1-3 3-2 3 1 2-1z M16 12a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" /></svg>
      </div>
    </header>
  )
}

type DrawerSection = 'home' | 'schedule' | 'todo' | 'detail'

export function ChatRoomDrawer({ room, onBack, items, itemsRoomId, conversationOverride, initialSection, onInitialSectionHandled, onUpdateItem, onCreateSchedule }: {
  room: ChatRoomListItem
  onBack: () => void
  items: RegisteredItem[]
  itemsRoomId?: string
  conversationOverride?: Conversation
  initialSection?: 'schedule' | 'todo' | null
  onInitialSectionHandled: () => void
  onUpdateItem: (item: RegisteredItem) => void
  onCreateSchedule: () => void
}) {
  const [section, setSection] = useState<DrawerSection>('home')
  const [selectedItem, setSelectedItem] = useState<RegisteredItem | null>(null)
  const conversation = conversationOverride ?? conversations[room.id] ?? { messages: [] }
  const participants = [...new Set(conversation.messages.filter((message) => !message.isSystem).map((message) => message.sender))]
  if (conversation.messages.some((message) => message.isSystem && message.text.includes('김성윤'))) participants.push('김성윤')
  const roomItems = items.filter((item) => item.roomId === (itemsRoomId ?? room.id))
  const schedules = roomItems.filter((item) => item.kind === 'schedule')
  const todos = roomItems.filter((item) => item.kind === 'todo')

  useEffect(() => {
    if (!initialSection) return
    setSection(initialSection)
    onInitialSectionHandled()
  }, [initialSection, onInitialSectionHandled])

  function backFromDrawer() {
    if (section === 'detail') { setSection(selectedItem?.kind ?? 'home'); setSelectedItem(null); return }
    if (section !== 'home') { setSection('home'); return }
    onBack()
  }

  return (
    <div className="drawer-view">
      <DrawerHeader onBack={backFromDrawer} />
      <section className="drawer-identity" aria-label={`${room.name} 채팅방 정보`}>
        <div className="drawer-participant-tiles" aria-hidden="true">
          {participants.slice(0, 4).map((participant, index) => (
            <img key={`${participant}-${index}`} src="/assets/default-profile.png" alt="" />
          ))}
        </div>
        <h1>{room.name}</h1>
      </section>
      <div className="drawer-scroll">
        {section === 'home' ? <>
        <section className="drawer-card drawer-media-card" aria-label="공유 항목">
          <div className="drawer-section-title"><DrawerIcon name="photo" /><span>사진/동영상</span></div>
          <div className="drawer-media-strip" aria-hidden="true">
            {Array.from({ length: 6 }, (_, index) => <span key={index} />)}
          </div>
          <div className="drawer-category-row">
            <div><DrawerIcon name="file" /><span>파일</span></div>
            <div><DrawerIcon name="link" /><span>링크</span></div>
            <button type="button" aria-label="등록된 일정 보기" onClick={() => setSection('schedule')}><DrawerIcon name="schedule" /><span>일정</span></button>
          </div>
        </section>
        <section className="drawer-card drawer-shortcuts" aria-label="채팅방 메뉴">
          <div><DrawerIcon name="board" /><span>게시판</span></div>
          <div><DrawerIcon name="notice" /><span>공지</span></div>
          <div><DrawerIcon name="vote" /><span>투표</span></div>
          <div><DrawerIcon name="call" /><span>통화</span></div>
        </section>
        <section className="drawer-card drawer-bot"><DrawerIcon name="bot" /><span>챗봇 <em>beta</em></span></section>
        <section className="drawer-card drawer-briefing" aria-label="브리핑 보드">
          <div className="drawer-briefing-heading"><h2>브리핑 보드</h2><span>{new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: '2-digit', day: 'numeric', weekday: 'short' }).format(new Date()).replaceAll('.', '.').replace(/\.$/, '')}</span></div>
          <button type="button" onClick={() => setSection('schedule')}><DrawerIcon name="schedule" /><span>일정</span>{schedules.length > 0 && <b>{schedules.length}</b>}</button>
          <button type="button" onClick={() => setSection('todo')}><span className="drawer-todo-mark">✓</span><span>할 일</span>{todos.length > 0 && <b>{todos.length}</b>}</button>
        </section>
        <section className="drawer-card drawer-members" aria-label="대화상대 목록">
          <h2>대화상대 <span>{participants.length}</span></h2>
          <div className="drawer-invite"><span className="drawer-invite-icon"><DrawerIcon name="invite" /></span><span>초대하기</span></div>
          <ul>
            {participants.map((participant) => (
              <li key={participant}>
                <img src="/assets/default-profile.png" alt="" />
                <span>{participant}</span>
              </li>
            ))}
          </ul>
        </section>
        </> : section === 'schedule' || section === 'todo' ? (
          <section className="drawer-card registered-list-card" aria-label={section === 'schedule' ? '등록된 일정 목록' : '등록된 할 일 목록'}>
            <h2>{section === 'schedule' ? '일정' : '할 일'} <span>{section === 'schedule' ? schedules.length : todos.length}</span></h2>
            {(section === 'schedule' ? schedules : todos).length === 0 ? <p className="registered-empty">등록된 {section === 'schedule' ? '일정' : '할 일이'} 없습니다.</p> : (section === 'schedule' ? schedules : todos).map((item) => (
              <button type="button" className="registered-list-item" key={item.id} onClick={() => { setSelectedItem(item); setSection('detail') }}>
                <span className={`registered-item-mark ${item.kind}`}>{item.kind === 'schedule' ? '●' : item.status === 'completed' ? '✓' : '○'}</span>
                <span className="registered-item-copy"><strong>{item.title}</strong><small>{item.kind === 'schedule' ? `${item.date}${item.allDay ? ' · 하루 종일' : item.time ? ` · ${item.time}` : ''} · ${getEffectiveScheduleStatus(item) === 'planned' ? '예정' : getEffectiveScheduleStatus(item) === 'past' ? '지난 일정' : '취소'}` : `기한 ${formatDueAt(item.dueAt)} · ${item.status === 'inProgress' ? '진행 중' : item.status === 'completed' ? '완료' : '더 이상 필요 없음'}`}</small></span>
              </button>
            ))}
            {section === 'schedule' && <button type="button" className="registered-create-button" onClick={onCreateSchedule}>일정 만들기</button>}
          </section>
        ) : selectedItem ? (
          <section className="drawer-card registered-detail-card" aria-label="등록 항목 상세">
            <button type="button" className="registered-detail-back" onClick={() => setSection(selectedItem.kind)}>‹ 목록으로</button>
            <span className={`registered-item-mark ${selectedItem.kind}`}>{selectedItem.kind === 'schedule' ? '●' : selectedItem.status === 'completed' ? '✓' : '○'}</span>
            <h2>{selectedItem.title}</h2>
            {selectedItem.kind === 'schedule' ? <dl>
              <dt>날짜</dt><dd>{selectedItem.date}{selectedItem.allDay ? ' · 하루 종일' : selectedItem.time ? ` · ${selectedItem.time}` : ''}</dd>
              {selectedItem.endDate && selectedItem.endDate !== selectedItem.date && <><dt>종료</dt><dd>{selectedItem.endDate}{selectedItem.endTime ? ` · ${selectedItem.endTime}` : ''}</dd></>}
              <dt>상태</dt><dd>{getEffectiveScheduleStatus(selectedItem) === 'planned' ? '예정' : getEffectiveScheduleStatus(selectedItem) === 'past' ? '지난 일정' : '취소'}</dd>
              <dt>캘린더</dt><dd>{selectedItem.calendar ? '내 캘린더' : '저장 안 함'}</dd>
              {selectedItem.location && <><dt>장소</dt><dd>{selectedItem.location}</dd></>}
              {selectedItem.description && <><dt>설명</dt><dd>{selectedItem.description}</dd></>}
              {selectedItem.reminderMinutes !== null && <><dt>알림</dt><dd>{selectedItem.reminderMinutes === 0 ? '정각' : `${selectedItem.reminderMinutes}분 전`}</dd></>}
            </dl> : <>
              <dl><dt>기한</dt><dd>{formatDueAt(selectedItem.dueAt)}</dd><dt>상태</dt><dd>{selectedItem.status === 'inProgress' ? '진행 중' : selectedItem.status === 'completed' ? '완료' : '더 이상 필요 없음'}</dd><dt>유효성 확인</dt><dd>{selectedItem.validityReviewStatus === 'notRequested' ? '미요청' : selectedItem.validityReviewStatus}</dd><dt>반복</dt><dd>{selectedItem.repeat}</dd>{selectedItem.reminderMinutes !== null && <><dt>알림</dt><dd>{selectedItem.reminderMinutes === 0 ? '정각' : `${selectedItem.reminderMinutes}분 전`}</dd></>}</dl>
              <div className="registered-todo-actions">
                {selectedItem.status === 'inProgress' ? <>
                  <button type="button" className="registered-complete-button" onClick={() => updateTodo(selectedItem, 'completed')}>완료로 표시</button>
                  <button type="button" className="registered-not-needed-button" onClick={() => updateTodo(selectedItem, 'notNeeded')}>더 이상 필요 없음</button>
                </> : <button type="button" className="registered-complete-button" onClick={() => updateTodo(selectedItem, 'inProgress')}>진행 중으로 변경</button>}
              </div>
            </>}
            {selectedItem.kind === 'schedule' && selectedItem.status !== 'cancelled' && <button type="button" className="registered-not-needed-button" onClick={() => { const updated = { ...selectedItem, status: 'cancelled' as const }; setSelectedItem(updated); onUpdateItem(updated) }}>일정 취소</button>}
          </section>
        ) : null}
      </div>
    </div>
  )

  function updateTodo(item: RegisteredTodo, status: RegisteredTodo['status']) {
    const updated: RegisteredTodo = { ...item, status }
    setSelectedItem(updated)
    onUpdateItem(updated)
  }
}
