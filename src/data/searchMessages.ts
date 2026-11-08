import type { chatRooms } from './chatRooms'
import type { conversations, ConversationMessage } from './conversations'

export type SearchMessageHit = {
  roomId: string
  roomName: string
  message: ConversationMessage
  dateLabel?: string
}

/** Search within the requested room, or across all supplied rooms when no scope is given. */
export function searchMessages(
  query: string,
  rooms: typeof chatRooms,
  conversationData: typeof conversations,
  roomId?: string,
): SearchMessageHit[] {
  const needle = query.trim().toLocaleLowerCase()
  if (!needle) return []

  const scopedRooms = roomId ? rooms.filter((room) => room.id === roomId) : rooms
  return scopedRooms.flatMap((room) => {
    const conversation = conversationData[room.id]
    if (!conversation) return []
    return conversation.messages
      .filter((message) => !message.isSystem && message.text.toLocaleLowerCase().includes(needle))
      .map((message) => ({ roomId: room.id, roomName: room.name, message, dateLabel: conversation.dateLabel }))
  })
}
