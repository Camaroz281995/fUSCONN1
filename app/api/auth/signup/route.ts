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
      email,
      password,
      fullName
    } = await request.json()



    if (!username || !email || !password || !fullName) {

      return NextResponse.json(
        {
          error: "All fields are required"
        },
        {
          status: 400
        }
      )

    }



    if (username.length < 3) {

      return NextResponse.json(
        {
          error: "Username must be at least 3 characters"
        },
        {
          status: 400
        }
      )

    }



    if (password.length < 6) {

      return NextResponse.json(
        {
          error: "Password must be at least 6 characters"
        },
        {
          status: 400
        }
      )

    }



    const existingUser = await sql`

      SELECT username
      FROM users
      WHERE username = ${username}

    `


    if (existingUser.length > 0) {

      return NextResponse.json(
        {
          error: "Username already taken"
        },
        {
          status: 400
        }
      )

    }



    const existingEmail = await sql`

      SELECT email
      FROM users
      WHERE email = ${email}

    `



    if (existingEmail.length > 0) {

      return NextResponse.json(
        {
          error: "Email already registered"
        },
        {
          status: 400
        }
      )

    }



    const newUser = await sql`

      INSERT INTO users (
        username,
        email,
        password_hash,
        full_name
      )

      VALUES (
        ${username},
        ${email},
        ${password},
        ${fullName}
      )

      RETURNING
        id,
        username,
        full_name,
        bio,
        profile_photo

    `



    const user = newUser[0]



    console.log(
      "New user created:",
      {
        id: user.id,
        username: user.username
      }
    )



    return NextResponse.json(

      {
        success: true,

        message:
          "Account created successfully",

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
        status: 201
      }

    )


  } catch (error) {

    console.error(
      "Signup error:",
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
