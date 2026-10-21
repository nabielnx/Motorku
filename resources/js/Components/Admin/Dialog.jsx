import { Dialog as HeadlessDialog, DialogPanel, DialogTitle } from '@headlessui/react';
import clsx from 'clsx';

export { DialogTitle };

// Keep form state with the caller. This component owns focus, Escape, and the backdrop.
export default function Dialog({ show = true, onClose, closeable = true, className, children }) {
    return (
        <HeadlessDialog open={show} onClose={() => closeable && onClose()} className="relative z-50">
            <div className="fixed inset-0 bg-slate-900 dark:bg-slate-950" aria-hidden="true" />
            <div className="fixed inset-0 overflow-y-auto">
                <div className="flex min-h-full items-center justify-center p-3 sm:p-4">
                    <DialogPanel className={clsx('admin-dialog w-full min-w-0 bg-white text-slate-900 dark:bg-slate-900 dark:text-white', className)}>
                        {children}
                    </DialogPanel>
                </div>
            </div>
        </HeadlessDialog>
    );
}
