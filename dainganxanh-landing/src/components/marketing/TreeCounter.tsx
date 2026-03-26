'use client'

import { useEffect, useState } from 'react'
import { motion, useSpring, useTransform } from 'framer-motion'
import { createBrowserClient } from '@/lib/supabase/client'

const GOAL = 1_000_000

function formatNumber(n: number): string {
    return n.toLocaleString('vi-VN')
}

function AnimatedNumber({ value }: { value: number }) {
    const spring = useSpring(0, { duration: 2000 })
    const display = useTransform(spring, (v) => formatNumber(Math.floor(v)))

    useEffect(() => {
        spring.set(value)
    }, [spring, value])

    return <motion.span>{display}</motion.span>
}

export function TreeCounter({ initialCount }: { initialCount?: number }) {
    const [count, setCount] = useState(initialCount ?? 0)

    useEffect(() => {
        const supabase = createBrowserClient()

        // Fetch initial count
        async function fetchCount() {
            const { count: treeCount } = await supabase
                .from('trees')
                .select('*', { count: 'exact', head: true })

            if (treeCount !== null) {
                setCount(treeCount)
            }
        }

        fetchCount()

        // Subscribe to realtime changes
        const channel = supabase
            .channel('tree-counter')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'trees' },
                () => {
                    setCount((prev) => prev + 1)
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    return (
        <div className="px-5 py-2 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white mb-8 shadow-lg">
            <span className="font-bold text-accent-gold text-3xl md:text-4xl">
                <AnimatedNumber value={count} />
            </span>{' '}
            <span className="text-2xl md:text-3xl">
                / {formatNumber(GOAL)} cây đã bén rễ
            </span>
        </div>
    )
}
