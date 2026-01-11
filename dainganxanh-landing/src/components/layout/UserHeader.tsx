"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase/client";
import { LogOut, User } from "lucide-react";
import type { User as SupabaseUser } from "@supabase/supabase-js";

export function UserHeader() {
    const router = useRouter();
    const [user, setUser] = useState<SupabaseUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const supabase = createBrowserClient();

        // Get initial session using getUser() for proper validation
        const fetchUser = async () => {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            setUser(authUser);
            setLoading(false);
        };

        fetchUser();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user || null);
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleLogout = async () => {
        const supabase = createBrowserClient();
        try {
            await supabase.auth.signOut();
            // Use hard redirect to ensure cookies are cleared
            window.location.href = "/";
        } catch (error) {
            console.error("Logout error:", error);
        }
    };

    if (loading) {
        return null; // Or a skeleton loader
    }

    if (!user) {
        return null; // Don't show anything if not logged in
    }

    const displayName = user.user_metadata?.full_name || user.email?.split("@")[0] || "User";
    const displayEmail = user.email || user.phone || "";

    return (
        <div className="flex items-center gap-3 px-4 py-2 bg-white border-b border-gray-200">
            <div className="flex items-center gap-2 flex-1">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                    <User className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{displayName}</p>
                    <p className="text-xs text-gray-600 truncate">{displayEmail}</p>
                </div>
            </div>
            <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Đăng xuất"
            >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Đăng xuất</span>
            </button>
        </div>
    );
}
