"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase/client";
import { Home, TreePine, Share2, Package, User, LogIn, BookOpen, UserCircle } from "lucide-react";
import { UserHeader } from "./UserHeader";
import { cn } from "@/lib/utils";
import type { User as SupabaseUser } from "@supabase/supabase-js";

const baseNavItems = [
    { name: 'Trang chủ', href: '/', icon: Home },
    { name: 'Mua cây', href: '/pricing', icon: Package },
]

const guestOnlyItems = [
    { name: 'Blog', href: '/blog', icon: BookOpen },
]

const sharedNavItems = [
    { name: 'Vườn của tôi', href: '/crm/my-garden', icon: TreePine },
    { name: 'Giới thiệu', href: '/crm/referrals', icon: Share2 },
]

const authOnlyItems = [
    { name: 'Hồ sơ', href: '/crm/profile', icon: UserCircle },
]

const guestNavItems = [...baseNavItems, ...guestOnlyItems, ...sharedNavItems]
const authNavItems = [...baseNavItems, ...sharedNavItems, ...authOnlyItems]

export function MarketingHeader() {
    const pathname = usePathname();
    const [user, setUser] = useState<SupabaseUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const supabase = createBrowserClient();

        // Get initial session
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

    // Helper to determine active state
    const isActive = (path: string) => {
        if (path === '/' && pathname === '/') return true;
        if (path !== '/' && pathname.startsWith(path)) return true;
        return false;
    };

    return (
        <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
            {/* Top Bar: User Info OR Brand+Login */}
            {!loading && (
                user ? (
                    <UserHeader />
                ) : (
                    <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-gray-200">
                        {/* Brand */}
                        <Link href="/" className="flex items-center gap-2">
                             <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                                <TreePine className="w-5 h-5 text-emerald-600" />
                            </div>
                            <span className="font-bold text-lg text-emerald-800">Đại Ngàn Xanh</span>
                        </Link>
                        
                        {/* Login Button */}
                        <Link 
                            href="/login"
                            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                        >
                            <LogIn className="w-4 h-4" />
                            <span>Đăng nhập</span>
                        </Link>
                    </div>
                )
            )}

            {/* Navigation Menu */}
            <nav className="border-t border-gray-100 bg-white overflow-x-auto">
                <div className="flex justify-center w-full">
                    <div className="flex w-full max-w-md">
                        {(user ? authNavItems : guestNavItems).map((item) => {
                            const active = isActive(item.href);
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "flex-1 flex flex-col items-center justify-center py-3 px-2 text-xs font-medium transition-colors border-b-2",
                                        active
                                            ? "border-emerald-500 text-emerald-600"
                                            : "border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                                    )}
                                >
                                    <item.icon className={cn("w-5 h-5 mb-1", active && "stroke-[2.5px]")} />
                                    <span className="truncate max-w-[80px]">{item.name}</span>
                                </Link>
                            )
                        })}
                    </div>
                </div>
            </nav>
        </div>
    );
}
