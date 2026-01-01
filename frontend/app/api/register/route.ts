import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData()

        // Proxy to Flask API
        // Note: Assuming Flask runs on http://127.0.0.1:5000
        const flaskRes = await fetch("http://127.0.0.1:5001/register", {
            method: "POST",
            body: formData,
            // We don't need to set Content-Type for FormData, fetch does it automatically
        })

        const data = await flaskRes.json()

        return NextResponse.json(data, { status: flaskRes.status })

    } catch (error) {
        console.error("Registration error:", error)
        return NextResponse.json(
            { error: "Internal server error. Is Flask running?" },
            { status: 500 }
        )
    }
}
