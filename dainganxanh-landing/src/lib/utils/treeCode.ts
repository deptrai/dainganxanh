/**
 * Tree Code Generation Utility
 * Format: TREE-{year}-{prefix}{sequence}
 * Example: TREE-2026-ABC12001, TREE-2026-ABC12002
 */

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
    // Add millisecond timestamp to ensure uniqueness even if same order assigned multiple times
    const timestamp = Date.now().toString().slice(-6) // Last 6 digits of timestamp
    return `TREE-${year}-${prefix}${seq}-${timestamp}`
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
