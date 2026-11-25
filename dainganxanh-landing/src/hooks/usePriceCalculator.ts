"use client";

import { useState, useCallback } from "react";
import { PACKAGE_PRICE } from "@/lib/constants";
import { formatCurrency, formatNumber } from "@/lib/format";
import { useLocale, useTranslations } from "next-intl";

const MIN_QUANTITY = 1;
const MAX_QUANTITY = 1000000;

interface UsePriceCalculatorReturn {
    quantity: number;
    totalPrice: number;
    error: string | null;
    isValid: boolean;
    setQuantity: (value: number) => void;
    increment: () => void;
    decrement: () => void;
    handleInputChange: (value: string) => void;
    formattedTotal: string;
    formattedUnitPrice: string;
}

export function usePriceCalculator(initialQuantity: number = 1, unitPrice: number = PACKAGE_PRICE): UsePriceCalculatorReturn {
    const locale = (useLocale() as 'vi' | 'en') || 'vi';
    const t = useTranslations('checkout');

    const [quantity, setQuantityState] = useState<number>(
        Math.max(MIN_QUANTITY, Math.min(MAX_QUANTITY, initialQuantity))
    );
    const [error, setError] = useState<string | null>(null);

    const validateQuantity = useCallback((value: number): boolean => {
        if (isNaN(value)) {
            setError(t('quantity.errorValid'));
            return false;
        }
        if (value < MIN_QUANTITY) {
            setError(t('quantity.errorMin', { min: formatNumber(MIN_QUANTITY, locale) }));
            return false;
        }
        if (value > MAX_QUANTITY) {
            setError(t('quantity.errorMax', { max: formatNumber(MAX_QUANTITY, locale) }));
            return false;
        }
        if (!Number.isInteger(value)) {
            setError(t('quantity.errorInteger'));
            return false;
        }
        setError(null);
        return true;
    }, [t, locale]);

    const setQuantity = useCallback((value: number) => {
        const isValid = validateQuantity(value);
        if (isValid) {
            setQuantityState(value);
        }
    }, [validateQuantity]);

    const increment = useCallback(() => {
        setQuantityState(prev => {
            const newQuantity = prev + 1;
            if (newQuantity <= MAX_QUANTITY) {
                setError(null);
                return newQuantity;
            } else {
                setError(t('quantity.errorMax', { max: formatNumber(MAX_QUANTITY, locale) }));
                return prev;
            }
        });
    }, [t, locale]);

    const decrement = useCallback(() => {
        setQuantityState(prev => {
            const newQuantity = prev - 1;
            if (newQuantity >= MIN_QUANTITY) {
                setError(null);
                return newQuantity;
            } else {
                setError(t('quantity.errorMin', { min: formatNumber(MIN_QUANTITY, locale) }));
                return prev;
            }
        });
    }, [t, locale]);

    const handleInputChange = useCallback((value: string) => {
        if (value === "") {
            setQuantityState(MIN_QUANTITY);
            setError(null);
            return;
        }

        // Sanitize input: remove non-numeric characters except digits
        const sanitized = value.replace(/[^\d]/g, "");
        if (sanitized === "") {
            setError(t('quantity.errorValid'));
            return;
        }

        const numValue = parseInt(sanitized, 10);
        if (isNaN(numValue)) {
            setError(t('quantity.errorValid'));
            return;
        }

        setQuantityState(numValue);
        validateQuantity(numValue);
    }, [validateQuantity, t]);

    const totalPrice = quantity * unitPrice;
    const isValid = error === null && quantity >= MIN_QUANTITY && quantity <= MAX_QUANTITY;

    return {
        quantity,
        totalPrice,
        error,
        isValid,
        setQuantity,
        increment,
        decrement,
        handleInputChange,
        formattedTotal: formatCurrency(totalPrice, locale),
        formattedUnitPrice: formatCurrency(unitPrice, locale),
    };
}
