"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Video, Upload, X, Play, Pause, AlertCircle } from 'lucide-react'

interface DeviceVideoUploadProps {
  onVideoSelect: (videoUrl: string | null) => void
  selectedVideo: string | null
  maxSizeMB?: number
}

export default function DeviceVideoUpload({ 
  onVideoSelect, 
  selectedVideo, 
  maxSizeMB = 50 
}: DeviceVideoUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [videoDuration, setVideoDuration] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setError(null)

    // Validate file type
    if (!file.type.startsWith('video/')) {
      setError('Please select a valid video file')
      return
    }

    // Validate file size
    const fileSizeMB = file.size / (1024 * 1024)
    if (fileSizeMB > maxSizeMB) {
      setError(`Video file size must be less than ${maxSizeMB}MB`)
      return
    }

    setIsUploading(true)
    setUploadProgress(0)

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 100)

      // Convert file to data URL
      const reader = new FileReader()
      reader.onload = (e) => {
        const videoUrl = e.target?.result as string
        setUploadProgress(100)
        onVideoSelect(videoUrl)
        setIsUploading(false)
        clearInterval(progressInterval)
      }

      reader.onerror = () => {
        setError('Failed to read video file')
        setIsUploading(false)
        clearInterval(progressInterval)
      }

      reader.readAsDataURL(file)
    } catch (error) {
      console.error('Video upload error:', error)
      setError('Failed to upload video')
      setIsUploading(false)
    }
  }

  const handleVideoLoad = () => {
    if (videoRef.current) {
      setVideoDuration(videoRef.current.duration)
    }
  }

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const removeVideo = () => {
    onVideoSelect(null)
    setVideoDuration(null)
    setIsPlaying(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-4">
      {!selectedVideo ? (
        <Card className="border-dashed border-2 hover:border-primary/50 transition-colors">
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Video className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-medium mb-1">Upload Video</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Select a video file from your device (max {maxSizeMB}MB)
                </p>
                <Button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="w-full"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {isUploading ? 'Uploading...' : 'Choose Video'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <video
                ref={videoRef}
                src={selectedVideo}
                className="w-full h-48 object-cover rounded-md"
                onLoadedMetadata={handleVideoLoad}
                onError={(e) => {
                  console.error('Video load error:', e)
                  setError('Failed to load video')
                }}
              />
              
              <div className="absolute inset-0 flex items-center justify-center">
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={togglePlayPause}
                  className="bg-black/50 hover:bg-black/70 text-white"
                >
                  {isPlaying ? (
                    <Pause className="h-6 w-6" />
                  ) : (
                    <Play className="h-6 w-6" />
                  )}
                </Button>
              </div>

              <Button
                variant="destructive"
                size="icon"
                onClick={removeVideo}
                className="absolute top-2 right-2"
              >
                <X className="h-4 w-4" />
              </Button>

              {videoDuration && (
                <div className="absolute bottom-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
                  {formatDuration(videoDuration)}
                </div>
              )}
            </div>

            <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
              <span>Video ready to post</span>
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                Change Video
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isUploading && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Uploading video...</span>
            <span>{uploadProgress}%</span>
          </div>
          <Progress value={uploadProgress} className="w-full" />
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  )
}
