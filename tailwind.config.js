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
            colors: {
                primary: '#9ECAE1',     // Biru #9ECAE1
                primaryDark: '#1E3A8A', // Biru Tua Navy
                accentYellow: '#F59E0B',// Kuning
                accentRed: '#EF4444',   // Merah
                brandGray: '#64748B',   // Abu-abu
            },
            fontFamily: {
                sans: ['Figtree', ...defaultTheme.fontFamily.sans],
            },
        },
    },

    plugins: [forms],
};