"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Upload, X, Camera, ImageIcon, Film } from 'lucide-react'

interface DevicePhotoUploadProps {
  onPhotoUploaded: (url: string, type: "image" | "gif") => void
  acceptGifs?: boolean
}

export default function DevicePhotoUpload({ onPhotoUploaded, acceptGifs = false }: DevicePhotoUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [fileType, setFileType] = useState<"image" | "gif">("image")
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    processFile(file)
  }

  const processFile = async (file: File) => {
    // Check file type
    const isGif = file.type === "image/gif"
    const isImage = file.type.startsWith("image/")

    if (!isImage) {
      alert("Please select an image file")
      return
    }

    if (isGif && !acceptGifs) {
      alert("GIF files are not supported in this context")
      return
    }

    // Check file size (limit to 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      alert(`File is too large (max 10MB)`)
      return
    }

    setIsProcessing(true)

    try {
      // Convert file to base64 data URL for reliable storage
      const reader = new FileReader()
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string
        if (dataUrl) {
          setPreviewUrl(dataUrl)
          setFileType(isGif ? "gif" : "image")
          onPhotoUploaded(dataUrl, isGif ? "gif" : "image")
        }
        setIsProcessing(false)
      }
      reader.onerror = () => {
        alert("Error reading file")
        setIsProcessing(false)
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error("Error processing file:", error)
      alert("Error processing file")
      setIsProcessing(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      processFile(files[0])
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const openFilePicker = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const openCamera = () => {
    if (cameraInputRef.current) {
      cameraInputRef.current.click()
    }
  }

  const handleClear = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
    if (cameraInputRef.current) {
      cameraInputRef.current.value = ""
    }
    setPreviewUrl(null)
    onPhotoUploaded("", "image")
  }

  return (
    <div className="space-y-4">
      <input
        type="file"
        accept={acceptGifs ? "image/*" : "image/*:not(image/gif)"}
        onChange={handleFileChange}
        className="hidden"
        ref={fileInputRef}
      />

      <input
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
        ref={cameraInputRef}
      />

      {!previewUrl ? (
        <Card
          className={`border-2 border-dashed transition-colors cursor-pointer ${
            isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={openFilePicker}
        >
          <CardContent className="p-8 text-center">
            <div className="flex flex-col items-center space-y-4">
              <div className="p-4 bg-muted rounded-full">
                <Upload className="h-8 w-8 text-muted-foreground" />
              </div>

              <div>
                <h3 className="font-medium mb-1">
                  {isDragging ? "Drop your image here" : isProcessing ? "Processing..." : "Upload an image"}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Drag and drop or click to select
                  {acceptGifs && " (including GIFs)"}
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isProcessing}
                  onClick={(e) => {
                    e.stopPropagation()
                    openFilePicker()
                  }}
                >
                  <ImageIcon className="h-4 w-4 mr-1" />
                  {isProcessing ? "Processing..." : "Choose File"}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isProcessing}
                  onClick={(e) => {
                    e.stopPropagation()
                    openCamera()
                  }}
                >
                  <Camera className="h-4 w-4 mr-1" />
                  Take Photo
                </Button>
              </div>

              <div className="text-xs text-muted-foreground">
                Supports: JPG, PNG{acceptGifs && ", GIF"} • Max size: 10MB
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="relative">
          <Card className="overflow-hidden">
            <div className="relative">
              {fileType === "gif" && (
                <Badge className="absolute top-2 left-2 z-10">
                  <Film className="h-3 w-3 mr-1" />
                  GIF
                </Badge>
              )}

              <img 
                src={previewUrl || "/placeholder.svg"} 
                alt="Preview" 
                className="w-full h-64 object-cover"
                onError={(e) => {
                  console.error("Image load error:", e)
                  // Fallback to placeholder if image fails to load
                  e.currentTarget.src = "/placeholder.svg?height=256&width=400"
                }}
              />

              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-8 w-8 rounded-full"
                onClick={handleClear}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </Card>

          <div className="mt-2 flex justify-between items-center text-sm text-muted-foreground">
            <span>Ready to upload</span>
            <Button variant="ghost" size="sm" onClick={openFilePicker} disabled={isProcessing}>
              Change Image
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
