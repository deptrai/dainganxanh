'use client'

import TreeCard from './TreeCard'

interface TreeGridProps {
    trees: Array<{
        id: string
        tree_code: string
        status: string
        planted_at: string
        co2_absorbed: number
        latest_photo: string | null
    }>
}

export default function TreeGrid({ trees }: TreeGridProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {trees.map((tree) => (
                <TreeCard key={tree.id} tree={tree} />
            ))}
        </div>
    )
}
