// Client-side helpers for the real-time social backend.

export interface ChatSummary {
  id: string
  type: "direct" | "group"
  name: string | null
  members: string[]
  otherUser: string | null
  lastMessage: string | null
  lastMediaType: string | null
  lastMessageTime: number
  unreadCount: number
}

export interface ChatMessage {
  id: string
  chat_id: string
  sender: string
  content: string | null
  media_url: string | null
  media_type: string | null
  created_at: number
}

export interface AppNotification {
  id: string
  type: string
  from_user: string | null
  to_user: string
  content: string | null
  is_read: boolean
  meta: any
  created_at: number
}

export interface CallSignal {
  id: string
  from_user: string
  to_user: string
  call_id: string
  type: "offer" | "answer" | "ice" | "ringing" | "reject" | "end"
  payload: any
  created_at: number
}

async function jsonOrThrow(res: Response) {
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || "Request failed")
  return data
}

export const socialApi = {
  // Chats & messages
  async listChats(username: string): Promise<ChatSummary[]> {
    const data = await jsonOrThrow(await fetch(`/api/chats?username=${encodeURIComponent(username)}`))
    return data.chats
  },
  async getOrCreateDirectChat(username: string, otherUser: string): Promise<string> {
    const data = await jsonOrThrow(
      await fetch("/api/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, type: "direct", otherUser }),
      }),
    )
    return data.chatId
  },
  async createGroupChat(username: string, members: string[], name: string): Promise<string> {
    const data = await jsonOrThrow(
      await fetch("/api/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, type: "group", members, name }),
      }),
    )
    return data.chatId
  },
  async getMessages(chatId: string, username: string, since = 0): Promise<ChatMessage[]> {
    const data = await jsonOrThrow(
      await fetch(`/api/messages/${chatId}?username=${encodeURIComponent(username)}&since=${since}`),
    )
    return data.messages
  },
  async sendMessage(
    chatId: string,
    sender: string,
    payload: { content?: string; mediaUrl?: string; mediaType?: string },
  ): Promise<{ id: string; created_at: number }> {
    return jsonOrThrow(
      await fetch(`/api/messages/${chatId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sender, ...payload }),
      }),
    )
  },

  // Safety
  async listBlocked(username: string): Promise<string[]> {
    const data = await jsonOrThrow(await fetch(`/api/blocks?username=${encodeURIComponent(username)}`))
    return data.blocked
  },
  async blockUser(username: string, target: string): Promise<void> {
    await jsonOrThrow(
      await fetch("/api/blocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, target }),
      }),
    )
  },
  async unblockUser(username: string, target: string): Promise<void> {
    await jsonOrThrow(
      await fetch(`/api/blocks?username=${encodeURIComponent(username)}&target=${encodeURIComponent(target)}`, {
        method: "DELETE",
      }),
    )
  },
  async report(payload: {
    reporter: string
    reportedUser?: string
    chatId?: string
    messageId?: string
    reason: string
  }): Promise<void> {
    await jsonOrThrow(
      await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    )
  },

  // Notifications
  async listNotifications(username: string): Promise<AppNotification[]> {
    const data = await jsonOrThrow(await fetch(`/api/notifications?username=${encodeURIComponent(username)}`))
    return data.notifications
  },
  async markNotificationsRead(username: string, id?: string): Promise<void> {
    await jsonOrThrow(
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, id }),
      }),
    )
  },

  // Calls
  async getSignals(username: string, since = 0): Promise<CallSignal[]> {
    const data = await jsonOrThrow(
      await fetch(`/api/calls/signal?username=${encodeURIComponent(username)}&since=${since}`),
    )
    return data.signals
  },
  async sendSignal(payload: {
    fromUser: string
    toUser: string
    callId: string
    type: string
    payload?: any
  }): Promise<{ id: string; created_at: number }> {
    return jsonOrThrow(
      await fetch("/api/calls/signal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    )
  },
  async logCall(payload: {
    caller: string
    recipient: string
    callType: string
    status: string
    duration: number
  }): Promise<void> {
    await jsonOrThrow(
      await fetch("/api/calls/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    )
  },
  async getCallHistory(username: string) {
    const data = await jsonOrThrow(await fetch(`/api/calls/history?username=${encodeURIComponent(username)}`))
    return data.calls
  },
}

// Convert a File to a data URL for inline media sharing.
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
