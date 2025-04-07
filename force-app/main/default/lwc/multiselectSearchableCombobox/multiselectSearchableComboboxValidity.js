const defaultLabels = {
    badInput: "Enter a valid value.",
    customError: "Enter a valid value.",
    // patternMismatch: "Your entry does not match the allowed pattern.",
    // rangeOverflow: "The number is too high.",
    // rangeUnderflow: "The number is too low.",
    // stepMismatch: "Your entry isn't a valid increment.",
    // tooLong: "Your entry is too long.",
    // tooShort: "Your entry is too short.",
    // typeMismatch: "You have entered an invalid format.",
    valueMissing: "Complete this field."
};

const constraintsPriority = [
    'customError', 
    'badInput', 
    // 'patternMismatch',
    // 'rangeOverflow', 'rangeUnderflow', 'stepMismatch',
    // 'tooLong', 'tooShort', 'typeMismatch',
     'valueMissing'
];

function resolveBestMatch(validity) {
    if (validity && !validity.valid) {
        return constraintsPriority.find((key) => validity[key]) || 'badInput';
    }
    return null;
}

function computeConstraint(provider, key) {
    const val = provider[key];
    return typeof val === 'function' ? val() : !!val;
}

function createValidity(constraints) {
    return {
        get valueMissing() { return computeConstraint(constraints, 'valueMissing'); },
        // get typeMismatch() { return computeConstraint(constraints, 'typeMismatch'); },
        // get patternMismatch() { return computeConstraint(constraints, 'patternMismatch'); },
        // get tooLong() { return computeConstraint(constraints, 'tooLong'); },
        // get tooShort() { return computeConstraint(constraints, 'tooShort'); },
        // get rangeUnderflow() { return computeConstraint(constraints, 'rangeUnderflow'); },
        // get rangeOverflow() { return computeConstraint(constraints, 'rangeOverflow'); },
        // get stepMismatch() { return computeConstraint(constraints, 'stepMismatch'); },
        get customError() { return computeConstraint(constraints, 'customError'); },
        get badInput() { return computeConstraint(constraints, 'badInput'); },
        get valid() {
            return !(
                this.valueMissing 
                // || this.typeMismatch || this.patternMismatch ||
                // this.tooLong || this.tooShort || this.rangeUnderflow ||
                // this.rangeOverflow || this.stepMismatch 
                || this.customError || this.badInput
            );
        }
    };
}

export function getErrorMessage(validity, labelMap = {}) {
    const key = resolveBestMatch(validity);
    return key ? (labelMap[key] || defaultLabels[key]) : '';
}

export class FieldConstraintApi {
    constructor(componentProvider, constraints) {
        this._getComponent = componentProvider;
        this._constraints = {
            ...constraints,
            customError: () =>
                typeof this._customMessage === 'string' && this._customMessage !== ''
        };
    }

    get inputComponent() {
        return this._element ||= this._getComponent();
    }

    get validity() {
        return this._validity ||= createValidity(this._constraints);
    }

    checkValidity() {
        const valid = this.validity.valid;
        if (!valid) {
            this.inputComponent?.dispatchEvent(new CustomEvent('invalid', { cancellable: true }));
        }
        return valid;
    }

    reportValidity(callback) {
        const valid = this.checkValidity();
        this.inputComponent?.classList.toggle('slds-has-error', !valid);
        callback?.(this.validationMessage);
        return valid;
    }

    setCustomValidity(message) {
        this._customMessage = message;
        this._validity = null; // force re-evaluation
    }

    get validationMessage() {
        const c = this.inputComponent;
        return getErrorMessage(this.validity, {
            customError: this._customMessage,
            badInput: c?.messageWhenBadInput,
            // patternMismatch: c?.messageWhenPatternMismatch,
            // rangeOverflow: c?.messageWhenRangeOverflow,
            // rangeUnderflow: c?.messageWhenRangeUnderflow,
            // stepMismatch: c?.messageWhenStepMismatch,
            // tooShort: c?.messageWhenTooShort,
            // tooLong: c?.messageWhenTooLong,
            // typeMismatch: c?.messageWhenTypeMismatch,
            valueMissing: c?.messageWhenValueMissing
        });
    }
}
