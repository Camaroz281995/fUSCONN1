"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useUser } from "@/context/user-context"
import DevicePhotoUpload from "@/components/photo/device-photo-upload"
import DeviceVideoUpload from "@/components/video/device-video-upload"
import FusionaryMailbox from "@/components/mailbox/fusionary-mailbox"
import { PenTool, Image, Video, Mail } from "lucide-react"
import type { Post } from "@/lib/types"

export default function PostTab() {

  const { id, username } = useUser()

  const [content, setContent] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [videoUrl, setVideoUrl] = useState("")
  const [gifUrl, setGifUrl] = useState("")

  const [devicePhoto, setDevicePhoto] =
    useState<string | null>(null)

  const [deviceVideo, setDeviceVideo] =
    useState<string | null>(null)

  const [activeTab, setActiveTab] =
    useState("text")

  const [isMailboxOpen, setIsMailboxOpen] =
    useState(false)

  const [mailboxUnreadCount, setMailboxUnreadCount] =
    useState(0)

  const fileInputRef =
    useRef<HTMLInputElement>(null)



  useEffect(() => {

    if (!username) return

    const updateUnread = () => {
      setMailboxUnreadCount(0)
    }

    updateUnread()

  }, [username])



  const handleSubmit = async (
    e: React.FormEvent
  ) => {

    e.preventDefault()


    if (!id || !username) {

      alert("Please log in first!")
      return

    }


    if (
      !content.trim() &&
      !imageUrl &&
      !videoUrl &&
      !gifUrl &&
      !devicePhoto &&
      !deviceVideo
    ) {

      alert("Please add something!")
      return

    }



    const mentions =
      content
        .match(/@(\w+)/g)
        ?.map(m => m.substring(1)) || []



    const post: Post = {

      id: Date.now().toString(),

      username,

      content:
        content.trim(),

      timestamp:
        Date.now(),

      likes: [],

      comments: [],

      mentions:
        mentions.length
          ? mentions
          : undefined

    }



    if (imageUrl || devicePhoto) {

      post.imageUrl =
        imageUrl || devicePhoto || undefined

    }


    if (videoUrl || deviceVideo) {

      post.videoUrl =
        videoUrl || deviceVideo || undefined

    }


    if (gifUrl) {

      post.gifUrl = gifUrl

    }



    window.dispatchEvent(
      new CustomEvent(
        "newPostCreated",
        {
          detail: post
        }
      )
    )



    try {

      const response =
        await fetch("/api/posts", {

          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },


          body: JSON.stringify({

            userId: id,

            username,

            content:
              post.content ||
              "(shared media)",

            imageUrl:
              post.imageUrl,

            videoUrl:
              post.videoUrl,

            gifUrl:
              post.gifUrl

          })

        })



      const result =
        await response.json()



      console.log(
        "Post creation result:",
        result
      )



      window.dispatchEvent(
        new CustomEvent(
          "newPostCreated"
        )
      )



    } catch(error) {

      console.error(
        "Post creation failed:",
        error
      )

    }



    setContent("")
    setImageUrl("")
    setVideoUrl("")
    setGifUrl("")
    setDevicePhoto(null)
    setDeviceVideo(null)
    setActiveTab("text")

  }



  const handleGifUpload =
    (e: React.ChangeEvent<HTMLInputElement>) => {

      const file =
        e.target.files?.[0]


      if (
        file &&
        file.type === "image/gif"
      ) {

        const reader =
          new FileReader()


        reader.onload = () => {

          setGifUrl(
            reader.result as string
          )

        }


        reader.readAsDataURL(file)

      }

    }



  if (!username || !id) {

    return (

      <Card>

        <CardContent className="p-6 text-center">

          <PenTool
            className="h-12 w-12 mx-auto mb-4"
          />

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

              <PenTool className="h-5 w-5"/>

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

              <Mail className="h-4 w-4"/>


              {mailboxUnreadCount > 0 && (

                <Badge
                  className="absolute -top-2 -right-2"
                >

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
              onValueChange={setActiveTab}
            >

              <TabsList className="grid grid-cols-3">

                <TabsTrigger value="text">
                  <PenTool className="h-4 w-4 mr-2"/>
                  Text
                </TabsTrigger>


                <TabsTrigger value="image">
                  <Image className="h-4 w-4 mr-2"/>
                  Image
                </TabsTrigger>


                <TabsTrigger value="video">
                  <Video className="h-4 w-4 mr-2"/>
                  Video
                </TabsTrigger>

              </TabsList>



              <TabsContent value="text">

                <Textarea

                  placeholder="What's on your mind?"

                  value={content}

                  onChange={
                    e => setContent(e.target.value)
                  }

                  className="min-h-[100px]"

                />

              </TabsContent>



              <TabsContent value="image">

                <Input

                  placeholder="Image URL"

                  value={imageUrl}

                  onChange={
                    e => setImageUrl(e.target.value)
                  }

                />


                <DevicePhotoUpload

                  onPhotoUploaded={
                    url =>
                      setDevicePhoto(url || null)
                  }

                  acceptGifs

                />


                <Input

                  ref={fileInputRef}

                  type="file"

                  accept="image/gif"

                  onChange={handleGifUpload}

                />

              </TabsContent>



              <TabsContent value="video">

                <Input

                  placeholder="Video URL"

                  value={videoUrl}

                  onChange={
                    e => setVideoUrl(e.target.value)
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
            >

              Create Post

            </Button>


          </form>

        </CardContent>

      </Card>



      <FusionaryMailbox

        isOpen={isMailboxOpen}

        onClose={() =>
          setIsMailboxOpen(false)
        }

      />

    </>

  )

}
