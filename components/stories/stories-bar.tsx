"use client"

import { useState, useEffect } from "react"
import { useUser } from "@/context/user-context"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import StoryViewer from "@/components/stories/story-viewer"
import CreateStory from "@/components/stories/create-story"
import { persistentStorage } from "@/lib/persistent-storage"
import type { Story } from "@/lib/types"

export default function StoriesBar() {
  const { username, following, profilePhoto } = useUser()
  const [stories, setStories] = useState<Story[]>([])
  const [viewingStoryIndex, setViewingStoryIndex] = useState<number | null>(null)
  const [showCreateStory, setShowCreateStory] = useState(false)

  const fetchStories = () => {
    // Get all stories from persistent storage
    const allStories = persistentStorage.getStories()

    // Filter out expired stories
    const now = Date.now()
    const validStories = allStories.filter((story) => story.expiresAt > now)

    // Sort stories: user's story first, then followed users, then others
    const sortedStories = validStories.sort((a, b) => {
      // User's own story comes first
      if (a.username === username) return -1
      if (b.username === username) return 1

      // Then stories from followed users
      const aIsFollowed = following.includes(a.username)
      const bIsFollowed = following.includes(b.username)

      if (aIsFollowed && !bIsFollowed) return -1
      if (!aIsFollowed && bIsFollowed) return 1

      // Then sort by last updated
      return b.lastUpdated - a.lastUpdated
    })

    setStories(sortedStories)
  }

  useEffect(() => {
    fetchStories()

    // Refresh stories every 60 seconds
    const interval = setInterval(fetchStories, 60000)
    return () => clearInterval(interval)
  }, [username, following])

  const handleStoryCreated = () => {
    fetchStories()
  }

  const hasUserStory = stories.some((story) => story.username === username)

  return (
    <>
      <div className="mb-6">
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-4 pb-2 px-1">
            {/* Create story button */}
            <div className="flex flex-col items-center">
              <Button
                variant="outline"
                size="icon"
                className="h-16 w-16 rounded-full relative"
                onClick={() => setShowCreateStory(true)}
              >
                {hasUserStory ? (
                  <>
                    <Avatar className="h-full w-full border-2 border-primary">
                      <AvatarImage src={profilePhoto || undefined} />
                      <AvatarFallback>{username?.substring(0, 2).toUpperCase() || "ME"}</AvatarFallback>
                    </Avatar>
                    <div className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full h-6 w-6 flex items-center justify-center border-2 border-background">
                      <Plus className="h-4 w-4" />
                    </div>
                  </>
                ) : (
                  <Plus className="h-6 w-6" />
                )}
              </Button>
              <span className="text-xs mt-1 text-center">{hasUserStory ? "Your story" : "Create"}</span>
            </div>

            {/* Story avatars */}
            {stories.map(
              (story, index) =>
                story.username !== username && (
                  <div key={story.id} className="flex flex-col items-center">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-16 w-16 rounded-full p-0 overflow-hidden border-2 border-primary"
                      onClick={() => setViewingStoryIndex(index)}
                    >
                      <Avatar className="h-full w-full">
                        <AvatarImage src={story.userAvatar || undefined} />
                        <AvatarFallback>{story.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                    </Button>
                    <span className="text-xs mt-1 text-center truncate w-16">{story.username}</span>
                  </div>
                ),
            )}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      {/* Story viewer */}
      {viewingStoryIndex !== null && (
        <StoryViewer
          stories={stories}
          initialStoryIndex={viewingStoryIndex}
          onClose={() => setViewingStoryIndex(null)}
        />
      )}

      {/* Create story dialog */}
      {showCreateStory && <CreateStory onStoryCreated={handleStoryCreated} onClose={() => setShowCreateStory(false)} />}
    </>
  )
}
