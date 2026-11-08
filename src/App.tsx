import { useEffect, useRef, useState } from 'react'
import { ChatRoomView, MessageComposer } from './components/ChatRoomView'
import { ChatRoomDrawer } from './components/ChatRoomDrawer'
import { MessageAddMenu } from './components/MessageAddMenu'
import { SearchView, type SearchHit } from './components/SearchView'
import { NoticeDetailView } from './components/NoticeDetailView'
import { RegistrationFlow } from './components/RegistrationFlow'
import { ExperimentFlow, TaskControls, useExperiment } from './components/ExperimentFlow'
import { TaskHintBar } from './components/TaskHintBar'
import { chatRooms, type ChatRoomListItem } from './data/chatRooms'
import { readRegisteredItems, writeRegisteredItems, type RegisteredItem } from './data/registeredItems'
import { createExperimentRooms, getTaskConversationMap, getTaskRoom, getExperimentRoomId } from './data/experimentTasks'
import { conversations, type Conversation } from './data/conversations'
import './styles/chat-room.css'
import './styles/message-add-menu.css'
import './styles/search.css'
import './styles/notice-detail.css'
import './styles/registration.css'
import './styles/experiment.css'

function SearchIcon() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <circle cx="13.5" cy="13.5" r="9.5" />
      <path d="m21 21 7 7" />
    </svg>
  )
}

function NewChatIcon() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <path d="M25 14.5a10.5 10.5 0 0 1-15.7 9.1L4 26l1.6-5.1A10.5 10.5 0 1 1 25 14.5Z" />
      <path d="M24 4v9M19.5 8.5h9" />
    </svg>
  )
}

function SettingsIcon() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <path d="m13.3 3.6.7-1h4l.7 1 1 2.3 2.2.9 2.4-.7 1.2.7 2 3.5-.4 1.3-1.7 1.8v2.5l1.7 1.8.4 1.3-2 3.5-1.2.7-2.4-.7-2.2.9-1 2.3-.7 1h-4l-.7-1-1-2.3-2.2-.9-2.4.7-1.2-.7-2-3.5.4-1.3 1.7-1.8v-2.5l-1.7-1.8-.4-1.3 2-3.5 1.2-.7 2.4.7 2.2-.9 1-2.3Z" transform="translate(1.8 1.8) scale(.88)" />
      <circle cx="16" cy="16" r="4.5" />
    </svg>
  )
}

function FilterIcon() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <path d="M4 8h18M4 16h13M4 24h18" />
      <path d="M23 20v8M19 24h8" />
      <circle cx="27" cy="6" r="2" className="filter-indicator" />
    </svg>
  )
}

function PersonIcon() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <circle cx="16" cy="10" r="6" />
      <path d="M4 28c.5-6.2 5.3-10 12-10s11.5 3.8 12 10H4Z" />
    </svg>
  )
}

function ChatIcon() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <path d="M4 6.5A3.5 3.5 0 0 1 7.5 3h17A3.5 3.5 0 0 1 28 6.5v14a3.5 3.5 0 0 1-3.5 3.5h-10L7 29v-5.2a3.5 3.5 0 0 1-3-3.3v-14Z" />
    </svg>
  )
}

function OpenChatIcon() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <path d="M3 8.5A5.5 5.5 0 0 1 8.5 3h11A5.5 5.5 0 0 1 25 8.5v8a5.5 5.5 0 0 1-5.5 5.5h-5L7 27v-5.6a5.5 5.5 0 0 1-4-4.9v-8Z" />
      <path d="M21.5 10H24a5 5 0 0 1 5 5v7a5 5 0 0 1-4 4.9V30l-5.5-4H16" />
      <path d="m11 9 7 4.5-7 4.5V9Z" className="open-chat-play" />
    </svg>
  )
}

function StoreIcon() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <path d="M6 11h20l2 17H4l2-17Z" />
      <path d="M11 12V8a5 5 0 0 1 10 0v4" />
    </svg>
  )
}

function MoreIcon() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <circle cx="6" cy="16" r="2" />
      <circle cx="16" cy="16" r="2" />
      <circle cx="26" cy="16" r="2" />
    </svg>
  )
}

function Avatar() {
  return (
    <span className="room-avatar" aria-hidden="true">
      <img src="/assets/default-profile.png" alt="" />
    </span>
  )
}

function listTimeLabel(value: string) {
  if (value.startsWith('어제')) return '어제'
  if (value.startsWith('10월') && value.includes('오후')) return value.slice(0, value.indexOf(' 오후'))
  return value
}

