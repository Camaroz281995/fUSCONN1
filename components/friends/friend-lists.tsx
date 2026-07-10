"use client"

import { useState, useEffect } from "react"
import { useUser } from "@/context/user-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Plus, X, Users, Search, Edit, Trash2 } from "lucide-react"
import { generateId } from "@/lib/utils"
import { persistentStorage } from "@/lib/persistent-storage"
import type { FriendList } from "@/lib/types"

export default function FriendLists() {
  const { username, following } = useUser()
  const [friendLists, setFriendLists] = useState<FriendList[]>([])
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingList, setEditingList] = useState<FriendList | null>(null)
  const [listName, setListName] = useState("")
  const [selectedFriends, setSelectedFriends] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")

  const fetchFriendLists = () => {
    if (!username) return

    const lists = persistentStorage.getUserFriendLists(username)
    setFriendLists(lists)
  }

  useEffect(() => {
    fetchFriendLists()
  }, [username])

  const handleCreateList = () => {
    if (!username || !listName.trim() || selectedFriends.length === 0) return

    const newList: FriendList = {
      id: generateId(),
      name: listName.trim(),
      owner: username,
      members: selectedFriends,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }

    persistentStorage.saveFriendList(newList)
    fetchFriendLists()

    // Reset form
    setListName("")
    setSelectedFriends([])
    setShowCreateDialog(false)
  }

  const handleUpdateList = () => {
    if (!editingList || !username || !listName.trim() || selectedFriends.length === 0) return

    const updatedList: FriendList = {
      ...editingList,
      name: listName.trim(),
      members: selectedFriends,
      updatedAt: Date.now(),
    }

    persistentStorage.saveFriendList(updatedList)
    fetchFriendLists()

    // Reset form
    setListName("")
    setSelectedFriends([])
    setEditingList(null)
    setShowEditDialog(false)
  }

  const handleDeleteList = (listId: string) => {
    if (!username) return

    persistentStorage.deleteFriendList(listId)
    fetchFriendLists()
  }

  const handleEditList = (list: FriendList) => {
    setEditingList(list)
    setListName(list.name)
    setSelectedFriends([...list.members])
    setShowEditDialog(true)
  }

  const filteredFollowing = following.filter((friend) => friend.toLowerCase().includes(searchQuery.toLowerCase()))

  if (!username) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Please set your username in the Profile tab to manage friend lists</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Friend Lists</h2>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Create List
        </Button>
      </div>

      {friendLists.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No Friend Lists Yet</h3>
            <p className="text-muted-foreground mb-4">Create lists to organize your connections</p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Create Your First List
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {friendLists.map((list) => (
            <Card key={list.id}>
              <CardHeader className="pb-2">
                <CardTitle className="flex justify-between items-center">
                  <span className="flex items-center">
                    <Users className="h-5 w-5 mr-2" />
                    {list.name}
                  </span>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEditList(list)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteList(list.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-2">
                  {list.members.map((member) => (
                    <Badge key={member} variant="secondary">
                      {member}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  {list.members.length} {list.members.length === 1 ? "member" : "members"}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create List Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Friend List</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="list-name">List Name</Label>
              <Input
                id="list-name"
                placeholder="Enter list name"
                value={listName}
                onChange={(e) => setListName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Select Friends</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search friends..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>

              <ScrollArea className="h-60 border rounded-md">
                <div className="p-2 space-y-2">
                  {filteredFollowing.length === 0 ? (
                    <p className="text-center py-4 text-muted-foreground">
                      {following.length === 0 ? "You're not following anyone yet" : "No results found"}
                    </p>
                  ) : (
                    filteredFollowing.map((friend) => (
                      <div key={friend} className="flex items-center space-x-2 p-2 hover:bg-muted/50 rounded-md">
                        <Checkbox
                          id={`friend-${friend}`}
                          checked={selectedFriends.includes(friend)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedFriends((prev) => [...prev, friend])
                            } else {
                              setSelectedFriends((prev) => prev.filter((f) => f !== friend))
                            }
                          }}
                        />
                        <Label htmlFor={`friend-${friend}`} className="flex items-center cursor-pointer flex-1">
                          <Avatar className="h-8 w-8 mr-2">
                            <AvatarFallback>{friend.substring(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <span>{friend}</span>
                        </Label>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>

              <div className="flex flex-wrap gap-1 mt-2">
                {selectedFriends.map((friend) => (
                  <Badge key={friend} variant="secondary" className="flex items-center gap-1">
                    {friend}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => setSelectedFriends((prev) => prev.filter((f) => f !== friend))}
                    />
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateList} disabled={!listName.trim() || selectedFriends.length === 0}>
              Create List
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit List Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Friend List</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-list-name">List Name</Label>
              <Input
                id="edit-list-name"
                placeholder="Enter list name"
                value={listName}
                onChange={(e) => setListName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Select Friends</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search friends..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>

              <ScrollArea className="h-60 border rounded-md">
                <div className="p-2 space-y-2">
                  {filteredFollowing.length === 0 ? (
                    <p className="text-center py-4 text-muted-foreground">
                      {following.length === 0 ? "You're not following anyone yet" : "No results found"}
                    </p>
                  ) : (
                    filteredFollowing.map((friend) => (
                      <div key={friend} className="flex items-center space-x-2 p-2 hover:bg-muted/50 rounded-md">
                        <Checkbox
                          id={`edit-friend-${friend}`}
                          checked={selectedFriends.includes(friend)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedFriends((prev) => [...prev, friend])
                            } else {
                              setSelectedFriends((prev) => prev.filter((f) => f !== friend))
                            }
                          }}
                        />
                        <Label htmlFor={`edit-friend-${friend}`} className="flex items-center cursor-pointer flex-1">
                          <Avatar className="h-8 w-8 mr-2">
                            <AvatarFallback>{friend.substring(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <span>{friend}</span>
                        </Label>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>

              <div className="flex flex-wrap gap-1 mt-2">
                {selectedFriends.map((friend) => (
                  <Badge key={friend} variant="secondary" className="flex items-center gap-1">
                    {friend}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => setSelectedFriends((prev) => prev.filter((f) => f !== friend))}
                    />
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateList} disabled={!listName.trim() || selectedFriends.length === 0}>
              Update List
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
