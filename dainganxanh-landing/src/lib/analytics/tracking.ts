/**
 * Client-side analytics tracking utility
 * Currently logs to console, can be extended to Mixpanel/GA4
 */

export type ShareMethod = 'native' | 'copy' | 'email' | 'facebook' | 'zalo' | 'twitter' | 'linkedin'
export type ShareSource = 'success_screen' | 'dashboard' | 'tree_detail'

export interface ShareEvent {
    source: ShareSource
    method: ShareMethod
    trees?: number
    refCode?: string
    context?: string
}

/**
 * Track share initiated event
 */
export function trackShareInitiated(event: ShareEvent): void {
    if (typeof window === 'undefined') return

    // Log to console for development
    console.log('[Analytics] share_initiated', event)

    // TODO: Add Mixpanel tracking
    // if (window.mixpanel) {
    //   window.mixpanel.track('share_initiated', event)
    // }

    // TODO: Add GA4 tracking
    // if (window.gtag) {
    //   window.gtag('event', 'share', {
    //     method: event.method,
    //     content_type: event.source,
    //     item_id: event.refCode,
    //   })
    // }
}

/**
 * Track share completed event
 */
export function trackShareCompleted(event: ShareEvent): void {
    if (typeof window === 'undefined') return

    // Log to console for development
    console.log('[Analytics] share_completed', event)

    // TODO: Add Mixpanel tracking
    // if (window.mixpanel) {
    //   window.mixpanel.track('share_completed', event)
    // }

    // TODO: Add GA4 tracking
    // if (window.gtag) {
    //   window.gtag('event', 'share_complete', {
    //     method: event.method,
    //     content_type: event.source,
    //     item_id: event.refCode,
    //   })
    // }
}

/**
 * Track general event
 */
export function trackEvent(eventName: string, properties?: Record<string, unknown>): void {
    if (typeof window === 'undefined') return

    // Log to console for development
    console.log(`[Analytics] ${eventName}`, properties)

    // TODO: Add Mixpanel tracking
    // if (window.mixpanel) {
    //   window.mixpanel.track(eventName, properties)
    // }

    // TODO: Add GA4 tracking
    // if (window.gtag) {
    //   window.gtag('event', eventName, properties)
    // }
}
