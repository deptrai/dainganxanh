'use client'

import { useRef, useState } from 'react'

interface HeroVideoProps {
    src?: string
    poster?: string
    className?: string
}

export function HeroVideo({
    src = '/hero-video.mp4',
    poster = '/hero-forest.png',
    className = '',
}: HeroVideoProps) {
    const videoRef = useRef<HTMLVideoElement>(null)
    const [isLoaded, setIsLoaded] = useState(false)

    return (
        <div className={`absolute inset-0 z-0 ${className}`}>
            {/* Poster image shown until video loads */}
            {!isLoaded && (
                <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${poster})` }}
                />
            )}

            <video
                ref={videoRef}
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
                poster={poster}
                onLoadedData={() => setIsLoaded(true)}
                className="absolute inset-0 w-full h-full object-cover"
            >
                <source src={src} type="video/mp4" />
            </video>

            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-brand-900/50" />
        </div>
    )
}
