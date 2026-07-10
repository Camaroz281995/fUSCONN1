"use client"

import type React from "react"
import { useState, useEffect, useRef, useCallback } from "react"
import { useUser } from "@/context/user-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ImagePlus, X, ArrowLeft, ArrowRight, LayoutGrid, Images, Trash2 } from "lucide-react"

interface CollagePhoto {
  id: string
  url: string
  caption: string
}

type LayoutId = "grid2" | "grid3" | "masonry" | "featured"

const LAYOUTS: { id: LayoutId; name: string; icon: React.ReactNode }[] = [
  { id: "grid2", name: "2 Columns", icon: <LayoutGrid className="h-4 w-4" /> },
  { id: "grid3", name: "3 Columns", icon: <LayoutGrid className="h-4 w-4" /> },
  { id: "masonry", name: "Masonry", icon: <Images className="h-4 w-4" /> },
  { id: "featured", name: "Featured", icon: <Images className="h-4 w-4" /> },
]

const MAX_PHOTOS = 24
const MAX_FILE_SIZE = 15 * 1024 * 1024 // 15MB source limit (compressed before storing)
const MAX_DIMENSION = 1200 // downscale longest edge to this before saving
const JPEG_QUALITY = 0.8

// Downscale + compress an image file to a JPEG data URL so it fits in
// localStorage. Full-resolution base64 photos quickly exceed the ~5MB quota.
function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const img = new window.Image()
      img.crossOrigin = "anonymous"
      img.onload = () => {
        let { width, height } = img
        if (width > height && width > MAX_DIMENSION) {
          height = Math.round((height * MAX_DIMENSION) / width)
          width = MAX_DIMENSION
        } else if (height > MAX_DIMENSION) {
          width = Math.round((width * MAX_DIMENSION) / height)
          height = MAX_DIMENSION
        }
        const canvas = document.createElement("canvas")
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext("2d")
        if (!ctx) {
          reject(new Error("Canvas not supported"))
          return
        }
        ctx.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL("image/jpeg", JPEG_QUALITY))
      }
      img.onerror = () => reject(new Error("Could not load image"))
      img.src = reader.result as string
    }
    reader.onerror = () => reject(new Error("Could not read file"))
    reader.readAsDataURL(file)
  })
}

