export interface Post {
  id: string
  username: string
  content: string
  timestamp: number
  likes?: string[]
  comments?: Comment[]
  imageUrl?: string
  gifUrl?: string
  videoUrl?: string
  mentions?: string[]
}

export interface Comment {
  id: string
  username: string
  content: string
  timestamp: number
}

export interface MarketplaceListing {
  id: string
  title: string
  description: string
  price: number
  category: string
  location: string
  imageUrl: string
  sellerUsername: string
  sellerJoinDate: number
  timestamp: number
  contactPhone: string | null
  contactEmail: string | null
  contactAddress: string | null
  status: "active" | "sold" | "pending"
}

export interface StoryItem {
  id: string
  type: "image" | "video"
  url: string
  caption?: string
  timestamp: number
  muted?: boolean
}

export interface Story {
  id: string
  username: string
  userAvatar: string | null
  items: StoryItem[]
  createdAt: number
  lastUpdated: number
  expiresAt: number
  privacy: "public" | "friends" | "close-friends"
}

export interface FriendList {
  id: string
  name: string
  owner: string
  members: string[]
  createdAt: number
  updatedAt: number
}

export interface VirtualPet {
  name: string
  type: string
  emoji: string
  owner: string
  hunger: number
  happiness: number
  energy: number
  hydration: number
  level: number
  experience: number
  createdAt: number
  lastVisit: number
  items: string[]
}

export interface MusicTrack {
  id: string
  title: string
  artist: string
  url: string
  coverArt?: string
  duration: number
  genre: string
}

export interface MusicPlaylist {
  id: string
  name: string
  owner: string
  coverArt?: string
  tracks: string[]
  createdAt: number
  updatedAt: number
}

export interface LiveStream {
  id: string
  hostUsername: string
  hostAvatar: string | null
  title: string
  description: string
  viewerCount: number
  startedAt: number
  tags: string[]
  isLive: boolean
}

export interface LiveStreamComment {
  id: string
  username: string
  content: string
  timestamp: number
}

export interface Message {
  id: string
  senderId: string
  recipientId: string
  content: string
  timestamp: number
  type: "text" | "image" | "audio" | "video"
  isRead: boolean
}

export interface Conversation {
  otherUser: string
  lastMessage: string
  lastMessageTime: number
  unreadCount: number
}

export interface CallSession {
  id: string
  callerId: string
  recipientId: string
  type: "voice" | "video"
  status: "calling" | "connected" | "ended"
  startTime: number
  endTime?: number
}

export interface FriendRequest {
  id: string
  fromUsername: string
  toUsername: string
  timestamp: number
  status: "pending" | "accepted" | "declined"
}

export interface Notification {
  id: string
  type: "call" | "message" | "friend_request"
  fromUsername: string
  toUsername: string
  content: string
  timestamp: number
  isRead: boolean
  callType?: "voice" | "video"
  messageId?: string
  friendRequestId?: string
}
