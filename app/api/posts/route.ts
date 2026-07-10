import { NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

function getDB() {
  const url =
    process.env.fusconn_DATABASE_URL_UNPOOLED ||
    process.env.fusconn_DATABASE_URL ||
    process.env.fusconn_POSTGRES_URL

  if (!url) throw new Error("No database URL configured")

  return neon(url)
}

export async function GET() {
  try {
    const sql = getDB()

    const posts = await sql`
      SELECT
        p.*,

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
          '[]'
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
            )
            FROM comments c
            WHERE c.post_id = p.id
          ),
          '[]'
        ) AS comments

      FROM posts p
      ORDER BY p.created_at DESC
      LIMIT 50
    `

    return NextResponse.json(
      { posts },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    )

  } catch (err) {
    console.error("GET /api/posts error:", err)

    return NextResponse.json(
      { error: "Failed to fetch posts" },
      { status: 500 }
    )
  }
}


export async function POST(request: NextRequest) {
  try {
    const sql = getDB()

    const {
      username,
      content,
      imageUrl,
      videoUrl,
      gifUrl,
    } = await request.json()


    if (!username || !content?.trim()) {
      return NextResponse.json(
        {
          error: "Username and content are required",
        },
        {
          status: 400,
        }
      )
    }


    const id = `post_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 9)}`

    const createdAt = Date.now()


    await sql`
      INSERT INTO posts (
        id,
        username,
        content,
        image_url,
        video_url,
        gif_url,
        created_at
      )
      VALUES (
        ${id},
        ${username},
        ${content.trim()},
        ${imageUrl || null},
        ${videoUrl || null},
        ${gifUrl || null},
        ${createdAt}
      )
    `


    return NextResponse.json(
      {
        success: true,
        id,
      },
      {
        status: 201,
      }
    )

  } catch (err) {
    console.error("POST /api/posts error:", err)

    return NextResponse.json(
      {
        error: "Failed to create post",
      },
      {
        status: 500,
      }
    )
  }
}
