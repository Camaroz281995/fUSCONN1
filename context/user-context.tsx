"use client"

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react"

export interface AuthUser {
  id: number
  username: string
  fullName?: string
  bio?: string
  profilePhoto?: string | null
}

interface UserContextType {
  id: number | null
  username: string
  setUsername: (username: string) => void
  fullName: string
  bio: string
  profilePhoto: string | null
  setProfilePhoto: (url: string | null) => void
  following: string[]
  addFollowing: (username: string) => void
  removeFollowing: (username: string) => void
  isFollowing: (username: string) => boolean
  login: (user: AuthUser) => void
  logout: () => void
  isLoggedIn: boolean
  isLoading: boolean
}

const UserContext = createContext<UserContextType>({
  id: null,
  username: "",
  setUsername: () => {},
  fullName: "",
  bio: "",
  profilePhoto: null,
  setProfilePhoto: () => {},
  following: [],
  addFollowing: () => {},
  removeFollowing: () => {},
  isFollowing: () => false,
  login: () => {},
  logout: () => {},
  isLoggedIn: false,
  isLoading: true,
})

export const useUser = () => useContext(UserContext)

export const UserProvider = ({
  children,
}: {
  children: ReactNode
}) => {
  const [id, setId] = useState<number | null>(null)
  const [username, setUsernameState] = useState("")
  const [fullName, setFullName] = useState("")
  const [bio, setBio] = useState("")
  const [profilePhoto, setProfilePhotoState] =
    useState<string | null>(null)

  const [following, setFollowing] =
    useState<string[]>([])

  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (typeof window === "undefined") {
      setIsLoading(false)
      return
    }

    try {
      const stored = localStorage.getItem("fusconn_user")

      if (stored) {
        const user: AuthUser = JSON.parse(stored)

        setId(user.id || null)
        setUsernameState(user.username || "")
        setFullName(user.fullName || "")
        setBio(user.bio || "")
        setProfilePhotoState(
          user.profilePhoto || null
        )
      }

      const storedFollowing =
        localStorage.getItem("fusconn_following")

      if (storedFollowing) {
        const parsedFollowing =
          JSON.parse(storedFollowing)

        if (Array.isArray(parsedFollowing)) {
          setFollowing(parsedFollowing)
        }
      }
    } catch (error) {
      console.error(
        "User loading error:",
        error
      )
    } finally {
      setIsLoading(false)
    }
  }, [])

  const login = (user: AuthUser) => {
    setId(user.id)
    setUsernameState(user.username)
    setFullName(user.fullName || "")
    setBio(user.bio || "")
    setProfilePhotoState(
      user.profilePhoto || null
    )

    localStorage.setItem(
      "fusconn_user",
      JSON.stringify(user)
    )
  }

  const logout = () => {
    setId(null)
    setUsernameState("")
    setFullName("")
    setBio("")
    setProfilePhotoState(null)
    setFollowing([])

    localStorage.removeItem("fusconn_user")
    localStorage.removeItem("fusconn_following")
  }

  const setUsername = (
    newUsername: string
  ) => {
    setUsernameState(newUsername)

    const stored =
      localStorage.getItem("fusconn_user")

    const user = stored
      ? JSON.parse(stored)
      : {}

    user.username = newUsername

    localStorage.setItem(
      "fusconn_user",
      JSON.stringify(user)
    )
  }

  const setProfilePhoto = (
    url: string | null
  ) => {
    setProfilePhotoState(url)

    const stored =
      localStorage.getItem("fusconn_user")

    const user = stored
      ? JSON.parse(stored)
      : {}

    user.profilePhoto = url

    localStorage.setItem(
      "fusconn_user",
      JSON.stringify(user)
    )
  }

  const addFollowing = (
    userToFollow: string
  ) => {
    if (
      userToFollow === username ||
      following.includes(userToFollow)
    ) {
      return
    }

    const next = [
      ...following,
      userToFollow,
    ]

    setFollowing(next)

    localStorage.setItem(
      "fusconn_following",
      JSON.stringify(next)
    )
  }

  const removeFollowing = (
    userToUnfollow: string
  ) => {
    const next = following.filter(
      (user) => user !== userToUnfollow
    )

    setFollowing(next)

    localStorage.setItem(
      "fusconn_following",
      JSON.stringify(next)
    )
  }

  return (
    <UserContext.Provider
      value={{
        id,
        username,
        setUsername,
        fullName,
        bio,
        profilePhoto,
        setProfilePhoto,
        following,
        addFollowing,
        removeFollowing,
        isFollowing: (user) =>
          following.includes(user),
        login,
        logout,
        isLoggedIn:
          !!username && !!id,
        isLoading,
      }}
    >
      {children}
    </UserContext.Provider>
  )
}
