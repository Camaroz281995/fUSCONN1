import { NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

export async function POST(request: NextRequest) {

  const dbUrl =
    process.env.fUSCONN_DATABASE_URL ||
    process.env.fUSCONN_POSTGRES_URL ||
    process.env.fUSCONN_POSTGRES_URL_NON_POOLING


  if (!dbUrl) {

    return NextResponse.json(
      {
        error: "Database not configured"
      },
      {
        status: 500
      }
    )

  }


  const sql = neon(dbUrl)


  try {

    const {
      username,
      password
    } = await request.json()



    if (!username || !password) {

      return NextResponse.json(
        {
          error:
            "Username and password are required"
        },
        {
          status: 400
        }
      )

    }



    const users = await sql`

      SELECT
        id,
        username,
        password_hash,
        full_name,
        bio,
        profile_photo

      FROM users

      WHERE username = ${username}

    `



    if (users.length === 0) {

      return NextResponse.json(
        {
          error:
            "Invalid username or password"
        },
        {
          status: 401
        }
      )

    }



    const user = users[0]



    if (user.password_hash !== password) {

      return NextResponse.json(
        {
          error:
            "Invalid username or password"
        },
        {
          status: 401
        }
      )

    }



    await sql`

      UPDATE users

      SET last_login = NOW()

      WHERE id = ${user.id}

    `



    console.log(
      "User logged in:",
      {
        id: user.id,
        username: user.username
      }
    )



    return NextResponse.json(

      {

        success: true,

        message:
          "Login successful",


        user: {

          id: user.id,

          username:
            user.username,

          fullName:
            user.full_name,

          bio:
            user.bio,

          profilePhoto:
            user.profile_photo

        }

      },

      {
        status: 200
      }

    )


  } catch (error) {


    console.error(
      "Login error:",
      error
    )


    return NextResponse.json(

      {
        error:
          "Internal server error"
      },

      {
        status: 500
      }

    )

  }

}
