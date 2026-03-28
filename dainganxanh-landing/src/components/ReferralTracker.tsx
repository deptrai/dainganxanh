"use client";

import { useEffect } from 'react';
import Cookies from 'js-cookie';
import { trackReferralClick } from '@/actions/referrals';

/**
 * Client component to handle referral tracking.
 * Sets the ref cookie on the client side (js-cookie) so it persists across navigation.
 */
export function ReferralTracker({ refCode }: { refCode?: string }) {
    useEffect(() => {
        if (!refCode) return;

        // Only set if no existing ref cookie (first referrer wins)
        const existing = Cookies.get('ref');
        if (!existing) {
            Cookies.set('ref', refCode, {
                expires: 30,
                path: '/',
                sameSite: 'lax',
                secure: window.location.protocol === 'https:',
            });
        }

        // Track click server-side (fire-and-forget)
        trackReferralClick(refCode).catch(() => {});
    }, [refCode]);

    return null;
}
