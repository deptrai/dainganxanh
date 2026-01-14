"use client";

import { ShareButton } from "@/components/shared/ShareButton";

interface TreeShareButtonProps {
    months: number;
    refCode: string;
    userName?: string;
}

/**
 * Share button for individual trees in My Garden dashboard
 * Uses "progress" context to share tree growth updates
 */
export function TreeShareButton({ months, refCode, userName }: TreeShareButtonProps) {
    return (
        <ShareButton
            context="progress"
            source="dashboard"
            data={{
                months,
                refCode,
                userName,
            }}
            className="mt-4"
        />
    );
}
