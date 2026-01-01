import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData()

        // Proxy to Flask API
        const flaskRes = await fetch("http://127.0.0.1:5001/verify", {
            method: "POST",
            body: formData
        })

        const data = await flaskRes.json()
        return NextResponse.json(data, { status: flaskRes.status })

    } catch (error) {
        console.error("Verification error:", error)
        return NextResponse.json(
            { error: "Internal server error. Is Flask running?" },
            { status: 500 }
        )
    }
}
