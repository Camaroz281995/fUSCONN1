"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Upload, X } from 'lucide-react'

interface PhotoUploadFieldProps {
  onPhotoUploaded: (url: string) => void
}

export default function PhotoUploadField({ onPhotoUploaded }: PhotoUploadFieldProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check if file is an image
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file")
      return
    }

    // Check file size (limit to 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      alert(`File is too large (max 5MB)`)
      return
    }

    setIsUploading(true)

    try {
      // Convert file to base64 data URL for reliable storage
      const reader = new FileReader()
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string
        if (dataUrl) {
          setPreviewUrl(dataUrl)
          onPhotoUploaded(dataUrl)
        }
        setIsUploading(false)
      }
      reader.onerror = () => {
        alert("Error reading file")
        setIsUploading(false)
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error("Error processing file:", error)
      alert("Error processing file")
      setIsUploading(false)
    }
  }

  const openFilePicker = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleClear = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
    setPreviewUrl(null)
    onPhotoUploaded("")
  }

  return (
    <div>
      <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" ref={fileInputRef} />

      {!previewUrl ? (
        <div
          className="border-2 border-dashed rounded-md p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={openFilePicker}
        >
          <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground mb-2">Click to upload an image</p>
          <Button type="button" variant="outline" size="sm" disabled={isUploading}>
            {isUploading ? "Processing..." : "Select Image"}
          </Button>
        </div>
      ) : (
        <div className="relative">
          <img 
            src={previewUrl || "/placeholder.svg"} 
            alt="Preview" 
            className="w-full h-48 object-cover rounded-md"
            onError={(e) => {
              console.error("Image load error:", e)
              // Fallback to placeholder if image fails to load
              e.currentTarget.src = "/placeholder.svg?height=192&width=400"
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
      )}
    </div>
  )
}