function StatusBar({ time = '7:50', isChat = false }: { time?: string; isChat?: boolean }) {
  return (
    <div className={`system-status-bar${isChat ? ' chat-status-bar' : ''}`} aria-hidden="true">
      <span className="status-time">{time}</span>
      <div className="status-system">
        <svg className="signal-icon" viewBox="0 0 24 20">
          <path d="M2 18V13M8 18V9M14 18V5M20 18V1" />
        </svg>
        <svg className="wifi-icon" viewBox="0 0 26 20">
          <path d="M2 6.5C8.2 1.5 17.8 1.5 24 6.5M5.5 10c4.3-3.5 10.7-3.5 15 0M9.5 13.5c2-1.6 5-1.6 7 0M13 17h.1" />
        </svg>
        <span className="battery-indicator">65</span>
      </div>
    </div>
  )
}

function ChatList({ onOpenRoom, rooms = chatRooms }: { onOpenRoom: (room: ChatRoomListItem) => void; rooms?: ChatRoomListItem[] }) {
  return (
    <div className="chat-list-page">
      <header className="chat-list-header">
        <h1>채팅</h1>
        <div className="header-actions" aria-hidden="true">
          <span className="header-action"><SearchIcon /></span>
          <span className="header-action"><NewChatIcon /></span>
          <span className="header-action"><SettingsIcon /></span>
        </div>
      </header>

      <div className="chat-filters" aria-label="채팅 목록 보기">
        <span className="filter-chip is-selected">전체</span>
        <span className="filter-chip unread-filter">
          안읽음 <span className="filter-unread-count">{rooms.reduce((total, room) => total + room.unreadCount, 0)}</span>
        </span>
        <span className="filter-chip">ChatGPT</span>
        <span className="filter-chip">통화</span>
        <span className="filter-icon"><FilterIcon /></span>
      </div>

      <aside className="reference-ad" aria-label="광고">
        <div className="ad-copy">
          <div className="ad-brand">
            <img src="/assets/reference-ad-logo.png" alt="" />
            <span>앱 냥코 대전쟁 ›</span>
          </div>
          <strong>징글 귀염 냥코들의 출격!</strong>
          <span className="ad-caption">확률형 아이템 포함</span>
        </div>
        <img className="ad-art" src="/assets/reference-ad-art.png" alt="" />
        <span className="ad-label">AD</span>
      </aside>

      <section className="chat-room-list" aria-label="채팅방 목록">
        {rooms.map((room) => (
          <button
            className="chat-room-row"
            key={room.id}
            type="button"
            onClick={() => onOpenRoom(room)}
            aria-label={`${room.name}, 마지막 메시지 ${room.lastMessage}, ${room.lastMessageTime}, 안 읽은 메시지 ${room.unreadCount}개`}
          >
            <Avatar />
            <span className="room-copy">
              <span className="room-title-row">
                <span className="room-name">{room.name}</span>
              </span>
              <span className="room-last-message">{room.lastMessage}</span>
            </span>
            <span className="room-meta">
              <span className="room-time">{listTimeLabel(room.lastMessageTime)}</span>
              {room.unreadCount > 0 && (
                <span className="unread-badge" aria-label={`안 읽은 메시지 ${room.unreadCount}개`}>
                  {room.unreadCount}
                </span>
              )}
            </span>
          </button>
        ))}
      </section>
    </div>
  )
}

function BottomNavigation({ rooms = chatRooms }: { rooms?: ChatRoomListItem[] }) {
  const unreadTotal = rooms.reduce((total, room) => total + room.unreadCount, 0)

  return (
    <nav className="bottom-navigation" aria-label="하단 메뉴">
      <span className="nav-item"><PersonIcon /></span>
      <span className="nav-item is-active">
        <ChatIcon />
        {unreadTotal > 0 && <span className="nav-badge">{unreadTotal}</span>}
      </span>
      <span className="nav-item"><OpenChatIcon /></span>
      <span className="nav-item"><StoreIcon /></span>
      <span className="nav-item"><MoreIcon /></span>
    </nav>
  )
}

export default function App() {
  return <ExperimentFlow><ChatApplication /></ExperimentFlow>
}

