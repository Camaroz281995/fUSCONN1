"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserProvider, useUser } from "@/context/user-context"
import ProfileTab from "@/components/tabs/profile-tab"
import PostTab from "@/components/tabs/post-tab"
import SmartFeed from "@/components/smart-feed/smart-feed"
import MessagingTab from "@/components/tabs/messaging-tab"
import StoriesBar from "@/components/stories/stories-bar"
import FriendLists from "@/components/friends/friend-lists"
import VirtualPet from "@/components/pet-game/virtual-pet"
import MusicTab from "@/components/tabs/music-tab"
import LiveStreamingTab from "@/components/tabs/live-streaming-tab"
import CallingTab from "@/components/tabs/calling-tab"
import IncomingCallListener from "@/components/calling/incoming-call-listener"
import { ThemeProvider } from "@/components/theme-provider"
import SignupForm from "@/components/auth/signup-form"
import LoginForm from "@/components/auth/login-form"
import type { AuthUser } from "@/context/user-context"
import { Home, Users, Music, Radio, ImageIcon, User, Phone, MessageSquare } from "lucide-react"

function AppContent() {
  const { isLoggedIn, login } = useUser()
  const [authView, setAuthView] = useState<"login" | "signup">("login")
  const [activeTab, setActiveTab] = useState("feed")
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null)
  const [backgroundBlur, setBackgroundBlur] = useState(0)
  const [backgroundOpacity, setBackgroundOpacity] = useState(0.1)
  const [backgroundBrightness, setBackgroundBrightness] = useState(100)
  const [backgroundParallax, setBackgroundParallax] = useState(false)
  const [backgroundFilter, setBackgroundFilter] = useState<string | null>(null)
  const [backgroundColor, setBackgroundColor] = useState<string | null>(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  // Load background settings
  useEffect(() => {
    if (typeof window === "undefined") return
    const storedImage = localStorage.getItem("backgroundImage")
    const storedBlur = localStorage.getItem("backgroundBlur")
    const storedOpacity = localStorage.getItem("backgroundOpacity")
    const storedBrightness = localStorage.getItem("backgroundBrightness")
    const storedParallax = localStorage.getItem("backgroundParallax")
    const storedFilter = localStorage.getItem("backgroundFilter")
    const storedColor = localStorage.getItem("backgroundColor")
    if (storedImage) setBackgroundImage(storedImage)
    if (storedBlur) setBackgroundBlur(Number(storedBlur))
    if (storedOpacity) setBackgroundOpacity(Number(storedOpacity))
    if (storedBrightness) setBackgroundBrightness(Number(storedBrightness))
    if (storedParallax) setBackgroundParallax(storedParallax === "true")
    if (storedFilter) setBackgroundFilter(storedFilter)
    if (storedColor) setBackgroundColor(storedColor)
  }, [])

  // Parallax effect
  useEffect(() => {
    if (!backgroundParallax) return
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight })
    }
    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [backgroundParallax])

  const handleAuthSuccess = (user: AuthUser) => {
    login(user)
  }

  const getParallaxStyle = () => {
    if (!backgroundParallax) return {}
    return {
      transform: `translate(${(mousePosition.x - 0.5) * 20}px, ${(mousePosition.y - 0.5) * 20}px)`,
      transition: "transform 0.1s ease-out",
    }
  }

  const getFilterStyle = () => {
    let f = `brightness(${backgroundBrightness}%)`
    if (backgroundFilter === "grayscale") f += " grayscale(1)"
    else if (backgroundFilter === "sepia") f += " sepia(0.7)"
    else if (backgroundFilter === "invert") f += " invert(0.8)"
    else if (backgroundFilter === "hue-rotate") f += " hue-rotate(90deg)"
    return f
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        {authView === "signup" ? (
          <SignupForm
            onSignupSuccess={handleAuthSuccess}
            onSwitchToLogin={() => setAuthView("login")}
          />
        ) : (
          <LoginForm
            onLoginSuccess={handleAuthSuccess}
            onSwitchToSignup={() => setAuthView("signup")}
          />
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col relative">
      <IncomingCallListener />
      {(backgroundImage || backgroundColor) && (
        <div className="fixed inset-0 z-0" style={{ backgroundColor: backgroundColor || undefined, ...getParallaxStyle() }}>
          {backgroundImage && (
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${backgroundImage})`, filter: getFilterStyle(), opacity: backgroundOpacity, backdropFilter: `blur(${backgroundBlur}px)` }}
            />
          )}
        </div>
      )}

      <main className="flex-1 container mx-auto p-4 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-4 mb-4">
              <img src="/images/fusconn-logo.png" alt="fUSCONN Logo" className="w-16 h-16 object-contain" onError={(e) => { e.currentTarget.style.display = "none" }} />
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">fUSCONN</h1>
              <img src="/images/fusconn-logo.png" alt="fUSCONN Logo" className="w-16 h-16 object-contain" onError={(e) => { e.currentTarget.style.display = "none" }} />
            </div>
            <p className="text-muted-foreground">Connect. Share. Thrive.</p>
          </div>

          <StoriesBar />

          <Tabs defaultValue="feed" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-8 mb-4">
              <TabsTrigger value="feed"><Home className="h-4 w-4 mr-1 md:mr-2" /><span className="hidden md:inline">Feed</span></TabsTrigger>
              <TabsTrigger value="messages"><MessageSquare className="h-4 w-4 mr-1 md:mr-2" /><span className="hidden md:inline">Messages</span></TabsTrigger>
              <TabsTrigger value="calling"><Phone className="h-4 w-4 mr-1 md:mr-2" /><span className="hidden md:inline">Calls</span></TabsTrigger>
              <TabsTrigger value="friends"><Users className="h-4 w-4 mr-1 md:mr-2" /><span className="hidden md:inline">Friends</span></TabsTrigger>
              <TabsTrigger value="music"><Music className="h-4 w-4 mr-1 md:mr-2" /><span className="hidden md:inline">Music</span></TabsTrigger>
              <TabsTrigger value="live"><Radio className="h-4 w-4 mr-1 md:mr-2" /><span className="hidden md:inline">Live</span></TabsTrigger>
              <TabsTrigger value="pet"><ImageIcon className="h-4 w-4 mr-1 md:mr-2" /><span className="hidden md:inline">Collage</span></TabsTrigger>
              <TabsTrigger value="profile"><User className="h-4 w-4 mr-1 md:mr-2" /><span className="hidden md:inline">Profile</span></TabsTrigger>
            </TabsList>

            <div className="grid grid-cols-1 gap-4">
              <TabsContent value="feed" className="mt-0">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2 space-y-4">
                    <PostTab />
                    <SmartFeed />
                  </div>
                  <div className="hidden md:block">
                    <ProfileTab onBackgroundImageChange={setBackgroundImage} onBackgroundBlurChange={setBackgroundBlur} onBackgroundOpacityChange={setBackgroundOpacity} onBackgroundBrightnessChange={setBackgroundBrightness} onBackgroundParallaxChange={setBackgroundParallax} onBackgroundFilterChange={setBackgroundFilter} onBackgroundColorChange={setBackgroundColor} backgroundImage={backgroundImage} backgroundBlur={backgroundBlur} backgroundOpacity={backgroundOpacity} backgroundBrightness={backgroundBrightness} backgroundParallax={backgroundParallax} backgroundFilter={backgroundFilter} backgroundColor={backgroundColor} />
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="messages" className="mt-0"><MessagingTab /></TabsContent>
              <TabsContent value="calling" className="mt-0"><CallingTab /></TabsContent>
              <TabsContent value="friends" className="mt-0"><FriendLists /></TabsContent>
              <TabsContent value="music" className="mt-0"><MusicTab /></TabsContent>
              <TabsContent value="live" className="mt-0"><LiveStreamingTab /></TabsContent>
              <TabsContent value="pet" className="mt-0"><VirtualPet /></TabsContent>
              <TabsContent value="profile" className="mt-0">
                <div className="max-w-2xl mx-auto">
                  <ProfileTab onBackgroundImageChange={setBackgroundImage} onBackgroundBlurChange={setBackgroundBlur} onBackgroundOpacityChange={setBackgroundOpacity} onBackgroundBrightnessChange={setBackgroundBrightness} onBackgroundParallaxChange={setBackgroundParallax} onBackgroundFilterChange={setBackgroundFilter} onBackgroundColorChange={setBackgroundColor} backgroundImage={backgroundImage} backgroundBlur={backgroundBlur} backgroundOpacity={backgroundOpacity} backgroundBrightness={backgroundBrightness} backgroundParallax={backgroundParallax} backgroundFilter={backgroundFilter} backgroundColor={backgroundColor} />
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </main>
    </div>
  )
}

export default function FusionaryConnectraApp() {
  return (
    <ThemeProvider>
      <UserProvider>
        <AppContent />
      </UserProvider>
    </ThemeProvider>
  )
}
