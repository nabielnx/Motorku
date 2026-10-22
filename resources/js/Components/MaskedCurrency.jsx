export default function MaskedCurrency({ text, visible, className = '', as: Element = 'span', maskGroupingSeparators = false }) {
    return (
        <Element
            aria-label={visible ? text : 'Pendapatan disembunyikan'}
            className={`inline-block whitespace-nowrap tabular-nums ${className}`}
        >
            {Array.from(text, (character, index) => (
                /\d/.test(character) || (!visible && maskGroupingSeparators && character === '.')
                    ? <span key={index} className="inline-flex w-[0.65em] justify-center">{visible ? character : '•'}</span>
                    : <span key={index}>{character}</span>
            ))}
        </Element>
    );
}
