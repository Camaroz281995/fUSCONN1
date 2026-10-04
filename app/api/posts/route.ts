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

function parseDataUrl(value: unknown) {
  if (
    typeof value !== "string" ||
    !value.startsWith("data:")
  ) {
    return null
  }

  const match = value.match(
    /^data:([^;,]+);base64,(.+)$/s
  )

  if (!match) {
    return null
  }

  return {
    mimeType: match[1],
    base64: match[2],
  }
}

function dataUrlToBuffer(value: unknown) {
  const parsed = parseDataUrl(value)

  if (!parsed) {
    return null
  }

  return {
    mimeType: parsed.mimeType,
    buffer: Buffer.from(
      parsed.base64,
      "base64"
    ),
  }
}

function detectImageMime(buffer: Buffer) {
  if (
    buffer.length >= 8 &&
    buffer.subarray(0, 8).equals(
      Buffer.from([
        0x89,
        0x50,
        0x4e,
        0x47,
        0x0d,
        0x0a,
        0x1a,
        0x0a,
      ])
    )
  ) {
    return "image/png"
  }

  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return "image/jpeg"
  }

  if (
    buffer.length >= 6 &&
    buffer
      .subarray(0, 6)
      .toString("ascii")
      .startsWith("GIF")
  ) {
    return "image/gif"
  }

  if (
    buffer.length >= 12 &&
    buffer
      .subarray(0, 4)
      .toString("ascii") === "RIFF" &&
    buffer
      .subarray(8, 12)
      .toString("ascii") === "WEBP"
  ) {
    return "image/webp"
  }

  return "image/jpeg"
}

function detectVideoMime(buffer: Buffer) {
  if (
    buffer.length >= 12 &&
    buffer
      .subarray(4, 8)
      .toString("ascii") === "ftyp"
  ) {
    return "video/mp4"
  }

  if (
    buffer.length >= 4 &&
    buffer
      .subarray(0, 4)
      .equals(
        Buffer.from([
          0x1a,
          0x45,
          0xdf,
          0xa3,
        ])
      )
  ) {
    return "video/webm"
  }

  return "video/mp4"
}

export async function GET() {
  try {
    const sql = getDB()

    const posts = await sql`
      SELECT
        p.id,
        p.user_id,
        p.username,
        p.content,
        p.created_at,

        CASE
          WHEN p.image_data IS NOT NULL
          THEN
            CASE
              WHEN substring(p.image_data from 1 for 8) =
                decode('89504e470d0a1a0a', 'hex')
              THEN
                'data:image/png;base64,' ||
                encode(p.image_data, 'base64')

              WHEN substring(p.image_data from 1 for 3) =
                decode('ffd8ff', 'hex')
              THEN
                'data:image/jpeg;base64,' ||
                encode(p.image_data, 'base64')

              WHEN substring(p.image_data from 1 for 4) =
                decode('52494646', 'hex')
                AND substring(p.image_data from 9 for 4) =
                decode('57454250', 'hex')
              THEN
                'data:image/webp;base64,' ||
                encode(p.image_data, 'base64')

              ELSE
                'data:image/jpeg;base64,' ||
                encode(p.image_data, 'base64')
            END

          ELSE p.image_url
        END AS image_url,

        CASE
          WHEN p.gif_data IS NOT NULL
          THEN
            'data:image/gif;base64,' ||
            encode(p.gif_data, 'base64')

          ELSE p.gif_url
        END AS gif_url,

        CASE
          WHEN p.video_data IS NOT NULL
          THEN
            CASE
              WHEN substring(p.video_data from 5 for 4) =
                decode('66747970', 'hex')
              THEN
                'data:video/mp4;base64,' ||
                encode(p.video_data, 'base64')

              ELSE
                'data:video/webm;base64,' ||
                encode(p.video_data, 'base64')
            END

          ELSE p.video_url
        END AS video_url,

        u.username AS author_username,
        u.id AS author_id,

        COALESCE(
          (
            SELECT json_agg(
              jsonb_build_object(
                'username', pl.username
              )
            )
            FROM post_likes pl
            WHERE pl.post_id = p.id
          ),
          '[]'::json
        ) AS likes,

        COALESCE(
          (
            SELECT json_agg(
              jsonb_build_object(
                'id', c.id,
                'username', c.username,
                'content', c.content,
                'created_at', c.created_at
              )
              ORDER BY c.created_at ASC
            )
            FROM comments c
            WHERE c.post_id = p.id
          ),
          '[]'::json
        ) AS comments

      FROM posts p

      LEFT JOIN users u
        ON p.user_id = u.id

      ORDER BY p.created_at DESC

      LIMIT 50
    `

    return NextResponse.json(
      { posts },
      {
        headers: {
          "Cache-Control":
            "no-store, max-age=0",
        },
      }
    )
  } catch (error) {
    console.error(
      "GET /api/posts error:",
      error
    )

    return NextResponse.json(
      {
        error: "Failed to fetch posts",
      },
      {
        status: 500,
      }
    )
  }
}

export async function POST(
  request: NextRequest
) {
  try {
    const sql = getDB()

    const {
      userId,
      username,
      content,
      imageUrl,
      videoUrl,
      gifUrl,
    } = await request.json()

    if (!userId || !username) {
      return NextResponse.json(
        {
          error:
            "User ID and username are required",
        },
        {
          status: 400,
        }
      )
    }

    const hasContent =
      typeof content === "string" &&
      content.trim().length > 0

    const imageData =
      dataUrlToBuffer(imageUrl)

    const videoData =
      dataUrlToBuffer(videoUrl)

    const gifData =
      dataUrlToBuffer(gifUrl)

    const storedImageUrl =
      imageData ? null : imageUrl || null

    const storedVideoUrl =
      videoData ? null : videoUrl || null

    const storedGifUrl =
      gifData ? null : gifUrl || null

    const id =
      `post_${Date.now()}_${Math.random()
        .toString(36)
        .substring(2, 9)}`

    const createdAt = Date.now()

    let imageBytes: Buffer | null = null
    let videoBytes: Buffer | null = null
    let gifBytes: Buffer | null = null

    if (imageData) {
      imageBytes = imageData.buffer
    }

    if (videoData) {
      videoBytes = videoData.buffer
    }

    if (gifData) {
      gifBytes = gifData.buffer
    }

    await sql`
      INSERT INTO posts (
        id,
        user_id,
        username,
        content,
        image_url,
        video_url,
        gif_url,
        image_data,
        video_data,
        gif_data,
        created_at
      )
      VALUES (
        ${id},
        ${userId},
        ${username},
        ${hasContent
          ? content.trim()
          : ""},
        ${storedImageUrl},
        ${storedVideoUrl},
        ${storedGifUrl},
        ${imageBytes},
        ${videoBytes},
        ${gifBytes},
        ${createdAt}
      )
    `

    let cleanupResult = null

    try {
      const cleanup =
        await sql`
          SELECT *
          FROM public.cleanup_posts_by_size()
        `

      cleanupResult =
        cleanup[0] || null

      console.log(
        "fUSCONN storage check:",
        cleanupResult
      )
    } catch (cleanupError) {
      console.error(
        "fUSCONN storage cleanup check failed:",
        cleanupError
      )
    }

    return NextResponse.json(
      {
        success: true,
        id,
        cleanup: cleanupResult,
      },
      {
        status: 201,
      }
    )
  } catch (error) {
    console.error(
      "POST /api/posts error:",
      error
    )

    return NextResponse.json(
      {
        error:
          "Failed to create post",
      },
      {
        status: 500,
      }
    )
  }
}
