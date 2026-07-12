"use client"

import { useState, useEffect, useCallback } from "react"
import { useUser } from "@/context/user-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Sparkles,
  TrendingUp,
  Users,
  Clock,
  Search,
} from "lucide-react"

import PostList from "@/components/post/post-list"
import type { Post } from "@/lib/types"
import StoriesBar from "@/components/stories/stories-bar"


function mapPost(p: any): Post {
  return {
    id: p.id,
    username: p.username,
    content: p.content || "",
    timestamp: Number(p.created_at),

    imageUrl: p.image_url || undefined,
    videoUrl: p.video_url || undefined,
    gifUrl: p.gif_url || undefined,

    likes: Array.isArray(p.likes)
      ? p.likes.map((l: any) => l.username).filter(Boolean)
      : [],

    comments: Array.isArray(p.comments)
      ? p.comments.map((c: any) => ({
          id: c.id,
          username: c.username,
          content: c.content,
          timestamp: Number(c.created_at),
        }))
      : [],
  }
}


export default function SmartFeed() {

  const { following } = useUser()

  const [posts, setPosts] = useState<Post[]>([])
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([])

  const [loading, setLoading] = useState(true)

  const [activeTab, setActiveTab] = useState("recent")

  const [searchQuery, setSearchQuery] = useState("")


  const fetchPosts = useCallback(async () => {

    try {

      const res = await fetch("/api/posts", {
        cache: "no-store",
      })


      const data = await res.json()


      console.log(
        "POSTS RECEIVED FROM DATABASE:",
        data.posts
      )


      const mappedPosts =
        (data.posts || [])
          .map(mapPost)
          .sort(
            (a: Post, b: Post) =>
              b.timestamp - a.timestamp
          )


      setPosts(mappedPosts)


    } catch(error) {

      console.error(
        "Feed loading error:",
        error
      )

    } finally {

      setLoading(false)

    }

  }, [])



  useEffect(() => {

    fetchPosts()


    const interval =
      setInterval(
        fetchPosts,
        5000
      )


    return () =>
      clearInterval(interval)


  }, [fetchPosts])




  useEffect(() => {

    let result = [...posts]


    if(searchQuery.trim()) {

      const q =
        searchQuery.toLowerCase()


      result =
        result.filter(post =>
          post.username
            .toLowerCase()
            .includes(q) ||

          post.content
            .toLowerCase()
            .includes(q)
        )

    }



    if(activeTab === "following") {

      result =
        result.filter(post =>
          following.includes(post.username)
        )

    }



    if(activeTab === "trending") {

      result.sort(
        (a,b) =>
          (
            b.likes.length +
            b.comments.length
          )
          -
          (
            a.likes.length +
            a.comments.length
          )
      )

    }



    if(activeTab === "recent") {

      result.sort(
        (a,b) =>
          b.timestamp -
          a.timestamp
      )

    }



    setFilteredPosts(result)


  }, [
    posts,
    activeTab,
    searchQuery,
    following
  ])




  return (

    <Card className="card-transparent">

      <CardHeader>

        <CardTitle className="flex items-center gap-2">

          <Sparkles className="h-5 w-5"/>

          Smart Feed

        </CardTitle>

      </CardHeader>



      <div className="px-4">

        <StoriesBar />

      </div>



      <CardContent className="p-0">


        <div className="p-4">

          <div className="relative">

            <Search className="absolute left-2 top-2.5 h-4 w-4"/>


            <Input

              placeholder="Search posts..."

              value={searchQuery}

              onChange={
                e =>
                setSearchQuery(
                  e.target.value
                )
              }

              className="pl-8"

            />

          </div>

        </div>




        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
        >


          <TabsList className="grid grid-cols-4 mx-4">

            <TabsTrigger value="recent">

              <Clock className="h-4 w-4 mr-1"/>

              Recent

            </TabsTrigger>


            <TabsTrigger value="following">

              <Users className="h-4 w-4 mr-1"/>

              Following

            </TabsTrigger>


            <TabsTrigger value="trending">

              <TrendingUp className="h-4 w-4 mr-1"/>

              Trending

            </TabsTrigger>


            <TabsTrigger value="for-you">

              <Sparkles className="h-4 w-4 mr-1"/>

              For You

            </TabsTrigger>


          </TabsList>



        </Tabs>




        <ScrollArea className="h-[calc(100vh-300px)]">


          <div className="p-4">


            {
              loading ? (

                <p className="text-center">
                  Loading posts...
                </p>

              ) : filteredPosts.length === 0 ? (

                <p className="text-center">
                  No posts found
                </p>

              ) : (

                <PostList
                  posts={filteredPosts}
                  onCommentAdded={fetchPosts}
                  onPostUpdated={fetchPosts}
                />

              )

            }


          </div>


        </ScrollArea>


      </CardContent>


    </Card>

  )

}
