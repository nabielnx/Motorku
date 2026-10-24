import { usePage } from '@inertiajs/react';
import clsx from 'clsx';
import { deletionLockedMessage, deletionsAllowed } from '@/Utils/deletion';

export default function DeleteButton({ as: Component = 'button', disabled, title, className, type = 'button', draft = false, ...props }) {
    const allowed = draft || deletionsAllowed(usePage().props.app_settings);
    return <Component {...props} type={type} disabled={disabled || !allowed} title={allowed ? title : deletionLockedMessage} className={clsx('disabled:cursor-not-allowed', className)} />;
}
