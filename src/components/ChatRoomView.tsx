import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { ChatRoomListItem } from '../data/chatRooms'
import { conversations, type Conversation, type ConversationMessage } from '../data/conversations'

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m15 4-8 8 8 8" />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <circle cx="13.5" cy="13.5" r="9.5" />
      <path d="m21 21 7 7" />
    </svg>
  )
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <path d="M3 6h26M3 16h26M3 26h26" />
    </svg>
  )
}

function NoticeIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 10v4h4l9 5V5l-9 5H3Zm4 4 2 6h4l-2.5-7.4M19 9l2-2m-2 10 2 2" /></svg>
}

function CloseIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>
}

function ChatRoomHeader({
  room,
  unreadTotal,
  onBack,
  onOpenDrawer,
  onOpenSearch,
}: {
  room: ChatRoomListItem
  unreadTotal: number
  onBack: () => void
  onOpenDrawer: () => void
  onOpenSearch: () => void
}) {
  return (
    <header className="chat-room-header">
      <button type="button" className="chat-back-button" onClick={onBack} aria-label="채팅 목록으로 돌아가기">
        <BackIcon />
        <span>{unreadTotal}</span>
      </button>
      <h1>{room.name}</h1>
      <div className="chat-room-actions">
        <button type="button" onClick={onOpenSearch} aria-label="대화 내용 검색"><SearchIcon /></button>
        <button type="button" onClick={onOpenDrawer} aria-label="채팅방 서랍 열기"><MenuIcon /></button>
      </div>
    </header>
  )
}

function MessageRow({ message, showSender, highlightTerm }: { message: ConversationMessage; showSender: boolean; highlightTerm?: string }) {
  const matchingText = highlightTerm ? message.text.toLocaleLowerCase().indexOf(highlightTerm.toLocaleLowerCase()) : -1
  const content = matchingText >= 0 && highlightTerm
    ? <>{message.text.slice(0, matchingText)}<mark className="message-search-highlight">{message.text.slice(matchingText, matchingText + highlightTerm.length)}</mark>{message.text.slice(matchingText + highlightTerm.length)}</>
    : message.text
  if (message.isSystem) {
    return <div className="chat-system-message" data-message-number={message.number}>{message.text}</div>
  }

  if (message.isMine) {
    return (
      <article className="message-row message-outgoing" data-message-number={message.number} aria-label={`내 메시지 ${message.number}`}>
        <div className="message-line">
          {message.timestamp && <time className="message-time">{message.timestamp}</time>}
          <div className="message-bubble">{content}</div>
        </div>
      </article>
    )
  }

  return (
    <article className={`message-row message-incoming${showSender ? ' is-new-sender' : ''}`} data-message-number={message.number} aria-label={`${message.sender} 메시지 ${message.number}`}>
      <div className="message-avatar-slot">
        {showSender && <img className="message-avatar" src="/assets/default-profile.png" alt="" />}
      </div>
      <div className="incoming-message-content">
        {showSender && <div className="message-sender">{message.sender}</div>}
        <div className="message-line">
          <div className="message-bubble">{content}</div>
          {message.timestamp && <time className="message-time">{message.timestamp}</time>}
        </div>
      </div>
    </article>
  )
}

