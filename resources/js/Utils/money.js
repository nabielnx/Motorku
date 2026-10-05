export function moneyDigits(value) {
    return String(value ?? '').replace(/[^0-9]/g, '').replace(/^0+(?=\d)/, '');
}

export function validMoneyInput(value) {
    return /^[0-9.]*$/.test(value) && !/(^|\.)\./.test(value) && moneyDigits(value).length <= 13;
}