export default function VirtualPet() {
  const { username } = useUser()
  const [photos, setPhotos] = useState<CollagePhoto[]>([])
  const [layout, setLayout] = useState<LayoutId>("masonry")
  const [loaded, setLoaded] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const storageKey = username ? `fusconn_collage_${username}` : null
  const layoutKey = username ? `fusconn_collage_layout_${username}` : null

  // Load saved collage for this user
  useEffect(() => {
    if (!storageKey || !layoutKey) return
    try {
      const stored = localStorage.getItem(storageKey)
      if (stored) setPhotos(JSON.parse(stored))
      const storedLayout = localStorage.getItem(layoutKey) as LayoutId | null
      if (storedLayout) setLayout(storedLayout)
    } catch (err) {
      console.error("[v0] collage load error:", err)
    }
    setLoaded(true)
  }, [storageKey, layoutKey])

  // Persist whenever photos change (after initial load). If we exceed the
  // localStorage quota, roll back to the last successfully-saved set so the
  // app never gets stuck throwing on every render.
  useEffect(() => {
    if (!loaded || !storageKey) return
    try {
      localStorage.setItem(storageKey, JSON.stringify(photos))
    } catch (err) {
      const isQuota =
        err instanceof DOMException &&
        (err.name === "QuotaExceededError" || err.name === "NS_ERROR_DOM_QUOTA_REACHED")
      if (isQuota) {
        alert("Your collage is full — there isn't enough browser storage for more photos. Remove some to add new ones.")
        setPhotos((prev) => prev.slice(0, -1))
      } else {
        console.error("[v0] collage save error:", err)
      }
    }
  }, [photos, loaded, storageKey])

  const changeLayout = (id: LayoutId) => {
    setLayout(id)
    if (layoutKey) localStorage.setItem(layoutKey, id)
  }

  const addFiles = useCallback(
    (files: FileList | File[]) => {
      const list = Array.from(files).filter((f) => f.type.startsWith("image/"))
      if (list.length === 0) return

      setPhotos((prev) => {
        const remaining = MAX_PHOTOS - prev.length
        if (remaining <= 0) {
          alert(`You can add up to ${MAX_PHOTOS} photos`)
          return prev
        }
        return prev
      })

      list.slice(0, MAX_PHOTOS).forEach((file) => {
        if (file.size > MAX_FILE_SIZE) {
          alert(`"${file.name}" is too large (max 15MB)`)
          return
        }
        compressImage(file)
          .then((dataUrl) => {
            setPhotos((prev) => {
              if (prev.length >= MAX_PHOTOS) return prev
              return [
                ...prev,
                {
                  id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
                  url: dataUrl,
                  caption: "",
                },
              ]
            })
          })
          .catch((err) => {
            console.error("[v0] image compress error:", err)
            alert(`Could not process "${file.name}"`)
          })
      })
    },
    [],
  )

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(e.target.files)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files) addFiles(e.dataTransfer.files)
  }

  const removePhoto = (id: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id))
  }

  const movePhoto = (index: number, direction: -1 | 1) => {
    setPhotos((prev) => {
      const target = index + direction
      if (target < 0 || target >= prev.length) return prev
      const next = [...prev]
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }

  const updateCaption = (id: string, caption: string) => {
    setPhotos((prev) => prev.map((p) => (p.id === id ? { ...p, caption } : p)))
  }

  const clearAll = () => {
    if (confirm("Remove all photos from your collage?")) setPhotos([])
  }

  const layoutClasses: Record<LayoutId, string> = {
    grid2: "grid grid-cols-2 gap-3",
    grid3: "grid grid-cols-2 sm:grid-cols-3 gap-3",
    masonry: "columns-2 sm:columns-3 gap-3 [&>*]:mb-3",
    featured: "grid grid-cols-2 sm:grid-cols-4 gap-3",
  }

  if (!username) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Please set your username in the Profile tab to build your photo collage</p>
      </div>
    )
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Images className="h-5 w-5 text-primary" />
              My Photo Collage
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {photos.length} {photos.length === 1 ? "photo" : "photos"} on FUSCONN
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" onClick={() => fileInputRef.current?.click()} disabled={photos.length >= MAX_PHOTOS}>
              <ImagePlus className="h-4 w-4 mr-1" />
              Add Photos
            </Button>
            {photos.length > 0 && (
              <Button size="sm" variant="outline" onClick={clearAll}>
                <Trash2 className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </div>

        {photos.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <span className="text-xs text-muted-foreground mr-1">Layout:</span>
            {LAYOUTS.map((l) => (
              <Button
                key={l.id}
                size="sm"
                variant={layout === l.id ? "default" : "outline"}
                onClick={() => changeLayout(l.id)}
                className="h-8"
              >
                {l.icon}
                <span className="ml-1 hidden sm:inline">{l.name}</span>
              </Button>
            ))}
          </div>
        )}
      </CardHeader>

      <CardContent>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          className="hidden"
          ref={fileInputRef}
        />

        {photos.length === 0 ? (
          <div
            role="button"
            tabIndex={0}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click()
            }}
            onDrop={handleDrop}
            onDragOver={(e) => {
              e.preventDefault()
              setIsDragging(true)
            }}
            onDragLeave={(e) => {
              e.preventDefault()
              setIsDragging(false)
            }}
            className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed py-16 text-center cursor-pointer transition-colors ${
              isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
            }`}
          >
            <div className="p-4 bg-muted rounded-full mb-4">
              <ImagePlus className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-medium mb-1">Start your photo collage</h3>
            <p className="text-sm text-muted-foreground">Drag and drop or click to choose photos from your device</p>
          </div>
        ) : (
          <div
            onDrop={handleDrop}
            onDragOver={(e) => {
              e.preventDefault()
              setIsDragging(true)
            }}
            onDragLeave={() => setIsDragging(false)}
            className={`${layoutClasses[layout]} ${isDragging ? "ring-2 ring-primary rounded-lg" : ""}`}
          >
            {photos.map((photo, index) => {
              const isFeatured = layout === "featured" && index === 0
              return (
                <div
                  key={photo.id}
                  className={`group relative overflow-hidden rounded-lg border bg-card break-inside-avoid ${
                    isFeatured ? "col-span-2 row-span-2 sm:col-span-2" : ""
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.url || "/placeholder.svg"}
                    alt={photo.caption || `Collage photo ${index + 1}`}
                    className={`w-full object-cover ${
                      layout === "masonry" ? "" : isFeatured ? "h-full min-h-56" : "h-40"
                    }`}
                    onError={(e) => {
                      e.currentTarget.src = "/placeholder.svg?height=200&width=200"
                    }}
                  />

                  {/* Controls overlay */}
                  <div className="absolute inset-0 flex flex-col justify-between bg-gradient-to-t from-black/60 via-transparent to-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                    <div className="flex justify-end p-1">
                      <Button
                        size="icon"
                        variant="destructive"
                        className="h-7 w-7 rounded-full"
                        onClick={() => removePhoto(photo.id)}
                        aria-label="Remove photo"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex items-center justify-center gap-2 p-1">
                      <Button
                        size="icon"
                        variant="secondary"
                        className="h-7 w-7 rounded-full"
                        onClick={() => movePhoto(index, -1)}
                        disabled={index === 0}
                        aria-label="Move left"
                      >
                        <ArrowLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="secondary"
                        className="h-7 w-7 rounded-full"
                        onClick={() => movePhoto(index, 1)}
                        disabled={index === photos.length - 1}
                        aria-label="Move right"
                      >
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Caption */}
                  <input
                    value={photo.caption}
                    onChange={(e) => updateCaption(photo.id, e.target.value)}
                    placeholder="Add a caption..."
                    className="w-full border-t bg-card px-2 py-1.5 text-xs text-foreground outline-none placeholder:text-muted-foreground focus:bg-muted"
                  />
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
