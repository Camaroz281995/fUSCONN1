"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { PhoneOff, Mic, MicOff, Camera, CameraOff, Volume2, VolumeX } from "lucide-react"
import { socialApi } from "@/lib/social-api"

interface CallInterfaceProps {
  selfUsername: string
  recipientUsername: string
  callType: "voice" | "video"
  callId: string
  isInitiator: boolean
  /** SDP offer already received (callee side) */
  incomingOffer?: RTCSessionDescriptionInit
  onEndCall: () => void
}

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [{ urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] }],
}

export default function CallInterface({
  selfUsername,
  recipientUsername,
  callType,
  callId,
  isInitiator,
  incomingOffer,
  onEndCall,
}: CallInterfaceProps) {
  const [callStatus, setCallStatus] = useState<"calling" | "connected" | "ended">("calling")
  const [isMuted, setIsMuted] = useState(false)
  const [isCameraOn, setIsCameraOn] = useState(callType === "video")
  const [isSpeakerOn, setIsSpeakerOn] = useState(true)
  const [callDuration, setCallDuration] = useState(0)

  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const remoteAudioRef = useRef<HTMLAudioElement>(null)
  const pcRef = useRef<RTCPeerConnection | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const sinceRef = useRef(0)
  const startedRef = useRef(0)
  const endedRef = useRef(false)

  const cleanup = useCallback(() => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop())
    pcRef.current?.close()
    pcRef.current = null
  }, [])

  const endCall = useCallback(
    async (notify = true) => {
      if (endedRef.current) return
      endedRef.current = true
      setCallStatus("ended")
      const duration = startedRef.current ? Math.floor((Date.now() - startedRef.current) / 1000) : 0
      cleanup()
      try {
        if (notify) {
          await socialApi.sendSignal({ fromUser: selfUsername, toUser: recipientUsername, callId, type: "end" })
        }
        if (isInitiator) {
          await socialApi.logCall({
            caller: selfUsername,
            recipient: recipientUsername,
            callType,
            status: duration > 0 ? "ended" : "missed",
            duration,
          })
        }
      } catch {
        // ignore
      }
      onEndCall()
    },
    [cleanup, selfUsername, recipientUsername, callId, callType, isInitiator, onEndCall],
  )

  // Establish the peer connection and media.
  useEffect(() => {
    let cancelled = false
    async function setup() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: callType === "video",
        })
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        localStreamRef.current = stream
        if (localVideoRef.current) localVideoRef.current.srcObject = stream

        const pc = new RTCPeerConnection(ICE_SERVERS)
        pcRef.current = pc
        stream.getTracks().forEach((track) => pc.addTrack(track, stream))

        pc.onicecandidate = (e) => {
          if (e.candidate) {
            socialApi
              .sendSignal({
                fromUser: selfUsername,
                toUser: recipientUsername,
                callId,
                type: "ice",
                payload: e.candidate.toJSON(),
              })
              .catch(() => {})
          }
        }

        pc.ontrack = (e) => {
          const [remoteStream] = e.streams
          if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream
          if (remoteAudioRef.current) remoteAudioRef.current.srcObject = remoteStream
          setCallStatus("connected")
          if (!startedRef.current) startedRef.current = Date.now()
        }

