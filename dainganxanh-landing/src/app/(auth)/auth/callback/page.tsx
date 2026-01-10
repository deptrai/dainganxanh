"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthCallbackPage() {
    const router = useRouter();

    useEffect(() => {
        const handleAuthCallback = async () => {
            // Get the hash fragment from URL
            const hashParams = new URLSearchParams(window.location.hash.substring(1));
            const accessToken = hashParams.get("access_token");
            const refreshToken = hashParams.get("refresh_token");

            if (accessToken && refreshToken) {
                // Set the session using the tokens from the magic link
                const { data, error } = await supabase.auth.setSession({
                    access_token: accessToken,
                    refresh_token: refreshToken,
                });

                if (error) {
                    console.error("Error setting session:", error);
                    router.push("/login?error=auth_failed");
                    return;
                }

                if (data.session) {
                    console.log("Session created successfully:", data.session.user.email);
                    // Redirect to checkout or home
                    router.push("/");
                }
            } else {
                // No tokens found, redirect to login
                router.push("/login");
            }
        };

        handleAuthCallback();
    }, [router]);

    return (
        <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-emerald-50 flex items-center justify-center">
            <div className="text-center">
                <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    Đang xác thực...
                </h2>
                <p className="text-gray-600">Vui lòng đợi trong giây lát</p>
            </div>
        </div>
    );
}
