import clsx from 'clsx';

export default function Button({ variant = 'primary', type = 'button', className, children, ...props }) {
    return (
        <button type={type} className={clsx('admin-button', `admin-button-${variant}`, className)} {...props}>
            {children}
        </button>
    );
}
