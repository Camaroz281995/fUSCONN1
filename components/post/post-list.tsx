"use client"

import { useState } from "react"
import { useUser } from "@/context/user-context"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { formatDate, generateId } from "@/lib/utils"
import { persistentStorage } from "@/lib/persistent-storage"
import { MessageSquare, Heart, Share2, MoreHorizontal, Send } from 'lucide-react'
import type { Post, Comment } from "@/lib/types"
import CallButton from "@/components/calling/call-button"

interface PostListProps {
  posts: Post[]
  onCommentAdded?: () => void
  onPostUpdated?: () => void
}

export default function PostList({ posts, onCommentAdded, onPostUpdated }: PostListProps) {
  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <PostItem key={post.id} post={post} onCommentAdded={onCommentAdded} onPostUpdated={onPostUpdated} />
      ))}
    </div>
  )
}

interface PostItemProps {
  post: Post
  onCommentAdded?: () => void
  onPostUpdated?: () => void
}

function PostItem({ post, onCommentAdded, onPostUpdated }: PostItemProps) {
  const { username, isFollowing, addFollowing, removeFollowing } = useUser()
  const [showComments, setShowComments] = useState(false)
  const [commentText, setCommentText] = useState("")
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)

  // Format post content to highlight mentions
  const formatContent = (content: string) => {
    const parts = content.split(/(@\w+)/g)
    return parts.map((part, index) => {
      if (part.startsWith("@")) {
        return (
          <span key={index} className="text-primary font-medium">
            {part}
          </span>
        )
      }
      return part
    })
  }

  const handleLike = () => {
    if (!username) return

    const updatedPost = { ...post }

    if (!updatedPost.likes) {
      updatedPost.likes = []
    }

    const userLikeIndex = updatedPost.likes.indexOf(username)

    if (userLikeIndex >= 0) {
      // Unlike
      updatedPost.likes.splice(userLikeIndex, 1)
    } else {
      // Like
      updatedPost.likes.push(username)
    }

    fetch(`/api/posts/${post.id}/like`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
    })
      .then(() => {
        if (onPostUpdated) onPostUpdated()
      })
      .catch((err) => console.error("[v0] like error:", err))
  }

  const handleFollow = () => {
    if (post.username === username) return

    if (isFollowing(post.username)) {
      removeFollowing(post.username)
    } else {
      addFollowing(post.username)
    }
  }

  const handleAddComment = () => {
    if (!username || !commentText.trim()) return

    setIsSubmittingComment(true)

    const newComment: Comment = {
      id: generateId(),
      username,
      content: commentText.trim(),
      timestamp: Date.now(),
    }

    fetch(`/api/posts/${post.id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, content: newComment.content }),
    })
      .then(() => {
        setCommentText("")
        setIsSubmittingComment(false)
        if (onCommentAdded) onCommentAdded()
      })
      .catch((err) => {
        console.error("[v0] comment error:", err)
        setIsSubmittingComment(false)
      })
  }

  const isLiked = username && post.likes?.includes(username)
  const isPostOwner = username === post.username
  const isFollowed = !isPostOwner && isFollowing(post.username)
  const commentCount = post.comments?.length || 0
  const likeCount = post.likes?.length || 0

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center">
            <Avatar className="h-8 w-8 mr-2">
              <AvatarFallback>{post.username.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center">
                <span className="font-medium">{post.username}</span>
                {!isPostOwner && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 ml-2 text-xs"
                    onClick={handleFollow}
                    disabled={!username}
                  >
                    {isFollowed ? "Unfollow" : "Follow"}
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{formatDate(post.timestamp)}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {!isPostOwner && username && <CallButton recipientUsername={post.username} />}
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        <p className="whitespace-pre-wrap">{formatContent(post.content)}</p>

        {post.imageUrl && (
          <div className="mt-3 rounded-md overflow-hidden">
            <img 
              src={post.imageUrl || "/placeholder.svg"} 
              alt="Post image" 
              className="w-full object-cover"
              onError={(e) => {
                console.error("Post image load error:", e)
                e.currentTarget.src = "/placeholder.svg?height=400&width=600&text=Image+Not+Available"
              }}
            />
          </div>
        )}

        {post.gifUrl && (
          <div className="mt-3 rounded-md overflow-hidden">
            <img 
              src={post.gifUrl || "/placeholder.svg"} 
              alt="Post GIF" 
              className="w-full object-cover"
              onError={(e) => {
                console.error("Post GIF load error:", e)
                e.currentTarget.src = "/placeholder.svg?height=400&width=600&text=GIF+Not+Available"
              }}
            />
          </div>
        )}

        {post.videoUrl && (
          <div className="mt-3 rounded-md overflow-hidden">
            <video 
              src={post.videoUrl || "/placeholder.svg"} 
              controls
              className="w-full object-cover max-h-96"
              onError={(e) => {
                console.error("Post video load error:", e)
                e.currentTarget.style.display = 'none'
              }}
            />
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-0 flex-col items-stretch">
        <div className="flex justify-between items-center pb-3">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-1 h-8 px-2"
              onClick={handleLike}
              disabled={!username}
            >
              <Heart className="h-4 w-4" fill={isLiked ? "currentColor" : "none"} />
              <span>{likeCount > 0 ? likeCount : ""}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-1 h-8 px-2"
              onClick={() => setShowComments(!showComments)}
            >
              <MessageSquare className="h-4 w-4" />
              <span>{commentCount > 0 ? commentCount : ""}</span>
            </Button>

            <Button variant="ghost" size="sm" className="flex items-center gap-1 h-8 px-2">
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {showComments && (
          <div className="pt-2 border-t">
            {post.comments && post.comments.length > 0 ? (
              <div className="space-y-3 mb-3 max-h-40 overflow-y-auto">
                {post.comments.map((comment) => (
                  <div key={comment.id} className="flex items-start gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback>{comment.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="bg-muted rounded-md px-3 py-2">
                        <span className="font-medium text-sm">{comment.username}</span>
                        <p className="text-sm">{comment.content}</p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{formatDate(comment.timestamp)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-2">No comments yet</p>
            )}

            <div className="flex gap-2 mt-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src="/placeholder.svg" />
                <AvatarFallback>{username ? username.substring(0, 2).toUpperCase() : "U"}</AvatarFallback>
              </Avatar>
              <div className="flex-1 flex gap-2">
                <Textarea
                  placeholder="Write a comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="min-h-0 h-9 py-2 resize-none"
                  disabled={!username || isSubmittingComment}
                />
                <Button
                  size="icon"
                  className="h-9 w-9"
                  disabled={!username || !commentText.trim() || isSubmittingComment}
                  onClick={handleAddComment}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardFooter>
    </Card>
  )
}
