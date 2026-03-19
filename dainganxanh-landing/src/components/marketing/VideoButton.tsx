"use client";

import { useState } from "react";
import { ScaleHover } from "@/components/MotionWrapper";
import { VideoModal } from "@/components/marketing/VideoModal";

export function VideoButton() {
    const [open, setOpen] = useState(false);

    return (
        <>
            <ScaleHover>
                <button
                    onClick={() => setOpen(true)}
                    className="glass-card hover:bg-white/90 text-white hover:text-brand-600 text-lg px-10 py-4 rounded-full font-bold transition-all flex items-center justify-center gap-2 group backdrop-blur-sm bg-white/10 hover:bg-white border-white/30"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Video Giới Thiệu
                </button>
            </ScaleHover>

            <VideoModal isOpen={open} onClose={() => setOpen(false)} />
        </>
    );
}

