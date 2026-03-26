"use client";

import { useState, useEffect, useRef } from "react";
import { Video, VideoOff, Maximize2, RefreshCw } from "lucide-react";

interface FarmCameraProps {
    streamName?: string;
}

const GO2RTC_URL = process.env.NEXT_PUBLIC_GO2RTC_URL || "https://stream.dainganxanh.com.vn";

export default function FarmCamera({ streamName = "farm" }: FarmCameraProps) {
    const [isOnline, setIsOnline] = useState<boolean | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [key, setKey] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);

    // Probe stream availability via server-side API (avoids browser SSL issues)
    useEffect(() => {
        const checkStream = async () => {
            try {
                const res = await fetch(`/api/camera/status?stream=${streamName}`, {
                    signal: AbortSignal.timeout(6000),
                });
                if (res.ok) {
                    const data = await res.json();
                    setIsOnline(data.online);
                } else {
                    setIsOnline(true); // Assume online if check fails
                }
            } catch {
                setIsOnline(true); // Assume online if unreachable
            }
        };
        checkStream();
        const interval = setInterval(checkStream, 30000);
        return () => clearInterval(interval);
    }, [streamName]);

    const streamUrl = `${GO2RTC_URL}/stream.html?src=${streamName}&mode=mse`;

    const handleFullscreen = () => {
        if (!document.fullscreenElement) {
            containerRef.current?.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <span className="text-3xl">📹</span>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">Camera Vườn Trực Tiếp</h2>
                        <p className="text-sm text-gray-500">Quan sát cây của bạn 24/7</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {isOnline === true && (
                        <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                            Đang phát
                        </span>
                    )}
                    {isOnline === false && (
                        <span className="flex items-center gap-1.5 text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                            <VideoOff className="w-3.5 h-3.5" />
                            Ngoại tuyến
                        </span>
                    )}
                    <button
                        onClick={() => setKey(k => k + 1)}
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                        title="Tải lại stream"
                    >
                        <RefreshCw className="w-4 h-4 text-gray-500" />
                    </button>
                    <button
                        onClick={handleFullscreen}
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                        title="Toàn màn hình"
                    >
                        <Maximize2 className="w-4 h-4 text-gray-500" />
                    </button>
                </div>
            </div>

            <div ref={containerRef} className="relative bg-black rounded-xl overflow-hidden" style={{ aspectRatio: "16/9" }}>
                {isOnline === false ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                        <VideoOff className="w-12 h-12 mb-3 opacity-50" />
                        <p className="font-medium">Camera đang ngoại tuyến</p>
                        <p className="text-sm mt-1 opacity-70">Vui lòng thử lại sau</p>
                    </div>
                ) : (
                    <iframe
                        key={key}
                        src={streamUrl}
                        className="w-full h-full border-0"
                        allow="autoplay; fullscreen"
                        title="Camera vườn trực tiếp"
                    />
                )}
            </div>

            <p className="text-xs text-gray-400 mt-3 text-center">
                Stream trực tiếp từ vườn — độ trễ ~2–5 giây
            </p>
        </div>
    );
}
