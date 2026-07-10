"use client"

import { useState, useEffect } from "react"
import { useUser } from "@/context/user-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Video, Users, Search, Plus, AirplayIcon as Broadcast } from "lucide-react"
import LiveStream from "@/components/live-streaming/live-stream"
import { persistentStorage } from "@/lib/persistent-storage"
import type { LiveStream as LiveStreamType } from "@/lib/types"

export default function LiveStreamingTab() {
  const { username, profilePhoto } = useUser()
  const [streams, setStreams] = useState<LiveStreamType[]>([])
  const [filteredStreams, setFilteredStreams] = useState<LiveStreamType[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [streamTitle, setStreamTitle] = useState("")
  const [streamDescription, setStreamDescription] = useState("")
  const [currentStream, setCurrentStream] = useState<LiveStreamType | null>(null)
  const [isHosting, setIsHosting] = useState(false)

  const fetchStreams = () => {
    // Get streams from persistent storage
    const allStreams = persistentStorage.getLiveStreams()
    setStreams(allStreams)

    // Apply initial filtering
    filterStreams(allStreams)
  }

  useEffect(() => {
    fetchStreams()

    // Refresh streams every 30 seconds
    const interval = setInterval(fetchStreams, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    filterStreams(streams)
  }, [streams, searchQuery])

  const filterStreams = (allStreams: LiveStreamType[]) => {
    if (!searchQuery.trim()) {
      setFilteredStreams(allStreams)
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = allStreams.filter(
      (stream) =>
        stream.title.toLowerCase().includes(query) ||
        stream.hostUsername.toLowerCase().includes(query) ||
        stream.tags.some((tag) => tag.toLowerCase().includes(query)),
    )

    setFilteredStreams(filtered)
  }

  const handleCreateStream = () => {
    if (!username || !streamTitle.trim()) return

    const newStream: LiveStreamType = {
      id: Date.now().toString(),
      hostUsername: username,
      hostAvatar: profilePhoto || null,
      title: streamTitle.trim(),
      description: streamDescription.trim() || "Welcome to my live stream!",
      viewerCount: 0,
      startedAt: Date.now(),
      tags: ["New", "Live"],
      isLive: true,
    }

    persistentStorage.saveLiveStream(newStream)
    setStreams((prev) => [newStream, ...prev])
    setShowCreateDialog(false)

    // Start hosting
    setCurrentStream(newStream)
    setIsHosting(true)
  }

  const handleJoinStream = (stream: LiveStreamType) => {
    setCurrentStream(stream)
    setIsHosting(false)
  }

  const handleCloseStream = () => {
    if (isHosting && currentStream) {
      // End the stream
      const updatedStream = { ...currentStream, isLive: false }
      persistentStorage.saveLiveStream(updatedStream)

      // Update streams list
      setStreams((prev) => prev.map((s) => (s.id === currentStream.id ? updatedStream : s)))
    }

    setCurrentStream(null)
    setIsHosting(false)
  }

  if (!username) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Please set your username in the Profile tab to use live streaming</p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Live Streaming</h2>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Broadcast className="h-4 w-4 mr-1" />
            Go Live
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search streams..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>

        <ScrollArea className="h-[calc(100vh-250px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStreams.length === 0 ? (
              <div className="col-span-full text-center py-8">
                <Video className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No Live Streams</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery.trim() ? "No streams match your search" : "There are no active streams right now"}
                </p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Start Streaming
                </Button>
              </div>
            ) : (
              filteredStreams.map((stream) => (
                <Card key={stream.id} className={`overflow-hidden ${!stream.isLive ? "opacity-60" : ""}`}>
                  <div className="aspect-video bg-muted relative">
                    <img
                      src="/placeholder.svg?height=200&width=320"
                      alt={stream.title}
                      className="w-full h-full object-cover"
                    />
                    {stream.isLive && (
                      <Badge variant="destructive" className="absolute top-2 left-2">
                        LIVE
                      </Badge>
                    )}
                    <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-md flex items-center">
                      <Users className="h-3 w-3 mr-1" />
                      {stream.viewerCount}
                    </div>
                  </div>

                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={stream.hostAvatar || undefined} />
                        <AvatarFallback>{stream.hostUsername.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">{stream.title}</h3>
                        <p className="text-sm text-muted-foreground">{stream.hostUsername}</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {stream.tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    <Button className="w-full mt-4" disabled={!stream.isLive} onClick={() => handleJoinStream(stream)}>
                      {stream.isLive ? "Join Stream" : "Ended"}
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Create Stream Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start Live Stream</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="stream-title">Stream Title</Label>
              <Input
                id="stream-title"
                placeholder="Enter a title for your stream"
                value={streamTitle}
                onChange={(e) => setStreamTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="stream-description">Description (optional)</Label>
              <Textarea
                id="stream-description"
                placeholder="Tell viewers what your stream is about"
                value={streamDescription}
                onChange={(e) => setStreamDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateStream} disabled={!streamTitle.trim()}>
              <Broadcast className="h-4 w-4 mr-1" />
              Go Live
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Live Stream Component */}
      {currentStream && (
        <LiveStream stream={isHosting ? undefined : currentStream} isHost={isHosting} onClose={handleCloseStream} />
      )}
    </>
  )
}
