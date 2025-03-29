import { LightningElement, api, track } from "lwc";

export default class InputWithDropDown extends LightningElement {
    @api messageWhenInvalid = "Please type or select a value";
    @api required = false;
    @api label = "Subject";

    @track _options = [];

    @track selectedValueLabel = '';

    _value = "";
    isOpen = false;
    highlightCounter = null;
    hasInteracted = false;
    _inputHasFocus = false;
    _cancelBlur = false;

    /*** GETTERS & SETTERS ***/
    @api get value() {
        return this._value;
    }

    set value(val) {
        this._value = val;
    }

    @api get options() {
        return this._options;
    }

    set options(val) {
        this._options = val || [];
    }

    get tempOptions() {
        let options = this._value
            ? this._options.filter((op) =>
                  op.label.toLowerCase().includes(this._value.toLowerCase())
              )
            : this._options;

        return this.highlightOptions(options);
    }

    get isInvalid() {
        return this.required && this.hasInteracted && !this._value;
    }

    get formElementClasses() {
        return `slds-form-element${this.isInvalid ? " slds-has-error" : ""}`;
    }

    get classes() {
        return `slds-combobox slds-dropdown-trigger slds-dropdown-trigger_click${this.isOpen ? " slds-is-open" : ""}`;
    }

    get inputClasses() {
        return `slds-input slds-combobox__input${this.isOpen ? " slds-has-focus" : ""}`;
    }

    /*** EVENT HANDLERS ***/
    handleChange(event) {
        this._value = event.target.value;
        this.hasInteracted = false;
        this.fireChange();
    }

    handleInput() {
        this.isOpen = true;
    }

    handleFocus() {
        this._inputHasFocus = true;
        this.isOpen = true;
        this.highlightCounter = null;
        this.dispatchEvent(new CustomEvent("focus"));
    }

    handleBlur() {
        this._inputHasFocus = false;
        if (this._cancelBlur) return;
        this.isOpen = false;
        if (!this._value) this.hasInteracted = true;
        this.highlightCounter = null;
        this.dispatchEvent(new CustomEvent("blur"));
    }

    handleSelect(event) {
        this._value = event.currentTarget.dataset.value;
        this.isOpen = false;
        this.allowBlur();
        this.fireChange();
    }

    handleKeyDown(event) {
        const keyMap = {
            Escape: () => {
                this.isOpen = !this.isOpen;
                this.highlightCounter = null;
            },
            Enter: () => {
                if (this.isOpen && this.highlightCounter !== null) {
                    this._value = this.tempOptions[this.highlightCounter].value;
                    this.isOpen = false;
                    this.fireChange();
                } else {
                    this.handleFocus();
                }
            },
            ArrowDown: () => this.moveHighlight(1),
            PageDown: () => this.moveHighlight(1),
            ArrowUp: () => this.moveHighlight(-1),
            PageUp: () => this.moveHighlight(-1),
            Home: () => (this.highlightCounter = 0),
            End: () => (this.highlightCounter = this.tempOptions.length - 1)
        };

        if (keyMap[event.key]) keyMap[event.key]();
    }

    /*** HELPER METHODS ***/
    moveHighlight(step) {
        this._inputHasFocus = true;
        this.isOpen = true;
        this.highlightCounter =
            this.highlightCounter === null
                ? 0
                : (this.highlightCounter + step + this.tempOptions.length) % this.tempOptions.length;
    }

    highlightOptions(options) {
        return options.map((option, index) => ({
            ...option,
            classes: `slds-media slds-listbox__option slds-listbox__option_plain slds-media_small${index === this.highlightCounter ? " slds-has-focus" : ""}`,
            focused: index === this.highlightCounter ? "yes" : ""
        }));
    }

    fireChange() {
        this.dispatchEvent(new CustomEvent("change", { detail: { value: this._value } }));
    }

    allowBlur() {
        this._cancelBlur = false;
    }

    cancelBlur() {
        this._cancelBlur = true;
    }

    handleDropdownMouseDown(event) {
        if (event.button === 0) this.cancelBlur();
    }

    handleDropdownMouseUp() {
        this.allowBlur();
    }

    handleDropdownMouseLeave() {
        if (!this._inputHasFocus) this.isOpen = false;
    }

    renderedCallback() {
        this.template.querySelector("[data-focused='yes']")?.scrollIntoView();
    }
}
