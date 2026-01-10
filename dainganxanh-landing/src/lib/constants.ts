// Package pricing constants for Đại Ngàn Xanh

export const PACKAGE_PRICE = 260000; // VNĐ per tree

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
        label: "Quỹ phát triển cộng đồng",
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
