import { useEffect, useState } from 'react'

const menuGroups = [
  [{ icon: 'phone', label: '통화', color: 'green' }, { icon: 'gift', label: '선물하기', color: 'pink' }, { icon: 'pay', label: '송금', color: 'yellow' }],
  [{ icon: 'pin', label: '지도', color: 'blue' }, { icon: 'friends', label: '친구위치', color: 'blue' }, { icon: 'music', label: '뮤직', color: 'green' }, { icon: 'game', label: '미니게임', color: 'pink' }],
  [{ icon: 'file', label: '파일', color: 'gray' }, { icon: 'contact', label: '연락처', color: 'green' }, { icon: 'voice', label: '음성메시지', color: 'pink' }, { icon: 'reserve', label: '예약메시지', color: 'purple' }, { icon: 'capture', label: '캡처', color: 'gray' }],
]

function AddMenuGlyph({ name }: { name: string }) {
  const paths: Record<string, string> = {
    phone: 'M7 3 4 5c-.8 1 1 5 5 9s8 6 9 5l2-3-4-3-2 2c-2-1-4-3-5-5l2-2-4-5Z',
    gift: 'M4 10h16v10H4zM3 7h18v3H3zM12 7v13M12 7c-5 0-6-4-3-4 2 0 3 4 3 4Zm0 0c0-4 1-6 3-4 2 2 0 4-3 4Z',
    pay: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm-4 9h8m-4-4 4 4-4 4',
    pin: 'M12 21s7-7 7-12a7 7 0 1 0-14 0c0 5 7 12 7 12Zm0-10a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z',
    friends: 'M8 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-6 8c0-4 2-6 6-6s6 2 6 6m5-8a3 3 0 1 0-2-5m-1 8c3 0 5 2 5 5',
    music: 'M10 18V5l10-2v13M10 18a3 2 0 1 1-6 0 3 2 0 0 1 6 0Zm10-2a3 2 0 1 1-6 0 3 2 0 0 1 6 0Z',
    game: 'M5 7h14a4 4 0 0 1 4 4v5a3 3 0 0 1-5 2l-2-2H8l-2 2a3 3 0 0 1-5-2v-5a4 4 0 0 1 4-4Zm2 3v5m-2-2h5m7-2h.1m2 3h.1',
    file: 'M5 3h9l5 5v13H5zM14 3v6h5',
    contact: 'M5 3h14v18H5zM8 8h8m-8 4h8m-8 4h5M3 7H2m1 5H2m1 5H2',
    voice: 'M5 10v4m5-8v12m5-16v20m5-14v8',
    reserve: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-14v5l4 2',
    capture: 'M4 8V4h4m8 0h4v4m0 8v4h-4m-8 0H4v-4M8 8h8v8H8z',
  }
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d={paths[name] ?? ''} /></svg>
}

export function MessageAddMenu({ onClose, onOpenRegistration }: { onClose: () => void; onOpenRegistration: () => void }) {
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <div className="message-add-overlay" onClick={onClose}>
      <section
        className={`message-add-sheet${expanded ? ' is-expanded' : ''}`}
        role="dialog"
        aria-label="메시지 추가 메뉴"
        onClick={(event) => event.stopPropagation()}
      >
        <button className="message-add-handle" type="button" aria-label={expanded ? '메뉴 높이 줄이기' : '메뉴 펼치기'} onClick={() => setExpanded(!expanded)}>
          <span />
        </button>
        <div className="message-add-scroll">
          <div className="message-add-recent-head">
            <h2>최근 사진</h2>
            <button type="button" disabled>전송</button>
          </div>
          <div className="message-add-recent" aria-label="최근 사진 미리보기 자리">
            <div className="message-add-camera" aria-hidden="true"><span>●</span></div>
            {Array.from({ length: 4 }, (_, index) => <div className="message-add-photo-placeholder" key={index} aria-hidden="true"><i /></div>)}
          </div>
          <p className="message-add-permission">선택된 사진만 접근할 수 있도록 설정되어 있습니다.</p>
          <button type="button" className="message-add-link">사진 추가 ›</button>
          <div className="message-add-primary-actions">
            <div><PrimaryMenuIcon name="photo" /><span>사진</span></div>
            <button type="button" onClick={onOpenRegistration}><PrimaryMenuIcon name="reserve" /><span>일정</span></button>
          </div>
          {menuGroups.map((group, groupIndex) => (
            <div className="message-add-group" key={groupIndex}>
              {group.map((item) => <div className="message-add-item" key={item.label}><span className={`message-add-icon ${item.color}`}><AddMenuGlyph name={item.icon} /></span><span>{item.label}</span></div>)}
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

function PrimaryMenuIcon({ name }: { name: 'photo' | 'reserve' }) {
  if (name === 'photo') return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 4h18v16H3zM5 17l5-5 3 3 3-4 3 6M16 8h.1" /></svg>
  return <MenuIconBase />
}

function MenuIconBase() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-14v5l4 2" /></svg>
}
