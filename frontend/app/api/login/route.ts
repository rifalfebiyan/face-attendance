import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData()

        // Proxy to Flask API
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5001"
        const flaskRes = await fetch(`${apiUrl}/login`, {
            method: "POST",
            body: formData,
            headers: {
                "ngrok-skip-browser-warning": "true"
            }
        })

        const data = await flaskRes.json()

        if (!flaskRes.ok) {
            return NextResponse.json(
                { error: data.error || "Login failed" },
                { status: flaskRes.status }
            )
        }

        // Create response with success data
        const response = NextResponse.json(data, { status: 200 })

        // Set auth token in cookie
        // Note: In a real app, the backend should ideally return a JWT or session ID.
        // For this demo/task, we'll assume a successful login is enough to set a flag,
        // or if the backend returns a token, we store it.
        // If data.token exists, use it. Otherwise, set a dummy 'authenticated' token.

        const token = data.token || "authenticated"

        // Wait for cookies()
        const cookieStore = await cookies()
        cookieStore.set("auth_token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            // 7 days
            maxAge: 60 * 60 * 24 * 7
        })

        return response

    } catch (error) {
        console.error("Login error:", error)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}
