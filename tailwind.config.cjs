/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './index.html',
        './src/**/*.{js,jsx,ts,tsx}',
    ],
    theme: {
        extend: {
            colors: {
                // Warm, sophisticated dining colors
                'warm-gray': {
                    50: '#fafaf9',
                    100: '#f5f5f4',
                    200: '#e7e5e4',
                    300: '#d6d3d1',
                    400: '#a8a29e',
                    500: '#78716c',
                    600: '#57534e',
                    700: '#44403c',
                    800: '#292524',
                    900: '#1c1917',
                },
                'sage': {
                    50: '#f6f7f6',
                    100: '#e8ebe8',
                    200: '#d1d7d1',
                    300: '#b4beb4',
                    400: '#93a693',
                    500: '#6b8068',
                    600: '#5a6e57',
                    700: '#485948',
                    800: '#394539',
                    900: '#2d362d',
                },
                'cream': {
                    50: '#fefdfb',
                    100: '#fefcf8',
                    200: '#fdf8f1',
                    300: '#fbf2e6',
                    400: '#f7e6d1',
                    500: '#f0d4b8',
                },
            },
            spacing: {
                '18': '4.5rem',
            },
            scale: {
                '98': '0.98',
            }
        },
    },
    plugins: [],
}
