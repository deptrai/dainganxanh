import Image from 'next/image'
import { FadeIn, StaggerContainer, StaggerItem, ParallaxImage, ScaleHover, TextReveal } from '@/components/MotionWrapper'

export default function HomePage() {
    return (
        <main className="overflow-x-hidden">
            {/* Navbar - Glassmorphism */}
            <nav className="fixed w-full z-50 transition-all duration-300 top-0 py-4">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <FadeIn delay={0.2} className="flex justify-between items-center glass-card rounded-full px-6 py-3 shadow-soft backdrop-blur-md bg-white/70 border border-white/50">
                        <div className="flex items-center space-x-2 cursor-pointer">
                            <span className="text-2xl font-serif font-bold text-brand-500">Đại Ngàn Xanh</span>
                        </div>
                        <div className="hidden md:flex space-x-8">
                            <a href="#about" className="text-brand-600 hover:text-brand-500 font-medium transition-colors hover:scale-105 transform duration-200">Câu Chuyện Đại Ngàn Dó Đen Việt</a>
                            <a href="#how-it-works" className="text-brand-600 hover:text-brand-500 font-medium transition-colors hover:scale-105 transform duration-200">Cách Tham Gia</a>
                            <a href="#dashboard" className="text-brand-600 hover:text-brand-500 font-medium transition-colors hover:scale-105 transform duration-200">Vườn Của Tôi</a>
                        </div>
                        <ScaleHover>
                            <button className="bg-brand-500 hover:bg-brand-600 text-white px-6 py-2 rounded-full font-medium shadow-lg hover:shadow-xl transition-all">
                                Trồng Ngay
                            </button>
                        </ScaleHover>
                    </FadeIn>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <ParallaxImage
                        src="/hero-forest.png"
                        alt="Rừng Dó Đen bình minh"
                        className="w-full h-full"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-brand-900/40"></div>
                </div>

                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-20">
                    <FadeIn delay={0.4} className="inline-block">
                        <div className="px-5 py-2 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white mb-8 animate-pulse shadow-lg">
                            <span className="font-bold text-accent-gold text-lg">138,592</span> / 1,000,000 cây đã bén rễ
                        </div>
                    </FadeIn>

                    <h1 className="font-serif text-5xl md:text-7xl font-bold text-white mb-8 leading-tight text-shadow">
                        <TextReveal text="Gieo Hạt Mầm Xanh" className="block text-white mb-2" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-gold to-brand-100 block">Dệt Đại Ngàn, Gặt Phước Báu</span>
                    </h1>
                    <FadeIn delay={0.8}>
                        <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto mb-12 font-light font-serif leading-relaxed drop-shadow-md">
                            Cùng viết tên bạn vào 1.000.000 cây rừng Dó Đen Việt. Chỉ với 260.000 VNĐ, bạn đang gửi một lời tạ lỗi chân thành đến Mẹ Thiên Nhiên.
                        </p>
                    </FadeIn>

                    <FadeIn delay={1.0} className="flex flex-col sm:flex-row justify-center gap-6">
                        <ScaleHover>
                            <button className="bg-accent-gold hover:bg-yellow-400 text-brand-900 text-lg px-10 py-4 rounded-full font-bold shadow-soft hover:shadow-lg transition-all ring-4 ring-accent-gold/30">
                                Gieo Mầm Ngay – 260.000đ
                            </button>
                        </ScaleHover>
                        <ScaleHover>
                            <button className="glass-card hover:bg-white/90 text-white hover:text-brand-600 text-lg px-10 py-4 rounded-full font-bold transition-all flex items-center justify-center gap-2 group backdrop-blur-sm bg-white/10 hover:bg-white border-white/30">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Video Giới Thiệu
                            </button>
                        </ScaleHover>
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
                                    Tại Sao Phải Là Bây Giờ?
                                    <span className="absolute -bottom-2 left-0 w-1/2 h-1 bg-accent-gold rounded-full"></span>
                                </h2>
                            </FadeIn>
                            <FadeIn delay={0.2}>
                                <p className="text-lg text-gray-700 leading-relaxed text-justify">
                                    Những cánh rừng Việt Nam đang ngày càng thu hẹp, những cơn bão dữ dội hơn, những trận lũ lụt kinh hoàng, và thời tiết ngày càng thay đổi cực đoan hơn là những lời thì thầm mà Mẹ Thiên Nhiên đang cảnh báo chúng ta. <strong>Dó Đen</strong> - một loài cây bản địa kiên cường, lá xanh quanh năm, âm thầm lọc sạch không khí, trả lại bầu khí quyển trong lành.
                                </p>
                            </FadeIn>
                            <FadeIn delay={0.4}>
                                <div className="bg-white p-6 rounded-organic shadow-soft border border-brand-100 hover:shadow-lg transition-shadow duration-300">
                                    <p className="italic text-brand-500 font-serif text-xl border-l-4 border-accent-gold pl-4">
                                        &ldquo;Bạn không cần rời bỏ phố thị phồn hoa để lấm lem bùn đất. Ngay tại đây, chỉ với một cú chạm, bạn đã có thể trở thành một phần của Đại Ngàn.&rdquo;
                                    </p>
                                </div>
                            </FadeIn>
                        </div>
                        <FadeIn delay={0.4} className="relative group perspective-1000">
                            <div className="absolute -inset-2 bg-gradient-to-r from-brand-500 to-accent-gold rounded-organic blur opacity-30 group-hover:opacity-60 transition duration-1000 group-hover:duration-200"></div>
                            <ScaleHover className="relative">
                                <Image
                                    src="/sapling-hands.png"
                                    alt="Mầm sống trên tay"
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
                            <span className="text-accent-gold font-bold tracking-widest uppercase mb-2 block">Giá Trị Của Người Gieo Mầm</span>
                            <h2 className="font-serif text-4xl md:text-5xl font-bold text-brand-600 mb-6">Hơn Cả Một Cái Cây, <br />Bạn Sở Hữu Một Di Sản</h2>
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
                                title: 'Một Sinh Mệnh Thật',
                                description: 'Cây Dó Đen được ươm mầm và nâng niu, đang hít thở và âm thầm phát triển tại Cao nguyên Bình Phước, và cái cây ấy ngày càng lớn lên mang theo Tình Yêu và lòng Tri Ân mà Bạn dành tặng lại cho Mẹ Thiên Nhiên.'
                            },
                            {
                                icon: (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                ),
                                title: 'Minh Bạch Tuyệt Đối',
                                description: 'Sổ Khai Sinh Xanh (Hợp đồng pháp lý & Giấy chứng nhận) gửi tận tay. Cam kết nuôi sống, hoặc trồng lại nếu cây chết.'
                            },
                            {
                                icon: (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                ),
                                title: 'Trang Quản Lý Số',
                                description: 'Theo dõi cây lớn lên từng ngày qua "Vườn Của Tôi". Ảnh chụp thực tế và video cập nhật mỗi quý.'
                            },
                            {
                                icon: (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                    </svg>
                                ),
                                title: 'Phước Báu Trao Tay',
                                description: 'Bình an khi biết rằng đâu đó có một mầm sống đang lớn lên nhờ tình yêu của bạn.'
                            }
                        ].map((benefit, index) => (
                            <StaggerItem key={index} className="group p-8 rounded-3xl bg-brand-50 hover:bg-brand-500 transition-all duration-500 hover:-translate-y-2 hover:shadow-xl cursor-default">
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

            {/* Dashboard Preview */}
            <section id="dashboard" className="py-24 bg-brand-900 text-white relative overflow-hidden">
                <div className="absolute inset-0 z-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] parallax-bg"></div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 grid lg:grid-cols-2 gap-16 items-center">
                    <div className="relative perspective-2000">
                        <div className="absolute inset-0 bg-accent-gold rounded-full blur-[120px] opacity-20 animate-pulse-slow"></div>
                        <FadeIn delay={0.2} className="relative z-10">
                            <Image
                                src="/dashboard-mockup.png"
                                alt="Dashboard Vườn Của Tôi"
                                width={600}
                                height={800}
                                className="relative rounded-[40px] border-8 border-brand-800 shadow-2xl rotate-3 hover:rotate-0 transition duration-700 ease-out transform hover:scale-[1.02]"
                            />
                        </FadeIn>
                    </div>

                    <div className="space-y-8">
                        <FadeIn>
                            <span className="text-accent-gold font-bold tracking-widest uppercase">Thiên Nhiên và Công Nghệ được ứng dụng</span>
                            <h2 className="font-serif text-4xl lg:text-5xl font-bold leading-tight mt-2">Khu Vườn Trong Túi Bạn</h2>
                        </FadeIn>
                        <FadeIn delay={0.2}>
                            <p className="text-xl text-brand-100/90 font-light">&ldquo;Đây không phải dự án trên giấy. Đây là sự sống thật, đang sinh sôi và được theo dõi, giám sát thông qua công nghệ.&rdquo;</p>
                        </FadeIn>

                        <StaggerContainer className="space-y-4">
                            {[
                                'Bản đồ vệ tinh vị trí cây chính xác',
                                'Hệ thống camera/ drone trực tiếp cập nhật hình ảnh',
                                'Chỉ số CO2 hấp thụ & sự phát triển của cây'
                            ].map((item, index) => (
                                <StaggerItem key={index} className="flex items-center gap-4">
                                    <span className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center shadow-lg shadow-brand-500/50">✓</span>
                                    <span className="text-lg">{item}</span>
                                </StaggerItem>
                            ))}
                        </StaggerContainer>

                        <FadeIn delay={0.6}>
                            <ScaleHover>
                                <button className="bg-white text-brand-900 px-8 py-3 rounded-full font-bold hover:bg-brand-50 transition-colors mt-4 shadow-lg hover:shadow-white/20">
                                    Xem Vườn Trồng Tập Trung
                                </button>
                            </ScaleHover>
                        </FadeIn>
                    </div>
                </div>
            </section>

            {/* How it Works */}
            <section id="how-it-works" className="py-24 bg-brand-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <FadeIn>
                        <h2 className="font-serif text-4xl font-bold text-center text-brand-600 mb-16">Hành Trình Trao Gửi Sự Sống</h2>
                    </FadeIn>

                    <StaggerContainer className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        {[
                            { number: 1, title: 'Chọn Số Lượng', description: 'Bạn muốn gieo bao nhiêu mầm xanh?' },
                            { number: 2, title: 'Đăng Ký', description: 'Để lại thông tin để cây nhận chủ nhân.' },
                            { number: 3, title: 'Thanh Toán', description: 'Cổng thanh toán bảo mật, an toàn và nhanh chóng.' },
                            { number: 4, title: 'Nhận Di Sản', description: 'Nhận Hợp đồng và Mã cây. Bắt đầu theo dõi quá trình phát triển.' }
                        ].map((step) => (
                            <StaggerItem key={step.number} className="relative text-center group cursor-default">
                                <div className="w-16 h-16 mx-auto bg-brand-500 text-white rounded-full flex items-center justify-center text-2xl font-bold mb-6 shadow-lg z-10 relative border-4 border-brand-50 group-hover:scale-110 group-hover:bg-accent-gold group-hover:text-brand-900 transition-all duration-300">
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
                        <h2 className="font-serif text-4xl font-bold text-center text-brand-600 mb-12">Những Lời Giải Đáp Chân Thành</h2>
                    </FadeIn>

                    <StaggerContainer className="space-y-6">
                        {[
                            {
                                question: 'Cây có thật không? Tôi có thể đến thăm không?',
                                answer: 'Thật như hơi thở của bạn. Chúng tôi chào đón bạn ghé thăm vườn bất cứ lúc nào để tận tay chạm vào thân cây xù xì và thoang thoảng mùi trầm tự nhiên khi cây lớn.'
                            },
                            {
                                question: 'Nếu cây không may qua đời thì sao?',
                                answer: 'Luôn có những rủi ro và những biến cố bất ngờ. Tuy nhiên, chúng tôi cam kết rằng nếu không phải vì nguyên nhân do thiên tai, dịch bệnh thì trong suốt 5 năm, Bạn trồng 1 cây, chắc chắn sẽ có 1 cây trưởng thành.'
                            },
                            {
                                question: 'Tại sao lại là 260.000 VNĐ?',
                                answer: 'Đó là chi phí trọn gói cho: cây giống, đất được thuê để trồng cây và 5 năm (60 tháng) công và phí chăm sóc, phân bón, bảo vệ và công nghệ quản lý cho cây của bạn. Chỉ với chưa đến 150 đồng mỗi ngày để nuôi dưỡng một sự sống.'
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
                            &ldquo;Hôm nay bạn gieo một hạt mầm xanh, <br />5 năm nữa con bạn sẽ có bóng mát của cả một khu rừng.&rdquo;
                        </h2>
                    </FadeIn>

                    <FadeIn delay={0.3}>
                        <ScaleHover>
                            <button className="bg-accent-gold hover:bg-yellow-400 text-brand-900 text-xl px-12 py-5 rounded-full font-bold shadow-soft hover:shadow-2xl transition-all mb-6 ring-4 ring-accent-gold/30">
                                Bắt Đầu Hành Trình Gieo Hạt
                            </button>
                        </ScaleHover>
                        <p className="text-brand-100 text-sm opacity-80 mt-4 font-light tracking-wide">Bạn hoàn toàn có thể trồng thêm bất cứ lúc nào trong Vườn Của Tôi.</p>
                    </FadeIn>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-brand-900 text-white/60 py-12 border-t border-white/10">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <FadeIn>
                        <p className="font-serif text-brand-100 mb-4 text-lg tracking-widest">Đại Ngàn Xanh - Dó Đen Việt</p>
                        <p className="text-sm">© 2026 Copyright by Dai Ngan Xanh Project. All rights reserved.</p>
                    </FadeIn>
                </div>
            </footer>
        </main>
    )
}
