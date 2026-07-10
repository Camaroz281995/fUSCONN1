"use client"

import { useState, useEffect, useCallback } from "react"
import { useUser } from "@/context/user-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sparkles, TrendingUp, Users, Clock, Search } from "lucide-react"
import PostList from "@/components/post/post-list"
import type { Post } from "@/lib/types"
import StoriesBar from "@/components/stories/stories-bar"

// Map a row from GET /api/posts into the client Post shape.
function mapPost(p: any): Post {
  return {
    id: p.id,
    username: p.username,
    content: p.content || "",
    timestamp: Number(p.created_at),
    imageUrl: p.image_url || undefined,
    gifUrl: p.gif_url || undefined,
    videoUrl: p.video_url || undefined,
    likes: Array.isArray(p.likes) ? p.likes.map((l: any) => l.username).filter(Boolean) : [],
    comments: Array.isArray(p.comments)
      ? p.comments
          .filter((c: any) => c && c.id)
          .map((c: any) => ({
            id: c.id,
            username: c.username,
            content: c.content,
            timestamp: Number(c.created_at),
          }))
      : [],
  }
}

export default function SmartFeed() {
  const { username, following } = useUser()
  const [posts, setPosts] = useState<Post[]>([])
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("for-you")
  const [searchQuery, setSearchQuery] = useState("")

  const fetchPosts = useCallback(async () => {
    try {
      const res = await fetch("/api/posts")
      const data = await res.json()
      const mapped = (data.posts || []).map(mapPost).sort((a: Post, b: Post) => b.timestamp - a.timestamp)
      setPosts(mapped)
    } catch (error) {
      console.error("Error fetching posts for smart feed:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  // Real-time: poll the shared database + react to local post creation.
  useEffect(() => {
    fetchPosts()

    // When this user creates a post, the event carries the new post so we can
    // prepend it instantly (optimistic). A follow-up event with no detail fires
    // once the server confirms the write, so we reconcile with the real row.
    const handleNewPost = (event: Event) => {
      const newPost = (event as CustomEvent<Post>).detail
      if (newPost) {
        setPosts((prev) => [newPost, ...prev.filter((p) => p.id !== newPost.id)])
      } else {
        fetchPosts()
      }
    }

    // Refetch when the tab regains focus so posts stay fresh after switching away.
    const handleFocus = () => fetchPosts()

    window.addEventListener("newPostCreated", handleNewPost)
    window.addEventListener("focus", handleFocus)
    const interval = setInterval(fetchPosts, 5000)
    return () => {
      window.removeEventListener("newPostCreated", handleNewPost)
      window.removeEventListener("focus", handleFocus)
      clearInterval(interval)
    }
  }, [fetchPosts])

  const calculateRelevanceScore = useCallback(
    (post: Post): number => {
      let score = 0
      if (following.includes(post.username)) score += 50
      const hoursSincePosted = (Date.now() - post.timestamp) / (1000 * 60 * 60)
      if (hoursSincePosted < 24) score += Math.max(0, 24 - hoursSincePosted)
      score += (post.likes?.length || 0) * 2
      score += (post.comments?.length || 0) * 3
      return score
    },
    [following],
  )

  useEffect(() => {
    let filtered = [...posts]
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (post) => post.content.toLowerCase().includes(query) || post.username.toLowerCase().includes(query),
      )
    }
    switch (activeTab) {
      case "for-you":
        filtered.sort((a, b) => calculateRelevanceScore(b) - calculateRelevanceScore(a))
        break
      case "following":
        if (following.length > 0) {
          const followingPosts = filtered.filter((post) => following.includes(post.username))
          filtered = followingPosts.length > 0 ? followingPosts : filtered
        }
        break
      case "trending":
        filtered.sort(
          (a, b) =>
            (b.likes?.length || 0) + (b.comments?.length || 0) - ((a.likes?.length || 0) + (a.comments?.length || 0)),
        )
        break
      case "recent":
        filtered.sort((a, b) => b.timestamp - a.timestamp)
        break
    }
    setFilteredPosts(filtered)
  }, [activeTab, posts, following, searchQuery, calculateRelevanceScore])

  return (
    <Card className="card-transparent">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center">
          <Sparkles className="h-5 w-5 mr-2" />
          Smart Feed
        </CardTitle>
      </CardHeader>
      <div className="px-4 pb-3">
        <StoriesBar />
      </div>
      <CardContent className="p-0">
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search posts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-4 mb-4 mx-4">
            <TabsTrigger value="for-you">
              <Sparkles className="h-4 w-4 mr-1 md:mr-2" />
              <span className="hidden md:inline">For You</span>
              <span className="md:hidden">You</span>
            </TabsTrigger>
            <TabsTrigger value="following">
              <Users className="h-4 w-4 mr-1 md:mr-2" />
              <span className="hidden md:inline">Following</span>
              <span className="md:hidden">Follow</span>
            </TabsTrigger>
            <TabsTrigger value="trending">
              <TrendingUp className="h-4 w-4 mr-1 md:mr-2" />
              <span className="hidden md:inline">Trending</span>
              <span className="md:hidden">Trend</span>
            </TabsTrigger>
            <TabsTrigger value="recent">
              <Clock className="h-4 w-4 mr-1 md:mr-2" />
              <span className="hidden md:inline">Recent</span>
              <span className="md:hidden">New</span>
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[calc(100vh-300px)]">
            <div className="px-4 pb-4">
              {loading ? (
                <div className="text-center py-8">Loading posts...</div>
              ) : filteredPosts.length === 0 ? (
                <div className="text-center py-8">
                  {activeTab === "following" && following.length === 0 ? (
                    <div>
                      <p className="mb-4">You&apos;re not following anyone yet</p>
                      <Button variant="outline" onClick={() => setActiveTab("for-you")}>
                        Discover users to follow
                      </Button>
                    </div>
                  ) : (
                    <p>No posts found</p>
                  )}
                </div>
              ) : (
                <PostList posts={filteredPosts} onCommentAdded={fetchPosts} onPostUpdated={fetchPosts} />
              )}
            </div>
          </ScrollArea>
        </Tabs>
      </CardContent>
    </Card>
  )
}
