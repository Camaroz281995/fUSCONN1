"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useUser } from "@/context/user-context"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Video, ImageIcon, Upload, X, AlertCircle, Check } from 'lucide-react'
import { generateId } from "@/lib/utils"
import { persistentStorage } from "@/lib/persistent-storage"
import type { Story, StoryItem } from "@/lib/types"

interface CreateStoryProps {
  onStoryCreated: () => void
  onClose: () => void
}

export default function CreateStory({ onStoryCreated, onClose }: CreateStoryProps) {
  const { username, profilePhoto } = useUser()
  const [mediaType, setMediaType] = useState<"image" | "video">("image")
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [caption, setCaption] = useState("")
  const [duration, setDuration] = useState("24")
  const [privacy, setPrivacy] = useState<"public" | "friends" | "close-friends">("public")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [videoMuted, setVideoMuted] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    // Check if file type matches selected media type
    if (mediaType === "image" && !selectedFile.type.startsWith("image/")) {
      setError("Please select an image file")
      return
    }

    if (mediaType === "video" && !selectedFile.type.startsWith("video/")) {
      setError("Please select a video file")
      return
    }

    // Check file size (limit to 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (selectedFile.size > maxSize) {
      setError(`File is too large (max 10MB)`)
      return
    }

    setFile(selectedFile)
    setError("")

    // Convert to base64 data URL for reliable storage
    const reader = new FileReader()
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string
      if (dataUrl) {
        setPreviewUrl(dataUrl)
      }
    }
    reader.onerror = () => {
      setError("Error reading file")
    }
    reader.readAsDataURL(selectedFile)
  }

  const openFilePicker = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleClear = () => {
    setFile(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
    setCaption("")
    setError("")
  }

  const handleSubmit = async () => {
    if (!username) {
      setError("Please set your username in the Profile tab")
      return
    }

    if (!file || !previewUrl) {
      setError("Please select a file")
      return
    }

    try {
      setIsSubmitting(true)
      setError("")

      // In a real app, we would upload the file to a server
      // For this demo, we'll use the object URL directly

      const storyItem: StoryItem = {
        id: generateId(),
        type: mediaType,
        url: previewUrl,
        caption: caption,
        timestamp: Date.now(),
        muted: mediaType === "video" ? videoMuted : undefined,
      }

      // Check if user already has a story
      const existingStory = persistentStorage.getUserStory(username)

      if (existingStory) {
        // Add item to existing story
        existingStory.items.push(storyItem)
        existingStory.lastUpdated = Date.now()
        persistentStorage.saveStory(existingStory)
      } else {
        // Create new story
        const newStory: Story = {
          id: generateId(),
          username,
          userAvatar: profilePhoto || null,
          items: [storyItem],
          createdAt: Date.now(),
          lastUpdated: Date.now(),
          expiresAt: Date.now() + Number.parseInt(duration) * 60 * 60 * 1000, // Convert hours to ms
          privacy,
        }

        persistentStorage.saveStory(newStory)
      }

      setSuccess(true)

      // Close dialog after a short delay
      setTimeout(() => {
        onStoryCreated()
        onClose()
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Story</DialogTitle>
        </DialogHeader>

        <Tabs
          defaultValue="image"
          value={mediaType}
          onValueChange={(value) => setMediaType(value as "image" | "video")}
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="image">
              <ImageIcon className="h-4 w-4 mr-2" />
              Image
            </TabsTrigger>
            <TabsTrigger value="video">
              <Video className="h-4 w-4 mr-2" />
              Video
            </TabsTrigger>
          </TabsList>

          <div className="mt-4">
            <input
              type="file"
              accept={mediaType === "image" ? "image/*" : "video/*"}
              onChange={handleFileChange}
              className="hidden"
              ref={fileInputRef}
            />

            {!previewUrl ? (
              <div
                className="border-2 border-dashed rounded-md p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={openFilePicker}
              >
                {mediaType === "image" ? (
                  <ImageIcon className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
                ) : (
                  <Video className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
                )}
                <p className="text-sm text-muted-foreground mb-2">
                  Click to select a {mediaType === "image" ? "photo" : "video"} for your story
                </p>
                <Button type="button" variant="outline" size="sm">
                  <Upload className="h-4 w-4 mr-1" />
                  Upload {mediaType === "image" ? "Image" : "Video"}
                </Button>
              </div>
            ) : (
              <div className="relative">
                <div className="aspect-square max-h-64 bg-black rounded-md overflow-hidden">
                  {mediaType === "image" ? (
                    <img
                      src={previewUrl || "/placeholder.svg"}
                      alt="Preview"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <video
                      ref={videoRef}
                      src={previewUrl}
                      className="w-full h-full object-contain"
                      controls
                      muted={videoMuted}
                    />
                  )}
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-8 w-8 rounded-full"
                  onClick={handleClear}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            {mediaType === "video" && previewUrl && (
              <div className="flex items-center space-x-2 mt-2">
                <Switch id="mute-video" checked={videoMuted} onCheckedChange={setVideoMuted} />
                <Label htmlFor="mute-video">Mute video</Label>
              </div>
            )}

            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="caption">Caption</Label>
                <Textarea
                  id="caption"
                  placeholder="Add a caption to your story..."
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration</Label>
                  <Select value={duration} onValueChange={setDuration}>
                    <SelectTrigger id="duration">
                      <SelectValue placeholder="Duration" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="24">24 hours</SelectItem>
                      <SelectItem value="48">48 hours</SelectItem>
                      <SelectItem value="72">72 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="privacy">Privacy</Label>
                  <Select value={privacy} onValueChange={(value) => setPrivacy(value as any)}>
                    <SelectTrigger id="privacy">
                      <SelectValue placeholder="Who can see" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Everyone</SelectItem>
                      <SelectItem value="friends">Friends</SelectItem>
                      <SelectItem value="close-friends">Close Friends</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        </Tabs>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4 mr-2" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="bg-green-50 border-green-200 text-green-800">
            <Check className="h-4 w-4 mr-2" />
            <AlertDescription>Story created successfully!</AlertDescription>
          </Alert>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !file || !previewUrl}>
            {isSubmitting ? "Creating..." : "Share Story"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
