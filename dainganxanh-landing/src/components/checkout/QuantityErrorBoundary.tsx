"use client";

import { Component, ReactNode } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export class QuantityErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error("Quantity page error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-emerald-50 flex items-center justify-center p-4">
                    <div className="max-w-md w-full bg-white rounded-2xl p-8 shadow-lg border border-red-100">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                                <AlertTriangle className="w-6 h-6 text-red-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">Đã có lỗi xảy ra</h2>
                        </div>

                        <p className="text-gray-600 mb-6">
                            Rất tiếc, đã có lỗi khi tải trang chọn số lượng. Vui lòng thử lại.
                        </p>

                        <div className="space-y-3">
                            <Link
                                href="/pricing"
                                className="block w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-center rounded-lg font-medium transition-colors"
                            >
                                Quay lại chọn gói
                            </Link>
                            <Link
                                href="/"
                                className="block w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 text-center rounded-lg font-medium transition-colors"
                            >
                                Về trang chủ
                            </Link>
                        </div>

                        {process.env.NODE_ENV === "development" && this.state.error && (
                            <details className="mt-6 p-4 bg-red-50 rounded-lg border border-red-200">
                                <summary className="text-sm font-medium text-red-900 cursor-pointer">
                                    Chi tiết lỗi (Development only)
                                </summary>
                                <pre className="mt-2 text-xs text-red-800 overflow-auto">
                                    {this.state.error.message}
                                    {"\n\n"}
                                    {this.state.error.stack}
                                </pre>
                            </details>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
