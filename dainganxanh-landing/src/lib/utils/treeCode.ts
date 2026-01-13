/**
 * Tree Code Generation Utility
 * Format: TREE-{year}-{prefix}{sequence}-{timestamp}
 * Example: TREE-2026-ABC12001-123456
 */

// Counter to ensure uniqueness when generating codes in rapid succession
let lastTimestamp = 0
let counter = 0

/**
 * Generate a unique tree code with timestamp
 * @param orderId - The order ID to generate prefix from
 * @param sequence - The sequence number for this tree (1-based)
 * @returns Tree code in format TREE-YYYY-XXXXX###-TIMESTAMP
 */
export function generateTreeCode(orderId: string, sequence: number): string {
    const year = new Date().getFullYear()
    const prefix = orderId.slice(0, 5).toUpperCase()
    const seq = String(sequence).padStart(3, '0')

    // Add millisecond timestamp with counter to ensure uniqueness
    let timestamp = Date.now()
    if (timestamp === lastTimestamp) {
        counter++
    } else {
        lastTimestamp = timestamp
        counter = 0
    }

    // Use last 6 digits of timestamp + counter
    const uniqueId = (timestamp + counter).toString().slice(-6)
    return `TREE-${year}-${prefix}${seq}-${uniqueId}`
}

/**
 * Generate multiple tree codes for an order
 * @param orderId - The order ID
 * @param quantity - Number of trees to generate codes for
 * @returns Array of tree codes
 */
export function generateTreeCodes(orderId: string, quantity: number): string[] {
    const codes: string[] = []
    for (let i = 1; i <= quantity; i++) {
        codes.push(generateTreeCode(orderId, i))
    }
    return codes
}

/**
 * Validate tree code format
 * @param code - Tree code to validate
 * @returns true if valid format
 */
export function isValidTreeCode(code: string): boolean {
    // Format: TREE-YYYY-XXXXX###-TIMESTAMP (timestamp is 6 digits)
    const pattern = /^TREE-\d{4}-[A-Z0-9]{5}\d{3}-\d{6}$/
    return pattern.test(code)
}
