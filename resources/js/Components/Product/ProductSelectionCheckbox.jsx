import { useEffect, useRef } from 'react';

export default function ProductSelectionCheckbox({ checked, indeterminate = false, onChange, disabled = false, label }) {
    const input = useRef(null);
    useEffect(() => { if (input.current) input.current.indeterminate = indeterminate; }, [indeterminate]);
    const active = checked || indeterminate;
    return (
        <label className="inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center" onClick={event => event.stopPropagation()}>
            <input ref={input} type="checkbox" checked={checked} onChange={onChange} disabled={disabled} aria-label={label} className="peer sr-only" />
            <span aria-hidden="true" className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border peer-disabled:cursor-not-allowed peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-slate-500 ${active ? 'border-[#19231f] bg-[#19231f] text-[#FFDD00]' : 'border-slate-400 bg-white text-slate-800 dark:border-slate-500 dark:bg-slate-900 dark:text-slate-100'}`}>
                {indeterminate ? <span className="h-0.5 w-2 rounded-sm bg-[#FFDD00]" /> : checked && (
                    <svg className="h-4 w-4" viewBox="0 0 16 16"><path d="m6.1 11.7-3.3-3.3 1.6-1.6 1.7 1.7 5.4-5.4 1.6 1.6-7 7z" fill="currentColor" /></svg>
                )}
            </span>
        </label>
    );
}
