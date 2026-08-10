import { NextRequest, NextResponse } from "next/server"
import { v2 as cloudinary } from "cloudinary"

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

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
        { error: "File is too large. Maximum size is 50MB." },
        { status: 400 }
      )
    }

    const isImage = file.type.startsWith("image/")
    const isVideo = file.type.startsWith("video/")

    if (!isImage && !isVideo) {
      return NextResponse.json(
        { error: "Only images and videos are supported." },
        { status: 400 }
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const resourceType = isVideo ? "video" : "image"

    const result = await new Promise<{
      secure_url: string
      public_id: string
      resource_type: string
    }>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "fusconn/posts",
          resource_type: resourceType,
        },
        (error, result) => {
          if (error) {
            reject(error)
          } else if (result) {
            resolve({
              secure_url: result.secure_url,
              public_id: result.public_id,
              resource_type: result.resource_type,
            })
          } else {
            reject(new Error("Cloudinary returned no result"))
          }
        }
      )

      uploadStream.end(buffer)
    })

    return NextResponse.json({
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      resourceType: result.resource_type,
    })
  } catch (error) {
    console.error("Cloudinary upload error:", error)

    return NextResponse.json(
      { error: "Failed to upload media" },
      { status: 500 }
    )
  }
}
