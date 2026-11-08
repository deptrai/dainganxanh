import Image from 'next/image'
import { Link } from '@/i18n/navigation'
import { Compass, ShoppingBag, ArrowRight } from 'lucide-react'
import { FadeIn, StaggerContainer, StaggerItem, ScaleHover } from '@/components/MotionWrapper'
import { AuthCallbackHandler } from '@/components/AuthCallbackHandler'
import { AuthNavLink } from '@/components/AuthNavLink'
import { ReferralTracker } from '@/components/ReferralTracker'
import { VideoButton } from '@/components/marketing/VideoButton'
import { HeroVideo } from '@/components/marketing/HeroVideo'
import { TreeCounter } from '@/components/marketing/TreeCounter'
import { SocialProofWidget } from '@/components/marketing/SocialProofWidget'
import { CTAButton } from '@/components/marketing/CTAButton'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { fetchRecentOrders, fetchActiveOrderCount } from '@/actions/socialProof'
import { getTranslations, setRequestLocale } from 'next-intl/server'

export const dynamic = 'force-dynamic'; // Tree counter cần real-time, không cache

export default async function HomePage({
    params,
    searchParams,
}: {
    params: Promise<{ locale: string }>
    searchParams: Promise<{ ref?: string }>
}) {
    const { locale } = await params
    setRequestLocale(locale)
    const t = await getTranslations('landing')
    const urlParams = await searchParams
    const refCode = urlParams.ref

    // Fetch tree count from completed orders server-side (service role to bypass RLS)
    let treeCount = 0
    try {
        const supabase = createServiceRoleClient()
        const { data, error } = await supabase
            .from('orders')
            .select('quantity')
            .in('status', ['paid', 'verified', 'assigned', 'completed'])
        if (error) console.error('[TreeCounter] fetch error:', error.message)
        if (data) {
            treeCount = data.reduce((sum, row) => sum + (row.quantity ?? 0), 0)
        }
        console.log('[TreeCounter] count:', treeCount)
    } catch (err) {
        console.error('[TreeCounter] exception:', err)
    }

    const [recentOrders, activeOrderCount] = await Promise.all([
        fetchRecentOrders(10),
        fetchActiveOrderCount(),
    ])

    return (
        <main className="overflow-x-hidden">
            <ReferralTracker refCode={refCode} />
            <SocialProofWidget orders={recentOrders} activeCount={activeOrderCount} />
            <AuthCallbackHandler />
            {/* Navbar - Glassmorphism */}
            <nav className="fixed w-full z-50 transition-all duration-300 top-0 py-4">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <FadeIn delay={0.2} className="flex justify-between items-center glass-card rounded-full px-5 py-3 shadow-soft backdrop-blur-md bg-white/80 border border-white/50">
                        <Link href="/" className="flex items-center space-x-2 cursor-pointer">
                            <span className="text-xl md:text-2xl font-serif font-bold text-brand-500">{t('nav.brand')}</span>
                        </Link>
                        <div className="hidden lg:flex items-center space-x-6">
                            <a href="#about" className="text-brand-600 hover:text-brand-500 font-medium transition-colors hover:scale-105 transform duration-200 text-sm">{t('nav.story')}</a>
                            <a href="#product" className="text-brand-600 hover:text-brand-500 font-medium transition-colors hover:scale-105 transform duration-200 text-sm">{t('nav.doDenViet')}</a>
                            <Link href="/eco-tourism" className="text-emerald-700 hover:text-emerald-800 font-semibold transition-colors hover:scale-105 transform duration-200 text-sm flex items-center gap-1.5">
                                <Compass className="w-4 h-4 text-emerald-600" />
                                <span>{t('nav.ecoTourism')}</span>
                            </Link>
                            <Link href="/store" className="text-amber-800 hover:text-amber-900 font-semibold transition-colors hover:scale-105 transform duration-200 text-sm flex items-center gap-1.5">
                                <ShoppingBag className="w-4 h-4 text-amber-600" />
                                <span>{t('nav.store')}</span>
                            </Link>
                            <Link href="/blog" className="text-brand-600 hover:text-brand-500 font-medium transition-colors hover:scale-105 transform duration-200 text-sm">{t('nav.blog')}</Link>
                            <AuthNavLink />
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3">
                            <LanguageSwitcher />
                            <Link href="/eco-tourism" className="lg:hidden text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 rounded-full border border-emerald-200 transition-colors">
                                {t('nav.mobileTour')}
                            </Link>
                            <Link href="/store" className="lg:hidden text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 px-2.5 py-1.5 rounded-full border border-amber-200 transition-colors">
                                {t('nav.mobileStore')}
                            </Link>
                            <ScaleHover>
                                <Link href="/pricing">
                                    <button className="bg-brand-600 hover:bg-brand-600 text-white px-4 sm:px-6 py-2 rounded-full font-medium text-sm shadow-lg hover:shadow-xl transition-all">
                                        {t('nav.plantNow')}
                                    </button>
                                </Link>
                            </ScaleHover>
                        </div>
                    </FadeIn>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
                <HeroVideo src="/hero-video.mp4" poster="/hero-forest.png" />

                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-20">
                    <FadeIn delay={0.4} className="inline-block">
                        <TreeCounter initialCount={treeCount} />
                    </FadeIn>

                    <h1 className="font-serif text-5xl md:text-7xl font-bold text-white mb-8 leading-tight text-shadow">
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-emerald-300 to-white bg-[length:200%_auto] animate-gradient-x block drop-shadow-lg">{t('hero.headline')}</span>
                    </h1>
                    <FadeIn delay={0.8}>
                        <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto mb-12 font-light font-serif leading-relaxed drop-shadow-md">
                            {t('hero.lead')}
                        </p>
                    </FadeIn>

                    <FadeIn delay={1.0} className="flex flex-col sm:flex-row justify-center gap-6">
                        <CTAButton href="/pricing">{t('hero.ctaPlant')}</CTAButton>
                        <VideoButton />
                    </FadeIn>

                    {/* Quick Access to Eco-Tourism & Store */}
                    <FadeIn delay={1.2} className="mt-10 flex flex-wrap justify-center gap-4">
                        <Link
                            href="/eco-tourism"
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-900/70 backdrop-blur-md border border-emerald-400/50 text-emerald-100 hover:bg-emerald-800/90 hover:scale-105 transition-all text-sm font-medium shadow-lg"
                        >
                            <Compass className="w-4 h-4 text-emerald-300" />
                            <span>{t('hero.quickTour')}</span>
                            <ArrowRight className="w-4 h-4 text-emerald-300" />
                        </Link>
                        <Link
                            href="/store"
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-amber-950/70 backdrop-blur-md border border-amber-400/50 text-amber-100 hover:bg-amber-900/90 hover:scale-105 transition-all text-sm font-medium shadow-lg"
                        >
                            <ShoppingBag className="w-4 h-4 text-amber-300" />
                            <span>{t('hero.quickStore')}</span>
                            <ArrowRight className="w-4 h-4 text-amber-300" />
                        </Link>
                    </FadeIn>
                </div>
            </section>

            {/* The Why Section */}
            <section id="about" className="py-24 bg-brand-50 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-1/3 h-full bg-brand-100/30 organic-shape blur-3xl translate-x-1/4 animate-blob"></div>
                <div className="absolute bottom-0 left-0 w-1/4 h-2/3 bg-accent-gold/10 organic-shape blur-3xl -translate-x-1/4 animate-blob animation-delay-2000"></div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="grid md:grid-cols-2 gap-16 items-center">
                        <div className="space-y-8">
                            <FadeIn>
                                <h2 className="font-serif text-4xl font-bold text-brand-600 relative inline-block">
                                    {t('why.title')}
                                    <span className="absolute -bottom-2 left-0 w-1/2 h-1 bg-accent-gold rounded-full"></span>
                                </h2>
                            </FadeIn>
                            <FadeIn delay={0.2}>
                                <p className="text-lg text-gray-700 leading-relaxed text-justify">
                                    {t('why.p1')}
                                </p>
                            </FadeIn>
                            <FadeIn delay={0.4}>
                                <div className="bg-white p-6 rounded-organic shadow-soft border border-brand-100 hover:shadow-lg transition-shadow duration-300">
                                    <p className="italic text-brand-500 font-serif text-xl border-l-4 border-accent-gold pl-4">
                                        &ldquo;{t('why.quote')}&rdquo;
                                    </p>
                                </div>
                            </FadeIn>
                        </div>
                        <FadeIn delay={0.4} className="relative group perspective-1000">
                            <div className="absolute -inset-2 bg-gradient-to-r from-brand-500 to-accent-gold rounded-organic blur opacity-30 group-hover:opacity-60 transition duration-1000 group-hover:duration-200"></div>
                            <ScaleHover className="relative">
                                <Image
                                    src="/sapling-hands.png"
                                    alt={t('why.imageAlt')}
                                    width={600}
                                    height={600}
                                    className="rounded-organic shadow-2xl w-full object-cover z-10 relative"
                                />
                            </ScaleHover>
                        </FadeIn>
                    </div>
                </div>
            </section>

            {/* Product Benefits */}
            <section id="product" className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-20">
                        <FadeIn>
                            <span className="text-accent-gold font-bold tracking-widest uppercase mb-2 block">{t('product.badge')}</span>
                            <h2 className="font-serif text-4xl md:text-5xl font-bold text-brand-600 mb-6">
                                {t.rich('product.title', { br: () => <br /> })}
                            </h2>
                        </FadeIn>
                    </div>
                    <StaggerContainer className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[
                            {
                                icon: (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
                                    </svg>
                                ),
                                title: t('product.benefit1Title'),
                                description: t('product.benefit1Desc'),
                            },
                            {
                                icon: (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                ),
                                title: t('product.benefit2Title'),
                                description: t('product.benefit2Desc'),
                            },
                            {
                                icon: (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                ),
                                title: t('product.benefit3Title'),
                                description: t('product.benefit3Desc'),
                            },
                            {
                                icon: (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                    </svg>
                                ),
                                title: t('product.benefit4Title'),
                                description: t('product.benefit4Desc'),
                            }
                        ].map((benefit, index) => (
                            <StaggerItem key={index} className="group p-8 rounded-3xl bg-brand-50 hover:bg-brand-600 transition-all duration-500 hover:-translate-y-2 hover:shadow-xl cursor-default">
                                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-md text-brand-500 group-hover:text-brand-500 group-hover:scale-110 transition-transform duration-300">
                                    {benefit.icon}
                                </div>
                                <h3 className="font-serif text-xl font-bold mb-3 group-hover:text-white transition-colors">{benefit.title}</h3>
                                <p className="text-brand-600/80 group-hover:text-brand-50 transition-colors leading-relaxed">{benefit.description}</p>
                            </StaggerItem>
                        ))}
                    </StaggerContainer>
                </div>
            </section>

            {/* Eco-Tourism & Store Showcase */}
            <section className="py-24 bg-gradient-to-b from-white via-emerald-50/40 to-white relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <FadeIn>
                            <span className="text-emerald-700 font-bold tracking-widest uppercase text-sm bg-emerald-100 px-4 py-1.5 rounded-full inline-block mb-3">
                                {t('showcase.badge')}
                            </span>
                            <h2 className="font-serif text-3xl md:text-5xl font-bold text-gray-900 leading-tight">
                                {t('showcase.title')}
                            </h2>
                            <p className="mt-4 text-gray-600 text-base md:text-lg">
                                {t('showcase.subtitle')}
                            </p>
                        </FadeIn>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
                        {/* Card 1: Eco-Tourism / Book tour */}
                        <FadeIn delay={0.2} className="group relative rounded-3xl overflow-hidden border border-emerald-100 bg-white shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col">
                            <div className="relative aspect-[16/10] overflow-hidden bg-emerald-950">
                                <Image
                                    src="/images/lots/vuon-tram-huong-ba-vi.webp"
                                    alt={t('showcase.tourImageAlt')}
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                                <div className="absolute top-4 left-4 bg-emerald-600/90 text-white px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-sm flex items-center gap-1.5">
                                    <Compass className="w-3.5 h-3.5" />
                                    <span>{t('showcase.tourTag')}</span>
                                </div>
                                <div className="absolute bottom-4 left-4 right-4 text-white">
                                    <p className="text-xs text-emerald-300 font-medium">{t('showcase.tourLocation')}</p>
                                    <h3 className="text-xl md:text-2xl font-serif font-bold mt-1">{t('showcase.tourTitle')}</h3>
                                </div>
                            </div>
                            <div className="p-6 md:p-8 flex-1 flex flex-col justify-between">
                                <p className="text-gray-600 leading-relaxed text-sm md:text-base mb-6">
                                    {t('showcase.tourDesc')}
                                </p>
                                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                    <div>
                                        <p className="text-xs text-gray-400">{t('showcase.tourPriceFrom')}</p>
                                        <p className="text-lg font-bold text-emerald-700">{t('showcase.tourPrice')}</p>
                                    </div>
                                    <Link
                                        href="/eco-tourism"
                                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm shadow-md hover:shadow-lg transition-all"
                                    >
                                        <span>{t('showcase.tourCta')}</span>
                                        <ArrowRight className="w-4 h-4" />
                                    </Link>
                                </div>
                            </div>
                        </FadeIn>

                        {/* Card 2: Store */}
                        <FadeIn delay={0.4} className="group relative rounded-3xl overflow-hidden border border-amber-100 bg-white shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col">
                            <div className="relative aspect-[16/10] overflow-hidden bg-amber-950">
                                <Image
                                    src="/images/products/nhang-nu-tram-huong.webp"
                                    alt={t('showcase.storeImageAlt')}
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                                <div className="absolute top-4 left-4 bg-amber-600/90 text-white px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-sm flex items-center gap-1.5">
                                    <ShoppingBag className="w-3.5 h-3.5" />
                                    <span>{t('showcase.storeTag')}</span>
                                </div>
                                <div className="absolute bottom-4 left-4 right-4 text-white">
                                    <p className="text-xs text-amber-300 font-medium">{t('showcase.storeQuality')}</p>
                                    <h3 className="text-xl md:text-2xl font-serif font-bold mt-1">{t('showcase.storeTitle')}</h3>
                                </div>
                            </div>
                            <div className="p-6 md:p-8 flex-1 flex flex-col justify-between">
                                <p className="text-gray-600 leading-relaxed text-sm md:text-base mb-6">
                                    {t('showcase.storeDesc')}
                                </p>
                                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                    <div>
                                        <p className="text-xs text-gray-400">{t('showcase.storePriceFrom')}</p>
                                        <p className="text-lg font-bold text-amber-800">{t('showcase.storePrice')}</p>
                                    </div>
                                    <Link
                                        href="/store"
                                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-medium text-sm shadow-md hover:shadow-lg transition-all"
                                    >
                                        <span>{t('showcase.storeCta')}</span>
                                        <ArrowRight className="w-4 h-4" />
                                    </Link>
                                </div>
                            </div>
                        </FadeIn>
                    </div>
                </div>
            </section>

            {/* Dashboard Preview */}
            <section id="dashboard" className="py-24 bg-brand-900 text-white relative overflow-hidden">
                <div className="absolute inset-0 z-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] parallax-bg"></div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 grid lg:grid-cols-2 gap-16 items-center">
                    <div className="relative perspective-2000">
                        <div className="absolute inset-0 bg-accent-gold rounded-full blur-[120px] opacity-20 animate-pulse-slow"></div>
                        <FadeIn delay={0.2} className="relative z-10">
                            <Image
                                src="/dashboard-mockup.png"
                                alt={t('dashboard.imageAlt')}
                                width={600}
                                height={800}
                                className="relative rounded-[40px] border-8 border-brand-800 shadow-2xl rotate-3 hover:rotate-0 transition duration-700 ease-out transform hover:scale-[1.02]"
                            />
                        </FadeIn>
                    </div>

                    <div className="space-y-8">
                        <FadeIn>
                            <span className="text-accent-gold font-bold tracking-widest uppercase">{t('dashboard.badge')}</span>
                            <h2 className="font-serif text-4xl lg:text-5xl font-bold leading-tight mt-2">{t('dashboard.title')}</h2>
                        </FadeIn>
                        <FadeIn delay={0.2}>
                            <p className="text-xl text-brand-100/90 font-light">&ldquo;{t('dashboard.quote')}&rdquo;</p>
                        </FadeIn>

                        <StaggerContainer className="space-y-4">
                            {[
                                t('dashboard.f1'),
                                t('dashboard.f2'),
                                t('dashboard.f3')
                            ].map((item, index) => (
                                <StaggerItem key={index} className="flex items-center gap-4">
                                    <span className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center shadow-lg shadow-brand-500/50">✓</span>
                                    <span className="text-lg">{item}</span>
                                </StaggerItem>
                            ))}
                        </StaggerContainer>

                        <FadeIn delay={0.6}>
                            <ScaleHover>
                                <Link href="/pricing">
                                    <button className="bg-white text-brand-900 px-8 py-3 rounded-full font-bold hover:bg-brand-50 transition-colors mt-4 shadow-lg hover:shadow-white/20">
                                        {t('dashboard.cta')}
                                    </button>
                                </Link>
                            </ScaleHover>
                        </FadeIn>
                    </div>
                </div>
            </section>

            {/* How it Works */}
            <section id="how-it-works" className="py-24 bg-brand-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <FadeIn>
                        <h2 className="font-serif text-4xl font-bold text-center text-brand-600 mb-16">{t('howItWorks.title')}</h2>
                    </FadeIn>

                    <StaggerContainer className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        {[
                            { number: 1, title: t('howItWorks.step1Title'), description: t('howItWorks.step1Desc') },
                            { number: 2, title: t('howItWorks.step2Title'), description: t('howItWorks.step2Desc') },
                            { number: 3, title: t('howItWorks.step3Title'), description: t('howItWorks.step3Desc') },
                            { number: 4, title: t('howItWorks.step4Title'), description: t('howItWorks.step4Desc') },
                        ].map((step) => (
                            <StaggerItem key={step.number} className="relative text-center group cursor-default">
                                <div className="w-16 h-16 mx-auto bg-brand-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mb-6 shadow-lg z-10 relative border-4 border-brand-50 group-hover:scale-110 group-hover:bg-accent-gold group-hover:text-brand-900 transition-all duration-300">
                                    {step.number}
                                </div>
                                {step.number < 4 && (
                                    <div className="hidden md:block absolute top-8 left-1/2 w-full h-0.5 bg-brand-200 -z-0"></div>
                                )}
                                <h3 className="font-serif text-xl font-bold mb-2 group-hover:text-brand-500 transition-colors">{step.title}</h3>
                                <p className="text-sm text-gray-600 leading-relaxed px-4">{step.description}</p>
                            </StaggerItem>
                        ))}
                    </StaggerContainer>
                </div>
            </section>

            {/* FAQ Section */}
            <section className="py-24 bg-white">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <FadeIn>
                        <h2 className="font-serif text-4xl font-bold text-center text-brand-600 mb-12">{t('faq.title')}</h2>
                    </FadeIn>

                    <StaggerContainer className="space-y-6">
                        {[
                            {
                                question: t('faq.q1'),
                                answer: t('faq.a1')
                            },
                            {
                                question: t('faq.q2'),
                                answer: t('faq.a2')
                            },
                            {
                                question: t('faq.q3'),
                                answer: t('faq.a3')
                            }
                        ].map((faq, index) => (
                            <StaggerItem key={index} className="border border-brand-100 rounded-2xl p-6 hover:shadow-soft transition-all duration-300 bg-brand-50/30 hover:bg-white cursor-pointer group">
                                <h3 className="font-serif text-xl font-bold text-brand-800 mb-3 flex items-center">
                                    <span className="mr-3 text-brand-500 text-2xl group-hover:scale-125 transition-transform duration-300">?</span>
                                    {faq.question}
                                </h3>
                                <p className="text-gray-700 ml-8 leading-relaxed text-lg">{faq.answer}</p>
                            </StaggerItem>
                        ))}
                    </StaggerContainer>
                </div>
            </section>

            {/* Final CTA */}
            <section className="py-24 bg-brand-600 relative overflow-hidden text-center">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 animate-pulse-slow"></div>
                <div className="absolute top-0 left-0 w-64 h-64 bg-accent-gold rounded-full blur-[150px] opacity-20 animate-blob"></div>
                <div className="absolute bottom-0 right-0 w-64 h-64 bg-brand-400 rounded-full blur-[150px] opacity-20 animate-blob animation-delay-2000"></div>

                <div className="relative z-10 max-w-4xl mx-auto px-4">
                    <FadeIn>
                        <h2 className="font-serif text-4xl md:text-5xl font-bold text-white mb-10 leading-tight">
                            &ldquo;{t.rich('finalCta.quote', { br: () => <br /> })}&rdquo;
                        </h2>
                    </FadeIn>

                    <FadeIn delay={0.3}>
                        <ScaleHover>
                            <Link href="/pricing">
                                <button className="bg-accent-gold hover:bg-yellow-400 text-brand-900 text-xl px-12 py-5 rounded-full font-bold shadow-soft hover:shadow-2xl transition-all mb-6 ring-4 ring-accent-gold/30">
                                    {t('finalCta.button')}
                                </button>
                            </Link>
                        </ScaleHover>
                        <p className="text-brand-100 text-sm opacity-80 mt-4 font-light tracking-wide">{t('finalCta.note')}</p>
                    </FadeIn>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-brand-900 text-white py-16 border-t border-white/10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
                        {/* Cột 1 — Thương hiệu */}
                        <div>
                            <p className="font-serif text-2xl font-bold text-white mb-3">{t('footer.brand')}</p>
                            <p className="text-white/60 text-sm leading-relaxed mb-4">
                                {t('footer.tagline')}
                            </p>
                            <div className="flex gap-4">
                                <a href="https://www.facebook.com/profile.php?id=61585922638193" target="_blank" rel="noopener noreferrer"
                                    className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                                    </svg>
                                </a>
                                <a href="https://zalo.me/0922888169" target="_blank" rel="noopener noreferrer"
                                    className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                                    <span className="text-white text-xs font-bold">Zalo</span>
                                </a>
                            </div>
                        </div>

                        {/* Cột 2 — Navigation */}
                        <div>
                            <p className="text-white font-semibold mb-4 uppercase tracking-wider text-sm">{t('footer.colExplore')}</p>
                            <ul className="space-y-2 text-white/60 text-sm">
                                <li><a href="#about" className="hover:text-white transition-colors">{t('footer.linkStory')}</a></li>
                                <li><a href="#product" className="hover:text-white transition-colors">{t('footer.linkDoDen')}</a></li>
                                <li><Link href="/eco-tourism" className="hover:text-white transition-colors flex items-center gap-1.5 text-emerald-300 font-medium">🌿 {t('footer.linkEco')}</Link></li>
                                <li><Link href="/store" className="hover:text-white transition-colors flex items-center gap-1.5 text-amber-300 font-medium">✨ {t('footer.linkStore')}</Link></li>
                                <li><a href="#how-it-works" className="hover:text-white transition-colors">{t('footer.linkHow')}</a></li>
                                <li><Link href="/pricing" className="hover:text-white transition-colors">{t('footer.linkBuy')}</Link></li>
                                <li><Link href="/blog" className="hover:text-white transition-colors">{t('footer.linkBlog')}</Link></li>
                            </ul>
                        </div>

                        {/* Cột 3 — Thông tin công ty */}
                        <div>
                            <p className="text-white font-semibold mb-4 uppercase tracking-wider text-sm">{t('footer.colCompany')}</p>
                            <ul className="space-y-2 text-white/60 text-sm">
                                <li className="font-medium text-white/80">{t('footer.companyName')}</li>
                                <li>{t('footer.taxId')}: <a href="https://masothue.com/0319475343-cong-ty-co-phan-dai-ngan-xanh-group" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors underline">0319475343</a></li>
                                <li>{t.rich('footer.address', { br: () => <br /> })}</li>
                                <li>
                                    <a href="mailto:lienhe@dainganxanh.com.vn" className="hover:text-white transition-colors">
                                        lienhe@dainganxanh.com.vn
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className="border-t border-white/10 pt-8 text-center text-white/40 text-sm">
                        {t('footer.copyright')}
                    </div>
                </div>
            </footer>
        </main>
    )
}
