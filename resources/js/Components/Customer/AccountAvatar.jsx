import { FiUser } from 'react-icons/fi';

export default function AccountAvatar({ customer, large = false }) {
    if (!customer) return <FiUser size={20} strokeWidth={2} aria-hidden="true" />;
    const words = (customer.name?.trim() || customer.email || 'Pelanggan').split(/\s+/u);
    const initials = [words[0], ...(words.length > 1 ? [words.at(-1)] : [])]
        .map(word => Array.from(word)[0]).join('').toLocaleUpperCase('id-ID');
    return <span aria-hidden="true" className={`inline-flex shrink-0 items-center justify-center rounded-full bg-[#19231f] font-bold leading-none text-[#FFDD00] ${large ? 'h-12 w-12 text-base' : 'h-7 w-7 text-[11px]'}`}>{initials}</span>;
}