export function ChatRoomView({
  room,
  unreadTotal,
  onBack,
  onOpenDrawer,
  onOpenSearch,
  onOpenNotice,
  targetMessageNumber,
  targetQuery,
  conversationOverride,
  participantName,
  onScrollTrackingReady,
  onScrollAssessment,
}: {
  room: ChatRoomListItem
  unreadTotal: number
  onBack: () => void
  onOpenDrawer: () => void
  onOpenSearch: () => void
  onOpenNotice: () => void
  targetMessageNumber?: number | null
  targetQuery?: string
  conversationOverride?: Conversation
  participantName?: string
  onScrollTrackingReady?: () => void
  onScrollAssessment?: (assessment: 'user' | 'uncertain') => void
}) {
  const sourceConversation = conversationOverride ?? conversations[room.id] ?? { messages: [] }
  const conversation = participantName ? {
    ...sourceConversation,
    messages: sourceConversation.messages.map((message) => message.isSystem && message.text.includes('김성윤')
      ? { ...message, text: `${participantName}님이 입장하셨습니다.` }
      : message.isMine ? { ...message, sender: participantName } : message),
  } : sourceConversation
  const timelineRef = useRef<HTMLDivElement>(null)
  const followsLatestRef = useRef(true)
  const lastScrollTopRef = useRef<number | null>(null)
  const userScrollIntentUntilRef = useRef(0)
  const programmaticScrollUntilRef = useRef(0)
  const touchStartYRef = useRef<number | null>(null)
  const confirmedUserScrollRef = useRef(false)
  const readyCallbackRef = useRef(onScrollTrackingReady)
  readyCallbackRef.current = onScrollTrackingReady
  const [isNoticeVisible, setIsNoticeVisible] = useState(true)

  useEffect(() => setIsNoticeVisible(true), [room.id])

  useEffect(() => {
    if (onScrollAssessment) readyCallbackRef.current?.()
  }, [room.id, Boolean(onScrollAssessment)])

  useLayoutEffect(() => {
    const timeline = timelineRef.current
    if (!timeline) return
    programmaticScrollUntilRef.current = performance.now() + 350
    if (targetMessageNumber) {
      const target = timeline.querySelector<HTMLElement>(`[data-message-number="${targetMessageNumber}"]`)
      if (target) target.scrollIntoView({ block: 'center', behavior: 'instant' })
    } else if (followsLatestRef.current) {
      timeline.scrollTop = timeline.scrollHeight
    }
  }, [room.id, targetMessageNumber, conversation.messages.length])

  return (
    <div className="chat-room-view">
      <ChatRoomHeader room={room} unreadTotal={unreadTotal} onBack={onBack} onOpenDrawer={onOpenDrawer} onOpenSearch={onOpenSearch} />
      {room.noticeTitle && isNoticeVisible && (
        <div className="chat-notice-banner">
          <button type="button" className="chat-notice-open" onClick={onOpenNotice} aria-label={`공지 보기: ${room.noticeTitle}`}>
            <NoticeIcon />
            <span>{room.noticeTitle}</span>
          </button>
          <button type="button" className="chat-notice-dismiss" onClick={() => setIsNoticeVisible(false)} aria-label="공지 띠 닫기"><CloseIcon /></button>
        </div>
      )}
      <div className="chat-timeline" ref={timelineRef} aria-label={`${room.name} 대화`} onScroll={(event) => {
        const timeline = event.currentTarget
        const previousScrollTop = lastScrollTopRef.current
        lastScrollTopRef.current = timeline.scrollTop
        followsLatestRef.current = timeline.scrollHeight - timeline.scrollTop - timeline.clientHeight < 36
        if (previousScrollTop === null || !onScrollAssessment || Math.abs(timeline.scrollTop - previousScrollTop) < 4) return
        const now = performance.now()
        if (now <= programmaticScrollUntilRef.current) {
          if (now <= userScrollIntentUntilRef.current) onScrollAssessment('uncertain')
          return
        }
        if (now <= userScrollIntentUntilRef.current) {
          confirmedUserScrollRef.current = true
          onScrollAssessment('user')
        } else if (!confirmedUserScrollRef.current) {
          onScrollAssessment('uncertain')
        }
      }} onWheel={() => {
        userScrollIntentUntilRef.current = performance.now() + 2000
      }} onTouchStart={(event) => {
        touchStartYRef.current = event.touches[0]?.clientY ?? null
      }} onTouchMove={(event) => {
        const currentY = event.touches[0]?.clientY
        if (currentY !== undefined && touchStartYRef.current !== null && Math.abs(currentY - touchStartYRef.current) >= 8) {
          userScrollIntentUntilRef.current = performance.now() + 2500
        }
      }} onPointerDown={(event) => {
        if (event.pointerType === 'mouse' || event.pointerType === 'pen') userScrollIntentUntilRef.current = performance.now() + 1200
      }} onKeyDown={(event) => {
        if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(event.key)) userScrollIntentUntilRef.current = performance.now() + 1200
      }}>
        {conversation.dateLabel && <div className="chat-date-divider"><span>{conversation.dateLabel}</span></div>}
        {conversation.messages.map((message, index) => {
          const previous = conversation.messages[index - 1]
          const showSender = !message.isMine && !message.isSystem && (
            !previous || previous.isMine || previous.isSystem || previous.sender !== message.sender
          )

          return <MessageRow key={`${room.id}-${message.number}`} message={message} showSender={showSender} highlightTerm={targetMessageNumber === message.number ? targetQuery : undefined} />
        })}
      </div>
    </div>
  )
}

function AddIcon() {
  return <svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 4v24M4 16h24" /></svg>
}

function EmojiIcon() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <circle cx="16" cy="16" r="12" />
      <path d="M10.5 19c1.2 2.2 3 3.3 5.5 3.3s4.3-1.1 5.5-3.3" />
      <path d="M11.5 12.5h.1M20.5 12.5h.1" />
    </svg>
  )
}

function HashIcon() {
  return <svg viewBox="0 0 32 32" aria-hidden="true"><path d="M12 4 8 28M24 4l-4 24M4 12h24M2 21h24" /></svg>
}

function VoiceIcon() {
  return <svg viewBox="0 0 32 32" aria-hidden="true"><path d="M7 13v6M12 8v16M17 4v24M22 9v14M27 13v6" /></svg>
}

export function MessageComposer({ onOpenAdd }: { onOpenAdd: () => void }) {
  return (
    <div className="chat-composer" aria-label="메시지 입력 영역">
      <div className="composer-pill">
        <button type="button" className="composer-add" onClick={onOpenAdd} aria-label="메시지 추가 메뉴 열기"><AddIcon /></button>
        <input aria-label="메시지 입력" placeholder="메시지 입력" readOnly />
        <span className="composer-emoji"><EmojiIcon /></span>
        <span className="composer-hash"><HashIcon /></span>
        <span className="composer-voice"><VoiceIcon /></span>
      </div>
    </div>
  )
}
