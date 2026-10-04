import { NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

function getDB() {
  const url =
    process.env.fUSCONN_DATABASE_URL ||
    process.env.fUSCONN_POSTGRES_URL ||
    process.env.fUSCONN_POSTGRES_URL_NON_POOLING

  if (!url) {
    throw new Error("No database URL configured")
  }

  return neon(url)
}

export async function POST(request: NextRequest) {
  try {
    const sql = getDB()

    const formData = await request.formData()

    const file = formData.get("file")
    const postId = formData.get("postId")

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      )
    }

    if (typeof postId !== "string" || !postId.trim()) {
      return NextResponse.json(
        { error: "Post ID is required" },
        { status: 400 }
      )
    }

    // 50 MB maximum per uploaded file
    const maxSize = 50 * 1024 * 1024

    if (file.size > maxSize) {
      return NextResponse.json(
        {
          error: "File is too large. Maximum size is 50MB.",
        },
        { status: 400 }
      )
    }

    const isImage = file.type.startsWith("image/")
    const isVideo = file.type.startsWith("video/")
    const isGif = file.type === "image/gif"

    if (!isImage && !isVideo) {
      return NextResponse.json(
        {
          error: "Only images and videos are supported.",
        },
        { status: 400 }
      )
    }

    const bytes = await file.arrayBuffer()

    const buffer = new Uint8Array(bytes)

    if (isVideo) {
      await sql`
        UPDATE posts
        SET
          video_data = ${buffer},
          video_url = NULL
        WHERE id = ${postId}
      `
    } else if (isGif) {
      await sql`
        UPDATE posts
        SET
          gif_data = ${buffer},
          gif_url = NULL
        WHERE id = ${postId}
      `
    } else {
      await sql`
        UPDATE posts
        SET
          image_data = ${buffer},
          image_url = NULL
        WHERE id = ${postId}
      `
    }

    // Run the existing 450 MB cleanup function
    try {
      await sql`
        SELECT public.cleanup_posts_by_size()
      `
    } catch (cleanupError) {
      console.error(
        "fUSCONN storage cleanup check failed:",
        cleanupError
      )
    }

    return NextResponse.json({
      success: true,
      postId,
      fileSize: file.size,
      mimeType: file.type,
      resourceType: isVideo ? "video" : "image",
    })
  } catch (error) {
    console.error("Media upload error:", error)

    return NextResponse.json(
      {
        error: "Failed to store media in Neon",
      },
      { status: 500 }
    )
  }
}
