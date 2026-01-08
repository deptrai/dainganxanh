/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                brand: {
                    50: '#F0FFF4',
                    100: '#C6E6C6',
                    500: '#2E8B57', // Forest Green
                    600: '#1A3320', // Deep Green Text
                    900: '#0F2615',
                },
                accent: {
                    gold: '#FFD700',
                    blue: '#87CEEB',
                }
            },
            fontFamily: {
                serif: ['Lora', 'serif'],
                sans: ['Raleway', 'sans-serif'],
            },
            borderRadius: {
                'organic': '24px',
            },
            boxShadow: {
                'soft': '0 10px 40px -10px rgba(46, 139, 87, 0.15)',
            }
        },
    },
    plugins: [],
}
