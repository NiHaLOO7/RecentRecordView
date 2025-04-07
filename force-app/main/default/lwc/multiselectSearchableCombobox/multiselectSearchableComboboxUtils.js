const classSet = (baseClasses) => {
    const proto = {
        add(classes) {
            if (typeof classes === 'string') {
                classes.split(' ').forEach(cls => {
                    if (cls.trim()) this[cls.trim()] = true;
                });
            } else if (typeof classes === 'object' && classes !== null) {
                Object.entries(classes).forEach(([key, val]) => {
                    if (val) this[key] = true;
                });
            }
            return this;
        },
        toString() {
            return Object.keys(this)
                .filter(key => this[key])
                .join(' ');
        }
    };

    let base = {};
    if (typeof baseClasses === 'string') {
        baseClasses.split(' ').forEach(cls => {
            if (cls.trim()) base[cls.trim()] = true;
        });
    } else if (typeof baseClasses === 'object' && baseClasses !== null) {
        Object.entries(baseClasses).forEach(([key, val]) => {
            if (val) base[key] = true;
        });
    }

    return Object.assign(Object.create(proto), base);
}


const normalizeString = (value, config = {}) => {
    const { fallbackValue = '', validValues, toLowerCase = true } = config;
    let normalized = (typeof value === 'string' && value.trim()) || '';
    normalized = toLowerCase ? normalized.toLowerCase() : normalized;
    if (validValues && validValues.indexOf(normalized) === -1) {
        normalized = fallbackValue;
    }
    return normalized;
}

const normalizeBoolean = (value) => {
    return (typeof value === 'string' && value.trim.toLowerCase() !== 'false') || (!!value && typeof value !== 'string');
}

const isEmptyString = (s) => {
    return (
        s === undefined ||
        s === null ||
        (typeof s === 'string' && s.trim() === '')
    );
}

export default {
    classSet,
    normalizeString,
    normalizeBoolean,
    isEmptyString,
}
