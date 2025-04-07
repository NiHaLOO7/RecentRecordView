const VARIANT = {
    STANDARD: 'standard',
    LABEL_HIDDEN: 'label-hidden',
    LABEL_STACKED: 'label-stacked',
    LABEL_INLINE: 'label-inline'
};

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

const classListMutation = (classList, config) => {
    Object.keys(config).forEach((key) => {
        if (typeof key === 'string' && key.length) {
            if (config[key]) {
                classList.add(key);
            } else {
                classList.remove(key);
            }
        }
    });
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
    return (typeof value === 'string' && value.trim().toLowerCase() !== 'false') || (!!value && typeof value !== 'string');
}

const normalizeAriaAttribute = (value) => {
    let arias = Array.isArray(value) ? value : [value];
    arias = arias
        .map((ariaValue) => {
            if (typeof ariaValue === 'string') {
                return ariaValue.replace(/\s+/g, ' ').trim();
            }
            return '';
        })
        .filter((ariaValue) => !!ariaValue);

    return arias.length > 0 ? arias.join(' ') : null;
}

const normalizeVariant = (value) => {
    return normalizeString(value, {
        fallbackValue: VARIANT.STANDARD,
        validValues: [
            VARIANT.STANDARD,
            VARIANT.LABEL_HIDDEN,
            VARIANT.LABEL_STACKED,
            VARIANT.LABEL_INLINE
        ]
    });
}

const isEmptyString = (s) => {
    return (
        s === undefined ||
        s === null ||
        (typeof s === 'string' && s.trim() === '')
    );
}

const isEmptyList = (list) => {
    return (
        list === undefined ||
        list === null ||
        !Array.isArray(list) ||
        list.length === 0 ||
        list.every(item => typeof item === 'string' && item.trim() === '')
    );
};

const synchronizeAttrs = (element, values) => {
    if (!element) {
        return;
    }
    const attributes = Object.keys(values);
    attributes.forEach((attribute) => {
        smartSetAttribute(element, attribute, values[attribute]);
    });
}

const smartSetAttribute = (element, attribute, value) => {
    if (element.tagName.match(/^C/i)) {
        attribute = attribute.replace(/-\w/g, (m) => m[1].toUpperCase());
        element[attribute] = value ? value : null;
    } else if (value) {
        element.setAttribute(attribute, value);
    } else {
        element.removeAttribute(attribute);
    }
}

const getCurrentElementId = (element) => {
    if (element && typeof element === 'string') {
        return element;
    } else if (element) {
        return element.getAttribute('id');
    }
    return null;
}



export default {
    VARIANT,
    classSet,
    classListMutation,
    normalizeString,
    normalizeBoolean,
    normalizeAriaAttribute,
    normalizeVariant,
    isEmptyString,
    isEmptyList,
    synchronizeAttrs,
    getCurrentElementId,
}
