"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export function AuthCallbackHandler() {
    const router = useRouter();

    useEffect(() => {
        const handleAuthCallback = async () => {
            // Check if we have auth tokens in the URL hash
            if (typeof window === "undefined") return;

            const hashParams = new URLSearchParams(window.location.hash.substring(1));
            const accessToken = hashParams.get("access_token");
            const refreshToken = hashParams.get("refresh_token");

            if (accessToken && refreshToken) {
                console.log("Found auth tokens in URL, setting session...");

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

                    // Clean up the hash
                    window.location.hash = "";

                    // Redirect to home or dashboard
                    router.push("/");
                    router.refresh();
                }
            }
        };

        handleAuthCallback();
    }, [router]);

    return null; // This component doesn't render anything
}
