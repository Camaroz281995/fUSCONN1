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

    const { communityId, username } = await request.json()

    if (!communityId || !username) {
      return NextResponse.json(
        { error: "Community ID and username required" },
        { status: 400 }
      )
    }

    const existing = await sql`
      SELECT 1
      FROM profile_community_members
      WHERE community_id = ${communityId}
      AND username = ${username}
    `

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "Already a member" },
        { status: 400 }
      )
    }

    await sql`
      INSERT INTO profile_community_members (
        community_id,
        username
      )
      VALUES (
        ${communityId},
        ${username}
      )
    `

    return NextResponse.json(
      { success: true }
    )

  } catch (error) {
    console.error("Error joining community:", error)

    return NextResponse.json(
      { error: "Failed to join community" },
      { status: 500 }
    )
  }
}
