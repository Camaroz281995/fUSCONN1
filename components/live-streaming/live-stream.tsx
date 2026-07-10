"use client"

import { useState, useRef, useEffect } from "react"
import { useUser } from "@/context/user-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Users,
  MessageSquare,
  Heart,
  Share2,
  Gift,
  Mic,
  MicOff,
  Camera,
  CameraOff,
  ScreenShare,
  PhoneOff,
  Settings,
  Maximize,
  Minimize,
  Send,
} from "lucide-react"
import type { LiveStream, LiveStreamComment } from "@/lib/types"

interface LiveStreamProps {
  stream?: LiveStream
  isHost?: boolean
  onClose: () => void
}

export default function LiveStream({ stream, isHost = false, onClose }: LiveStreamProps) {
  const { username, profilePhoto } = useUser()
  const [isLive, setIsLive] = useState(false)
  const [viewerCount, setViewerCount] = useState(0)
  const [likeCount, setLikeCount] = useState(0)
  const [comments, setComments] = useState<LiveStreamComment[]>([])
  const [commentInput, setCommentInput] = useState("")
  const [isMicOn, setIsMicOn] = useState(true)
  const [isCameraOn, setIsCameraOn] = useState(true)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [activeTab, setActiveTab] = useState("chat")

  const videoRef = useRef<HTMLVideoElement>(null)
  const streamContainerRef = useRef<HTMLDivElement>(null)
  const localStreamRef = useRef<MediaStream | null>(null)

  // Initialize stream
  useEffect(() => {
    if (isHost) {
      startCamera()
    } else if (stream) {
      // In a real app, we would connect to the stream
      // For this demo, we'll simulate a stream with a timer

      // Simulate viewers joining
      const viewerInterval = setInterval(() => {
        setViewerCount((prev) => Math.min(prev + Math.floor(Math.random() * 3), 100))
      }, 5000)

      // Simulate likes
      const likeInterval = setInterval(() => {
        if (Math.random() > 0.7) {
          setLikeCount((prev) => prev + 1)
        }
      }, 3000)

      // Simulate comments
      const commentInterval = setInterval(() => {
        if (Math.random() > 0.6) {
          const randomComment = generateRandomComment()
          setComments((prev) => [...prev, randomComment])
        }
      }, 4000)

      return () => {
        clearInterval(viewerInterval)
        clearInterval(likeInterval)
        clearInterval(commentInterval)
      }
    }

    return () => {
      stopStream()
    }
  }, [isHost, stream])

  // Scroll to bottom of comments
  useEffect(() => {
    const chatContainer = document.getElementById("live-chat-container")
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight
    }
  }, [comments])

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }

      localStreamRef.current = stream
      setIsLive(true)

      // Simulate viewers joining
      const viewerInterval = setInterval(() => {
        setViewerCount((prev) => Math.min(prev + Math.floor(Math.random() * 3), 100))
      }, 5000)

      return () => clearInterval(viewerInterval)
    } catch (error) {
      console.error("Error accessing camera:", error)
    }
  }

  const stopStream = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop())
      localStreamRef.current = null
    }

    setIsLive(false)
  }

  const toggleMic = () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks()
      audioTracks.forEach((track) => {
        track.enabled = !track.enabled
      })
      setIsMicOn(!isMicOn)
    }
  }

  const toggleCamera = () => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks()
      videoTracks.forEach((track) => {
        track.enabled = !track.enabled
      })
      setIsCameraOn(!isCameraOn)
    }
  }

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      // Stop screen sharing and go back to camera
      await startCamera()
      setIsScreenSharing(false)
    } else {
      try {
        // Stop current stream
        stopStream()

        // Start screen sharing
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        })

        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }

        localStreamRef.current = stream
        setIsLive(true)
        setIsScreenSharing(true)
      } catch (error) {
        console.error("Error sharing screen:", error)
        // Fallback to camera
        await startCamera()
      }
    }
  }

  const toggleFullscreen = () => {
    if (!streamContainerRef.current) return

    if (!document.fullscreenElement) {
      streamContainerRef.current.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`)
      })
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  const handleEndStream = () => {
    stopStream()
    onClose()
  }

  const handleSendComment = () => {
    if (!commentInput.trim() || !username) return

    const newComment: LiveStreamComment = {
      id: Date.now().toString(),
      username,
      content: commentInput,
      timestamp: Date.now(),
    }

    setComments((prev) => [...prev, newComment])
    setCommentInput("")
  }

  const handleLike = () => {
    setLikeCount((prev) => prev + 1)
  }

  // Generate random comments for demo
  const generateRandomComment = (): LiveStreamComment => {
    const randomUsernames = ["viewer123", "fan_account", "music_lover", "tech_geek", "travel_addict"]
    const randomComments = [
      "Great stream!",
      "Hello from California!",
      "Can you play some music?",
      "What's your favorite song?",
      "How often do you stream?",
      "Love the content!",
      "First time here, this is awesome!",
      "Greetings from Germany!",
      "What camera are you using?",
      "Do you have any pets?",
    ]

    return {
      id: Date.now().toString(),
      username: randomUsernames[Math.floor(Math.random() * randomUsernames.length)],
      content: randomComments[Math.floor(Math.random() * randomComments.length)],
      timestamp: Date.now(),
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        ref={streamContainerRef}
        className="w-full max-w-4xl bg-background rounded-lg shadow-lg overflow-hidden flex flex-col"
      >
        <div className="relative">
          <div className="aspect-video bg-black">
            <video ref={videoRef} autoPlay playsInline muted={isHost} className="w-full h-full object-cover" />

            {/* Stream info overlay */}
            <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start bg-gradient-to-b from-black/70 to-transparent">
              <div className="flex items-center">
                <Avatar className="h-10 w-10 border-2 border-primary">
                  <AvatarImage src={stream?.hostAvatar || profilePhoto || undefined} />
                  <AvatarFallback>
                    {(stream?.hostUsername || username || "").substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="ml-2">
                  <h3 className="text-white font-medium">{stream?.hostUsername || username || "Anonymous"}</h3>
                  <div className="flex items-center">
                    <Badge variant="destructive" className="mr-2">
                      LIVE
                    </Badge>
                    <span className="text-white/80 text-xs flex items-center">
                      <Users className="h-3 w-3 mr-1" />
                      {viewerCount}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="text-white" onClick={handleLike}>
                  <Heart className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" className="text-white">
                  <Share2 className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" className="text-white" onClick={toggleFullscreen}>
                  {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
                </Button>
              </div>
            </div>

            {/* Stream title and description */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
              <h2 className="text-white font-medium text-lg">{stream?.title || "Live Stream"}</h2>
              <p className="text-white/80 text-sm">{stream?.description || "Welcome to my live stream!"}</p>
            </div>

            {/* Like animation */}
            <div className="absolute bottom-16 right-8 flex flex-col-reverse items-center">
              {Array.from({ length: Math.min(3, likeCount % 10) }).map((_, i) => (
                <Heart
                  key={i}
                  className="text-red-500 absolute animate-float"
                  style={{
                    animationDelay: `${i * 0.2}s`,
                    opacity: 1 - i * 0.2,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Stream controls */}
          {isHost && (
            <div className="bg-muted p-2 flex justify-center gap-2">
              <Button variant={isMicOn ? "outline" : "destructive"} size="icon" onClick={toggleMic}>
                {isMicOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
              </Button>
              <Button variant={isCameraOn ? "outline" : "destructive"} size="icon" onClick={toggleCamera}>
                {isCameraOn ? <Camera className="h-4 w-4" /> : <CameraOff className="h-4 w-4" />}
              </Button>
              <Button variant={isScreenSharing ? "default" : "outline"} size="icon" onClick={toggleScreenShare}>
                <ScreenShare className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon">
                <Settings className="h-4 w-4" />
              </Button>
              <Button variant="destructive" size="icon" onClick={handleEndStream}>
                <PhoneOff className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Chat and viewers */}
        <div className="flex-1 min-h-0">
          <Tabs defaultValue="chat" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="chat" className="flex items-center">
                <MessageSquare className="h-4 w-4 mr-2" />
                Chat
              </TabsTrigger>
              <TabsTrigger value="viewers" className="flex items-center">
                <Users className="h-4 w-4 mr-2" />
                Viewers ({viewerCount})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="chat" className="m-0 h-[200px] flex flex-col">
              <ScrollArea className="flex-1" id="live-chat-container">
                <div className="p-4 space-y-2">
                  {comments.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground">
                      No comments yet. Be the first to say hello!
                    </div>
                  ) : (
                    comments.map((comment) => (
                      <div key={comment.id} className="flex items-start gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback>{comment.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-baseline gap-2">
                            <span className="font-medium text-sm">{comment.username}</span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(comment.timestamp).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                          <p className="text-sm">{comment.content}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>

              <div className="p-2 border-t">
                <div className="flex gap-2">
                  <Input
                    placeholder="Type a message..."
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleSendComment()
                      }
                    }}
                  />
                  <Button size="icon" onClick={handleSendComment}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="viewers" className="m-0 h-[200px]">
              <ScrollArea className="h-full">
                <div className="p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-medium">Top Viewers</h3>
                    <Button variant="ghost" size="sm">
                      See All
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {Array.from({ length: Math.min(10, viewerCount) }).map((_, i) => (
                      <div key={i} className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-md">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>
                              {String.fromCharCode(65 + (i % 26))}
                              {String.fromCharCode(65 + ((i + 1) % 26))}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">Viewer{i + 1}</p>
                            <p className="text-xs text-muted-foreground">
                              Watching for {Math.floor(Math.random() * 60)} min
                            </p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          <Gift className="h-4 w-4 mr-1" />
                          Gift
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>

        {/* Close button for viewers */}
        {!isHost && (
          <div className="p-4 border-t">
            <Button variant="outline" className="w-full" onClick={onClose}>
              Close Stream
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
