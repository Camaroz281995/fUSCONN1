"use client"

import { useState } from "react"
import { useUser } from "@/context/user-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { User, ImageIcon, Sliders, Palette, MessageSquare, AlertCircle, Check } from 'lucide-react'
import PhotoUploadField from "@/components/photo/photo-upload-field"
import MessageList from "@/components/messaging/message-list"
import ProfileCommunities from "@/components/profile/profile-communities"
import { persistentStorage } from "@/lib/persistent-storage"

interface ProfileTabProps {
  backgroundImage: string | null
  backgroundBlur: number
  backgroundOpacity: number
  backgroundBrightness: number
  backgroundParallax: boolean
  backgroundFilter: string | null
  backgroundColor: string | null
  onBackgroundImageChange: (url: string | null) => void
  onBackgroundBlurChange: (blur: number) => void
  onBackgroundOpacityChange: (opacity: number) => void
  onBackgroundBrightnessChange: (brightness: number) => void
  onBackgroundParallaxChange: (parallax: boolean) => void
  onBackgroundFilterChange: (filter: string | null) => void
  onBackgroundColorChange: (color: string | null) => void
}

export default function ProfileTab({
  backgroundImage,
  backgroundBlur,
  backgroundOpacity,
  backgroundBrightness,
  backgroundParallax,
  backgroundFilter,
  backgroundColor,
  onBackgroundImageChange,
  onBackgroundBlurChange,
  onBackgroundOpacityChange,
  onBackgroundBrightnessChange,
  onBackgroundParallaxChange,
  onBackgroundFilterChange,
  onBackgroundColorChange,
}: ProfileTabProps) {
  const { username, setUsername, profilePhoto, setProfilePhoto } = useUser()
  const [usernameInput, setUsernameInput] = useState(username)
  const [profilePhotoInput, setProfilePhotoInput] = useState(profilePhoto || "")
  const [backgroundImageInput, setBackgroundImageInput] = useState(backgroundImage || "")
  const [backgroundColorInput, setBackgroundColorInput] = useState(backgroundColor || "")
  const [usePhotoUpload, setUsePhotoUpload] = useState(true)
  const [usernameError, setUsernameError] = useState("")
  const [usernameSuccess, setUsernameSuccess] = useState("")

  const handleUsernameSubmit = () => {
    if (!usernameInput.trim()) {
      setUsernameError("Username cannot be empty")
      return
    }

    const trimmedUsername = usernameInput.trim()

    // Check if username is already taken (but allow current user to keep their username)
    if (trimmedUsername !== username && !persistentStorage.isUsernameAvailable(trimmedUsername)) {
      setUsernameError("This Fusionary name is already taken. Please choose a different one.")
      return
    }

    // Save the new username
    setUsername(trimmedUsername)
    persistentStorage.saveUsername(trimmedUsername)
    setUsernameError("")
    setUsernameSuccess("Fusionary name updated successfully!")

    // Clear success message after 3 seconds
    setTimeout(() => {
      setUsernameSuccess("")
    }, 3000)
  }

  const handleProfilePhotoSubmit = () => {
    if (profilePhotoInput.trim()) {
      setProfilePhoto(profilePhotoInput.trim())
    } else {
      setProfilePhoto(null)
    }
  }

  const handleProfilePhotoUploaded = (url: string) => {
    if (url) {
      setProfilePhoto(url)
    }
  }

  const handleBackgroundImageSubmit = () => {
    if (backgroundImageInput.trim()) {
      onBackgroundImageChange(backgroundImageInput.trim())
      localStorage.setItem("backgroundImage", backgroundImageInput.trim())
    } else {
      onBackgroundImageChange(null)
      localStorage.removeItem("backgroundImage")
    }
  }

  const handleBackgroundPhotoUploaded = (url: string) => {
    if (url) {
      onBackgroundImageChange(url)
      localStorage.setItem("backgroundImage", url)
      setBackgroundImageInput(url)
    }
  }

  const handleBackgroundColorSubmit = () => {
    if (backgroundColorInput.trim()) {
      onBackgroundColorChange(backgroundColorInput.trim())
      localStorage.setItem("backgroundColor", backgroundColorInput.trim())
    } else {
      onBackgroundColorChange(null)
      localStorage.removeItem("backgroundColor")
    }
  }

  const handleBackgroundBlurChange = (value: number[]) => {
    const blur = value[0]
    onBackgroundBlurChange(blur)
    localStorage.setItem("backgroundBlur", blur.toString())
  }

  const handleBackgroundOpacityChange = (value: number[]) => {
    const opacity = value[0]
    onBackgroundOpacityChange(opacity)
    localStorage.setItem("backgroundOpacity", opacity.toString())
  }

  const handleBackgroundBrightnessChange = (value: number[]) => {
    const brightness = value[0]
    onBackgroundBrightnessChange(brightness)
    localStorage.setItem("backgroundBrightness", brightness.toString())
  }

  const handleBackgroundParallaxChange = (checked: boolean) => {
    onBackgroundParallaxChange(checked)
    localStorage.setItem("backgroundParallax", checked.toString())
  }

  const handleBackgroundFilterChange = (value: string) => {
    const filter = value === "none" ? null : value
    onBackgroundFilterChange(filter)
    if (filter) {
      localStorage.setItem("backgroundFilter", filter)
    } else {
      localStorage.removeItem("backgroundFilter")
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs defaultValue="account">
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="account">
              <User className="h-4 w-4 mr-2" />
              Account
            </TabsTrigger>
            <TabsTrigger value="communities">
              <MessageSquare className="h-4 w-4 mr-2" />
              Communities
            </TabsTrigger>
            <TabsTrigger value="messages">
              <MessageSquare className="h-4 w-4 mr-2" />
              Messages
            </TabsTrigger>
            <TabsTrigger value="appearance">
              <ImageIcon className="h-4 w-4 mr-2" />
              Background
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Sliders className="h-4 w-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="account" className="p-4 space-y-6">
            <div className="flex flex-col items-center mb-6">
              <Avatar className="h-24 w-24 mb-3">
                <AvatarImage src={profilePhoto || undefined} />
                <AvatarFallback className="text-lg">
                  {username ? username.substring(0, 2).toUpperCase() : "U"}
                </AvatarFallback>
              </Avatar>
              <h3 className="font-medium text-lg">{username || "Guest User"}</h3>
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Fusionary Name</Label>
              <div className="flex gap-2">
                <Input
                  id="username"
                  value={usernameInput}
                  onChange={(e) => {
                    setUsernameInput(e.target.value)
                    setUsernameError("")
                    setUsernameSuccess("")
                  }}
                  placeholder="Enter your unique Fusionary name"
                />
                <Button onClick={handleUsernameSubmit}>Save</Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Choose a unique name that other Fusionary users can find you by
              </p>

              {usernameError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{usernameError}</AlertDescription>
                </Alert>
              )}

              {usernameSuccess && (
                <Alert className="bg-green-50 border-green-200 text-green-800">
                  <Check className="h-4 w-4" />
                  <AlertDescription>{usernameSuccess}</AlertDescription>
                </Alert>
              )}
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Profile Photo</Label>
                <div className="flex items-center space-x-2">
                  <Switch id="photo-upload-mode" checked={usePhotoUpload} onCheckedChange={setUsePhotoUpload} />
                  <Label htmlFor="photo-upload-mode" className="text-sm">
                    {usePhotoUpload ? "Upload Photo" : "Use URL"}
                  </Label>
                </div>
              </div>

              {usePhotoUpload ? (
                <div className="space-y-2">
                  <Label>Upload Profile Photo</Label>
                  <PhotoUploadField onPhotoUploaded={handleProfilePhotoUploaded} />
                  <p className="text-xs text-muted-foreground">Upload an image file to use as your profile photo</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="profile-photo">Profile Photo URL</Label>
                  <div className="flex gap-2">
                    <Input
                      id="profile-photo"
                      value={profilePhotoInput}
                      onChange={(e) => setProfilePhotoInput(e.target.value)}
                      placeholder="Enter photo URL"
                    />
                    <Button onClick={handleProfilePhotoSubmit}>Save</Button>
                  </div>
                  <p className="text-xs text-muted-foreground">Enter a URL to an image to use as your profile photo</p>
                </div>
              )}

              {profilePhoto && (
                <div className="flex items-center justify-between p-2 bg-muted rounded-md">
                  <span className="text-sm">Current profile photo set</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setProfilePhoto(null)
                      setProfilePhotoInput("")
                    }}
                  >
                    Remove
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="communities" className="p-0">
            <ProfileCommunities />
          </TabsContent>

          <TabsContent value="messages" className="p-0 h-[500px]">
            <MessageList />
          </TabsContent>

          <TabsContent value="appearance" className="p-4 space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Background Image</Label>
                <div className="flex items-center space-x-2">
                  <Switch id="bg-upload-mode" checked={usePhotoUpload} onCheckedChange={setUsePhotoUpload} />
                  <Label htmlFor="bg-upload-mode" className="text-sm">
                    {usePhotoUpload ? "Upload Photo" : "Use URL"}
                  </Label>
                </div>
              </div>

              {usePhotoUpload ? (
                <div className="space-y-2">
                  <Label>Upload Background Image</Label>
                  <PhotoUploadField onPhotoUploaded={handleBackgroundPhotoUploaded} />
                  <p className="text-xs text-muted-foreground">Upload an image file to use as your background</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="background-image">Background Image URL</Label>
                  <div className="flex gap-2">
                    <Input
                      id="background-image"
                      value={backgroundImageInput}
                      onChange={(e) => setBackgroundImageInput(e.target.value)}
                      placeholder="Enter image URL"
                    />
                    <Button onClick={handleBackgroundImageSubmit}>Save</Button>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="background-color">Background Color</Label>
              <div className="flex gap-2">
                <Input
                  id="background-color"
                  value={backgroundColorInput}
                  onChange={(e) => setBackgroundColorInput(e.target.value)}
                  placeholder="e.g. #f0f0f0 or rgba(0,0,0,0.5)"
                />
                <Button onClick={handleBackgroundColorSubmit}>Save</Button>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h4 className="font-medium">Background Effects</h4>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>Background Blur</Label>
                  <span className="text-sm">{backgroundBlur}px</span>
                </div>
                <Slider value={[backgroundBlur]} min={0} max={20} step={1} onValueChange={handleBackgroundBlurChange} />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>Background Opacity</Label>
                  <span className="text-sm">{backgroundOpacity.toFixed(1)}</span>
                </div>
                <Slider
                  value={[backgroundOpacity]}
                  min={0.1}
                  max={1}
                  step={0.1}
                  onValueChange={handleBackgroundOpacityChange}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>Background Brightness</Label>
                  <span className="text-sm">{backgroundBrightness}%</span>
                </div>
                <Slider
                  value={[backgroundBrightness]}
                  min={20}
                  max={200}
                  step={5}
                  onValueChange={handleBackgroundBrightnessChange}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch id="parallax" checked={backgroundParallax} onCheckedChange={handleBackgroundParallaxChange} />
                <Label htmlFor="parallax">Enable Parallax Effect</Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="background-filter">Background Filter</Label>
                <Select value={backgroundFilter || "none"} onValueChange={handleBackgroundFilterChange}>
                  <SelectTrigger id="background-filter">
                    <SelectValue placeholder="Select filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="grayscale">Grayscale</SelectItem>
                    <SelectItem value="sepia">Sepia</SelectItem>
                    <SelectItem value="invert">Invert</SelectItem>
                    <SelectItem value="hue-rotate">Hue Rotate</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="p-4 space-y-4">
            <div className="space-y-2">
              <Label>Theme</Label>
              <Select defaultValue="system">
                <SelectTrigger>
                  <SelectValue placeholder="Select theme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>Accent Color</Label>
              <div className="grid grid-cols-6 gap-2">
                <Button variant="outline" className="w-full h-8 bg-red-500" />
                <Button variant="outline" className="w-full h-8 bg-orange-500" />
                <Button variant="outline" className="w-full h-8 bg-green-500" />
                <Button variant="outline" className="w-full h-8 bg-teal-500" />
                <Button variant="outline" className="w-full h-8 bg-purple-500" />
                <Button variant="outline" className="w-full h-8 bg-pink-500" />
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h4 className="font-medium">Preferences</h4>

              <div className="flex items-center space-x-2">
                <Switch id="notifications" />
                <Label htmlFor="notifications">Enable Notifications</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch id="sounds" />
                <Label htmlFor="sounds">Enable Sounds</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch id="auto-play" />
                <Label htmlFor="auto-play">Auto-play Videos</Label>
              </div>
            </div>

            <Separator />

            <div className="pt-4">
              <Button variant="outline" className="w-full bg-transparent">
                <Palette className="h-4 w-4 mr-2" />
                Advanced Customization
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
