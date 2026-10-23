import { useEffect, useId, useState } from 'react';
import { Link } from '@inertiajs/react';
import { FiChevronDown } from 'react-icons/fi';

export default function SidebarMenuGroup({ item, onNavigate }) {
    const [isOpen, setIsOpen] = useState(item.active);
    const submenuId = useId();
    const activeChildHref = item.children.find(child => child.active)?.href;
    const Icon = item.icon;

    useEffect(() => {
        if (item.active) setIsOpen(true);
    }, [item.active, activeChildHref]);

    return (
        <div>
            <div
                className={`admin-nav-link admin-nav-parent flex w-full items-stretch text-left ${item.active ? 'admin-nav-link--active' : ''}`}
            >
                <Link
                    href={item.href}
                    aria-current={item.current ? 'page' : undefined}
                    onClick={onNavigate}
                    className="flex min-w-0 flex-1 items-center gap-3 rounded-md px-3 py-2.5"
                >
                    <Icon size={17} aria-hidden="true" />
                    <span className="min-w-0 break-words">{item.name}</span>
                </Link>
                <button
                    type="button"
                    aria-label={`${isOpen ? 'Tutup' : 'Buka'} submenu ${item.name}`}
                    aria-expanded={isOpen}
                    aria-controls={submenuId}
                    onClick={() => setIsOpen(open => !open)}
                    className="flex min-h-11 w-11 shrink-0 items-center justify-center rounded-md"
                >
                    <FiChevronDown size={15} className={isOpen ? 'rotate-180' : ''} aria-hidden="true" />
                </button>
            </div>
            <ul id={submenuId} className="admin-nav-submenu" hidden={!isOpen}>
                {item.children.map(child => (
                    <li key={child.href}>
                        <Link
                            href={child.href}
                            aria-current={child.active ? 'page' : undefined}
                            onClick={onNavigate}
                            className={`admin-nav-child ${child.active ? 'admin-nav-child--active' : ''}`}
                        >
                            <span className="min-w-0 break-words">{child.name}</span>
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
}
