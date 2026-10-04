```typescript
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file")

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      )
    }

    // 50 MB maximum upload size
    const maxSize = 50 * 1024 * 1024

    if (file.size > maxSize) {
      return NextResponse.json(
        {
          error: "File is too large. Maximum size is 50MB.",
        },
        {
          status: 400,
        }
      )
    }

    const isImage = file.type.startsWith("image/")
    const isVideo = file.type.startsWith("video/")

    if (!isImage && !isVideo) {
      return NextResponse.json(
        {
          error: "Only images and videos are supported.",
        },
        {
          status: 400,
        }
      )
    }

    // Convert the uploaded file to a Base64 data URL.
    // This removes the need for Cloudinary or another
    // external media-storage service.
    const bytes = await file.arrayBuffer()
    const base64 = Buffer.from(bytes).toString("base64")

    const dataUrl = `data:${file.type};base64,${base64}`

    return NextResponse.json({
      success: true,
      url: dataUrl,
      resourceType: isVideo ? "video" : "image",
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
    })
  } catch (error) {
    console.error("Media upload error:", error)

    return NextResponse.json(
      {
        error: "Failed to upload media",
      },
      {
        status: 500,
      }
    )
  }
}
```
