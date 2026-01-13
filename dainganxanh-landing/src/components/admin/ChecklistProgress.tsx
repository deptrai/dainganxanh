'use client'

interface ChecklistProgressProps {
    completed: number
    total: number
    showPercentage?: boolean
    size?: 'sm' | 'md' | 'lg'
}

const SIZE_CLASSES = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4',
}

export function ChecklistProgress({
    completed,
    total,
    showPercentage = true,
    size = 'md',
}: ChecklistProgressProps) {
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0

    // Color based on completion
    const getColor = () => {
        if (percentage < 30) return 'bg-red-500'
        if (percentage < 70) return 'bg-yellow-500'
        return 'bg-green-500'
    }

    const getTextColor = () => {
        if (percentage < 30) return 'text-red-600'
        if (percentage < 70) return 'text-yellow-600'
        return 'text-green-600'
    }

    return (
        <div className="w-full">
            {/* Progress Bar */}
            <div className={`w-full bg-gray-200 rounded-full overflow-hidden ${SIZE_CLASSES[size]}`}>
                <div
                    className={`${getColor()} ${SIZE_CLASSES[size]} rounded-full transition-all duration-500 ease-out`}
                    style={{ width: `${percentage}%` }}
                />
            </div>

            {/* Percentage Text */}
            {showPercentage && (
                <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-gray-600">
                        {completed}/{total} hoàn thành
                    </span>
                    <span className={`text-sm font-semibold ${getTextColor()}`}>
                        {percentage}%
                    </span>
                </div>
            )}
        </div>
    )
}
