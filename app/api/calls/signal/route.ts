import { type NextRequest, NextResponse } from "next/server"
import { getDB, ensureSchema, newId, isBlockedBetween } from "@/lib/db"

// GET pending WebRTC signals
export async function GET(request: NextRequest) {
  try {
    await ensureSchema()

    const sql = getDB()

    const username = request.nextUrl.searchParams.get("username")
    const since = Number(request.nextUrl.searchParams.get("since") || "0")

    if (!username) {
      return NextResponse.json(
        { error: "username required" },
        { status: 400 }
      )
    }

    const signals = await sql`
      SELECT 
        id,
        from_user,
        to_user,
        call_id,
        type,
        payload,
        created_at
      FROM call_signals
      WHERE 
        to_user = ${username}
        AND created_at > ${since}
      ORDER BY created_at ASC
      LIMIT 100
    `

    const formatted = signals.map((signal: any) => ({
      id: signal.id,
      from_user: signal.from_user,
      to_user: signal.to_user,
      call_id: signal.call_id,
      type: signal.type,
      payload:
        typeof signal.payload === "string"
          ? JSON.parse(signal.payload)
          : signal.payload,
      created_at: Number(signal.created_at),
    }))

    // Remove very old signals
    await sql`
      DELETE FROM call_signals
      WHERE created_at < ${Date.now() - 1000 * 60 * 10}
    `

    return NextResponse.json({
      signals: formatted,
    })

  } catch (error) {
    console.error("GET signal error:", error)

    return NextResponse.json(
      { error: "Failed to load signals" },
      { status: 500 }
    )
  }
}


// POST new WebRTC signal
export async function POST(request: NextRequest) {
  try {
    await ensureSchema()

    const sql = getDB()

    const body = await request.json()

    const {
      fromUser,
      toUser,
      callId,
      type,
      payload,
    } = body


    if (!fromUser || !toUser || !callId || !type) {
      return NextResponse.json(
        {
          error:
            "fromUser, toUser, callId, and type are required",
        },
        {
          status: 400,
        }
      )
    }


    // Prevent blocked users from calling
    if (
      type === "offer" &&
      await isBlockedBetween(fromUser, toUser)
    ) {
      return NextResponse.json(
        {
          error: "Cannot call this user",
        },
        {
          status: 403,
        }
      )
    }


    const id = newId("signal")
    const now = Date.now()


    await sql`
      INSERT INTO call_signals
      (
        id,
        from_user,
        to_user,
        call_id,
        type,
        payload,
        created_at
      )

      VALUES
      (
        ${id},
        ${fromUser},
        ${toUser},
        ${callId},
        ${type},
        ${payload ? JSON.stringify(payload) : null},
        ${now}
      )
    `


    // Create notification for incoming call
    if (type === "offer") {

      const notificationId = newId("notif")


      await sql`
        INSERT INTO app_notifications
        (
          id,
          type,
          from_user,
          to_user,
          content,
          is_read,
          meta,
          created_at
        )

        VALUES
        (
          ${notificationId},
          'call',
          ${fromUser},
          ${toUser},
          ${`${fromUser} is calling you`},
          false,
          ${JSON.stringify({
            callId,
            callType: payload?.callType || "voice"
          })},
          ${now}
        )
      `
    }


    return NextResponse.json(
      {
        success: true,
        id,
        created_at: now,
      },
      {
        status: 201,
      }
    )


  } catch (error) {

    console.error("POST signal error:", error)

    return NextResponse.json(
      {
        error: "Failed to send signal",
      },
      {
        status: 500,
      }
    )
  }
}
