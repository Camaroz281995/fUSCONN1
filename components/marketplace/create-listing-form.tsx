"use client"

import type React from "react"

import { useState } from "react"
import { useUser } from "@/context/user-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, DollarSign, MapPin, Phone, Mail, Home } from "lucide-react"
import PhotoUploadField from "@/components/photo/photo-upload-field"
import { generateId } from "@/lib/utils"
import { persistentStorage } from "@/lib/persistent-storage"
import type { MarketplaceListing } from "@/lib/types"

interface CreateListingFormProps {
  onListingCreated: () => void
}

const CATEGORIES = [
  "Electronics",
  "Furniture",
  "Clothing",
  "Books",
  "Sports",
  "Collectibles",
  "Vehicles",
  "Real Estate",
  "Services",
  "Other",
]

export default function CreateListingForm({ onListingCreated }: CreateListingFormProps) {
  const { username } = useUser()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [price, setPrice] = useState("")
  const [category, setCategory] = useState("")
  const [location, setLocation] = useState("")
  const [contactPhone, setContactPhone] = useState("")
  const [contactEmail, setContactEmail] = useState("")
  const [contactAddress, setContactAddress] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const handlePhotoUploaded = (url: string) => {
    setImageUrl(url)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!username) {
      setError("Please set your username in the Profile tab")
      return
    }

    if (!title.trim()) {
      setError("Title is required")
      return
    }

    if (!description.trim()) {
      setError("Description is required")
      return
    }

    if (!price.trim() || isNaN(Number.parseFloat(price))) {
      setError("Valid price is required")
      return
    }

    if (!category) {
      setError("Category is required")
      return
    }

    if (!location.trim()) {
      setError("Location is required")
      return
    }

    if (!contactPhone.trim() && !contactEmail.trim() && !contactAddress.trim()) {
      setError("At least one contact method is required")
      return
    }

    if (!imageUrl) {
      setError("Please upload an image for your listing")
      return
    }

    try {
      setIsSubmitting(true)
      setError("")
      setSuccess(false)

      const listing: MarketplaceListing = {
        id: generateId(),
        title,
        description,
        price: Number.parseFloat(price),
        category,
        location,
        imageUrl,
        sellerUsername: username,
        sellerJoinDate: Date.now() - 30 * 24 * 60 * 60 * 1000, // Mock join date (30 days ago)
        timestamp: Date.now(),
        contactPhone: contactPhone.trim() || null,
        contactEmail: contactEmail.trim() || null,
        contactAddress: contactAddress.trim() || null,
        status: "active",
      }

      // Save to persistent storage
      persistentStorage.saveMarketplaceListing(listing)

      setSuccess(true)

      // Reset form after a short delay
      setTimeout(() => {
        setTitle("")
        setDescription("")
        setPrice("")
        setCategory("")
        setLocation("")
        setContactPhone("")
        setContactEmail("")
        setContactAddress("")
        setImageUrl("")
        setSuccess(false)
        onListingCreated()
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Listing</CardTitle>
        <CardDescription>List an item or service for sale</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="listing-title">Title</Label>
            <Input
              id="listing-title"
              placeholder="What are you selling?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="listing-description">Description</Label>
            <Textarea
              id="listing-description"
              placeholder="Describe your item or service"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              disabled={isSubmitting}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="listing-price">Price ($)</Label>
              <div className="relative">
                <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="listing-price"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  disabled={isSubmitting}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="listing-category">Category</Label>
              <Select value={category} onValueChange={setCategory} disabled={isSubmitting}>
                <SelectTrigger id="listing-category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="listing-location">Location</Label>
            <div className="relative">
              <MapPin className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="listing-location"
                placeholder="City, State"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                disabled={isSubmitting}
                className="pl-8"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Contact Information (at least one required)</Label>
            <div className="space-y-2">
              <div className="relative">
                <Phone className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Phone number"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  disabled={isSubmitting}
                  className="pl-8"
                />
              </div>
              <div className="relative">
                <Mail className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Email address"
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  disabled={isSubmitting}
                  className="pl-8"
                />
              </div>
              <div className="relative">
                <Home className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Address (optional)"
                  value={contactAddress}
                  onChange={(e) => setContactAddress(e.target.value)}
                  disabled={isSubmitting}
                  className="pl-8"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Listing Image</Label>
            <PhotoUploadField onPhotoUploaded={handlePhotoUploaded} />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4 mr-2" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="bg-green-50 border-green-200 text-green-800">
              <AlertDescription>Listing created successfully!</AlertDescription>
            </Alert>
          )}
        </form>
      </CardContent>
      <CardFooter>
        <Button type="submit" disabled={isSubmitting || !username} className="w-full" onClick={handleSubmit}>
          {isSubmitting ? "Creating..." : "Create Listing"}
        </Button>
      </CardFooter>
    </Card>
  )
}
