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

const BASE_BREAKDOWN: CostBreakdown[] = [
    {
        label: "Cây giống chất lượng cao",
        amount: 40000,
        description: "Giống Dó Đen (Aquilaria) chất lượng cao",
        icon: "Sprout"
    },
    {
        label: "Phí chăm sóc 10 năm",
        amount: 194000,
        description: "Chăm sóc chuyên nghiệp, báo cáo hàng quý",
        icon: "Heart"
    },
    {
        label: "Quỹ đại sứ xanh",
        amount: 26000,
        description: "Hỗ trợ cộng đồng địa phương và bảo vệ môi trường",
        icon: "Users"
    }
];

const BASE_FEATURES = [
    "Chứng nhận sở hữu cây",
    "Báo cáo hàng quý với ảnh thực tế",
    "Theo dõi GPS vị trí cây",
    "3 lựa chọn thu hoạch sau 10 năm"
];

const INSURANCE_BREAKDOWN: CostBreakdown = {
    label: "Bảo hiểm cam kết bao tiêu",
    amount: 150000,
    description: "2.500đ/tháng × 60 tháng. Hoàn 325.000đ/cây nếu công ty không thực hiện cam kết",
    icon: "Shield"
};

export const PACKAGES: Record<PackageType, PackageInfo> = {
    standard: {
        type: 'standard',
        name: 'Gói Cá Nhân',
        price: 260_000,
        breakdown: BASE_BREAKDOWN,
        features: BASE_FEATURES,
        hasInsurance: false,
    },
    insurance: {
        type: 'insurance',
        name: 'Gói Có Bảo Hiểm',
        price: 410_000,
        breakdown: [...BASE_BREAKDOWN, INSURANCE_BREAKDOWN],
        features: [
            ...BASE_FEATURES,
            "Bảo hiểm cam kết bao tiêu 60 tháng",
            "Hoàn 325.000đ/cây nếu vi phạm cam kết",
        ],
        hasInsurance: true,
    },
};

export const VALID_UNIT_PRICES = [260_000, 410_000]

export const getPackageByPrice = (price: number): PackageType =>
    price === 410_000 ? 'insurance' : 'standard'

export const isValidPackageType = (type: string): type is PackageType =>
    type === 'standard' || type === 'insurance'

// ─── Backward-compatible aliases ─────────────────────────────────
export const PACKAGE_PRICE = 260_000;
export const COST_BREAKDOWN = BASE_BREAKDOWN;
export const PACKAGE_INFO = {
    name: PACKAGES.standard.name,
    price: PACKAGES.standard.price,
    unit: "cây",
    breakdown: PACKAGES.standard.breakdown,
    features: PACKAGES.standard.features,
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
