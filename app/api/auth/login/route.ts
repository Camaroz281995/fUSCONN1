import { NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

export async function POST(request: NextRequest) {
  const dbUrl = process.env.fusconn_DATABASE_URL_UNPOOLED || process.env.fusconn_DATABASE_URL || process.env.fusconn_POSTGRES_URL
  if (!dbUrl) {
    return NextResponse.json({ error: "Database not configured" }, { status: 500 })
  }
  const sql = neon(dbUrl)
  try {
    const { username, password } = await request.json()

    // Validation
    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      )
    }

    // Find user
    const users = await sql`
      SELECT username, password_hash, full_name, bio, profile_photo
      FROM users
      WHERE username = ${username}
    `

    if (users.length === 0) {
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 }
      )
    }

    const user = users[0]

    if (user.password_hash !== password) {
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 }
      )
    }

    // Update last_login
    await sql`UPDATE users SET last_login = NOW() WHERE username = ${username}`

    return NextResponse.json(
      {
        success: true,
        message: "Login successful",
        username: user.username,
        fullName: user.full_name,
        bio: user.bio,
        profilePhoto: user.profile_photo,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
