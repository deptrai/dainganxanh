"use client";

import { useState, useEffect } from "react";
import { z } from "zod";
import { createBrowserClient } from "@/lib/supabase/client";

export const customerIdentitySchema = z.object({
    full_name: z.string().min(1, "Vui lòng nhập họ tên"),
    dob: z.string().min(1, "Vui lòng nhập ngày sinh"),
    nationality: z.string().default("Việt Nam"),
    id_number: z.string().regex(/^\d{12}$/, "Số CCCD phải có 12 chữ số"),
    id_issue_date: z.string().min(1, "Vui lòng nhập ngày cấp"),
    id_issue_place: z.string().min(1, "Vui lòng nhập nơi cấp"),
    address: z.string().min(1, "Vui lòng nhập địa chỉ"),
    phone: z.string().regex(/^0\d{9}$/, "Số điện thoại không hợp lệ (VD: 0901234567)"),
});

export type CustomerIdentityData = z.infer<typeof customerIdentitySchema>;

interface CustomerIdentityFormProps {
    onSubmit: (data: CustomerIdentityData) => Promise<void>;
    isLoading?: boolean;
    error?: string;
    defaultValues?: Partial<CustomerIdentityData>;
}

type FieldErrors = Partial<Record<keyof CustomerIdentityData, string>>;

