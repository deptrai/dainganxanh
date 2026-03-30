---
stepsCompleted: [1, 2]
inputDocuments: []
workflowType: 'research'
lastStep: 1
research_type: 'technical'
research_topic: 'Camera Streaming for Outdoor Farm Monitoring'
research_goals: 'Evaluate technical options for live/recorded camera streaming of tree farms for the Đại Ngàn Xanh platform'
user_name: 'Luisphan'
date: '2026-03-26'
web_research_enabled: true
source_verification: true
---

# Research Report: Technical — Camera Streaming for Outdoor Farm Monitoring

**Date:** 2026-03-26
**Author:** Luisphan
**Research Type:** Technical

---

## Technical Research Scope Confirmation

**Research Topic:** Camera Streaming for Outdoor Farm Monitoring
**Research Goals:** Evaluate technical options for live/recorded camera streaming of tree farms for the Đại Ngàn Xanh platform

**Technical Research Scope:**
- Architecture Analysis — streaming protocols, server architecture, CDN
- Implementation Approaches — hardware → ingest → transcode → deliver → embed
- Technology Stack — camera hardware, streaming servers, player libs
- Integration Patterns — Next.js CRM embed, auth, recording/VOD
- Performance & Cost — latency, bandwidth, scaling, pricing

**Scope Confirmed:** 2026-03-26

---

## Technology Stack Analysis

### Streaming Protocols

| Protocol | Latency | Browser Support | Scalability | Use Case |
|---|---|---|---|---|
| **WebRTC** | < 200–500ms | Native (Chrome/Firefox/Safari/Edge) | Needs SFU to scale | Real-time IoT monitoring, interactive |
| **RTSP** | 1–3s | ❌ None — needs proxy | Poor (1-to-few) | IP camera native, AI inference pipeline |
| **RTMP** | 3–5s | ❌ None (Flash dead) | Medium | Ingest only (camera → server) |
| **LL-HLS** | 2–6s | Excellent (HTTP/CDN) | Excellent (CDN) | Broadcast, many concurrent viewers |
| **HLS/DASH** | 15–30s | Excellent | Excellent | VOD, non-latency-critical live |

**Key insight:** RTSP is native to all IP cameras but has zero browser support. The dominant pattern for IoT farm monitoring is: **Camera (RTSP) → MediaMTX/go2rtc → WebRTC viewer in browser** for real-time, or **→ LL-HLS → CDN** for scalable broadcast.

