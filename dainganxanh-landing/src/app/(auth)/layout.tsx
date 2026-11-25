import type { Metadata } from 'next'
import '../globals.css'

export const metadata: Metadata = {
    title: 'Xác thực | Đại Ngàn Xanh',
    robots: {
        index: false,
        follow: false,
    },
}

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="vi">
            <body className="antialiased">
                {children}
            </body>
        </html>
    )
}
