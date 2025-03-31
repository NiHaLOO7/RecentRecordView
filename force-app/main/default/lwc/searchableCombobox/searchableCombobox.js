import { LightningElement, api, track } from 'lwc';

export default class SearchableCombobox extends LightningElement {
    @api messageWhenInvalid = 'Please select a valid value';
    @api required = false;
    @api label = 'Subject';

    @track _options = [];
    
    searchedText = '';
    isOpen = false;
    highlightCounter = null;
    hasInteracted = false;
    placeholder = "Select an Option";
    ValLabelDict = {};
    
    _value = '';
    _pendingValue = '';
    _inputHasFocus = false;
    _cancelBlur = false;

    /*** GETTERS & SETTERS ***/
    @api get value() {
        return this._value;
    }

    set value(val) {
        this._pendingValue = val;
        this.validateValue();
    }

    @api get options() {
        return this.reorderOptions();
    }

    set options(val) {
        this._options = JSON.parse(JSON.stringify(val || []));
        this.reorderOptions();
        this.validateValue();
    }


    get tempOptions() {
        let options;
        if([null, undefined].includes(this._value)) return this._options;
        const selOpts = this.options.find(op => op.value === this._value)?.label || '';
        if (!this.isOpen || (this.isOpen && this.searchedText === selOpts)) 
        {
            options = this.options;
        } else {
            options = this.searchedText
                ? this.options.filter((op) =>
                      op.label.toLowerCase().includes(this.searchedText.toLowerCase()) ||
                      op.value === this.value
                  )
                : this.options;
        }
        return this.highlightOptions(options);
    }

    get isInvalid() {
        return this.required && this.hasInteracted && !this._value;
    }

    get formElementClasses() {
        return `slds-form-element${this.isInvalid ? ' slds-has-error' : ''}`;
    }

    get classes() {
        return `slds-combobox slds-dropdown-trigger slds-dropdown-trigger_click${this.isOpen ? ' slds-is-open' : ''}`;
    }

    get inputClasses() {
        return `slds-input slds-combobox__input${this.isOpen ? ' slds-has-focus' : ''}`;
    }

    /*** EVENT HANDLERS ***/
    handleChange(event) {
        this.searchedText = event.target.value;
        if(event.target.value === '' && this._value !== '' ) {
            this._value = '';
            this.highlightCounter = null;
            this.fireChange();
        }
    }

    handleInput() {
        this.isOpen = true;
    }

    handleFocus() {
        this._inputHasFocus = true;
        this.isOpen = true;
        this.dispatchEvent(new CustomEvent('focus'));
    }

    handleBlur() {
        this._inputHasFocus = false;
        if (this._cancelBlur) return;
        this.isOpen = false;
        this.hasInteracted = true;
        this.dispatchEvent(new CustomEvent('blur'));
    }

    handleSelect(event) {
        this._value = event.currentTarget.dataset.value;
        this.searchedText = event.currentTarget.dataset.label;
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
                    const labelValuePair = {
                        label: this.tempOptions[this.highlightCounter].label,
                        value: this.tempOptions[this.highlightCounter].value
                    }
                    this.searchedText  = labelValuePair.label;
                    this._value =  labelValuePair.value;
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

        if (keyMap[event.key]) keyMap[event.key](event);
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

    validateValue() {
        if (!this._options.length || this._value === this._pendingValue) return;
        const option = this._options.find(op => op.value === this._pendingValue);
        this.searchedText =  option ? option.label : '';
        this._value = option ? option.value : '';
    }

    reorderOptions() {
        // let options = [];
        if (!this._options.length) return this._options;
        this._options = [...this._options].sort((a, b) => a.label.localeCompare(b.label));
        if([null, undefined].includes(this._value)) return this._options;
        const selectedIndex = this._options.findIndex(op => op.value === this._value);
        if (selectedIndex > 0) {
            this._options = [this._options[selectedIndex], ...this._options.filter((_, i) => i !== selectedIndex)];
        }
        if(!this.isOpen) this.highlightCounter = this._options.some(op => op.value === this._value) ? this._options.findIndex(op => op.value === this._value) : null;
        return this._options;
    }



    highlightOptions(options) {
        return options.map((option, index) => ({
            ...option,
            isSelected: option.value === this._value,
            classes: `slds-media slds-listbox__option slds-listbox__option_plain slds-media_small${index === this.highlightCounter ? ' slds-has-focus' : ''}`,
            focused: index === this.highlightCounter ? 'yes' : ''
        }));
    }

    fireChange() {
        this.dispatchEvent(new CustomEvent('change', { detail: { value: this._value } }));
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
        this.template.querySelector(`[data-focused='yes']`)?.scrollIntoView({ block: "nearest" }) ||
        !this._value ? this.template.querySelector(`[data-function='options']`)?.scrollIntoView({ block: "nearest" }) : null;
    }
}
