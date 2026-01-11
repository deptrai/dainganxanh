"use client";

import { useEffect } from "react";
import { createBrowserClient } from "@/lib/supabase/client";

export function AuthCallbackHandler() {
    useEffect(() => {
        const handleAuthCallback = async () => {
            // Check if we have auth tokens in the URL hash
            if (typeof window === "undefined") return;

            const hashParams = new URLSearchParams(window.location.hash.substring(1));
            const accessToken = hashParams.get("access_token");
            const refreshToken = hashParams.get("refresh_token");

            if (accessToken && refreshToken) {
                console.log("Found auth tokens in URL, setting session...");
                const supabase = createBrowserClient();

                // Set the session using the tokens from the magic link
                const { data, error } = await supabase.auth.setSession({
                    access_token: accessToken,
                    refresh_token: refreshToken,
                });

                if (error) {
                    console.error("Error setting session:", error);
                    alert("Lỗi xác thực. Vui lòng thử lại.");
                    // Clean up the hash
                    window.location.hash = "";
                    return;
                }

                if (data.session) {
                    console.log("✅ Session created successfully for:", data.session.user.email);
                    alert(`Đăng nhập thành công! Chào mừng ${data.session.user.email}`);

                    // Clean up the hash and force hard redirect to sync cookies
                    window.location.hash = "";
                    window.location.href = "/";
                }
            }
        };

        handleAuthCallback();
    }, []);

    return null; // This component doesn't render anything
}
