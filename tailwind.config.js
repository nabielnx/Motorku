import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.jsx',      
    ],

    theme: {
        extend: {
            spacing: {
                '18': '4.5rem',
            },
            colors: {
                primary: '#4066AD',       // Biru Laut
                primaryDark: '#003882',   // Biru Gelap
                accentYellow: '#FFDD00',  // Kuning Cerah
                accentRed: '#EF4444',     // Merah
                brandGray: '#64748B',     // Abu-abu
            },
            fontFamily: {
                sans: ['"Plus Jakarta Sans"', ...defaultTheme.fontFamily.sans],
                heading: ['"Outfit"', ...defaultTheme.fontFamily.sans],
            },
            borderRadius: {
                'none': '0px',
                'xs': '2px',
                'sm': '2px',
                'DEFAULT': '3px',
                'md': '3px',
                'lg': '4px',
                'xl': '6px',
                '2xl': '8px',
                '3xl': '10px',
                'full': '9999px',
            },
        },
    },

    plugins: [forms],
};