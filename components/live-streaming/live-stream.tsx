"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { useUser } from "@/context/user-context"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Camera,
  CameraOff,
  Mic,
  MicOff,
  PhoneOff,
  Send,
  Users,
  Heart,
  Maximize,
  Minimize,
} from "lucide-react"

import type { LiveStreamComment } from "@/lib/types"

interface LiveStreamProps {
  stream?: {
    id: string
    hostUsername: string
    title?: string
    description?: string
    hostAvatar?: string
  }

  isHost?: boolean
  onClose: () => void
}

export default function LiveStream({
  stream,
  isHost = false,
  onClose,
}: LiveStreamProps) {

  const { username, profilePhoto } = useUser()

  const [isLive, setIsLive] = useState(false)
  const [cameraOn, setCameraOn] = useState(true)
  const [micOn, setMicOn] = useState(true)
  const [viewerCount, setViewerCount] = useState(0)
  const [likes, setLikes] = useState(0)

  const [comments, setComments] = useState<LiveStreamComment[]>([])
  const [comment, setComment] = useState("")

  const [fullscreen, setFullscreen] = useState(false)


  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const localStreamRef = useRef<MediaStream | null>(null)

  const endedRef = useRef(false)


  /*
    START CAMERA
  */
  const startStream = useCallback(async () => {

    if (!isHost) return

    try {

      const media = await navigator.mediaDevices.getUserMedia({
        video:true,
        audio:true,
      })


      localStreamRef.current = media


      if(videoRef.current){
        videoRef.current.srcObject = media
      }


      setIsLive(true)


      /*
        TODO:
        Later this calls:
        POST /api/live/start

        This creates ownership in Neon.
      */


    } catch(error){

      console.error(
        "Camera startup failed",
        error
      )

    }

  },[isHost])



  /*
    END STREAM
  */
  const endStream = useCallback(async()=>{


    if(endedRef.current)
      return


    endedRef.current = true



    // Stop camera + microphone
    if(localStreamRef.current){

      localStreamRef.current
      .getTracks()
      .forEach(track=>{
        track.stop()
      })


      localStreamRef.current=null
    }



    setIsLive(false)



    /*
      TODO:
      POST /api/live/end

      This tells the server:
      "The host ended this stream"
    */



    onClose()


  },[onClose])




  /*
    Start when host opens
  */
  useEffect(()=>{

    if(isHost){
      startStream()
    }


    return()=>{

      // Browser leaving protection
      if(localStreamRef.current){

        localStreamRef.current
        .getTracks()
        .forEach(track=>{
          track.stop()
        })

      }

    }


  },[isHost,startStream])





  /*
    Browser close protection
  */
  useEffect(()=>{


    const leave = ()=>{

      if(localStreamRef.current){

        localStreamRef.current
        .getTracks()
        .forEach(track=>{
          track.stop()
        })

      }

    }


    window.addEventListener(
      "beforeunload",
      leave
    )


    return()=>{

      window.removeEventListener(
        "beforeunload",
        leave
      )

    }


  },[])




  const toggleMic=()=>{

    const track =
      localStreamRef.current
      ?.getAudioTracks()[0]


    if(track){

      track.enabled=!micOn

      setMicOn(!micOn)

    }

  }



  const toggleCamera=()=>{

    const track =
      localStreamRef.current
      ?.getVideoTracks()[0]


    if(track){

      track.enabled=!cameraOn

      setCameraOn(!cameraOn)

    }

  }




  const sendComment=()=>{

    if(!comment.trim())
      return


    setComments(prev=>[
      ...prev,
      {
        id:Date.now().toString(),
        username:username || "User",
        content:comment,
        timestamp:Date.now()
      }
    ])


    setComment("")

  }





  const toggleFullscreen=()=>{

    if(!containerRef.current)
      return


    if(!document.fullscreenElement){

      containerRef.current
      .requestFullscreen()

      setFullscreen(true)

    }else{

      document.exitFullscreen()

      setFullscreen(false)

    }

  }





return (

<div
ref={containerRef}
className="fixed inset-0 bg-black z-50 flex items-center justify-center"
>


<div className="w-full max-w-5xl">


<div className="relative aspect-video bg-black">


<video
ref={videoRef}
autoPlay
playsInline
muted
className="w-full h-full object-cover"
/>



<div className="absolute top-4 left-4 flex gap-3 items-center">


<Avatar>

<AvatarImage
src={
stream?.hostAvatar ||
profilePhoto ||
undefined
}
/>

<AvatarFallback>
{
(stream?.hostUsername ||
username ||
"U")
.slice(0,2)
.toUpperCase()
}
</AvatarFallback>

</Avatar>


<Badge variant="destructive">
LIVE
</Badge>


<div className="text-white flex items-center gap-1">

<Users size={16}/>

{viewerCount}

</div>


</div>





<div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3">


<Button
onClick={toggleMic}
variant={micOn?"secondary":"destructive"}
>

{
micOn?
<Mic/>:
<MicOff/>
}

</Button>



<Button
onClick={toggleCamera}
variant={cameraOn?"secondary":"destructive"}
>

{
cameraOn?
<Camera/>:
<CameraOff/>
}

</Button>




<Button
variant="secondary"
onClick={toggleFullscreen}
>

{
fullscreen?
<Minimize/>:
<Maximize/>
}

</Button>




{
isHost &&
<Button
variant="destructive"
onClick={endStream}
>

<PhoneOff/>

</Button>
}



</div>



</div>





<div className="bg-background p-4">


<div className="flex gap-2">

<Input

value={comment}

onChange={
e=>setComment(e.target.value)
}

placeholder="Say something..."

onKeyDown={
e=>{
if(e.key==="Enter")
sendComment()
}
}

/>


<Button onClick={sendComment}>
<Send/>
</Button>


<Button
onClick={()=>setLikes(v=>v+1)}
>

<Heart/>

{likes}

</Button>


</div>



<ScrollArea className="h-40 mt-4">

{
comments.map(c=>(

<div key={c.id}>
<b>{c.username}</b>: {c.content}
</div>

))
}

</ScrollArea>


</div>


</div>


</div>

)

}
