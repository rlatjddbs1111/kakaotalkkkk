import { conversations } from '../data/conversations'
import type { ChatRoomListItem } from '../data/chatRooms'

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

export function ChatRoomDrawer({ room, onBack }: { room: ChatRoomListItem; onBack: () => void }) {
  const conversation = conversations[room.id]
  const participants = [...new Set(conversation.messages.filter((message) => !message.isSystem).map((message) => message.sender))]
  if (conversation.messages.some((message) => message.isSystem && message.text.includes('김성윤'))) participants.push('김성윤')

  return (
    <div className="drawer-view">
      <DrawerHeader onBack={onBack} />
      <section className="drawer-identity" aria-label={`${room.name} 채팅방 정보`}>
        <div className="drawer-participant-tiles" aria-hidden="true">
          {participants.slice(0, 4).map((participant, index) => (
            <img key={`${participant}-${index}`} src="/assets/default-profile.png" alt="" />
          ))}
        </div>
        <h1>{room.name}</h1>
      </section>
      <div className="drawer-scroll">
        <section className="drawer-card drawer-media-card" aria-label="공유 항목">
          <div className="drawer-section-title"><DrawerIcon name="photo" /><span>사진/동영상</span></div>
          <div className="drawer-media-strip" aria-hidden="true">
            {Array.from({ length: 6 }, (_, index) => <span key={index} />)}
          </div>
          <div className="drawer-category-row">
            <div><DrawerIcon name="file" /><span>파일</span></div>
            <div><DrawerIcon name="link" /><span>링크</span></div>
            <div><DrawerIcon name="schedule" /><span>일정</span></div>
          </div>
        </section>
        <section className="drawer-card drawer-shortcuts" aria-label="채팅방 메뉴">
          <div><DrawerIcon name="board" /><span>게시판</span></div>
          <div><DrawerIcon name="notice" /><span>공지</span></div>
          <div><DrawerIcon name="vote" /><span>투표</span></div>
          <div><DrawerIcon name="call" /><span>통화</span></div>
        </section>
        <section className="drawer-card drawer-bot"><DrawerIcon name="bot" /><span>챗봇 <em>beta</em></span></section>
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
      </div>
    </div>
  )
}
