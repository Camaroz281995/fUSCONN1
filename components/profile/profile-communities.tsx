"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Users, Plus, Settings, Trash2, UserPlus } from 'lucide-react'
import { useUser } from "@/context/user-context"

interface ProfileCommunity {
  id: string
  name: string
  description: string
  creator: string
  members: string[]
  createdAt: number
  isPrivate: boolean
  tags: string[]
}

export default function ProfileCommunities() {
  const { username } = useUser()
  const [communities, setCommunities] = useState<ProfileCommunity[]>([])
  const [loading, setLoading] = useState(false)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newCommunity, setNewCommunity] = useState({
    name: "",
    description: "",
    isPrivate: false,
    tags: ""
  })

  // Load communities from Neon database
  useEffect(() => {
    if (username) {
      loadUserCommunities()
    }
  }, [username])

  const loadUserCommunities = async () => {
    if (!username) return
    
    setLoading(true)
    try {
      const response = await fetch(`/api/profile-communities?username=${username}`)
      if (response.ok) {
        const data = await response.json()
        setCommunities(data.communities || [])
      }
    } catch (error) {
      console.error("Failed to load communities:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCommunity = async () => {
    if (!username || !newCommunity.name.trim()) return

    const community: ProfileCommunity = {
      id: `pc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: newCommunity.name.trim(),
      description: newCommunity.description.trim(),
      creator: username,
      members: [username],
      createdAt: Date.now(),
      isPrivate: newCommunity.isPrivate,
      tags: newCommunity.tags.split(',').map(t => t.trim()).filter(Boolean)
    }

    try {
      const response = await fetch('/api/profile-communities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(community)
      })

      if (response.ok) {
        setCommunities(prev => [community, ...prev])
        setIsCreateOpen(false)
        setNewCommunity({ name: "", description: "", isPrivate: false, tags: "" })
      }
    } catch (error) {
      console.error("Failed to create community:", error)
    }
  }

  const handleDeleteCommunity = async (communityId: string) => {
    try {
      const response = await fetch(`/api/profile-communities?id=${communityId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setCommunities(prev => prev.filter(c => c.id !== communityId))
      }
    } catch (error) {
      console.error("Failed to delete community:", error)
    }
  }

  const handleJoinCommunity = async (communityId: string) => {
    if (!username) return

    try {
      const response = await fetch('/api/profile-communities/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ communityId, username })
      })

      if (response.ok) {
        setCommunities(prev => prev.map(c => 
          c.id === communityId 
            ? { ...c, members: [...c.members, username] }
            : c
        ))
      }
    } catch (error) {
      console.error("Failed to join community:", error)
    }
  }

  if (!username) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">Please log in to view communities</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Profile Communities
            </CardTitle>
            <CardDescription>Communities you've created or joined</CardDescription>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Create
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Profile Community</DialogTitle>
                <DialogDescription>
                  Build a community around your interests
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Community Name</Label>
                  <Input
                    id="name"
                    value={newCommunity.name}
                    onChange={(e) => setNewCommunity(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter community name"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newCommunity.description}
                    onChange={(e) => setNewCommunity(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="What is this community about?"
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="tags">Tags (comma separated)</Label>
                  <Input
                    id="tags"
                    value={newCommunity.tags}
                    onChange={(e) => setNewCommunity(prev => ({ ...prev, tags: e.target.value }))}
                    placeholder="gaming, tech, art"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="private"
                    checked={newCommunity.isPrivate}
                    onChange={(e) => setNewCommunity(prev => ({ ...prev, isPrivate: e.target.checked }))}
                    className="rounded"
                  />
                  <Label htmlFor="private" className="cursor-pointer">Private community</Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateCommunity} disabled={!newCommunity.name.trim()}>
                  Create Community
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-center text-muted-foreground py-4">Loading communities...</p>
        ) : communities.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">No communities yet</p>
        ) : (
          <div className="space-y-4">
            {communities.map((community) => {
              const isMember = community.members.includes(username)
              const isCreator = community.creator === username

              return (
                <Card key={community.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{community.name}</h3>
                        {community.isPrivate && (
                          <Badge variant="secondary" className="text-xs">Private</Badge>
                        )}
                        {isCreator && (
                          <Badge variant="default" className="text-xs">Creator</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{community.description}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <Users className="h-4 w-4" />
                        <span>{community.members.length} members</span>
                      </div>
                      {community.tags.length > 0 && (
                        <div className="flex gap-2 flex-wrap">
                          {community.tags.map((tag, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {!isMember && !isCreator && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleJoinCommunity(community.id)}
                        >
                          <UserPlus className="h-4 w-4" />
                        </Button>
                      )}
                      {isCreator && (
                        <>
                          <Button size="sm" variant="outline">
                            <Settings className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => handleDeleteCommunity(community.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
