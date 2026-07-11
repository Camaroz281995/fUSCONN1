import { NextRequest, NextResponse } from "next/server"
import { getDB } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const sql = getDB()

    const {
      username,
      title,
      description,
    } = await request.json()

    if (!username) {
      return NextResponse.json(
        { error: "Username required" },
        { status: 400 }
      )
    }

    const id = `live_${Date.now()}`
    const now = Date.now()

    await sql`
      INSERT INTO live_streams
      (
        id,
        host_username,
        title,
        description,
        status,
        started_at
      )
      VALUES
      (
        ${id},
        ${username},
        ${title || "Live Stream"},
        ${description || ""},
        'live',
        ${now}
      )
    `

    return NextResponse.json({
      success: true,
      streamId: id
    })

  } catch (error) {
    console.error(error)

    return NextResponse.json(
      { error: "Failed to start stream" },
      { status:500 }
    )
  }
}
