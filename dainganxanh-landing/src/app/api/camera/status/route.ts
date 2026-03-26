import { NextRequest, NextResponse } from "next/server";
import https from "https";

const GO2RTC_URL = process.env.NEXT_PUBLIC_GO2RTC_URL || "https://stream.dainganxanh.com.vn";

// Server-side probe — bypasses browser SSL cert restrictions
export async function GET(request: NextRequest) {
    const stream = request.nextUrl.searchParams.get("stream") || "farm";

    try {
        const apiUrl = `${GO2RTC_URL}/api/streams`;

        // Use node https agent that accepts self-signed certs (dev/staging only)
        const agent = apiUrl.startsWith("https")
            ? new https.Agent({ rejectUnauthorized: false })
            : undefined;

        const res = await fetch(apiUrl, {
            // @ts-expect-error node fetch agent
            agent,
            signal: AbortSignal.timeout(5000),
            next: { revalidate: 0 },
        });

        if (!res.ok) return NextResponse.json({ online: false });

        const data = await res.json();
        const streamData = data[stream];
        const hasProducer = streamData?.producers?.some((p: { bytes_recv?: number }) => p.bytes_recv && p.bytes_recv > 0);

        return NextResponse.json({ online: !!streamData, streaming: !!hasProducer });
    } catch {
        return NextResponse.json({ online: false });
    }
}
