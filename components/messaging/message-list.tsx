"use client"

import { useState, useEffect } from "react"
import { useUser } from "@/context/user-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, MessageSquare, Plus } from "lucide-react"
import { formatDate } from "@/lib/utils"
import { persistentStorage } from "@/lib/persistent-storage"
import MessageThread from "./message-thread"
import type { Conversation } from "@/lib/types"

export default function MessageList() {
  const { username, following } = useUser()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [showNewMessage, setShowNewMessage] = useState(false)

  useEffect(() => {
    if (username) {
      const userConversations = persistentStorage.getConversations(username)
      setConversations(userConversations)
    }
  }, [username])

  const filteredConversations = conversations.filter((conv) =>
    conv.otherUser.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const startNewConversation = (recipientUsername: string) => {
    setSelectedConversation(recipientUsername)
    setShowNewMessage(false)
  }

  if (selectedConversation) {
    return <MessageThread recipientUsername={selectedConversation} onBack={() => setSelectedConversation(null)} />
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <MessageSquare className="h-5 w-5 mr-2" />
            Messages
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={() => setShowNewMessage(!showNewMessage)}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        {showNewMessage && (
          <div className="px-4 pb-4">
            <Card>
              <CardContent className="p-3">
                <h4 className="font-medium mb-2">Start new conversation</h4>
                <div className="space-y-2">
                  {following.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Follow someone to start messaging them</p>
                  ) : (
                    following.map((user) => (
                      <div
                        key={user}
                        className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-md cursor-pointer"
                        onClick={() => startNewConversation(user)}
                      >
                        <div className="flex items-center">
                          <Avatar className="h-8 w-8 mr-2">
                            <AvatarFallback>{user.substring(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{user}</span>
                        </div>
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <ScrollArea className="h-[calc(100vh-250px)]">
          <div className="px-4 pb-4">
            {filteredConversations.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No conversations yet</h3>
                <p className="text-muted-foreground mb-4">Start messaging people you follow</p>
                <Button onClick={() => setShowNewMessage(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  New Message
                </Button>
              </div>
            ) : (
              <div className="space-y-1">
                {filteredConversations.map((conversation) => (
                  <div
                    key={conversation.otherUser}
                    className="flex items-center p-3 hover:bg-muted/50 rounded-md cursor-pointer"
                    onClick={() => setSelectedConversation(conversation.otherUser)}
                  >
                    <Avatar className="h-12 w-12 mr-3">
                      <AvatarFallback>{conversation.otherUser.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium truncate">{conversation.otherUser}</h4>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(conversation.lastMessageTime)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{conversation.lastMessage}</p>
                    </div>

                    {conversation.unreadCount > 0 && (
                      <Badge variant="destructive" className="ml-2">
                        {conversation.unreadCount}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
