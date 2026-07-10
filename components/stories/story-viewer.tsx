"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { formatDate } from "@/lib/utils"
import { X, ChevronLeft, ChevronRight, MessageCircle, Heart, MoreHorizontal } from "lucide-react"
import type { Story } from "@/lib/types"

interface StoryViewerProps {
  stories: Story[]
  initialStoryIndex: number
  onClose: () => void
}

export default function StoryViewer({ stories, initialStoryIndex, onClose }: StoryViewerProps) {
  const [currentStoryIndex, setCurrentStoryIndex] = useState(initialStoryIndex)
  const [currentItemIndex, setCurrentItemIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [isLiked, setIsLiked] = useState(false)
  const progressInterval = useRef<NodeJS.Timeout | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  const currentStory = stories[currentStoryIndex]
  const currentItem = currentStory?.items[currentItemIndex]
  const isLastStory = currentStoryIndex === stories.length - 1
  const isLastItem = currentItemIndex === currentStory?.items.length - 1

  // Start progress timer
  useEffect(() => {
    if (!currentItem) return

    // Clear any existing interval
    if (progressInterval.current) {
      clearInterval(progressInterval.current)
    }

    setProgress(0)

    // For videos, use the video duration
    if (currentItem.type === "video" && videoRef.current) {
      videoRef.current.currentTime = 0
      videoRef.current.play().catch((err) => console.error("Error playing video:", err))

      // Update progress based on video currentTime
      progressInterval.current = setInterval(() => {
        if (videoRef.current && !isPaused) {
          const percentage = (videoRef.current.currentTime / videoRef.current.duration) * 100
          setProgress(percentage)

          if (percentage >= 99) {
            goToNextItem()
          }
        }
      }, 30)
    } else {
      // For images, use a fixed duration (5 seconds)
      const duration = 5000
      const interval = 30
      const increment = (interval / duration) * 100

      progressInterval.current = setInterval(() => {
        if (!isPaused) {
          setProgress((prev) => {
            const newProgress = prev + increment
            if (newProgress >= 100) {
              goToNextItem()
              return 0
            }
            return newProgress
          })
        }
      }, interval)
    }

    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current)
      }
    }
  }, [currentStoryIndex, currentItemIndex, isPaused])

  const goToNextItem = () => {
    if (isLastItem) {
      if (isLastStory) {
        onClose()
      } else {
        setCurrentStoryIndex((prev) => prev + 1)
        setCurrentItemIndex(0)
      }
    } else {
      setCurrentItemIndex((prev) => prev + 1)
    }
  }

  const goToPreviousItem = () => {
    if (currentItemIndex > 0) {
      setCurrentItemIndex((prev) => prev - 1)
    } else if (currentStoryIndex > 0) {
      setCurrentStoryIndex((prev) => prev - 1)
      setCurrentItemIndex(stories[currentStoryIndex - 1].items.length - 1)
    }
  }

  const handleMouseDown = () => {
    setIsPaused(true)
    if (videoRef.current) {
      videoRef.current.pause()
    }
  }

  const handleMouseUp = () => {
    setIsPaused(false)
    if (videoRef.current) {
      videoRef.current.play().catch((err) => console.error("Error playing video:", err))
    }
  }

  const handleLike = () => {
    setIsLiked((prev) => !prev)
  }

  if (!currentStory || !currentItem) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
      <div
        className="relative w-full h-full max-w-md max-h-[80vh] mx-auto"
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onTouchStart={handleMouseDown}
        onTouchEnd={handleMouseUp}
      >
        {/* Story content */}
        <div className="relative h-full w-full bg-black">
          {currentItem.type === "image" ? (
            <img src={currentItem.url || "/placeholder.svg"} alt="Story" className="w-full h-full object-contain" />
          ) : (
            <video
              ref={videoRef}
              src={currentItem.url}
              className="w-full h-full object-contain"
              playsInline
              muted={currentItem.muted}
            />
          )}

          {/* Progress bars */}
          <div className="absolute top-0 left-0 right-0 flex gap-1 p-2 z-10">
            {currentStory.items.map((_, index) => (
              <Progress
                key={index}
                value={index === currentItemIndex ? progress : index < currentItemIndex ? 100 : 0}
                className="h-1 flex-1"
              />
            ))}
          </div>

          {/* Header */}
          <div className="absolute top-0 left-0 right-0 p-4 pt-6 flex items-center justify-between z-10 bg-gradient-to-b from-black/70 to-transparent">
            <div className="flex items-center">
              <Avatar className="h-8 w-8 mr-2">
                <AvatarImage src={currentStory.userAvatar || "/placeholder.svg"} />
                <AvatarFallback>{currentStory.username.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-white text-sm font-medium">{currentStory.username}</p>
                <p className="text-white/70 text-xs">{formatDate(currentItem.timestamp)}</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="text-white">
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Caption */}
          {currentItem.caption && (
            <div className="absolute bottom-16 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
              <p className="text-white text-sm">{currentItem.caption}</p>
            </div>
          )}

          {/* Actions */}
          <div className="absolute bottom-0 left-0 right-0 p-4 flex items-center justify-between z-10 bg-gradient-to-t from-black/70 to-transparent">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Reply to story..."
                className="w-full bg-white/20 text-white rounded-full px-4 py-2 text-sm backdrop-blur-sm"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            <div className="flex ml-2">
              <Button
                variant="ghost"
                size="icon"
                className={`text-white ${isLiked ? "text-red-500" : ""}`}
                onClick={(e) => {
                  e.stopPropagation()
                  handleLike()
                }}
              >
                <Heart className="h-5 w-5" fill={isLiked ? "currentColor" : "none"} />
              </Button>
              <Button variant="ghost" size="icon" className="text-white" onClick={(e) => e.stopPropagation()}>
                <MessageCircle className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-white" onClick={(e) => e.stopPropagation()}>
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Navigation buttons */}
          <button
            className="absolute left-0 top-0 bottom-0 w-1/4 h-full flex items-center justify-start opacity-0"
            onClick={(e) => {
              e.stopPropagation()
              goToPreviousItem()
            }}
          >
            <ChevronLeft className="h-8 w-8 text-white" />
          </button>

          <button
            className="absolute right-0 top-0 bottom-0 w-1/4 h-full flex items-center justify-end opacity-0"
            onClick={(e) => {
              e.stopPropagation()
              goToNextItem()
            }}
          >
            <ChevronRight className="h-8 w-8 text-white" />
          </button>
        </div>
      </div>
    </div>
  )
}