function ChatApplication() {
  const experiment = useExperiment()
  const { session, taskId } = experiment
  const experimentRooms = createExperimentRooms(taskId)
  const rawConversationMap: Record<string, Conversation> = session ? getTaskConversationMap(taskId, session) : conversations
  const visibleMessageCount = taskId === 'task_2' && experiment.attempt
    ? Math.min(rawConversationMap.room_1.messages.length, Math.floor(Math.max(0, Date.now() - Date.parse(experiment.attempt.startTime)) / 400))
    : undefined
  const conversationMap: Record<string, Conversation> = taskId === 'task_2'
    ? { ...rawConversationMap, room_1: { ...rawConversationMap.room_1, messages: rawConversationMap.room_1.messages.slice(0, visibleMessageCount) } }
    : rawConversationMap
  const scopedRegistrationRoomId = session ? `${getExperimentRoomId(taskId)}::${session.sessionId}` : undefined
  const [selectedRoom, setSelectedRoom] = useState<ChatRoomListItem | null>(() => {
    if (session?.currentAttempt && taskId !== 'task_1') return getTaskRoom(taskId, getExperimentRoomId(taskId)) ?? null
    return null
  })
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isNoticeOpen, setIsNoticeOpen] = useState(false)
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false)
  const [registrationInitialKind, setRegistrationInitialKind] = useState<'schedule' | 'todo' | null>(null)
  const [registrationPath, setRegistrationPath] = useState<'plus' | 'drawer'>('plus')
  const [registeredItems, setRegisteredItems] = useState<RegisteredItem[]>(readRegisteredItems)
  const task2SubmissionLock = useRef(false)
  const [initialDrawerSection, setInitialDrawerSection] = useState<'schedule' | 'todo' | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [targetMessageNumber, setTargetMessageNumber] = useState<number | null>(null)
  const [targetQuery, setTargetQuery] = useState('')
  const unreadTotal = experimentRooms.reduce((total, room) => total + room.unreadCount, 0)

  useEffect(() => { writeRegisteredItems(registeredItems) }, [registeredItems])

  function saveRegisteredItem(item: RegisteredItem) {
    const scopedItem = taskId === 'task_2' && scopedRegistrationRoomId ? { ...item, roomId: scopedRegistrationRoomId } : item
    if (taskId === 'task_2') {
      if (task2SubmissionLock.current) return false
      task2SubmissionLock.current = true
      if (scopedItem.kind === 'schedule' && !experiment.isTask2ScheduleCorrect(scopedItem)) {
        experiment.recordIncorrectTask2Schedule(scopedItem, registrationPath)
        task2SubmissionLock.current = false
        return false
      }
      if (scopedItem.kind !== 'schedule') {
        experiment.recordIncorrectTask2Type()
        task2SubmissionLock.current = false
        return false
      }
      writeRegisteredItems([...registeredItems.filter((existing) => existing.id !== scopedItem.id), scopedItem])
      setRegisteredItems((current) => current.some((existing) => existing.id === scopedItem.id) ? current : [...current, scopedItem])
      experiment.recordTask2CalendarReturn(registrationPath, isDrawerOpen ? 'drawer' : 'chat')
      experiment.completeTask2Schedule(scopedItem, registrationPath)
      setIsRegistrationOpen(false)
      setRegistrationInitialKind(null)
      setIsAddMenuOpen(false)
      return true
    }
    setRegisteredItems((current) => current.some((existing) => existing.id === scopedItem.id) ? current : [...current, scopedItem])
    setIsRegistrationOpen(false)
    setRegistrationInitialKind(null)
    setIsAddMenuOpen(false)
    setInitialDrawerSection(item.kind)
    setIsDrawerOpen(true)
  }

  function updateRegisteredItem(updated: RegisteredItem) {
    setRegisteredItems((current) => current.map((item) => item.id === updated.id ? updated : item))
  }

  function openSearchHit(hit: SearchHit) {
    const room = getTaskRoom(taskId, hit.roomId)
    if (!room) return
    const matchIndex = hit.message.text.toLocaleLowerCase().indexOf(searchTerm.trim().toLocaleLowerCase())
    setIsSearchOpen(false)
    setIsAddMenuOpen(false)
    setSelectedRoom(room)
    setTargetMessageNumber(hit.message.number)
    setTargetQuery(searchTerm.trim() ? hit.message.text.slice(matchIndex, matchIndex + searchTerm.trim().length) : '')
    if (taskId === 'task_3') experiment.selectSearchHit(hit.roomId, hit.message.number, searchTerm)
  }

  return (
    <main className="app-stage" aria-label="채팅 정보 탐색 앱">
      <div className={`mobile-frame${selectedRoom ? ' is-chat' : ''}${isDrawerOpen ? ' is-drawer' : ''}${isNoticeOpen ? ' is-notice' : ''}`}>
        <StatusBar time={selectedRoom ? '7:52' : '7:50'} isChat={Boolean(selectedRoom) && !isDrawerOpen} />
        <TaskHintBar />
        <section className={`app-content${selectedRoom ? ' chat-app-content' : ''}${isDrawerOpen ? ' drawer-app-content' : ''}`}>
          {selectedRoom && isDrawerOpen ? (
            <ChatRoomDrawer
              room={selectedRoom}
              items={taskId === 'task_2' ? registeredItems : []}
              itemsRoomId={scopedRegistrationRoomId}
              conversationOverride={conversationMap[selectedRoom.id]}
              initialSection={initialDrawerSection}
              onInitialSectionHandled={() => setInitialDrawerSection(null)}
              onUpdateItem={updateRegisteredItem}
              onCreateSchedule={() => { setRegistrationPath('drawer'); setRegistrationInitialKind('schedule'); setIsRegistrationOpen(true) }}
              onBack={() => setIsDrawerOpen(false)}
            />
          ) : selectedRoom ? (
            <ChatRoomView
              room={selectedRoom}
              unreadTotal={unreadTotal}
              onBack={() => { setIsAddMenuOpen(false); setIsSearchOpen(false); setIsNoticeOpen(false); setTargetMessageNumber(null); setTargetQuery(''); setSelectedRoom(null) }}
              onOpenDrawer={() => { setIsAddMenuOpen(false); setIsSearchOpen(false); setIsNoticeOpen(false); setIsDrawerOpen(true) }}
              onOpenSearch={() => { setIsAddMenuOpen(false); setIsNoticeOpen(false); setSearchTerm(''); setIsSearchOpen(true) }}
              onOpenNotice={() => { setIsAddMenuOpen(false); setIsSearchOpen(false); setIsNoticeOpen(true) }}
              targetMessageNumber={targetMessageNumber}
              targetQuery={targetQuery}
              conversationOverride={conversationMap[selectedRoom.id]}
              participantName={session.participantName}
              onScrollTrackingReady={taskId === 'task_3' ? experiment.markTask3ScrollTrackingReady : undefined}
              onScrollAssessment={taskId === 'task_3' ? experiment.recordTask3Scroll : undefined}
            />
          ) : (
            <ChatList rooms={experimentRooms} onOpenRoom={(room) => { experiment.visitRoom(room.id); setSelectedRoom(room) }} />
          )}
        </section>
        <TaskControls taskId={taskId} selectedRoomId={selectedRoom?.id} onAbandon={experiment.openAbandonDialog} onWrongRoom={() => setSelectedRoom(null)} />
        {selectedRoom && !isDrawerOpen && !isNoticeOpen ? <MessageComposer onOpenAdd={() => setIsAddMenuOpen(true)} /> : !selectedRoom ? <BottomNavigation rooms={experimentRooms} /> : null}
        <div className="system-bottom-space" aria-hidden="true">
          <span className="home-indicator" />
        </div>
        {selectedRoom && !isDrawerOpen && !isNoticeOpen && isAddMenuOpen && <MessageAddMenu onClose={() => setIsAddMenuOpen(false)} onOpenRegistration={() => { setRegistrationPath('plus'); setRegistrationInitialKind(taskId === 'task_2' ? 'schedule' : null); setIsAddMenuOpen(false); setIsRegistrationOpen(true) }} />}
        {selectedRoom && !isDrawerOpen && !isNoticeOpen && isSearchOpen && <SearchView rooms={experimentRooms} conversationData={conversationMap} onCancel={() => { setIsSearchOpen(false); setSearchTerm('') }} onQueryChange={setSearchTerm} onSearchSubmit={experiment.recordSearchQuery} onSelect={openSearchHit} />}
        {selectedRoom && !isDrawerOpen && isNoticeOpen && <NoticeDetailView room={selectedRoom} onBack={() => setIsNoticeOpen(false)} />}
        {selectedRoom && isRegistrationOpen && <RegistrationFlow roomId={taskId === 'task_2' ? scopedRegistrationRoomId ?? selectedRoom.id : selectedRoom.id} initialKind={registrationInitialKind} onOpen={() => { if (taskId === 'task_2') experiment.recordTask2CalendarOpen(registrationPath, isDrawerOpen ? 'drawer' : 'chat') }} onClose={() => { if (taskId === 'task_2') experiment.recordTask2CalendarReturn(registrationPath, isDrawerOpen ? 'drawer' : 'chat'); setIsRegistrationOpen(false); setRegistrationInitialKind(null) }} onSave={saveRegisteredItem} />}
      </div>
    </main>
  )
}
