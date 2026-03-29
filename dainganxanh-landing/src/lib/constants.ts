// Package pricing constants for Đại Ngàn Xanh

export const PACKAGE_PRICE = 260000; // VNĐ per tree

// Business logic thresholds
export const HARVEST_MONTHS = 60; // trees must be 60 months old to harvest
export const PHOTO_PLACEHOLDER_MONTHS = 9; // show placeholder before 9 months
export const MIN_WITHDRAWAL = 200_000; // minimum withdrawal amount in VNĐ

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

export interface CostBreakdown {
    label: string;
    amount: number;
    description: string;
    icon: string; // Lucide icon name
}

export const COST_BREAKDOWN: CostBreakdown[] = [
    {
        label: "Cây giống chất lượng cao",
        amount: 40000,
        description: "Giống Dó Đen (Aquilaria) chất lượng cao",
        icon: "Sprout"
    },
    {
        label: "Phí chăm sóc 5 năm",
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

export const PACKAGE_INFO = {
    name: "Gói Cá nhân",
    price: PACKAGE_PRICE,
    unit: "cây",
    breakdown: COST_BREAKDOWN,
    features: [
        "Chứng nhận sở hữu cây",
        "Báo cáo hàng quý với ảnh thực tế",
        "Theo dõi GPS vị trí cây",
        "3 lựa chọn thu hoạch sau 5 năm"
    ]
};

// Utility function to format VND currency
export const formatVND = (amount: number): string => {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
};

// Validate that breakdown sums to total price
const breakdownTotal = COST_BREAKDOWN.reduce((sum, item) => sum + item.amount, 0);
if (breakdownTotal !== PACKAGE_PRICE) {
    console.warn(
        `Cost breakdown (${formatVND(breakdownTotal)}) does not match package price (${formatVND(PACKAGE_PRICE)})`
    );
}
