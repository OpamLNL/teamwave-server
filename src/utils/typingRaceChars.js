const APOSTROPHE_CHARS = new Set(["'", '\u2019', '\u02BC', '`', '\u00B4', '\u2018']);

const CYRILLIC_LATIN_LOOKALIKES = {
    '\u0410': 'A', '\u0430': 'a',
    '\u0412': 'B', '\u0432': 'b',
    '\u0415': 'E', '\u0435': 'e',
    '\u0401': 'E', '\u0451': 'e',
    '\u041A': 'K', '\u043A': 'k',
    '\u041C': 'M', '\u043C': 'm',
    '\u041D': 'H', '\u043D': 'h',
    '\u041E': 'O', '\u043E': 'o',
    '\u0420': 'P', '\u0440': 'p',
    '\u0421': 'C', '\u0441': 'c',
    '\u0422': 'T', '\u0442': 't',
    '\u0423': 'Y', '\u0443': 'y',
    '\u0425': 'X', '\u0445': 'x',
};

function normalizeTypedChar(char) {
    if (char == null) return null;
    let value = String(char).normalize('NFC');
    if (value === '\u00A0') value = ' ';
    if (CYRILLIC_LATIN_LOOKALIKES[value]) {
        value = CYRILLIC_LATIN_LOOKALIKES[value];
    }
    return value;
}

function splitTextChars(text) {
    const value = String(text ?? '');
    if (typeof Intl !== 'undefined' && Intl.Segmenter) {
        return [...new Intl.Segmenter('uk', { granularity: 'grapheme' }).segment(value)]
            .map((part) => part.segment);
    }
    return [...value];
}

function getExpectedChar(text, typedIndex) {
    const chars = splitTextChars(text);
    const index = Number(typedIndex) || 0;
    return chars[index] ?? null;
}

function charsMatch(expected, typed) {
    const normExpected = normalizeTypedChar(expected);
    const normTyped = normalizeTypedChar(typed);

    if (normExpected == null || normTyped == null) return false;
    if (normExpected === normTyped) return true;

    if (APOSTROPHE_CHARS.has(normExpected) && APOSTROPHE_CHARS.has(normTyped)) {
        return true;
    }

    if (/^[a-zA-Z]$/.test(normExpected) && normExpected.toLowerCase() === normTyped.toLowerCase()) {
        return true;
    }

    return false;
}

function assertSingleChar(char) {
    const graphemes = splitTextChars(String(char ?? '').normalize('NFC'));
    if (graphemes.length !== 1) {
        throw new Error('Передайте один символ');
    }
    return graphemes[0];
}

module.exports = {
    charsMatch,
    getExpectedChar,
    splitTextChars,
    assertSingleChar,
    normalizeTypedChar,
};
