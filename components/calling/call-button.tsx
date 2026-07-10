"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Phone, Video, ChevronDown } from "lucide-react"
import CallInterface from "./call-interface"
import { useUser } from "@/context/user-context"

interface CallButtonProps {
  recipientUsername: string
  variant?: "default" | "ghost" | "outline"
  size?: "default" | "sm" | "lg" | "icon"
}

export default function CallButton({ recipientUsername, variant = "ghost", size = "icon" }: CallButtonProps) {
  const { username } = useUser()
  const [activeCall, setActiveCall] = useState<{ type: "voice" | "video"; callId: string } | null>(null)

  const startCall = (type: "voice" | "video") => {
    const callId = `call_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    setActiveCall({ type, callId })
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant={variant} size={size} className="relative" disabled={!username}>
            <Phone className="h-4 w-4" />
            {size !== "icon" && <ChevronDown className="h-3 w-3 ml-1" />}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => startCall("voice")}>
            <Phone className="h-4 w-4 mr-2" />
            Voice Call
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => startCall("video")}>
            <Video className="h-4 w-4 mr-2" />
            Video Call
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {activeCall && username && (
        <CallInterface
          selfUsername={username}
          recipientUsername={recipientUsername}
          callType={activeCall.type}
          callId={activeCall.callId}
          isInitiator
          onEndCall={() => setActiveCall(null)}
        />
      )}
    </>
  )
}
