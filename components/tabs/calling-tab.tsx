"use client"

import { useState, useEffect } from "react"
import { useUser } from "@/context/user-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Phone, Video, Search, Clock, Users, PhoneCall, VideoIcon, UserPlus, AlertCircle, Check } from 'lucide-react'
import { formatDate } from "@/lib/utils"
import { persistentStorage } from "@/lib/persistent-storage"
import CallInterface from "@/components/calling/call-interface"
import type { CallSession, FriendRequest, Notification } from "@/lib/types"

export default function CallingTab() {
  const { username, following, addFollowing } = useUser()
  const [searchQuery, setSearchQuery] = useState("")
  const [friendSearchQuery, setFriendSearchQuery] = useState("")
  const [activeCall, setActiveCall] = useState<{ type: "voice" | "video"; recipient: string; callId: string } | null>(null)
  const [callHistory, setCallHistory] = useState<CallSession[]>([])
  const [onlineUsers, setOnlineUsers] = useState<string[]>([])
  const [searchResults, setSearchResults] = useState<string[]>([])
  const [searchError, setSearchError] = useState("")
  const [searchSuccess, setSearchSuccess] = useState("")

  // Load real call history from the shared log and keep presence updated.
  useEffect(() => {
    if (!username) return

    const loadHistory = () => {
      fetch(`/api/calls/history?username=${encodeURIComponent(username)}`)
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data.calls)) setCallHistory(data.calls)
        })
        .catch((err) => console.error("[v0] call history error:", err))
    }

    const loadPresence = () => {
      // Heartbeat + fetch currently-online users.
      fetch("/api/presence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data.online)) {
            setOnlineUsers(data.online.filter((u: string) => u !== username))
          }
        })
        .catch((err) => console.error("[v0] presence error:", err))
    }

    loadHistory()
    loadPresence()
    const historyTimer = setInterval(loadHistory, 15000)
    const presenceTimer = setInterval(loadPresence, 10000)
    return () => {
      clearInterval(historyTimer)
      clearInterval(presenceTimer)
    }
  }, [username])

  const searchForFriends = () => {
    if (!friendSearchQuery.trim()) {
      setSearchResults([])
      setSearchError("")
      return
    }

    // Get all registered usernames
    const allUsernames = persistentStorage.getAllUsernames()
    
    // Filter usernames that match the search query and aren't already followed
    const results = allUsernames.filter(user => 
      user.toLowerCase().includes(friendSearchQuery.toLowerCase()) &&
      user !== username &&
      !following.includes(user)
    )

    if (results.length === 0) {
      setSearchError("No users found with that name")
      setSearchResults([])
    } else {
      setSearchError("")
      setSearchResults(results)
    }
  }

  const sendFriendRequest = (targetUsername: string) => {
    if (!username) return

    // Create friend request
    const friendRequest: FriendRequest = {
      id: Date.now().toString(),
      fromUsername: username,
      toUsername: targetUsername,
      timestamp: Date.now(),
      status: "pending"
    }

    // Save friend request
    persistentStorage.saveFriendRequest(friendRequest)

    // Create notification for the target user
    const notification: Notification = {
      id: Date.now().toString(),
      type: "friend_request",
      fromUsername: username,
      toUsername: targetUsername,
      content: `${username} sent you a friend request!`,
      timestamp: Date.now(),
      isRead: false,
      friendRequestId: friendRequest.id
    }

    persistentStorage.saveNotification(notification)

    setSearchSuccess(`Friend request sent to ${targetUsername}!`)
    setSearchResults(searchResults.filter(user => user !== targetUsername))
    
    // Clear success message after 3 seconds
    setTimeout(() => {
      setSearchSuccess("")
    }, 3000)
  }

  const startCall = (recipientUsername: string, type: "voice" | "video") => {
    if (!username || recipientUsername === username) return
    // Generate a shared call id; the recipient receives the WebRTC offer via
    // the signaling API and is alerted by the global IncomingCallListener.
    const callId = `call_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    setActiveCall({ type, recipient: recipientUsername, callId })
  }

  const endCall = () => {
    setActiveCall(null)
    // Refresh call history from the shared log
    if (username) {
      fetch(`/api/calls/history?username=${encodeURIComponent(username)}`)
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data.calls)) setCallHistory(data.calls)
        })
        .catch((err) => console.error("[v0] call history error:", err))
    }
  }

  const filteredFollowing = following.filter(user => 
    user.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredHistory = callHistory.filter(call => {
    const otherUser = call.callerId === username ? call.recipientId : call.callerId
    return otherUser.toLowerCase().includes(searchQuery.toLowerCase())
  })

  if (!username) {
    return (
      <div className="text-center py-8">
        <Phone className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <div className="flex items-center justify-center gap-3 mb-4">
          <img 
            src="/images/fusionary-logo.webp" 
            alt="Fusionary Connectra Logo" 
            className="w-8 h-8 object-contain"
            onError={(e) => {
              console.error("Logo load error:", e)
              e.currentTarget.style.display = 'none'
            }}
          />
          <h3 className="text-lg font-medium">Fusionary Connectra</h3>
          <img 
            src="/images/fusionary-logo.webp" 
            alt="Fusionary Connectra Logo" 
            className="w-8 h-8 object-contain"
            onError={(e) => {
              console.error("Logo load error:", e)
              e.currentTarget.style.display = 'none'
            }}
          />
        </div>
        <p className="text-muted-foreground">Please set your username in the Profile tab to use calling features</p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-6">
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <img 
              src="/images/fusionary-logo.webp" 
              alt="Fusionary Connectra Logo" 
              className="w-10 h-10 object-contain"
              onError={(e) => {
                console.error("Logo load error:", e)
                e.currentTarget.style.display = 'none'
              }}
            />
            <h2 className="text-2xl font-bold">Fusionary Connectra</h2>
            <img 
              src="/images/fusionary-logo.webp" 
              alt="Fusionary Connectra Logo" 
              className="w-10 h-10 object-contain"
              onError={(e) => {
                console.error("Logo load error:", e)
                e.currentTarget.style.display = 'none'
              }}
            />
          </div>
          <p className="text-muted-foreground">Connect with friends through voice and video calls</p>
        </div>

        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search contacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>

        <Tabs defaultValue="contacts" className="w-full">
          <TabsList className="grid grid-cols-4 mb-6">
            <TabsTrigger value="contacts">
              <Users className="h-4 w-4 mr-2" />
              Contacts
            </TabsTrigger>
            <TabsTrigger value="add-friends">
              <UserPlus className="h-4 w-4 mr-2" />
              Add Friends
            </TabsTrigger>
            <TabsTrigger value="online">
              <Phone className="h-4 w-4 mr-2" />
              Online
            </TabsTrigger>
            <TabsTrigger value="history">
              <Clock className="h-4 w-4 mr-2" />
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="add-friends" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <UserPlus className="h-5 w-5 mr-2" />
                  Add Fusionary Friends
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by Fusionary name..."
                      value={friendSearchQuery}
                      onChange={(e) => setFriendSearchQuery(e.target.value)}
                      className="pl-8"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          searchForFriends()
                        }
                      }}
                    />
                  </div>
                  <Button onClick={searchForFriends}>
                    <Search className="h-4 w-4 mr-1" />
                    Search
                  </Button>
                </div>

                {searchError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{searchError}</AlertDescription>
                  </Alert>
                )}

                {searchSuccess && (
                  <Alert className="bg-green-50 border-green-200 text-green-800">
                    <Check className="h-4 w-4" />
                    <AlertDescription>{searchSuccess}</AlertDescription>
                  </Alert>
                )}

                <ScrollArea className="h-[300px]">
                  <div className="space-y-2">
                    {searchResults.length === 0 && !searchError ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <UserPlus className="h-12 w-12 mx-auto mb-4" />
                        <p>Search for Fusionary users to send friend requests</p>
                      </div>
                    ) : (
                      searchResults.map((user) => (
                        <div key={user} className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-md border">
                          <div className="flex items-center">
                            <Avatar className="h-10 w-10 mr-3">
                              <AvatarFallback>{user.substring(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div>
                              <h4 className="font-medium">{user}</h4>
                              <p className="text-sm text-muted-foreground">Fusionary user</p>
                            </div>
                          </div>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => sendFriendRequest(user)}
                          >
                            <UserPlus className="h-4 w-4 mr-1" />
                            Send Request
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contacts" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Your Contacts ({following.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[400px]">
                  <div className="p-4">
                    {filteredFollowing.length === 0 ? (
                      <div className="text-center py-8">
                        <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="text-lg font-medium mb-2">No Contacts Found</h3>
                        <p className="text-muted-foreground">
                          {following.length === 0 
                            ? "Add some friends to start calling them" 
                            : "No contacts match your search"
                          }
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {filteredFollowing.map((contact) => (
                          <div key={contact} className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-md">
                            <div className="flex items-center">
                              <Avatar className="h-10 w-10 mr-3">
                                <AvatarFallback>{contact.substring(0, 2).toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <div>
                                <h4 className="font-medium">{contact}</h4>
                                <p className="text-sm text-muted-foreground">
                                  {onlineUsers.includes(contact) ? (
                                    <span className="flex items-center">
                                      <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                                      Online
                                    </span>
                                  ) : (
                                    "Offline"
                                  )}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => startCall(contact, "voice")}
                              >
                                <Phone className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => startCall(contact, "video")}
                              >
                                <Video className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="online" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  Online Now ({onlineUsers.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[400px]">
                  <div className="p-4">
                    {onlineUsers.length === 0 ? (
                      <div className="text-center py-8">
                        <Phone className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="text-lg font-medium mb-2">No One Online</h3>
                        <p className="text-muted-foreground">None of your contacts are currently online</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {onlineUsers.map((user) => (
                          <div key={user} className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-md">
                            <div className="flex items-center">
                              <Avatar className="h-10 w-10 mr-3 relative">
                                <AvatarFallback>{user.substring(0, 2).toUpperCase()}</AvatarFallback>
                                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-background rounded-full"></div>
                              </Avatar>
                              <div>
                                <h4 className="font-medium">{user}</h4>
                                <p className="text-sm text-green-600">Available for calls</p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => startCall(user, "voice")}
                              >
                                <Phone className="h-4 w-4 mr-1" />
                                Call
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => startCall(user, "video")}
                              >
                                <Video className="h-4 w-4 mr-1" />
                                Video
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  Call History
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[400px]">
                  <div className="p-4">
                    {filteredHistory.length === 0 ? (
                      <div className="text-center py-8">
                        <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="text-lg font-medium mb-2">No Call History</h3>
                        <p className="text-muted-foreground">
                          {callHistory.length === 0 
                            ? "Your call history will appear here" 
                            : "No calls match your search"
                          }
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {filteredHistory.map((call) => {
                          const otherUser = call.callerId === username ? call.recipientId : call.callerId
                          const isOutgoing = call.callerId === username
                          const duration = call.endTime ? Math.floor((call.endTime - call.startTime) / 1000 / 60) : 0

                          return (
                            <div key={call.id} className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-md">
                              <div className="flex items-center">
                                <Avatar className="h-10 w-10 mr-3">
                                  <AvatarFallback>{otherUser.substring(0, 2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <h4 className="font-medium flex items-center">
                                    {otherUser}
                                    {call.type === "video" ? (
                                      <VideoIcon className="h-3 w-3 ml-2 text-muted-foreground" />
                                    ) : (
                                      <PhoneCall className="h-3 w-3 ml-2 text-muted-foreground" />
                                    )}
                                  </h4>
                                  <p className="text-sm text-muted-foreground">
                                    {isOutgoing ? "Outgoing" : "Incoming"} • {duration}m • {formatDate(call.startTime)}
                                  </p>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => startCall(otherUser, call.type)}
                                >
                                  {call.type === "video" ? (
                                    <Video className="h-4 w-4" />
                                  ) : (
                                    <Phone className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Active Call Interface */}
      {activeCall && username && (
        <CallInterface
          selfUsername={username}
          recipientUsername={activeCall.recipient}
          callType={activeCall.type}
          callId={activeCall.callId}
          isInitiator={true}
          onEndCall={endCall}
        />
      )}
    </>
  )
}
