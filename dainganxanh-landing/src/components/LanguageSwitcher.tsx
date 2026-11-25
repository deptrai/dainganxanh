"use client";

import { useEffect, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { updateUserLocale } from "@/actions/userLocale";
import { Globe } from "lucide-react";

let isFormDirty = false;

/**
 * Builds the NEXT_LOCALE cookie string, adding ; Secure if running over https.
 */
export function buildLocaleCookie(targetLocale: 'vi' | 'en', protocol?: string): string {
  const isSecure = (protocol ?? (typeof window !== 'undefined' ? window.location.protocol : '')) === 'https:';
  return `NEXT_LOCALE=${targetLocale}; path=/; max-age=31536000; SameSite=Lax${isSecure ? '; Secure' : ''}`;
}

/**
 * Returns whether any form element has registered user input.
 */
export function isAnyFormDirty(): boolean {
  return isFormDirty;
}

/**
 * Resets the dirty-form flag.
 */
export function resetDirty(): void {
  isFormDirty = false;
}

interface LanguageSwitcherProps {
  className?: string;
  variant?: "pill" | "minimal";
}

export function LanguageSwitcher({ className = "", variant: _variant = "pill" }: LanguageSwitcherProps) {
  const locale = useLocale() as "vi" | "en";
  const t = useTranslations("common");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const handleDirtyInteraction = (event: Event) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      const tagName = target.tagName?.toLowerCase();
      if (tagName === "input" || tagName === "textarea" || tagName === "select") {
        const inputEl = target as HTMLInputElement;
        if (
          inputEl.type === "hidden" ||
          inputEl.type === "submit" ||
          inputEl.type === "button" ||
          inputEl.type === "reset"
        ) {
          return;
        }
        isFormDirty = true;
      }
    };

    document.addEventListener("input", handleDirtyInteraction, { capture: true });
    document.addEventListener("change", handleDirtyInteraction, { capture: true });

    return () => {
      document.removeEventListener("input", handleDirtyInteraction, { capture: true });
      document.removeEventListener("change", handleDirtyInteraction, { capture: true });
    };
  }, []);

  useEffect(() => {
    isFormDirty = false;
  }, [pathname]);

  const handleSwitch = (targetLocale: "vi" | "en") => {
    if (targetLocale === locale || isPending) return;

    if (isAnyFormDirty()) {
      if (!window.confirm(t("switcher.dirtyFormWarning"))) {
        return;
      }
    }

    // Set cookie immediately for API routes and SSR negotiation
    document.cookie = buildLocaleCookie(targetLocale);

    // Persist to user record in DB if logged in (fire-and-forget)
    updateUserLocale(targetLocale).catch((err) => {
      console.error("[LanguageSwitcher] Failed to persist user locale:", err);
    });

    const search = searchParams?.toString();
    const targetPath = search ? `${pathname}?${search}` : pathname;

    // Localized client navigation
    startTransition(() => {
      isFormDirty = false;
      router.replace(targetPath, { locale: targetLocale });
    });
  };

  return (
    <div
      role="group"
      aria-label={t("switcher.ariaLabel")}
      className={`inline-flex items-center rounded-lg bg-gray-100 p-0.5 text-xs font-semibold text-gray-600 ${className}`}
    >
      <div className="flex items-center px-1 text-gray-400" aria-hidden="true">
        <Globe className="w-3.5 h-3.5" />
      </div>
      <button
        type="button"
        onClick={() => handleSwitch("vi")}
        disabled={isPending}
        aria-pressed={locale === "vi"}
        aria-label={t("switcher.vi")}
        className={`px-2 py-1 rounded-md transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
          locale === "vi"
            ? "bg-white text-emerald-800 shadow-sm font-bold"
            : "text-gray-500 hover:text-gray-900 hover:bg-gray-200/60"
        }`}
      >
        VI
      </button>
      <button
        type="button"
        onClick={() => handleSwitch("en")}
        disabled={isPending}
        aria-pressed={locale === "en"}
        aria-label={t("switcher.en")}
        className={`px-2 py-1 rounded-md transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
          locale === "en"
            ? "bg-white text-emerald-800 shadow-sm font-bold"
            : "text-gray-500 hover:text-gray-900 hover:bg-gray-200/60"
        }`}
      >
        EN
      </button>
    </div>
  );
}