_Source: [Flussonic — Video Streaming Protocols 2024](https://flussonic.com/blog/news/best-video-streaming-protocols) · [nanocosmos — WebRTC Latency 2026](https://www.nanocosmos.net/blog/webrtc-latency/) · [ZedIoT — RTSP vs WebRTC for IoT](https://zediot.com/blog/rtsp-vs-webrtc/)_

---

### Streaming Servers & Frameworks

#### Open-Source (Self-Hosted)

**MediaMTX** ⭐ _Recommended for farm IoT_
- GitHub: [bluenviron/mediamtx](https://github.com/bluenviron/mediamtx) — 12k+ stars
- License: **MIT** (commercial-friendly)
- Language: **Go** — single binary, zero dependencies, runs on Raspberry Pi/ARM
- Protocols: RTSP, RTMP, SRT, WebRTC, LL-HLS, MPEG-TS, RTP — converts between all of them
- Key feature: **RTSP → WebRTC conversion** with near-zero CPU overhead (copy mode)
- Native Raspberry Pi Camera support; REST API for management
- Recording to MP4; Docker-ready; ideal for edge deployment on farm

**go2rtc**
- GitHub: [AlexxIT/go2rtc](https://github.com/AlexxIT/go2rtc) — universal streaming gateway
- Best-in-class RTSP/RTMP → WebRTC conversion, extremely low latency
- Popular in Home Assistant/IoT community

**SRS (Simple Realtime Server)**
- GitHub: [ossrs/srs](https://github.com/ossrs/srs) — 25k+ stars
- RTMP/HLS/WebRTC/SRT; Kubernetes-native; cluster support
- More complex than MediaMTX but better for large-scale deployments

**LiveKit** (WebRTC SFU) ⭐ _Recommended if multiple concurrent viewers needed_
- GitHub: [livekit/livekit](https://github.com/livekit/livekit) — 13k+ stars
- License: **Apache 2.0**; written in Go (Pion WebRTC)
- Horizontal scaling via Redis cluster; managed cloud tier available (livekit.io)
- 2025: Added **Agents 1.0** AI framework; < 200ms latency
- Best developer experience among SFU options; full SDK (Web/iOS/Android)

| | LiveKit | Mediasoup | Janus |
|---|---|---|---|
| License | Apache 2.0 | ISC | LGPL |
| Language | Go | Node.js+C++ | C |
| Horizontal Scale | ✅ Good | ❌ Vertical only | ✅ Good |
| Latency | < 200ms | < 100ms | < 200ms |
| Setup Complexity | Low | High | Medium |
| WHIP/WHEP | ✅ | Partial | ✅ |

**Ant Media Server** (all-in-one alternative)
- Community Edition: Apache 2.0 (free self-hosted); Enterprise: ~$99/month
- Sub-0.5s WebRTC latency; RTSP ingest native; built-in transcoding
- Good if you want everything in one server without coding SFU logic

_Source: [MediaMTX GitHub](https://github.com/bluenviron/mediamtx) · [LiveKit Docs](https://docs.livekit.io/) · [go2rtc](https://github.com/AlexxIT/go2rtc) · [BlogGeek — OSS WebRTC Servers 2024](https://bloggeek.me/webrtc-open-source-media-servers-github-2024/)_

---

### Camera Hardware

#### 4G/Solar Outdoor Cameras — Comparison

| Camera | Resolution | Battery | Solar | 4G | RTSP | ONVIF | Price (USD) |
|---|---|---|---|---|---|---|---|
| **Reolink Go PT Ultra** | **4K/8MP** | ~5–7 days | 6W panel | ✅ | ✅ | ✅ | ~$150–200 |
| **Hikvision DS-2XS2T47G0** | **4MP ColorVu** | 5 days (rain) | Built-in | ✅ | ✅ | Profile S/T | ~$200–300 |
| **Milesight 4G Solar** | **4MP** | 8–10 days (no sun) | 80W panel | ✅ | ✅ | ✅ | ~$300–500 |
| **eufy 4G LTE S330** | **4K** | ~1 month | Available | ✅ | Limited | ❌ | ~$200 |
| **Vosker VKX** | 1080p | **6 months** | ✅ | ✅ | Limited | ❌ | ~$200 |

**For Đại Ngàn Xanh forest environment:**
- **Best value:** Reolink Go PT Ultra — 4K, PTZ (355° pan/140° tilt), RTSP, ONVIF, solar, ~$150
- **Best AI edge:** Milesight 4G Solar — 26 TOPS onboard AI, 80W solar, 10 days no-sun
- **Best enterprise:** Hikvision DS-2XS series — full ONVIF Profile T, proven in harsh environments

**ONVIF Profiles:**
- **Profile S** — live streaming + PTZ control (most common)
- **Profile G** — onboard recording/playback
- **Profile T** — H.265, HTTPS, motion analytics events
- Verify compliance at [onvif.org/conformant-products](https://www.onvif.org/conformant-products/)

**4G Coverage Vietnam:**
- **Viettel** is mandatory for forest/remote areas — military-origin, reaches border regions, Tây Nguyên
- Require cameras supporting **Band 28 (700MHz)** — best penetration through dense forest
- Actual uplink in remote areas: 15–25 Mbps (sufficient for 4–5 cameras at 1080p H.265)

**Bandwidth per camera:**

| Resolution | Codec | Bitrate | Daily data (24/7) |
|---|---|---|---|
| 1080p 15fps | H.264 | 2–3 Mbps | ~27 GB |
| 1080p 15fps | **H.265** | **1–1.5 Mbps** | **~13 GB** |
| 720p 15fps | H.265 | 500–800 Kbps | **~5–8 GB** |
| Event-based only | H.265 | — | **~50–100 MB** |

> Use **H.265 + event-triggered streaming** (motion detection) to cut data usage by 95%.

_Source: [Reolink Go PT Ultra Review](https://www.outdoortechlab.com/reolink-go-pt-ultra-review/) · [Milesight Launch 2024](https://www.milesight.com/company/news/4g-solar-powered-camera-series-official-launch) · [Vietnam 4G Coverage](https://govnsim.com/vinaphone-coverage-vietnam-2025-4g-5g-prices-comparisons/)_

---

### Next.js Player Integration

**Recommended stack for Next.js App Router:**

```tsx
// All video players MUST be 'use client' — they use useEffect, useRef, window APIs
'use client';
import Hls from 'hls.js';
import { useEffect, useRef } from 'react';

export function FarmStreamPlayer({ hlsUrl }: { hlsUrl: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (Hls.isSupported()) {
      const hls = new Hls({ lowLatencyMode: true, liveSyncDurationCount: 3 });
      hls.loadSource(hlsUrl);
      hls.attachMedia(video);
      return () => hls.destroy();
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = hlsUrl; // Safari native HLS
    }
  }, [hlsUrl]);

  return <video ref={videoRef} autoPlay muted playsInline controls />;
}
```

**Library options:**

| Library | Bundle | Use Case |
|---|---|---|
| `hls.js` (direct) | ~300KB | Best control, HLS live stream |
| `video.js` + VHS (built-in v7+) | ~400KB | Plugin ecosystem, UI/UX |
| `react-player` | ~300KB | Multiple source types |
| `@mux/mux-player-react` | ~100KB | Mux-managed streams |
| `@cloudflare/stream-react` | Small | Cloudflare Stream |
| WebRTC + `@livekit/components-react` | — | Sub-200ms live |

**Auth-gated video patterns:**
1. **HLS.js `xhrSetup`** — inject Bearer token in headers (doesn't work on Safari native)
2. **Signed JWT URL** — append `?token=xxx` to HLS URL (works everywhere including Safari)
3. **Managed signed tokens** — Mux `signPlaybackToken()`, Cloudflare Stream signed tokens

**Important:** Always use `dynamic(() => import(...), { ssr: false })` or lazy `import('hls.js')` inside `useEffect` to avoid SSR errors.

_Source: [LogRocket — HLS.js in Next.js](https://blog.logrocket.com/next-js-real-time-video-streaming-hls-js-alternatives/) · [Mux Next.js Guide](https://www.mux.com/video-for/next-js) · [VideoSDK HLS.js 2025](https://www.videosdk.live/developer-hub/hls/hls-js)_

---

### Cloud Infrastructure & Cost

#### Managed Platforms

| Platform | Latency | Pricing Model | 10-cam 24/7 Cost/month |
|---|---|---|---|
| **Cloudflare Stream** | 2–5s HLS | $5/1k min stored + $1/1k min delivered | **~$6,500** 💸 |
| **AWS IVS** (Singapore) | 2–3s low-latency | $0.85/channel-hour + egress | **~$13,000** 💸 |
| **Mux** | 2–5s LL-HLS | $0.032/min encoding | **~$14,000** 💸 |
| **Self-hosted VPS + CDN** | 2–5s HLS | Fixed VPS + storage | **$200–400** ✅ |

> **Managed platforms are cost-prohibitive for 24/7 continuous farm monitoring.** They are designed for event-based or on-demand content, not always-on IoT streams.

#### Recommended Self-Hosted Architecture

```
[IP Camera RTSP/H.265]
        ↓ 4G (Viettel Band 28)
[MediaMTX on VPS Singapore/HCM]  ← copy mode, ~0% CPU overhead
   ├── → WebRTC viewer (< 500ms latency)    for real-time
   ├── → LL-HLS segments                    for dashboard
   └── → Record MP4 → Cloudflare R2         for archive
        ↓
[Cloudflare CDN] ← free egress via R2, PoP in HN + HCM
        ↓
[Next.js CRM — HLS.js or WebRTC player]
```

**Cost estimate — 10 cameras, 24/7, 720p H.265:**

| Item | Cost/month |
|---|---|
| VPS 4 vCPU/8GB (DigitalOcean Singapore) | $48 |
| Cloudflare R2 storage (recordings ~6TB) | $90 |
| Egress from VPS | $60–100 |
| Cloudflare CDN delivery | **Free** |
| **Total** | **~$200–250/month** |

_Source: [Cloudflare Stream Pricing](https://developers.cloudflare.com/stream/pricing/) · [AWS IVS Pricing](https://aws.amazon.com/ivs/pricing/) · [MediaMTX GitHub](https://github.com/bluenviron/mediamtx) · [Mux Pricing](https://www.mux.com/pricing)_

---

### Technology Adoption Trends (2025–2026)

- **WebRTC WHIP/WHEP** standard emerging — simplifies ingest/playback APIs (LiveKit, Janus, OBS support)
- **LL-HLS** replacing standard HLS as default for live streaming — latency down from 30s to 2–4s
- **H.265/HEVC** becoming camera default — ~50% bandwidth saving vs H.264
- **Edge AI cameras** (26+ TOPS) eliminating need for separate inference server — detect events at camera
- **Media over QUIC (MOQ)** — emerging sub-WebRTC latency protocol, still nascent (2025–2026)
- **Solar + 4G cameras** maturing — 80W panel + 10-day battery covers most farm deployment scenarios

_Source: [nanocosmos — WebRTC Latency 2026](https://www.nanocosmos.net/blog/webrtc-latency/) · [Milesight 2024 Launch](https://www.milesight.com/company/news/4g-solar-powered-camera-series-official-launch)_
