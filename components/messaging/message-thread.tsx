"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useUser } from "@/context/user-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { MoreHorizontal, Send, Paperclip, ArrowLeft, Ban, Flag, ShieldOff, Loader2 } from "lucide-react"
import { formatDate } from "@/lib/utils"
import { socialApi, fileToDataUrl, type ChatMessage } from "@/lib/social-api"
import CallButton from "@/components/calling/call-button"

interface MessageThreadProps {
  recipientUsername?: string
  chatId?: string
  chatName?: string
  isGroup?: boolean
  onBack: () => void
}

const MAX_MEDIA_BYTES = 8 * 1024 * 1024 // 8MB inline limit

export default function MessageThread({
  recipientUsername,
  chatId: chatIdProp,
  chatName,
  isGroup,
  onBack,
}: MessageThreadProps) {
  const { username } = useUser()
  const [chatId, setChatId] = useState<string | null>(chatIdProp || null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [messageInput, setMessageInput] = useState("")
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isBlocked, setIsBlocked] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [reportReason, setReportReason] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const lastTsRef = useRef(0)

  const title = isGroup ? chatName || "Group Chat" : recipientUsername || ""

  // Resolve or create the chat id.
  useEffect(() => {
    let cancelled = false
    async function resolve() {
      try {
        if (chatIdProp) {
          setChatId(chatIdProp)
          return
        }
        if (username && recipientUsername) {
          const id = await socialApi.getOrCreateDirectChat(username, recipientUsername)
          if (!cancelled) setChatId(id)
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Unable to open chat")
      }
    }
    resolve()
    return () => {
      cancelled = true
    }
  }, [chatIdProp, username, recipientUsername])

  // Load blocked state for direct chats.
  useEffect(() => {
    if (!username || !recipientUsername || isGroup) return
    socialApi
      .listBlocked(username)
      .then((list) => setIsBlocked(list.includes(recipientUsername)))
      .catch(() => {})
  }, [username, recipientUsername, isGroup])

  const poll = useCallback(async () => {
    if (!chatId || !username) return
    try {
      const newMsgs = await socialApi.getMessages(chatId, username, lastTsRef.current)
      if (newMsgs.length > 0) {
        lastTsRef.current = newMsgs[newMsgs.length - 1].created_at
        setMessages((prev) => {
          const seen = new Set(prev.map((m) => m.id))
          return [...prev, ...newMsgs.filter((m) => !seen.has(m.id))]
        })
      }
    } catch {
      // ignore transient polling errors
    }
  }, [chatId, username])

  // Initial load + polling every 2s for near real-time delivery.
  useEffect(() => {
    if (!chatId || !username) return
    lastTsRef.current = 0
    setMessages([])
    poll()
    const interval = setInterval(poll, 2000)
    return () => clearInterval(interval)
  }, [chatId, username, poll])

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages])

  const send = async (payload: { content?: string; mediaUrl?: string; mediaType?: string }) => {
    if (!username || !chatId) return
    setSending(true)
    setError(null)
    try {
      await socialApi.sendMessage(chatId, username, payload)
      await poll()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send")
    } finally {
      setSending(false)
    }
  }

  const handleSendText = async () => {
    const text = messageInput.trim()
    if (!text) return
    setMessageInput("")
    await send({ content: text })
  }

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > MAX_MEDIA_BYTES) {
        setError("File too large (max 8MB).")
      } else {
        const dataUrl = await fileToDataUrl(file)
        const mediaType = file.type.startsWith("image/")
          ? "image"
          : file.type.startsWith("video/")
            ? "video"
            : file.type.startsWith("audio/")
              ? "audio"
              : "file"
        await send({ mediaUrl: dataUrl, mediaType, content: file.name })
      }
    }
    if (fileRef.current) fileRef.current.value = ""
  }

  const toggleBlock = async () => {
    if (!username || !recipientUsername) return
    try {
      if (isBlocked) {
        await socialApi.unblockUser(username, recipientUsername)
        setIsBlocked(false)
      } else {
        await socialApi.blockUser(username, recipientUsername)
        setIsBlocked(true)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed")
    }
  }

  const submitReport = async () => {
    if (!username || !reportReason.trim()) return
    try {
      await socialApi.report({
        reporter: username,
        reportedUser: recipientUsername,
        chatId: chatId || undefined,
        reason: reportReason.trim(),
      })
      setReportOpen(false)
      setReportReason("")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to report")
    }
  }

  const renderMedia = (m: ChatMessage) => {
    if (!m.media_url) return null
    if (m.media_type === "image")
      return <img src={m.media_url || "/placeholder.svg"} alt="Shared image" className="mt-1 rounded-md max-h-64 object-cover" />
    if (m.media_type === "video")
      return <video src={m.media_url} controls className="mt-1 rounded-md max-h-64" />
    if (m.media_type === "audio") return <audio src={m.media_url} controls className="mt-1 w-full" />
    return (
      <a href={m.media_url} download className="mt-1 block underline text-sm">
        Download attachment
      </a>
    )
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={onBack} className="mr-2">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Avatar className="h-8 w-8 mr-3">
              <AvatarFallback>{title.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">{title}</CardTitle>
              <p className="text-xs text-muted-foreground">
                {isGroup ? "Group chat" : isBlocked ? "Blocked" : "Direct message"}
              </p>
            </div>
          </div>

          <div className="flex gap-1">
            {!isGroup && recipientUsername && username && (
              <CallButton recipientUsername={recipientUsername} />
            )}
            {!isGroup && recipientUsername && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={toggleBlock}>
                    {isBlocked ? (
                      <>
                        <ShieldOff className="h-4 w-4 mr-2" /> Unblock {recipientUsername}
                      </>
                    ) : (
                      <>
                        <Ban className="h-4 w-4 mr-2" /> Block {recipientUsername}
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setReportOpen(true)}>
                    <Flag className="h-4 w-4 mr-2" /> Report
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0 flex flex-col h-[calc(100vh-200px)]">
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No messages yet. Start the conversation!</p>
              </div>
            ) : (
              messages.map((message) => {
                const mine = message.sender === username
                return (
                  <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[70%] rounded-lg px-3 py-2 ${
                        mine ? "bg-primary text-primary-foreground" : "bg-muted"
                      }`}
                    >
                      {isGroup && !mine && <p className="text-xs font-medium mb-1">{message.sender}</p>}
                      {message.content && message.media_type !== "image" && message.media_type !== "video" && (
                        <p className="text-sm break-words">{message.content}</p>
                      )}
                      {renderMedia(message)}
                      <p className="text-xs opacity-70 mt-1">{formatDate(message.created_at)}</p>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </ScrollArea>

        {error && <p className="px-4 py-1 text-xs text-destructive">{error}</p>}

        <div className="p-4 border-t">
          {isBlocked ? (
            <p className="text-center text-sm text-muted-foreground">
              You blocked this user. Unblock to send messages.
            </p>
          ) : (
            <div className="flex gap-2">
              <input ref={fileRef} type="file" accept="image/*,video/*,audio/*" hidden onChange={handleFile} />
              <Button variant="ghost" size="icon" onClick={() => fileRef.current?.click()} disabled={sending}>
                <Paperclip className="h-4 w-4" />
              </Button>
              <Input
                placeholder="Type a message..."
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.nativeEvent.isComposing && e.keyCode !== 229) handleSendText()
                }}
                className="flex-1"
                disabled={sending}
              />
              <Button size="icon" onClick={handleSendText} disabled={!messageInput.trim() || sending}>
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          )}
        </div>
      </CardContent>

      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report {recipientUsername}</DialogTitle>
            <DialogDescription>
              Tell us what&apos;s wrong. Our team reviews reports to keep the community safe.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Describe the issue (spam, harassment, etc.)"
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setReportOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitReport} disabled={!reportReason.trim()}>
              Submit report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
