"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { useUser } from "@/context/user-context"
import { socialApi, type ChatSummary } from "@/lib/social-api"
import MessageThread from "@/components/messaging/message-thread"
import { MessageCircle, Users, Search, Send, Plus, UsersRound } from "lucide-react"

export default function MessagingTab() {
  const { username, following } = useUser()
  const [chats, setChats] = useState<ChatSummary[]>([])
  const [selected, setSelected] = useState<ChatSummary | { direct: string } | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("conversations")
  const [groupOpen, setGroupOpen] = useState(false)
  const [groupName, setGroupName] = useState("")
  const [groupMembers, setGroupMembers] = useState<string[]>([])

  const loadChats = useCallback(async () => {
    if (!username) return
    try {
      setChats(await socialApi.listChats(username))
    } catch {
      // ignore transient errors
    }
  }, [username])

  // Poll conversation list for real-time updates.
  useEffect(() => {
    if (!username) return
    loadChats()
    const interval = setInterval(loadChats, 4000)
    return () => clearInterval(interval)
  }, [username, loadChats])

  const formatTime = (timestamp: number) => {
    const diff = Date.now() - timestamp
    const m = Math.floor(diff / 60000)
    const h = Math.floor(diff / 3600000)
    const d = Math.floor(diff / 86400000)
    if (m < 1) return "Just now"
    if (m < 60) return `${m}m ago`
    if (h < 24) return `${h}h ago`
    return `${d}d ago`
  }

  const startDirect = (otherUser: string) => {
    setSelected({ direct: otherUser })
    setActiveTab("conversations")
  }

  const createGroup = async () => {
    if (!username || groupMembers.length < 1) return
    try {
      const chatId = await socialApi.createGroupChat(username, groupMembers, groupName || "Group Chat")
      setGroupOpen(false)
      setGroupName("")
      setGroupMembers([])
      await loadChats()
      const created = (await socialApi.listChats(username)).find((c) => c.id === chatId)
      if (created) setSelected(created)
    } catch {
      // ignore
    }
  }

  const filteredChats = chats.filter((c) => {
    const label = c.type === "group" ? c.name || "Group" : c.otherUser || ""
    return label.toLowerCase().includes(searchQuery.toLowerCase())
  })

  const filteredFriends = following.filter((f) => f.toLowerCase().includes(searchQuery.toLowerCase()))

  if (!username) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Please log in to access messaging</p>
        </CardContent>
      </Card>
    )
  }

  if (selected) {
    if ("direct" in selected) {
      return <MessageThread recipientUsername={selected.direct} onBack={() => setSelected(null)} />
    }
    return (
      <MessageThread
        chatId={selected.id}
        chatName={selected.name || undefined}
        recipientUsername={selected.otherUser || undefined}
        isGroup={selected.type === "group"}
        onBack={() => setSelected(null)}
      />
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Messages
          </CardTitle>
          <Dialog open={groupOpen} onOpenChange={setGroupOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <UsersRound className="h-4 w-4 mr-1" />
                New Group
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create a group chat</DialogTitle>
                <DialogDescription>Select people you follow to add to the group.</DialogDescription>
              </DialogHeader>
              <Input placeholder="Group name" value={groupName} onChange={(e) => setGroupName(e.target.value)} />
              <ScrollArea className="h-48 border rounded-md p-2">
                {following.length === 0 ? (
                  <p className="text-sm text-muted-foreground p-2">Follow people to add them to a group.</p>
                ) : (
                  following.map((f) => (
                    <label key={f} className="flex items-center gap-2 p-2 cursor-pointer hover:bg-muted/50 rounded">
                      <Checkbox
                        checked={groupMembers.includes(f)}
                        onCheckedChange={(checked) =>
                          setGroupMembers((prev) => (checked ? [...prev, f] : prev.filter((x) => x !== f)))
                        }
                      />
                      <Avatar className="h-6 w-6">
                        <AvatarFallback>{f.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{f}</span>
                    </label>
                  ))
                )}
              </ScrollArea>
              <DialogFooter>
                <Button onClick={createGroup} disabled={groupMembers.length < 1}>
                  <Plus className="h-4 w-4 mr-1" />
                  Create group
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations and friends..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="conversations" className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                Conversations
                {chats.filter((c) => c.unreadCount > 0).length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {chats.filter((c) => c.unreadCount > 0).length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="friends" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Friends
                <Badge variant="secondary" className="ml-1">
                  {following.length}
                </Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="conversations" className="mt-4">
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {filteredChats.map((chat) => {
                    const label = chat.type === "group" ? chat.name || "Group Chat" : chat.otherUser || ""
                    return (
                      <Card
                        key={chat.id}
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => setSelected(chat)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarFallback>
                                {chat.type === "group" ? (
                                  <UsersRound className="h-4 w-4" />
                                ) : (
                                  label.substring(0, 2).toUpperCase()
                                )}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="font-medium truncate">{label}</p>
                                <div className="flex items-center gap-2">
                                  {chat.unreadCount > 0 && (
                                    <Badge variant="destructive" className="h-5 min-w-5 px-1 text-xs">
                                      {chat.unreadCount}
                                    </Badge>
                                  )}
                                  {chat.lastMessageTime > 0 && (
                                    <span className="text-xs text-muted-foreground">
                                      {formatTime(chat.lastMessageTime)}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <p className="text-sm text-muted-foreground truncate">
                                {chat.lastMediaType && chat.lastMediaType !== "text"
                                  ? `Sent a ${chat.lastMediaType}`
                                  : chat.lastMessage || "No messages yet"}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}

                  {filteredChats.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No conversations yet</p>
                      <p className="text-sm">Start messaging from the Friends tab!</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="friends" className="mt-4">
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {filteredFriends.map((friend) => (
                    <Card
                      key={friend}
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => startDirect(friend)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarFallback>{friend.substring(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{friend}</p>
                              <p className="text-sm text-muted-foreground">Tap to message</p>
                            </div>
                          </div>
                          <Button size="sm" variant="outline">
                            <Send className="h-3 w-3 mr-1" />
                            Message
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {filteredFriends.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No friends yet</p>
                      <p className="text-sm">Follow people to start messaging!</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
    </Card>
  )
}
