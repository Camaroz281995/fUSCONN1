"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useUser } from "@/context/user-context"
import { persistentStorage } from "@/lib/persistent-storage"
import { Phone, MessageCircle, UserPlus, Check, X, PhoneCall, Video } from 'lucide-react'
import type { Notification, FriendRequest } from "@/lib/types"

interface FusionaryMailboxProps {
  isOpen: boolean
  onClose: () => void
}

export default function FusionaryMailbox({ isOpen, onClose }: FusionaryMailboxProps) {
  const { username } = useUser()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([])
  const [activeTab, setActiveTab] = useState("all")

  useEffect(() => {
    if (username && isOpen) {
      loadNotifications()
    }
  }, [username, isOpen])

  const loadNotifications = () => {
    if (!username) return

    const userNotifications = persistentStorage.getUserNotifications(username)
    const pendingRequests = persistentStorage.getFriendRequests()
      .filter(req => req.toUsername === username && req.status === "pending")

    setNotifications(userNotifications)
    setFriendRequests(pendingRequests)
  }

  const handleAcceptFriendRequest = (requestId: string) => {
    persistentStorage.updateFriendRequestStatus(requestId, "accepted")
    loadNotifications()
  }

  const handleDeclineFriendRequest = (requestId: string) => {
    persistentStorage.updateFriendRequestStatus(requestId, "declined")
    loadNotifications()
  }

  const handleMarkAsRead = (notificationId: string) => {
    persistentStorage.markNotificationAsRead(notificationId)
    loadNotifications()
  }

  const formatTime = (timestamp: number) => {
    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return "Just now"
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  const getNotificationIcon = (type: string, callType?: string) => {
    switch (type) {
      case "call":
        return callType === "video" ? <Video className="h-4 w-4" /> : <PhoneCall className="h-4 w-4" />
      case "message":
        return <MessageCircle className="h-4 w-4" />
      case "friend_request":
        return <UserPlus className="h-4 w-4" />
      default:
        return <MessageCircle className="h-4 w-4" />
    }
  }

  const callNotifications = notifications.filter(n => n.type === "call")
  const messageNotifications = notifications.filter(n => n.type === "message")
  const friendRequestNotifications = notifications.filter(n => n.type === "friend_request")

  const totalUnread = notifications.filter(n => !n.isRead).length + friendRequests.length

  if (!username) {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <img 
              src="/images/fusionary-logo.webp" 
              alt="Fusionary Logo" 
              className="h-6 w-6"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
            Fusionary Connectra Mailbox
            <img 
              src="/images/fusionary-logo.webp" 
              alt="Fusionary Logo" 
              className="h-6 w-6"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
            {totalUnread > 0 && (
              <Badge variant="destructive" className="ml-2">
                {totalUnread}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all" className="flex items-center gap-1">
              All
              {totalUnread > 0 && (
                <Badge variant="secondary" className="ml-1 h-4 w-4 p-0 text-xs">
                  {totalUnread}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="calls" className="flex items-center gap-1">
              <Phone className="h-3 w-3" />
              Calls
              {callNotifications.filter(n => !n.isRead).length > 0 && (
                <Badge variant="secondary" className="ml-1 h-4 w-4 p-0 text-xs">
                  {callNotifications.filter(n => !n.isRead).length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="messages" className="flex items-center gap-1">
              <MessageCircle className="h-3 w-3" />
              Messages
              {messageNotifications.filter(n => !n.isRead).length > 0 && (
                <Badge variant="secondary" className="ml-1 h-4 w-4 p-0 text-xs">
                  {messageNotifications.filter(n => !n.isRead).length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="friends" className="flex items-center gap-1">
              <UserPlus className="h-3 w-3" />
              Friends
              {friendRequests.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-4 w-4 p-0 text-xs">
                  {friendRequests.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[400px] mt-4">
            <TabsContent value="all" className="space-y-2">
              {friendRequests.map((request) => (
                <Card key={request.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {request.fromUsername.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{request.fromUsername}</p>
                          <p className="text-sm text-muted-foreground">
                            Sent you a friend request
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatTime(request.timestamp)}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleAcceptFriendRequest(request.id)}
                          className="h-8"
                        >
                          <Check className="h-3 w-3 mr-1" />
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeclineFriendRequest(request.id)}
                          className="h-8"
                        >
                          <X className="h-3 w-3 mr-1" />
                          Decline
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {notifications.map((notification) => (
                <Card 
                  key={notification.id} 
                  className={`${!notification.isRead ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0">
                          {getNotificationIcon(notification.type, notification.callType)}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{notification.fromUsername}</p>
                          <p className="text-sm text-muted-foreground">
                            {notification.content}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatTime(notification.timestamp)}
                          </p>
                        </div>
                      </div>
                      {!notification.isRead && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleMarkAsRead(notification.id)}
                        >
                          Mark as read
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {friendRequests.length === 0 && notifications.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No notifications yet</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="calls" className="space-y-2">
              {callNotifications.map((notification) => (
                <Card 
                  key={notification.id} 
                  className={`${!notification.isRead ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0">
                          {notification.callType === "video" ? 
                            <Video className="h-4 w-4" /> : 
                            <PhoneCall className="h-4 w-4" />
                          }
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{notification.fromUsername}</p>
                          <p className="text-sm text-muted-foreground">
                            {notification.content}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatTime(notification.timestamp)}
                          </p>
                        </div>
                      </div>
                      {!notification.isRead && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleMarkAsRead(notification.id)}
                        >
                          Mark as read
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {callNotifications.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Phone className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No call notifications</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="messages" className="space-y-2">
              {messageNotifications.map((notification) => (
                <Card 
                  key={notification.id} 
                  className={`${!notification.isRead ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <MessageCircle className="h-4 w-4" />
                        <div className="flex-1">
                          <p className="font-medium">{notification.fromUsername}</p>
                          <p className="text-sm text-muted-foreground">
                            {notification.content}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatTime(notification.timestamp)}
                          </p>
                        </div>
                      </div>
                      {!notification.isRead && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleMarkAsRead(notification.id)}
                        >
                          Mark as read
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {messageNotifications.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No message notifications</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="friends" className="space-y-2">
              {friendRequests.map((request) => (
                <Card key={request.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {request.fromUsername.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{request.fromUsername}</p>
                          <p className="text-sm text-muted-foreground">
                            Wants to be your Fusionary friend
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatTime(request.timestamp)}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleAcceptFriendRequest(request.id)}
                          className="h-8"
                        >
                          <Check className="h-3 w-3 mr-1" />
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeclineFriendRequest(request.id)}
                          className="h-8"
                        >
                          <X className="h-3 w-3 mr-1" />
                          Decline
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {friendRequests.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <UserPlus className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No friend requests</p>
                </div>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
