import { useEffect, useMemo, useRef, useState } from 'react'
import { chatRooms } from '../data/chatRooms'
import { conversations } from '../data/conversations'
import { searchMessages, type SearchMessageHit } from '../data/searchMessages'

export type SearchHit = SearchMessageHit

function SearchGlyph() {
  return <svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="13.5" cy="13.5" r="9.5" /><path d="m21 21 7 7" /></svg>
}

function ClearGlyph() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" /><path d="m8.5 8.5 7 7m0-7-7 7" /></svg>
}

function PersonSearchGlyph() {
  return <svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="12" cy="10" r="5" /><path d="M3 26c0-5 3-8 9-8 2 0 4 .5 5.5 1.5M21 22a6 6 0 1 0 12 0 6 6 0 0 0-12 0Zm10 5 3 3" /></svg>
}

function DateSearchGlyph() {
  return <svg viewBox="0 0 32 32" aria-hidden="true"><rect x="4" y="6" width="19" height="21" rx="3" /><path d="M9 3v6m9-6v6M4 12h19m3 12a5 5 0 1 0 10 0 5 5 0 0 0-10 0Zm9 4 4 4" /></svg>
}

function ResultArrow({ direction }: { direction: 'up' | 'down' }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d={direction === 'up' ? 'm5 15 7-7 7 7' : 'm5 9 7 7 7-7'} /></svg>
}

function highlight(text: string, query: string) {
  if (!query) return text
  const lower = text.toLocaleLowerCase()
  const match = lower.indexOf(query.toLocaleLowerCase())
  if (match < 0) return text
  return <>{text.slice(0, match)}<mark>{text.slice(match, match + query.length)}</mark>{text.slice(match + query.length)}</>
}

export function SearchView({ onCancel, onSelect, onQueryChange, onSearchSubmit, rooms = chatRooms, conversationData = conversations, roomId }: { onCancel: () => void; onSelect: (hit: SearchHit) => void; onQueryChange: (query: string) => void; onSearchSubmit?: (query: string) => void; rooms?: typeof chatRooms; conversationData?: typeof conversations; roomId?: string }) {
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const results = useMemo(() => {
    return searchMessages(query, rooms, conversationData, roomId)
  }, [query, rooms, conversationData, roomId])
  const safeIndex = results.length ? activeIndex % results.length : 0

  useEffect(() => {
    if (!results.length) return
    document.querySelector<HTMLElement>(`[data-search-hit="${safeIndex}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [safeIndex, results.length])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onCancel])

  function moveResult(direction: number) {
    setActiveIndex((current) => results.length ? (current + direction + results.length) % results.length : 0)
  }

  function clearQuery() {
    setQuery('')
    onQueryChange('')
    setActiveIndex(0)
    inputRef.current?.focus()
  }

  return (
    <section className="search-screen" aria-label="대화 내용 검색">
      <div className="search-topbar">
        <label className="search-field">
          <SearchGlyph />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => { setQuery(event.target.value); onQueryChange(event.target.value); setActiveIndex(0) }}
            placeholder="대화내용 검색"
            aria-label="대화내용 검색"
            onKeyDown={(event) => { if (event.key === 'Enter') onSearchSubmit?.(query) }}
            autoFocus
          />
          {query && <button type="button" className="search-clear" aria-label="검색어 지우기" onClick={clearQuery}><ClearGlyph /></button>}
        </label>
        <button type="button" className="search-cancel" onClick={onCancel}>취소</button>
      </div>

      {query.trim() && (
        <div className="search-results" aria-live="polite">
          {results.length ? results.map((hit, index) => (
            <button
              type="button"
              className={`search-result${index === safeIndex ? ' is-current' : ''}`}
              data-search-hit={index}
              key={`${hit.roomId}-${hit.message.number}`}
              onClick={() => onSelect(hit)}
            >
              <span className="search-result-heading">{hit.roomName}<time>{hit.dateLabel}{hit.dateLabel && hit.message.timestamp ? ' · ' : ''}{hit.message.timestamp}</time></span>
              <span className="search-result-body">{highlight(hit.message.text, query.trim())}</span>
            </button>
          )) : <div className="search-empty">검색 결과 없음</div>}
        </div>
      )}

      {query.trim() && (
        <div className="search-navigation" aria-label="검색 결과 이동">
          <button type="button" aria-label="사람별 검색" disabled><PersonSearchGlyph /></button>
          <button type="button" aria-label="날짜별 검색" disabled><DateSearchGlyph /></button>
          <span className="search-result-count">{results.length ? `${safeIndex + 1}/${results.length}` : '검색 결과 없음'}</span>
          <button type="button" aria-label="이전 검색 결과" onClick={() => moveResult(-1)} disabled={!results.length}><ResultArrow direction="up" /></button>
          <button type="button" aria-label="다음 검색 결과" onClick={() => moveResult(1)} disabled={!results.length}><ResultArrow direction="down" /></button>
        </div>
      )}
    </section>
  )
}
