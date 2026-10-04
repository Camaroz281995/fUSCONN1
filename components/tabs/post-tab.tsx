"use client"

import {
  useState,
  useRef,
  useEffect,
} from "react"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import { Button } from "@/components/ui/button"

import { Textarea } from "@/components/ui/textarea"

import { Input } from "@/components/ui/input"

import { Badge } from "@/components/ui/badge"

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"

import { useUser } from "@/context/user-context"

import DevicePhotoUpload from "@/components/photo/device-photo-upload"
import DeviceVideoUpload from "@/components/video/device-video-upload"
import FusionaryMailbox from "@/components/mailbox/fusionary-mailbox"

import {
  PenTool,
  Image,
  Video,
  Mail,
} from "lucide-react"

import type { Post } from "@/lib/types"

export default function PostTab() {
  const {
    id,
    username,
    isLoading,
  } = useUser()

  const [content, setContent] =
    useState("")

  const [imageUrl, setImageUrl] =
    useState("")

  const [videoUrl, setVideoUrl] =
    useState("")

  const [gifUrl, setGifUrl] =
    useState("")

  const [devicePhoto, setDevicePhoto] =
    useState<string | null>(null)

  const [devicePhotoType, setDevicePhotoType] =
    useState<"image" | "gif">("image")

  const [deviceVideo, setDeviceVideo] =
    useState<string | null>(null)

  const [activeTab, setActiveTab] =
    useState("text")

  const [isMailboxOpen, setIsMailboxOpen] =
    useState(false)

  const [mailboxUnreadCount, setMailboxUnreadCount] =
    useState(0)

  const [isSubmitting, setIsSubmitting] =
    useState(false)

  const fileInputRef =
    useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!username) return

    setMailboxUnreadCount(0)
  }, [username])

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault()

    if (!id || !username) {
      alert("Please log in first!")
      return
    }

    const finalImageUrl =
      devicePhoto ||
      imageUrl

    const finalVideoUrl =
      deviceVideo ||
      videoUrl

    const finalGifUrl =
      devicePhotoType === "gif"
        ? devicePhoto
        : gifUrl

    if (
      !content.trim() &&
      !finalImageUrl &&
      !finalVideoUrl &&
      !finalGifUrl
    ) {
      alert("Please add something!")
      return
    }

    setIsSubmitting(true)

    const mentions =
      content
        .match(/@(\w+)/g)
        ?.map((mention) =>
          mention.substring(1)
        ) || []

    const post: Post = {
      id: Date.now().toString(),
      username,
      content:
        content.trim(),
      timestamp: Date.now(),
      likes: [],
      comments: [],
      mentions:
        mentions.length
          ? mentions
          : undefined,
    }

    if (finalImageUrl) {
      post.imageUrl =
        devicePhotoType === "image"
          ? finalImageUrl
          : undefined
    }

    if (finalVideoUrl) {
      post.videoUrl =
        finalVideoUrl
    }

    if (finalGifUrl) {
      post.gifUrl =
        finalGifUrl
    }

    try {
      const response =
        await fetch("/api/posts", {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            userId: id,
            username,
            content:
              post.content,
            imageUrl:
              post.imageUrl,
            videoUrl:
              post.videoUrl,
            gifUrl:
              post.gifUrl,
          }),
        })

      const result =
        await response.json()

      console.log(
        "Post creation result:",
        result
      )

      if (!response.ok) {
        throw new Error(
          result?.error ||
            "Failed to create post"
        )
      }

      window.dispatchEvent(
        new CustomEvent(
          "newPostCreated",
          {
            detail: post,
          }
        )
      )

      setContent("")
      setImageUrl("")
      setVideoUrl("")
      setGifUrl("")
      setDevicePhoto(null)
      setDevicePhotoType("image")
      setDeviceVideo(null)
      setActiveTab("text")

      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    } catch (error) {
      console.error(
        "Post creation failed:",
        error
      )

      alert(
        error instanceof Error
          ? error.message
          : "The post could not be saved."
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGifUpload = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file =
      e.target.files?.[0]

    if (!file) return

    if (
      file.type !==
      "image/gif"
    ) {
      alert(
        "Please select a GIF file."
      )
      return
    }

    const reader =
      new FileReader()

    reader.onload = () => {
      setGifUrl(
        reader.result as string
      )
    }

    reader.readAsDataURL(file)
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p>
            Loading your account...
          </p>
        </CardContent>
      </Card>
    )
  }

  if (!username || !id) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <PenTool className="h-12 w-12 mx-auto mb-4" />

          <p>
            Please log in to create posts
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex gap-2 items-center">
              <PenTool className="h-5 w-5" />
              Create Post
            </CardTitle>

            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setIsMailboxOpen(true)
              }
              className="relative rounded-full h-10 w-10 p-0"
            >
              <Mail className="h-4 w-4" />

              {mailboxUnreadCount > 0 && (
                <Badge className="absolute -top-2 -right-2">
                  {mailboxUnreadCount}
                </Badge>
              )}
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            <Tabs
              value={activeTab}
              onValueChange={
                setActiveTab
              }
            >
              <TabsList className="grid grid-cols-3">
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

              <TabsContent value="text">
                <Textarea
                  placeholder="What's on your mind?"
                  value={content}
                  onChange={(e) =>
                    setContent(
                      e.target.value
                    )
                  }
                  className="min-h-[100px]"
                />
              </TabsContent>

              <TabsContent value="image">
                <Input
                  placeholder="Image URL"
                  value={imageUrl}
                  onChange={(e) =>
                    setImageUrl(
                      e.target.value
                    )
                  }
                />

                <DevicePhotoUpload
                  onPhotoUploaded={(
                    url,
                    type
                  ) => {
                    setDevicePhoto(
                      url || null
                    )

                    setDevicePhotoType(
                      type
                    )

                    if (type === "gif") {
                      setGifUrl("")
                    }
                  }}
                  acceptGifs
                />

                <Input
                  ref={fileInputRef}
                  type="file"
                  accept="image/gif"
                  onChange={
                    handleGifUpload
                  }
                />
              </TabsContent>

              <TabsContent value="video">
                <Input
                  placeholder="Video URL"
                  value={videoUrl}
                  onChange={(e) =>
                    setVideoUrl(
                      e.target.value
                    )
                  }
                />

                <DeviceVideoUpload
                  onVideoSelect={
                    setDeviceVideo
                  }
                  selectedVideo={
                    deviceVideo
                  }
                />
              </TabsContent>
            </Tabs>

            <Button
              type="submit"
              className="w-full"
              disabled={
                isSubmitting
              }
            >
              {isSubmitting
                ? "Saving Post..."
                : "Create Post"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <FusionaryMailbox
        isOpen={
          isMailboxOpen
        }
        onClose={() =>
          setIsMailboxOpen(false)
        }
      />
    </>
  )
}
