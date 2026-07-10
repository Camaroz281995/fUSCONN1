"use client"

import { useState } from "react"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { formatDate } from "@/lib/utils"
import { MapPin, MessageSquare, Share2, Flag, ExternalLink } from 'lucide-react'
import type { MarketplaceListing } from "@/lib/types"

interface MarketplaceListingProps {
  listing: MarketplaceListing
}

export default function MarketplaceListing({ listing }: MarketplaceListingProps) {
  const [showContactDialog, setShowContactDialog] = useState(false)

  return (
    <Card className="overflow-hidden">
      <div className="aspect-square bg-muted relative">
        <img
          src={listing.imageUrl || "/placeholder.svg?height=400&width=400"}
          alt={listing.title}
          className="w-full h-full object-cover"
          onError={(e) => {
            console.error("Listing image load error:", e)
            e.currentTarget.src = "/placeholder.svg?height=400&width=400&text=Image+Not+Available"
          }}
        />
        <Badge className="absolute top-2 right-2">${listing.price.toFixed(2)}</Badge>
      </div>

      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-bold text-lg">{listing.title}</h3>
            <p className="text-sm text-muted-foreground flex items-center">
              <MapPin className="h-3 w-3 mr-1" />
              {listing.location}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="py-2">
        <p className="text-sm line-clamp-3">{listing.description}</p>

        <div className="flex items-center mt-3">
          <Avatar className="h-6 w-6 mr-2">
            <AvatarFallback>{listing.sellerUsername.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-xs font-medium">{listing.sellerUsername}</p>
            <p className="text-xs text-muted-foreground">{formatDate(listing.timestamp)}</p>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex justify-between pt-2">
        <Button variant="default" size="sm" onClick={() => setShowContactDialog(true)}>
          <MessageSquare className="h-4 w-4 mr-1" />
          Contact
        </Button>

        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Share2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Flag className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>

      <Dialog open={showContactDialog} onOpenChange={setShowContactDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Contact Seller</DialogTitle>
            <DialogDescription>Contact information for {listing.title}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex items-center">
              <Avatar className="h-10 w-10 mr-3">
                <AvatarFallback>{listing.sellerUsername.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <h4 className="font-medium">{listing.sellerUsername}</h4>
                <p className="text-sm text-muted-foreground">Member since {formatDate(listing.sellerJoinDate)}</p>
              </div>
            </div>

            <div className="border rounded-md p-3 space-y-2">
              <p className="text-sm font-medium">Contact Information</p>
              {listing.contactPhone && <p className="text-sm">Phone: {listing.contactPhone}</p>}
              {listing.contactEmail && <p className="text-sm">Email: {listing.contactEmail}</p>}
              {listing.contactAddress && <p className="text-sm">Address: {listing.contactAddress}</p>}
            </div>

            <div className="text-sm text-muted-foreground">
              <p>
                Note: Fusion Connect is not responsible for transactions. Please exercise caution when making purchases.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowContactDialog(false)}>
              Close
            </Button>
            <Button>
              <ExternalLink className="h-4 w-4 mr-1" />
              Message Seller
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