pc.onconnectionstatechange = () => {
  console.log("WebRTC state:", pc.connectionState)

  if (pc.connectionState === "connected") {
    setCallStatus("connected")
    if (!startedRef.current) startedRef.current = Date.now()
  }

  if (["failed", "closed"].includes(pc.connectionState)) {
    endCall(false)
  }
}

        if (isInitiator) {
          const offer = await pc.createOffer()
          await pc.setLocalDescription(offer)
          await socialApi.sendSignal({
            fromUser: selfUsername,
            toUser: recipientUsername,
            callId,
            type: "offer",
            payload: offer,
          })
        } else if (incomingOffer) {
          await pc.setRemoteDescription(new RTCSessionDescription(incomingOffer))
          const answer = await pc.createAnswer()
          await pc.setLocalDescription(answer)
          await socialApi.sendSignal({
            fromUser: selfUsername,
            toUser: recipientUsername,
            callId,
            type: "answer",
            payload: answer,
          })
        }
      } catch (err) {
        console.error("[v0] Call setup error:", err)
        endCall(true)
      }
    }
    setup()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Poll for incoming signals (answer / ice / end) for this call.
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const signals = await socialApi.getSignals(selfUsername, sinceRef.current)
        for (const sig of signals) {
          sinceRef.current = Math.max(sinceRef.current, sig.created_at)
          if (sig.call_id !== callId) continue
          const pc = pcRef.current
          if (!pc) continue
          if (sig.type === "answer" && sig.payload) {
            if (!pc.currentRemoteDescription) {
              await pc.setRemoteDescription(new RTCSessionDescription(sig.payload))
            }
          } else if (sig.type === "ice" && sig.payload) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(sig.payload))
            } catch {
              // ignore candidate errors before remote description
            }
          } else if (sig.type === "end" || sig.type === "reject") {
            endCall(false)
          }
        }
      } catch {
        // ignore transient errors
      }
    }, 1500)
    return () => clearInterval(interval)
  }, [selfUsername, callId, endCall])

  // Duration timer.
  useEffect(() => {
    if (callStatus !== "connected") return
    const interval = setInterval(() => {
      if (startedRef.current) setCallDuration(Math.floor((Date.now() - startedRef.current) / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [callStatus])

  const formatDuration = (s: number) =>
    `${Math.floor(s / 60)
      .toString()
      .padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`

  const toggleMute = () => {
    const track = localStreamRef.current?.getAudioTracks()[0]
    if (track) {
      track.enabled = isMuted
      setIsMuted(!isMuted)
    }
  }

  const toggleCamera = () => {
    const track = localStreamRef.current?.getVideoTracks()[0]
    if (track) {
      track.enabled = !isCameraOn
      setIsCameraOn(!isCameraOn)
    }
  }

  const toggleSpeaker = () => {
    const el = remoteAudioRef.current
    if (el) el.muted = isSpeakerOn
    setIsSpeakerOn(!isSpeakerOn)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center">
      <Card className="w-full max-w-2xl bg-black text-white border-gray-800">
        <CardContent className="p-0 h-full relative">
          <audio ref={remoteAudioRef} autoPlay />
          {callType === "video" ? (
            <div className="relative h-full min-h-[500px]">
              <video ref={remoteVideoRef} className="w-full h-full object-cover rounded-lg bg-gray-900" autoPlay playsInline />
              {callStatus !== "connected" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-800 rounded-lg">
                  <Avatar className="h-32 w-32 mb-4">
                    <AvatarFallback className="text-4xl bg-gray-700">
                      {recipientUsername.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <p className="text-gray-300">{isInitiator ? "Calling..." : "Connecting..."}</p>
                </div>
              )}
              <div className="absolute top-4 right-4 w-32 h-24 bg-gray-900 rounded-lg overflow-hidden border-2 border-gray-600">
                <video ref={localVideoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
                {!isCameraOn && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                    <CameraOff className="h-6 w-6 text-gray-400" />
                  </div>
                )}
              </div>
              <div className="absolute top-4 left-4 bg-black/50 rounded-lg px-3 py-2 flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${callStatus === "connected" ? "bg-green-500" : "bg-blue-500 animate-pulse"}`} />
                <span className="text-sm">{recipientUsername}</span>
                {callStatus === "connected" && <span className="text-xs text-gray-300">{formatDuration(callDuration)}</span>}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[500px] p-8">
              <Avatar className="h-32 w-32 mb-6">
                <AvatarFallback className="text-4xl bg-gray-700">
                  {recipientUsername.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <h2 className="text-2xl font-semibold mb-2">{recipientUsername}</h2>
              <div className="flex items-center gap-2 mb-8">
                <div className={`w-2 h-2 rounded-full ${callStatus === "connected" ? "bg-green-500" : "bg-blue-500 animate-pulse"}`} />
                <span className="text-gray-300">
                  {callStatus === "connected" ? formatDuration(callDuration) : isInitiator ? "Calling..." : "Connecting..."}
                </span>
              </div>
            </div>
          )}

          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4">
            <Button variant={isMuted ? "destructive" : "secondary"} size="icon" className="rounded-full h-12 w-12" onClick={toggleMute}>
              {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </Button>
            {callType === "video" && (
              <Button variant={isCameraOn ? "secondary" : "destructive"} size="icon" className="rounded-full h-12 w-12" onClick={toggleCamera}>
                {isCameraOn ? <Camera className="h-5 w-5" /> : <CameraOff className="h-5 w-5" />}
              </Button>
            )}
            <Button variant="destructive" size="icon" className="rounded-full h-14 w-14" onClick={() => endCall(true)}>
              <PhoneOff className="h-6 w-6" />
            </Button>
            <Button variant={isSpeakerOn ? "default" : "secondary"} size="icon" className="rounded-full h-12 w-12" onClick={toggleSpeaker}>
              {isSpeakerOn ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
