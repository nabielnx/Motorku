const DEFAULT_BRAND = {
    badge: "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 font-bold",
    activeBtn: "bg-blue-600 text-white border-blue-600 shadow-xs font-semibold",
    inactiveBtn: "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-750",
};

const HONDA_BRAND = {
    ...DEFAULT_BRAND,
    badge: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-900 font-bold",
};

export const getBrandConfig = brand => brand === 'Honda' ? HONDA_BRAND : DEFAULT_BRAND;
