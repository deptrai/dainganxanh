import { NextRequest, NextResponse } from "next/server";
import https from "https";

const GO2RTC_URL = process.env.NEXT_PUBLIC_GO2RTC_URL || "https://stream.dainganxanh.com.vn";

// Server-side probe — bypasses browser SSL cert restrictions
export async function GET(request: NextRequest) {
    const stream = request.nextUrl.searchParams.get("stream") || "farm";

    try {
        // Use node https agent that accepts self-signed certs (dev/staging only)
        const agent = GO2RTC_URL.startsWith("https")
            ? new https.Agent({ rejectUnauthorized: false })
            : undefined;

        // Check if stream config exists
        const streamsRes = await fetch(`${GO2RTC_URL}/api/streams`, {
            // @ts-expect-error node fetch agent
            agent,
            signal: AbortSignal.timeout(5000),
            next: { revalidate: 0 },
        });

        if (!streamsRes.ok) return NextResponse.json({ online: false, streaming: false });

        const streams = await streamsRes.json();
        const streamData = streams[stream];
        if (!streamData) return NextResponse.json({ online: false, streaming: false });

        // Try to grab a single frame — the only reliable way to know if the RTSP source is alive
        const frameRes = await fetch(`${GO2RTC_URL}/api/frame.jpeg?src=${stream}`, {
            // @ts-expect-error node fetch agent
            agent,
            signal: AbortSignal.timeout(8000),
            next: { revalidate: 0 },
        });

        const isStreaming = frameRes.ok && Number(frameRes.headers.get("content-length") || "0") > 0;

        return NextResponse.json({ online: true, streaming: isStreaming });
    } catch {
        return NextResponse.json({ online: false, streaming: false });
    }
}
