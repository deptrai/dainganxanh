"use client";

import { useState, useCallback } from "react";
import { PACKAGE_PRICE, formatVND } from "@/lib/constants";


const MIN_QUANTITY = 1;
const MAX_QUANTITY = 1000;

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
    const [quantity, setQuantityState] = useState<number>(
        Math.max(MIN_QUANTITY, Math.min(MAX_QUANTITY, initialQuantity))
    );
    const [error, setError] = useState<string | null>(null);

    const validateQuantity = useCallback((value: number): boolean => {
        if (isNaN(value)) {
            setError("Vui lòng nhập số hợp lệ");
            return false;
        }
        if (value < MIN_QUANTITY) {
            setError(`Số lượng tối thiểu là ${MIN_QUANTITY} cây`);
            return false;
        }
        if (value > MAX_QUANTITY) {
            setError(`Số lượng tối đa là ${MAX_QUANTITY.toLocaleString('vi-VN')} cây`);
            return false;
        }
        if (!Number.isInteger(value)) {
            setError("Số lượng phải là số nguyên");
            return false;
        }
        setError(null);
        return true;
    }, []);

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
                setError(`Số lượng tối đa là ${MAX_QUANTITY.toLocaleString('vi-VN')} cây`);
                return prev;
            }
        });
    }, []);

    const decrement = useCallback(() => {
        setQuantityState(prev => {
            const newQuantity = prev - 1;
            if (newQuantity >= MIN_QUANTITY) {
                setError(null);
                return newQuantity;
            } else {
                setError(`Số lượng tối thiểu là ${MIN_QUANTITY.toLocaleString('vi-VN')} cây`);
                return prev;
            }
        });
    }, []);

    const handleInputChange = useCallback((value: string) => {
        if (value === "") {
            setQuantityState(MIN_QUANTITY);
            setError(null);
            return;
        }

        // Sanitize input: remove non-numeric characters except digits
        const sanitized = value.replace(/[^\d]/g, "");
        if (sanitized === "") {
            setError("Vui lòng nhập số hợp lệ");
            return;
        }

        const numValue = parseInt(sanitized, 10);
        if (isNaN(numValue)) {
            setError("Vui lòng nhập số hợp lệ");
            return;
        }

        setQuantityState(numValue);
        validateQuantity(numValue);
    }, [validateQuantity]);

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
        formattedTotal: formatVND(totalPrice),
        formattedUnitPrice: formatVND(unitPrice),
    };
}
