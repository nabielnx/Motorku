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
            <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={submenuId}
                onClick={() => setIsOpen(open => !open)}
                className={`admin-nav-link admin-nav-parent flex w-full items-center gap-3 text-left ${item.active ? 'admin-nav-link--active' : ''}`}
            >
                <Icon size={17} aria-hidden="true" />
                <span className="min-w-0 flex-1">{item.name}</span>
                <FiChevronDown size={15} className={isOpen ? 'rotate-180' : ''} aria-hidden="true" />
            </button>
            <ul id={submenuId} className="admin-nav-submenu" hidden={!isOpen}>
                {item.children.map(child => (
                    <li key={child.href}>
                        <Link
                            href={child.href}
                            aria-current={child.active ? 'page' : undefined}
                            onClick={onNavigate}
                            className={`admin-nav-child ${child.active ? 'admin-nav-child--active' : ''}`}
                        >
                            {child.name}
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
}
