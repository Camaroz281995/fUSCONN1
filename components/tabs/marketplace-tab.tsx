"use client"

import { useState, useEffect } from "react"
import { useUser } from "@/context/user-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, Tag, MapPin } from "lucide-react"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import MarketplaceListing from "@/components/marketplace/marketplace-listing"
import CreateListingForm from "@/components/marketplace/create-listing-form"
import { persistentStorage } from "@/lib/persistent-storage"
import type { MarketplaceListing as MarketplaceListingType } from "@/lib/types"

export default function MarketplaceTab() {
  const { username } = useUser()
  const [listings, setListings] = useState<MarketplaceListingType[]>([])
  const [filteredListings, setFilteredListings] = useState<MarketplaceListingType[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("browse")
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")
  const [locationFilter, setLocationFilter] = useState("")
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  const fetchListings = async () => {
    try {
      setLoading(true)

      // Get listings from persistent storage
      const allListings = persistentStorage.getMarketplaceListings()
      setListings(allListings)

      // Apply initial filtering
      filterListings(allListings)
    } catch (error) {
      console.error("Error fetching marketplace listings:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchListings()

    // Refresh listings every 60 seconds
    const interval = setInterval(fetchListings, 60000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    filterListings(listings)
  }, [listings, searchQuery, categoryFilter, locationFilter, activeTab])

  const filterListings = (allListings: MarketplaceListingType[]) => {
    let filtered = [...allListings]

    // Filter by tab
    if (activeTab === "my-listings" && username) {
      filtered = filtered.filter((listing) => listing.sellerUsername === username)
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (listing) => listing.title.toLowerCase().includes(query) || listing.description.toLowerCase().includes(query),
      )
    }

    // Apply category filter
    if (categoryFilter) {
      filtered = filtered.filter((listing) => listing.category === categoryFilter)
    }

    // Apply location filter
    if (locationFilter) {
      filtered = filtered.filter((listing) => listing.location.toLowerCase().includes(locationFilter.toLowerCase()))
    }

    setFilteredListings(filtered)
  }

  const handleListingCreated = () => {
    setShowCreateDialog(false)
    fetchListings()
  }

  // Get unique categories and locations for filters
  const categories = [...new Set(listings.map((listing) => listing.category))].sort()
  const locations = [...new Set(listings.map((listing) => listing.location))].sort()

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-220px)]">
      {/* Filters */}
      <Card className="md:col-span-1 h-full">
        <CardHeader className="px-4 py-3">
          <CardTitle className="text-lg flex justify-between items-center">
            <span>Marketplace</span>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-1" />
                  Sell
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <CreateListingForm onListingCreated={handleListingCreated} />
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Tabs defaultValue="browse" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="browse">Browse</TabsTrigger>
              <TabsTrigger value="my-listings">My Listings</TabsTrigger>
            </TabsList>

            <div className="p-4 space-y-4">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search listings..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center">
                  <Tag className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="text-sm">Category</span>
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="text-sm">Location</span>
                </div>
                <Select value={locationFilter} onValueChange={setLocationFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All locations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All locations</SelectItem>
                    {locations.map((location) => (
                      <SelectItem key={location} value={location}>
                        {location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    setSearchQuery("")
                    setCategoryFilter("")
                    setLocationFilter("")
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </Tabs>
        </CardContent>
      </Card>

      {/* Listings */}
      <Card className="md:col-span-2 h-full">
        <CardContent className="p-4 h-full">
          <ScrollArea className="h-[calc(100vh-250px)]">
            {loading ? (
              <div className="text-center py-8">Loading listings...</div>
            ) : filteredListings.length === 0 ? (
              <div className="text-center py-8">
                {activeTab === "my-listings" ? (
                  <div>
                    <p className="mb-4">You haven't created any listings yet</p>
                    <Button onClick={() => setShowCreateDialog(true)}>
                      <Plus className="h-4 w-4 mr-1" />
                      Create Listing
                    </Button>
                  </div>
                ) : (
                  <p>No listings found matching your filters</p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredListings.map((listing) => (
                  <MarketplaceListing key={listing.id} listing={listing} />
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
