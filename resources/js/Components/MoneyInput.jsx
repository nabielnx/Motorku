import { forwardRef } from 'react';

import { moneyDigits, validMoneyInput } from '@/Utils/money';

export default forwardRef(function MoneyInput({ value, onChange, ...props }, ref) {
    const digits = moneyDigits(value);
    return <input {...props} ref={ref} type="text" inputMode="numeric" value={digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
        onChange={event => {
            // Reject invalid characters instead of turning a pasted negative/garbled value positive.
            if (!validMoneyInput(event.target.value)) return;
            onChange({ target: { value: moneyDigits(event.target.value) } });
        }} />;
});
