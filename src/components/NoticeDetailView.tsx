import type { ChatRoomListItem } from '../data/chatRooms'

function CloseIcon() {
  return <svg viewBox="0 0 32 32" aria-hidden="true"><path d="m5 5 22 22M27 5 5 27" /></svg>
}

function HeartIcon() {
  return <svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 27 4.8 15.9C-1 9.9 7.7 1.7 14 8l2 2 2-2c6.3-6.3 15 1.9 9.2 7.9L16 27Z" /></svg>
}

function SmileIcon() {
  return <svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="12" /><path d="M10.5 19c1.2 2.2 3 3.3 5.5 3.3s4.3-1.1 5.5-3.3m-11-6h.1m10.8 0h.1" /></svg>
}

export function NoticeDetailView({ room, onBack }: { room: ChatRoomListItem; onBack: () => void }) {
  return (
    <section className="notice-detail-view" aria-label={`${room.name} 공지 상세`}>
      <header className="notice-detail-header">
        <button type="button" onClick={onBack} aria-label="채팅방으로 돌아가기"><CloseIcon /></button>
        <h1>상세보기</h1>
        <span>글목록</span>
      </header>
      <article className="notice-detail-article">
        <div className="notice-detail-origin">
          <strong>{room.name}</strong>
          <span>공지</span>
        </div>
        <h2>{room.noticeTitle}</h2>
        {/* 상세 공지 본문은 기준 자료에 없으므로 비워 둡니다. */}
        <div className="notice-detail-body" aria-label="공지 본문 없음" />
      </article>
      <footer className="notice-comment-bar" aria-label="댓글 입력 영역">
        <button type="button" aria-label="좋아요" disabled><HeartIcon /></button>
        <input placeholder="댓글을 남겨보세요." aria-label="댓글을 남겨보세요" readOnly />
        <button type="button" aria-label="이모티콘" disabled><SmileIcon /></button>
        <button className="notice-comment-submit" type="button" disabled>등록</button>
      </footer>
    </section>
  )
}
