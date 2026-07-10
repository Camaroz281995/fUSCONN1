"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useUser } from "@/context/user-context"
import { persistentStorage } from "@/lib/persistent-storage"
import DevicePhotoUpload from "@/components/photo/device-photo-upload"
import DeviceVideoUpload from "@/components/video/device-video-upload"
import FusionaryMailbox from "@/components/mailbox/fusionary-mailbox"
import { PenTool, Image, Video, Mail } from 'lucide-react'
import type { Post } from "@/lib/types"

export default function PostTab() {
  const { username } = useUser()
  const [content, setContent] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [videoUrl, setVideoUrl] = useState("")
  const [gifUrl, setGifUrl] = useState("")
  const [devicePhoto, setDevicePhoto] = useState<string | null>(null)
  const [deviceVideo, setDeviceVideo] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("text")
  const [isMailboxOpen, setIsMailboxOpen] = useState(false)
  const [mailboxUnreadCount, setMailboxUnreadCount] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Update mailbox unread count
  useEffect(() => {
    if (username) {
      const updateUnreadCount = () => {
        const notifications = persistentStorage.getUserNotifications(username)
        const friendRequests = persistentStorage.getFriendRequests()
          .filter(req => req.toUsername === username && req.status === "pending")
        
        const unread = notifications.filter(n => !n.isRead).length + friendRequests.length
        setMailboxUnreadCount(unread)
      }

      updateUnreadCount()
      
      // Update count periodically
      const interval = setInterval(updateUnreadCount, 5000)
      return () => clearInterval(interval)
    }
  }, [username])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!username) {
      alert("Please set your username first!")
      return
    }

    if (!content.trim() && !imageUrl && !videoUrl && !gifUrl && !devicePhoto && !deviceVideo) {
      alert("Please add some content to your post!")
      return
    }

    // Extract mentions from content
    const mentionRegex = /@(\w+)/g
    const mentions = content.match(mentionRegex)?.map((m) => m.substring(1)) || []

    const post: Post = {
      id: Date.now().toString(),
      username,
      content: content.trim(),
      timestamp: Date.now(),
      likes: [],
      comments: [],
      mentions: mentions.length > 0 ? mentions : undefined,
    }

    // Add media based on what's available
    if (imageUrl || devicePhoto) {
      post.imageUrl = imageUrl || devicePhoto || undefined
    }
    if (videoUrl || deviceVideo) {
      post.videoUrl = videoUrl || deviceVideo || undefined
    }
    if (gifUrl) {
      post.gifUrl = gifUrl
    }

    // Show the post instantly in the feed for this user (optimistic update).
    window.dispatchEvent(new CustomEvent("newPostCreated", { detail: post }))

    // Save post to the shared database so it is visible to all users in real time,
    // then trigger a reconcile refetch so the real (server) row replaces the optimistic one.
    fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username,
        content: post.content || "(shared media)",
        imageUrl: post.imageUrl,
        videoUrl: post.videoUrl,
        gifUrl: post.gifUrl,
      }),
    })
      .then(() => window.dispatchEvent(new CustomEvent("newPostCreated")))
      .catch((err) => console.error("[v0] create post error:", err))

    // Reset form
    setContent("")
    setImageUrl("")
    setVideoUrl("")
    setGifUrl("")
    setDevicePhoto(null)
    setDeviceVideo(null)
    setActiveTab("text")
  }

  const handleGifUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type === 'image/gif') {
      const reader = new FileReader()
      reader.onload = (e) => {
        setGifUrl(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  if (!username) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <PenTool className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Please set your username to create posts</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <PenTool className="h-5 w-5" />
              Create Post
            </CardTitle>
            
            {/* Circular Mailbox Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsMailboxOpen(true)}
              className="relative rounded-full h-10 w-10 p-0"
            >
              <Mail className="h-4 w-4" />
              {mailboxUnreadCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
                >
                  {mailboxUnreadCount > 99 ? "99+" : mailboxUnreadCount}
                </Badge>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="text">
                  <PenTool className="h-4 w-4 mr-2" />
                  Text
                </TabsTrigger>
                <TabsTrigger value="image">
                  <Image className="h-4 w-4 mr-2" />
                  Image
                </TabsTrigger>
                <TabsTrigger value="video">
                  <Video className="h-4 w-4 mr-2" />
                  Video
                </TabsTrigger>
              </TabsList>

              <TabsContent value="text" className="space-y-4">
                <Textarea
                  placeholder="What's on your mind? Use @username to mention someone..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="min-h-[100px] resize-none"
                />
              </TabsContent>

              <TabsContent value="image" className="space-y-4">
                <Textarea
                  placeholder="Add a caption to your image..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="min-h-[80px] resize-none"
                />
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Image URL</label>
                    <Input
                      type="url"
                      placeholder="https://example.com/image.jpg"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                    />
                  </div>

                  <div className="text-center text-muted-foreground">or</div>

                  <DevicePhotoUpload
                    onPhotoUploaded={(url) => setDevicePhoto(url || null)}
                    acceptGifs={true}
                  />

                  <div className="text-center text-muted-foreground">or</div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Upload GIF</label>
                    <Input
                      ref={fileInputRef}
                      type="file"
                      accept="image/gif"
                      onChange={handleGifUpload}
                      className="cursor-pointer"
                    />
                    {gifUrl && (
                      <div className="mt-2">
                        <img
                          src={gifUrl || "/placeholder.svg"}
                          alt="Selected GIF"
                          className="max-w-full h-32 object-cover rounded border"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {(imageUrl || devicePhoto || gifUrl) && (
                  <div className="border rounded-lg p-2">
                    <p className="text-sm text-muted-foreground mb-2">Preview:</p>
                    <img
                      src={imageUrl || devicePhoto || gifUrl}
                      alt="Preview"
                      className="max-w-full h-32 object-cover rounded"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder.svg?height=128&width=200&text=Image+Error'
                      }}
                    />
                  </div>
                )}
              </TabsContent>

              <TabsContent value="video" className="space-y-4">
                <Textarea
                  placeholder="Add a caption to your video..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="min-h-[80px] resize-none"
                />
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Video URL</label>
                    <Input
                      type="url"
                      placeholder="https://example.com/video.mp4"
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                    />
                  </div>

                  <div className="text-center text-muted-foreground">or</div>

                  <DeviceVideoUpload
                    onVideoSelect={setDeviceVideo}
                    selectedVideo={deviceVideo}
                  />
                </div>

                {(videoUrl || deviceVideo) && (
                  <div className="border rounded-lg p-2">
                    <p className="text-sm text-muted-foreground mb-2">Preview:</p>
                    <video
                      src={videoUrl || deviceVideo || undefined}
                      className="max-w-full h-32 object-cover rounded"
                      controls
                      onError={(e) => {
                        console.error("Video preview error:", e)
                      }}
                    />
                  </div>
                )}
              </TabsContent>
            </Tabs>

            <Button type="submit" className="w-full">
              Create Post
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Fusionary Mailbox */}
      <FusionaryMailbox 
        isOpen={isMailboxOpen} 
        onClose={() => setIsMailboxOpen(false)} 
      />
    </>
  )
}