export function CustomerIdentityForm({ onSubmit, isLoading, error, defaultValues }: CustomerIdentityFormProps) {
    const [values, setValues] = useState<Partial<CustomerIdentityData>>({
        full_name: "",
        dob: "",
        nationality: "Việt Nam",
        id_number: "",
        id_issue_date: "",
        id_issue_place: "",
        address: "",
        phone: "",
        ...defaultValues,
    });
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
    const [submitting, setSubmitting] = useState(false);

    // Pre-fill full_name and phone from user metadata
    useEffect(() => {
        const loadUser = async () => {
            try {
                const supabase = createBrowserClient();
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;
                setValues((prev) => ({
                    ...prev,
                    full_name: prev.full_name || user.user_metadata?.full_name || "",
                    phone: prev.phone || user.user_metadata?.phone || "",
                }));
            } catch {
                // Silent fail — user just won't get pre-fill
            }
        };
        loadUser();
    }, []);

    const validateField = (name: keyof CustomerIdentityData, value: string) => {
        const result = customerIdentitySchema.shape[name].safeParse(value);
        if (!result.success) {
            return result.error.issues[0]?.message ?? "Không hợp lệ";
        }
        return undefined;
    };

    const handleChange = (name: keyof CustomerIdentityData, value: string) => {
        setValues((prev) => ({ ...prev, [name]: value }));
        // Clear error on change
        if (fieldErrors[name]) {
            setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
        }
    };

    const handleBlur = (name: keyof CustomerIdentityData) => {
        const err = validateField(name, values[name] ?? "");
        setFieldErrors((prev) => ({ ...prev, [name]: err }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate all fields
        const result = customerIdentitySchema.safeParse(values);
        if (!result.success) {
            const errors: FieldErrors = {};
            result.error.issues.forEach((issue) => {
                const field = issue.path[0] as keyof CustomerIdentityData;
                if (field && !errors[field]) errors[field] = issue.message;
            });
            setFieldErrors(errors);
            return;
        }

        setSubmitting(true);
        try {
            await onSubmit(result.data);
        } finally {
            setSubmitting(false);
        }
    };

    const inputClass = (hasError: boolean) =>
        `w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors ${
            hasError ? "border-red-400 bg-red-50" : "border-gray-300 bg-white"
        }`;

    const labelClass = "block text-sm font-medium text-gray-700 mb-1";
    const errorClass = "text-xs text-red-600 mt-1";

    const busy = submitting || isLoading;

    return (
        <form onSubmit={handleSubmit} noValidate>
            <div className="space-y-4">
                {/* Họ và tên */}
                <div>
                    <label htmlFor="full_name" className={labelClass}>
                        Họ và tên <span className="text-red-500">*</span>
                    </label>
                    <input
                        id="full_name"
                        type="text"
                        value={values.full_name ?? ""}
                        onChange={(e) => handleChange("full_name", e.target.value)}
                        onBlur={() => handleBlur("full_name")}
                        className={inputClass(!!fieldErrors.full_name)}
                        placeholder="Nguyễn Văn A"
                        autoComplete="name"
                    />
                    {fieldErrors.full_name && <p className={errorClass}>{fieldErrors.full_name}</p>}
                </div>

                {/* Ngày sinh */}
                <div>
                    <label htmlFor="dob" className={labelClass}>
                        Ngày sinh <span className="text-red-500">*</span>
                    </label>
                    <input
                        id="dob"
                        type="date"
                        value={values.dob ?? ""}
                        onChange={(e) => handleChange("dob", e.target.value)}
                        onBlur={() => handleBlur("dob")}
                        className={inputClass(!!fieldErrors.dob)}
                        max={new Date().toISOString().split("T")[0]}
                    />
                    {fieldErrors.dob && <p className={errorClass}>{fieldErrors.dob}</p>}
                </div>

                {/* Quốc tịch */}
                <div>
                    <label htmlFor="nationality" className={labelClass}>
                        Quốc tịch
                    </label>
                    <input
                        id="nationality"
                        type="text"
                        value={values.nationality ?? "Việt Nam"}
                        onChange={(e) => handleChange("nationality", e.target.value)}
                        onBlur={() => handleBlur("nationality")}
                        className={inputClass(!!fieldErrors.nationality)}
                        placeholder="Việt Nam"
                    />
                    {fieldErrors.nationality && <p className={errorClass}>{fieldErrors.nationality}</p>}
                </div>

                {/* Số CCCD */}
                <div>
                    <label htmlFor="id_number" className={labelClass}>
                        Số CCCD <span className="text-red-500">*</span>
                    </label>
                    <input
                        id="id_number"
                        type="text"
                        inputMode="numeric"
                        maxLength={12}
                        value={values.id_number ?? ""}
                        onChange={(e) => handleChange("id_number", e.target.value.replace(/\D/g, ""))}
                        onBlur={() => handleBlur("id_number")}
                        className={inputClass(!!fieldErrors.id_number)}
                        placeholder="123456789012"
                    />
                    {fieldErrors.id_number && <p className={errorClass}>{fieldErrors.id_number}</p>}
                </div>

                {/* Ngày cấp + Nơi cấp */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="id_issue_date" className={labelClass}>
                            Ngày cấp <span className="text-red-500">*</span>
                        </label>
                        <input
                            id="id_issue_date"
                            type="date"
                            value={values.id_issue_date ?? ""}
                            onChange={(e) => handleChange("id_issue_date", e.target.value)}
                            onBlur={() => handleBlur("id_issue_date")}
                            className={inputClass(!!fieldErrors.id_issue_date)}
                            max={new Date().toISOString().split("T")[0]}
                        />
                        {fieldErrors.id_issue_date && <p className={errorClass}>{fieldErrors.id_issue_date}</p>}
                    </div>
                    <div>
                        <label htmlFor="id_issue_place" className={labelClass}>
                            Nơi cấp <span className="text-red-500">*</span>
                        </label>
                        <input
                            id="id_issue_place"
                            type="text"
                            value={values.id_issue_place ?? ""}
                            onChange={(e) => handleChange("id_issue_place", e.target.value)}
                            onBlur={() => handleBlur("id_issue_place")}
                            className={inputClass(!!fieldErrors.id_issue_place)}
                            placeholder="Cục Cảnh sát QLHC về TTXH"
                        />
                        {fieldErrors.id_issue_place && <p className={errorClass}>{fieldErrors.id_issue_place}</p>}
                    </div>
                </div>

                {/* Địa chỉ */}
                <div>
                    <label htmlFor="address" className={labelClass}>
                        Địa chỉ thường trú <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        id="address"
                        rows={2}
                        value={values.address ?? ""}
                        onChange={(e) => handleChange("address", e.target.value)}
                        onBlur={() => handleBlur("address")}
                        className={inputClass(!!fieldErrors.address)}
                        placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố"
                    />
                    {fieldErrors.address && <p className={errorClass}>{fieldErrors.address}</p>}
                </div>

                {/* Số điện thoại */}
                <div>
                    <label htmlFor="phone" className={labelClass}>
                        Số điện thoại <span className="text-red-500">*</span>
                    </label>
                    <input
                        id="phone"
                        type="tel"
                        inputMode="numeric"
                        maxLength={10}
                        value={values.phone ?? ""}
                        onChange={(e) => handleChange("phone", e.target.value.replace(/\D/g, ""))}
                        onBlur={() => handleBlur("phone")}
                        className={inputClass(!!fieldErrors.phone)}
                        placeholder="0901234567"
                        autoComplete="tel"
                    />
                    {fieldErrors.phone && <p className={errorClass}>{fieldErrors.phone}</p>}
                </div>

                {/* API-level error */}
                {error && (
                    <p className="text-sm text-red-600 text-center">{error}</p>
                )}

                <button
                    type="submit"
                    disabled={busy}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                    {busy ? (
                        <>
                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Đang xử lý...
                        </>
                    ) : (
                        "Tiếp tục →"
                    )}
                </button>
            </div>
        </form>
    );
}
