import type { Post, Comment, MarketplaceListing, Story, FriendList, VirtualPet, MusicTrack, MusicPlaylist, LiveStream, LiveStreamComment, Message, Conversation, FriendRequest, Notification } from "./types"

// Define basic types here to avoid import issues
interface StoryItem {
  id: string
  type: "image" | "video"
  url: string
  caption?: string
  timestamp: number
  muted?: boolean
}

// Helper function to get data from localStorage
function getFromStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") return defaultValue

  const stored = localStorage.getItem(key)
  if (!stored) return defaultValue

  try {
    return JSON.parse(stored) as T
  } catch (error) {
    console.error(`Error parsing ${key} from localStorage:`, error)
    return defaultValue
  }
}

// Helper function to save data to localStorage
function saveToStorage<T>(key: string, data: T): void {
  if (typeof window === "undefined") return

  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error)
  }
}

class PersistentStorage {
  // Posts
  savePosts(posts: Post[]): void {
    saveToStorage("fusion_connect_posts", posts)
  }

  getPosts(): Post[] {
    return getFromStorage<Post[]>("fusion_connect_posts", [])
  }

  savePost(post: Post): void {
    const posts = this.getPosts()
    const existingIndex = posts.findIndex((p) => p.id === post.id)

    if (existingIndex >= 0) {
      // Update existing post
      posts[existingIndex] = post
    } else {
      // Add new post at the beginning (newest first)
      posts.unshift(post)
    }

    // Sort posts by timestamp to ensure consistent ordering (newest first)
    posts.sort((a, b) => b.timestamp - a.timestamp)

    saveToStorage("fusion_connect_posts", posts)

    // Trigger custom event for real-time updates
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("newPostCreated", { detail: post }))
    }
  }

  // Add alias method for compatibility
  addPost(post: Post): void {
    this.savePost(post)
  }

  deletePost(postId: string): void {
    const posts = this.getPosts()
    const updatedPosts = posts.filter((post) => post.id !== postId)
    saveToStorage("fusion_connect_posts", updatedPosts)
  }

  // Comments
  addComment(postId: string, comment: Comment): void {
    const posts = this.getPosts()
    const postIndex = posts.findIndex((p) => p.id === postId)

    if (postIndex >= 0) {
      if (!posts[postIndex].comments) {
        posts[postIndex].comments = []
      }

      posts[postIndex].comments!.push(comment)
      saveToStorage("fusion_connect_posts", posts)
    }
  }

  saveComment(postId: string, comment: Comment): void {
    this.addComment(postId, comment)
  }

  // Likes
  toggleLike(postId: string, username: string): void {
    const posts = this.getPosts()
    const postIndex = posts.findIndex(p => p.id === postId)
    if (postIndex !== -1) {
      if (!posts[postIndex].likes) {
        posts[postIndex].likes = []
      }
      const likes = posts[postIndex].likes!
      const likeIndex = likes.indexOf(username)
      if (likeIndex === -1) {
        likes.push(username)
      } else {
        likes.splice(likeIndex, 1)
      }
      saveToStorage("fusion_connect_posts", posts)
    }
  }

  // Marketplace
  saveMarketplaceListing(listing: MarketplaceListing): void {
    const listings = this.getMarketplaceListings()
    const existingIndex = listings.findIndex((l) => l.id === listing.id)

    if (existingIndex >= 0) {
      listings[existingIndex] = listing
    } else {
      listings.unshift(listing)
    }

    saveToStorage("fusion_connect_marketplace", listings)
  }

  getMarketplaceListings(): MarketplaceListing[] {
    return getFromStorage<MarketplaceListing[]>("fusion_connect_marketplace", [])
  }

  deleteMarketplaceListing(listingId: string): void {
    const listings = this.getMarketplaceListings()
    const updatedListings = listings.filter((listing) => listing.id !== listingId)
    saveToStorage("fusion_connect_marketplace", updatedListings)
  }

  // Stories
  saveStory(story: Story): void {
    const stories = this.getStories()
    const existingIndex = stories.findIndex((s) => s.id === story.id)

    if (existingIndex >= 0) {
      stories[existingIndex] = story
    } else {
      stories.unshift(story)
    }

    saveToStorage("fusion_connect_stories", stories)
  }

  getStories(): Story[] {
    return getFromStorage<Story[]>("fusion_connect_stories", [])
  }

  getUserStory(username: string): Story | null {
    const stories = this.getStories()
    return stories.find((story) => story.username === username) || null
  }

  deleteStory(storyId: string): void {
    const stories = this.getStories()
    const updatedStories = stories.filter((story) => story.id !== storyId)
    saveToStorage("fusion_connect_stories", updatedStories)
  }

  // Friend Lists
  saveFriendList(friendList: FriendList): void {
    const lists = getFromStorage<FriendList[]>("fusion_connect_friend_lists", [])
    const existingIndex = lists.findIndex((l) => l.id === friendList.id)

    if (existingIndex >= 0) {
      lists[existingIndex] = friendList
    } else {
      lists.push(friendList)
    }

    saveToStorage("fusion_connect_friend_lists", lists)
  }

  getFriendLists(): FriendList[] {
    return getFromStorage<FriendList[]>("fusion_connect_friend_lists", [])
  }

  getUserFriendLists(username: string): FriendList[] {
    const lists = this.getFriendLists()
    return lists.filter((list) => list.owner === username)
  }

  deleteFriendList(listId: string): void {
    const lists = this.getFriendLists()
    const updatedLists = lists.filter((list) => list.id !== listId)
    saveToStorage("fusion_connect_friend_lists", updatedLists)
  }

  // Virtual Pet
  saveVirtualPet(pet: VirtualPet): void {
    const pets = getFromStorage<Record<string, VirtualPet>>("fusion_connect_pets", {})
    pets[pet.owner] = pet
    saveToStorage("fusion_connect_pets", pets)
  }

  saveUserPet(pet: VirtualPet): void {
    this.saveVirtualPet(pet)
  }

  getVirtualPet(owner: string): VirtualPet | null {
    const pets = getFromStorage<Record<string, VirtualPet>>("fusion_connect_pets", {})
    return pets[owner] || null
  }

  getUserPet(username: string): VirtualPet | null {
    const pets = getFromStorage<Record<string, VirtualPet>>("fusion_connect_pets", {})
    return pets[username] || null
  }

  // Music
  saveMusicTrack(track: MusicTrack): void {
    const tracks = this.getMusicTracks()
    tracks.push(track)
    saveToStorage("fusion_connect_tracks", tracks)
  }

  getMusicTracks(): MusicTrack[] {
    return getFromStorage<MusicTrack[]>("fusion_connect_tracks", [])
  }

  saveMusicPlaylist(playlist: MusicPlaylist): void {
    const playlists = this.getMusicPlaylists()
    const existingIndex = playlists.findIndex((p) => p.id === playlist.id)

    if (existingIndex >= 0) {
      playlists[existingIndex] = playlist
    } else {
      playlists.push(playlist)
    }

    saveToStorage("fusion_connect_playlists", playlists)
  }

  savePlaylist(playlist: MusicPlaylist): void {
    this.saveMusicPlaylist(playlist)
  }

  getMusicPlaylists(): MusicPlaylist[] {
    return getFromStorage<MusicPlaylist[]>("fusion_connect_playlists", [])
  }

  getUserPlaylists(username: string): MusicPlaylist[] {
    const playlists = this.getMusicPlaylists()
    return playlists.filter((playlist) => playlist.owner === username)
  }

  deletePlaylist(playlistId: string): void {
    const playlists = this.getMusicPlaylists()
    const updatedPlaylists = playlists.filter((playlist) => playlist.id !== playlistId)
    saveToStorage("fusion_connect_playlists", updatedPlaylists)
  }

  saveUserLikedTracks(username: string, trackIds: string[]): void {
    const likedTracks = getFromStorage<Record<string, string[]>>("fusion_connect_liked_tracks", {})
    likedTracks[username] = trackIds
    saveToStorage("fusion_connect_liked_tracks", likedTracks)
  }

  getUserLikedTracks(username: string): string[] {
    const likedTracks = getFromStorage<Record<string, string[]>>("fusion_connect_liked_tracks", {})
    return likedTracks[username] || []
  }

  // Live Streaming
  saveLiveStream(stream: LiveStream): void {
    const streams = this.getLiveStreams()
    const existingIndex = streams.findIndex((s) => s.id === stream.id)

    if (existingIndex >= 0) {
      streams[existingIndex] = stream
    } else {
      streams.unshift(stream)
    }

    saveToStorage("fusion_connect_live_streams", streams)
  }

  getLiveStreams(): LiveStream[] {
    return getFromStorage<LiveStream[]>("fusion_connect_live_streams", [])
  }

  deleteLiveStream(streamId: string): void {
    const streams = this.getLiveStreams()
    const updatedStreams = streams.filter((stream) => stream.id !== streamId)
    saveToStorage("fusion_connect_live_streams", updatedStreams)
  }

  // Messages
  saveMessage(message: Message): void {
    const messages = getFromStorage<Message[]>("fusion_connect_messages", [])
    messages.push(message)
    saveToStorage("fusion_connect_messages", messages)
  }

  getAllMessages(): Message[] {
    return getFromStorage<Message[]>("fusion_connect_messages", [])
  }

  getMessages(user1?: string, user2?: string): Message[] {
    const allMessages = this.getAllMessages()
    if (!user1 || !user2) {
      return allMessages
    }
    return allMessages.filter(message => 
      (message.senderId === user1 && message.recipientId === user2) ||
      (message.senderId === user2 && message.recipientId === user1)
    ).sort((a, b) => a.timestamp - b.timestamp)
  }

  getConversations(username: string): Conversation[] {
    const allMessages = this.getAllMessages()
    const conversationMap = new Map<string, Conversation>()

    allMessages.forEach(message => {
      const otherUser = message.senderId === username ? message.recipientId : message.senderId
      
      if (!conversationMap.has(otherUser)) {
        conversationMap.set(otherUser, {
          otherUser,
          lastMessage: message.content,
          lastMessageTime: message.timestamp,
          unreadCount: 0
        })
      } else {
        const conversation = conversationMap.get(otherUser)!
        if (message.timestamp > conversation.lastMessageTime) {
          conversation.lastMessage = message.content
          conversation.lastMessageTime = message.timestamp
        }
      }

      // Count unread messages
      if (message.recipientId === username && !message.isRead) {
        const conversation = conversationMap.get(otherUser)!
        conversation.unreadCount++
      }
    })

    return Array.from(conversationMap.values()).sort((a, b) => b.lastMessageTime - a.lastMessageTime)
  }

  // Friend Requests
  saveFriendRequest(friendRequest: FriendRequest): void {
    const requests = this.getFriendRequests()
    requests.push(friendRequest)
    saveToStorage("fusion_connect_friend_requests", requests)
  }

  getFriendRequests(): FriendRequest[] {
    return getFromStorage<FriendRequest[]>("fusion_connect_friend_requests", [])
  }

  updateFriendRequestStatus(requestId: string, status: "accepted" | "declined"): void {
    const requests = this.getFriendRequests()
    const requestIndex = requests.findIndex((r) => r.id === requestId)
    if (requestIndex >= 0) {
      requests[requestIndex].status = status
      saveToStorage("fusion_connect_friend_requests", requests)
    }
  }

  // Notifications
  saveNotification(notification: Notification): void {
    const notifications = this.getNotifications()
    notifications.unshift(notification)
    saveToStorage("fusion_connect_notifications", notifications)
  }

  getNotifications(): Notification[] {
    return getFromStorage<Notification[]>("fusion_connect_notifications", [])
  }

  getUserNotifications(username: string): Notification[] {
    const allNotifications = this.getNotifications()
    return allNotifications.filter(notification => notification.toUsername === username)
      .sort((a, b) => b.timestamp - a.timestamp)
  }

  markNotificationAsRead(notificationId: string): void {
    const notifications = this.getNotifications()
    const notificationIndex = notifications.findIndex((n) => n.id === notificationId)
    if (notificationIndex >= 0) {
      notifications[notificationIndex].isRead = true
      saveToStorage("fusion_connect_notifications", notifications)
    }
  }

  // Username tracking
  getAllUsernames(): string[] {
    return getFromStorage<string[]>("fusion_connect_usernames", [])
  }

  addUsername(username: string): void {
    const usernames = this.getAllUsernames()
    if (!usernames.includes(username)) {
      usernames.push(username)
      saveToStorage("fusion_connect_usernames", usernames)
    }
  }

  isUsernameTaken(username: string): boolean {
    const usernames = this.getAllUsernames()
    return usernames.includes(username)
  }

  saveUsername(username: string): void {
    const usernames = this.getAllUsernames()
    if (!usernames.includes(username)) {
      usernames.push(username)
      saveToStorage("fusion_connect_usernames", usernames)
    }
  }

  isUsernameAvailable(username: string): boolean {
    const usernames = this.getAllUsernames()
    return !usernames.includes(username)
  }
}

export const persistentStorage = new PersistentStorage()
