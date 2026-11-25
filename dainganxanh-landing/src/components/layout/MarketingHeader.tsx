"use client";

import { useEffect, useState } from "react";
import { Link, usePathname } from '@/i18n/navigation'
import { useTranslations } from "next-intl";
import { createBrowserClient } from "@/lib/supabase/client";
import Image from "next/image";
import { Home, TreePine, Share2, Package, LogIn, BookOpen, UserCircle, ShoppingBag, PackageCheck, Compass } from "lucide-react";
import { UserHeader } from "./UserHeader";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { cn } from "@/lib/utils";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface NavConfigItem {
    key: 'home' | 'pricing' | 'store' | 'ecoTourism' | 'blog' | 'myGarden' | 'referrals' | 'orders' | 'profile';
    href: string;
    icon: typeof Home;
}

const baseNavItems: NavConfigItem[] = [
    { key: 'home', href: '/', icon: Home },
    { key: 'pricing', href: '/pricing', icon: Package },
    { key: 'store', href: '/store', icon: ShoppingBag },
    { key: 'ecoTourism', href: '/eco-tourism', icon: Compass },
];

const guestOnlyItems: NavConfigItem[] = [
    { key: 'blog', href: '/blog', icon: BookOpen },
];

const sharedNavItems: NavConfigItem[] = [
    { key: 'myGarden', href: '/crm/my-garden', icon: TreePine },
    { key: 'referrals', href: '/crm/referrals', icon: Share2 },
];

const authOnlyItems: NavConfigItem[] = [
    { key: 'orders', href: '/crm/my-store-orders', icon: PackageCheck },
    { key: 'profile', href: '/crm/profile', icon: UserCircle },
];

const guestNavItems = [...baseNavItems, ...guestOnlyItems, ...sharedNavItems];
const authNavItems = [...baseNavItems, ...sharedNavItems, ...authOnlyItems];

export function MarketingHeader() {
    const pathname = usePathname();
    const t = useTranslations('common');
    const [user, setUser] = useState<SupabaseUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const supabase = createBrowserClient();

        // Get initial session from localStorage (no network call)
        const fetchUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setUser(session?.user ?? null);
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
                            <Image src="/logo.png" alt={t('brand.name')} width={32} height={40} className="object-contain" />
                            <span className="font-bold text-lg text-emerald-800">{t('brand.name')}</span>
                        </Link>
                        
                        {/* Language Switcher + Login Button */}
                        <div className="flex items-center gap-2">
                            <LanguageSwitcher />
                            <Link 
                                href="/login"
                                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                            >
                                <LogIn className="w-4 h-4" />
                                <span>{t('nav.login')}</span>
                            </Link>
                        </div>
                    </div>
                )
            )}

            {/* Navigation Menu */}
            <nav className="border-t border-gray-100 bg-white overflow-x-auto">
                <div className="flex justify-center w-full min-w-max md:min-w-0 px-2">
                    <div className="flex w-full max-w-2xl justify-between">
                        {(user ? authNavItems : guestNavItems).map((item) => {
                            const active = isActive(item.href);
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "flex-1 flex flex-col items-center justify-center py-3 px-3 text-xs font-medium transition-colors border-b-2 whitespace-nowrap",
                                        active
                                            ? "border-emerald-500 text-emerald-600"
                                            : "border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                                    )}
                                >
                                    <item.icon className={cn("w-5 h-5 mb-1", active && "stroke-[2.5px]")} />
                                    <span>{t(`nav.${item.key}`)}</span>
                                </Link>
                            )
                        })}
                    </div>
                </div>
            </nav>
        </div>
    );
}
