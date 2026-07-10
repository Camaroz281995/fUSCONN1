"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Phone, PhoneOff, Video } from "lucide-react"
import { useUser } from "@/context/user-context"
import { socialApi } from "@/lib/social-api"
import CallInterface from "./call-interface"

interface IncomingCall {
  callId: string
  from: string
  offer: RTCSessionDescriptionInit
  callType: "voice" | "video"
}

// Global component: polls for incoming call offers and shows an accept/decline prompt.
export default function IncomingCallListener() {
  const { username } = useUser()
  const [incoming, setIncoming] = useState<IncomingCall | null>(null)
  const [active, setActive] = useState<IncomingCall | null>(null)
  const sinceRef = useRef(0)
  const handledRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (!username) return
    sinceRef.current = Date.now()
    const interval = setInterval(async () => {
      try {
        const signals = await socialApi.getSignals(username, sinceRef.current)
        for (const sig of signals) {
          sinceRef.current = Math.max(sinceRef.current, sig.created_at)
          if (sig.type === "offer" && sig.payload && !handledRef.current.has(sig.call_id)) {
            handledRef.current.add(sig.call_id)
            const isVideo = !!sig.payload?.sdp && /m=video/.test(sig.payload.sdp)
            setIncoming({
              callId: sig.call_id,
              from: sig.from_user,
              offer: sig.payload,
              callType: isVideo ? "video" : "voice",
            })
          }
        }
      } catch {
        // ignore transient errors
      }
    }, 2000)
    return () => clearInterval(interval)
  }, [username])

  const accept = () => {
    if (!incoming) return
    setActive(incoming)
    setIncoming(null)
  }

  const decline = async () => {
    if (!incoming || !username) return
    try {
      await socialApi.sendSignal({
        fromUser: username,
        toUser: incoming.from,
        callId: incoming.callId,
        type: "reject",
      })
    } catch {
      // ignore
    }
    setIncoming(null)
  }

  if (!username) return null

  if (active) {
    return (
      <CallInterface
        selfUsername={username}
        recipientUsername={active.from}
        callType={active.callType}
        callId={active.callId}
        isInitiator={false}
        incomingOffer={active.offer}
        onEndCall={() => setActive(null)}
      />
    )
  }

  if (incoming) {
    return (
      <div className="fixed top-4 right-4 z-50">
        <Card className="w-80 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-4">
              <Avatar className="h-12 w-12">
                <AvatarFallback>{incoming.from.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{incoming.from}</p>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  {incoming.callType === "video" ? <Video className="h-3 w-3" /> : <Phone className="h-3 w-3" />}
                  Incoming {incoming.callType} call
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={accept}>
                <Phone className="h-4 w-4 mr-1" />
                Accept
              </Button>
              <Button variant="destructive" className="flex-1" onClick={decline}>
                <PhoneOff className="h-4 w-4 mr-1" />
                Decline
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return null
}
