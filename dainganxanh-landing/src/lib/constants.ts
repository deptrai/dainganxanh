// Package pricing constants for Đại Ngàn Xanh

// ─── Package Types ───────────────────────────────────────────────
export type PackageType = 'standard' | 'insurance'

export interface PackageInfo {
    type: PackageType
    name: string
    price: number
    breakdown: CostBreakdown[]
    features: string[]
    hasInsurance: boolean
}

export interface CostBreakdown {
    label: string;
    amount: number;
    description: string;
    icon: string;
}

const INSURANCE_PACKAGE_BREAKDOWN: CostBreakdown[] = [
    {
        label: "Cây giống chất lượng cao",
        amount: 40_000,
        description: "Cam kết giống Dó đen chuẩn Việt 100%",
        icon: "Sprout"
    },
    {
        label: "Quỹ Đại sứ Xanh",
        amount: 41_000,
        description: "Chia sẻ cộng đồng đại sứ",
        icon: "Users"
    },
    {
        label: "Chi phí cho cây trong 10 năm",
        amount: 229_000,
        description: "Chi phí đất, phân bón, nước, hệ thống tưới tiêu, vi sinh...",
        icon: "Heart"
    },
    {
        label: "Công chăm sóc và bảo hiểm 10 năm",
        amount: 100_000,
        description: "Công chăm sóc và bảo hiểm cây chết trong 10 năm",
        icon: "Shield"
    },
];

const INSURANCE_PACKAGE_FEATURES = [
    "Hợp đồng Chứng nhận quyền sở hữu cây",
    "Hệ thống camera giám sát cây 24/7",
    "Hệ thống GPS vị trí cây",
    "Quyền thăm quan vườn, cây",
    "Quyền lợi lưu trú tại farm miễn phí",
    "Quyền lựa chọn phương án thu hoạch cây",
    "Được bao tiêu khi thu hoạch cây trưởng thành",
];

export const PACKAGES: Record<PackageType, PackageInfo> = {
    // Kept for type compatibility — no longer shown on pricing page
    standard: {
        type: 'standard',
        name: 'Gói Cơ Bản',
        price: 410_000,
        breakdown: INSURANCE_PACKAGE_BREAKDOWN,
        features: INSURANCE_PACKAGE_FEATURES,
        hasInsurance: true,
    },
    insurance: {
        type: 'insurance',
        name: 'Gói Trồng Cây Dó Đen',
        price: 410_000,
        breakdown: INSURANCE_PACKAGE_BREAKDOWN,
        features: INSURANCE_PACKAGE_FEATURES,
        hasInsurance: true,
    },
};

export const VALID_UNIT_PRICES = [410_000]

export const getPackageByPrice = (price: number): PackageType => 'insurance'

export const isValidPackageType = (type: string): type is PackageType =>
    type === 'standard' || type === 'insurance'

// ─── Backward-compatible aliases ─────────────────────────────────
export const PACKAGE_PRICE = 410_000;
export const COST_BREAKDOWN = INSURANCE_PACKAGE_BREAKDOWN;
export const PACKAGE_INFO = {
    name: PACKAGES.insurance.name,
    price: PACKAGES.insurance.price,
    unit: "cây",
    breakdown: PACKAGES.insurance.breakdown,
    features: PACKAGES.insurance.features,
};

// ─── Business logic thresholds ───────────────────────────────────
export const HARVEST_MONTHS = 120;
export const PHOTO_PLACEHOLDER_MONTHS = 9;
export const MIN_WITHDRAWAL = 200_000;

// Tree status config — shared across PackageCard, PackageDetailHeader, TreeCard
export const TREE_STATUS_CONFIG = {
    pending: { label: 'Chờ xử lý', emoji: '⏳', color: 'bg-gray-100 text-gray-800' },
    seedling: { label: 'Đang ươm', emoji: '🌱', color: 'bg-green-100 text-green-800' },
    planted: { label: 'Đã trồng', emoji: '🌿', color: 'bg-emerald-100 text-emerald-800' },
    growing: { label: 'Đang lớn', emoji: '🌲', color: 'bg-green-600 text-white' },
    mature: { label: 'Trưởng thành', emoji: '🎋', color: 'bg-yellow-100 text-yellow-800' },
    harvested: { label: 'Thu hoạch', emoji: '✨', color: 'bg-purple-100 text-purple-800' },
    dead: { label: 'Chết', emoji: '⚫', color: 'bg-gray-100 text-gray-800' },
} as const;

// Utility function to format VND currency
export const formatVND = (amount: number): string => {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
};

// Validate that breakdowns sum to package prices
for (const [key, pkg] of Object.entries(PACKAGES)) {
    const total = pkg.breakdown.reduce((sum, item) => sum + item.amount, 0);
    if (total !== pkg.price) {
        console.warn(
            `[${key}] Cost breakdown (${formatVND(total)}) does not match package price (${formatVND(pkg.price)})`
        );
    }
}
