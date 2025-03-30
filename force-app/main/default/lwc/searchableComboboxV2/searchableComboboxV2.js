import { LightningElement, api, track } from 'lwc';

export default class SearchableComboboxV2 extends LightningElement {
    @api messageWhenInvalid = 'Please select a valid value';
    @api required = false;
    @api label = 'Subject';

    @track _options = [];
    
    searchedText = '';
    selectedLabel = '';
    isOpen = false;
    highlightCounter = null;
    hasInteracted = false;
    placeholder = "Select an Option";
    searchPlaceholder = "Type to Search";
    
    _value = '';
    _pendingValue ='';
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
        return this._options;
    }

    set options(val) {
        this._options = val || [];
        this.validateValue();
    }

    get tempOptions() {
        let options = this.searchedText
            ? this._options.filter((op) =>
                  op.label.toLowerCase().includes(this.searchedText.toLowerCase())
              )
            : this._options;

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

    get comboboxClasses() {
        return `slds-combobox__input slds-input_faux fix-slds-input_faux${this.selectedLabel ? ' slds-combobox__input-value' : ''}`;
    }

    get comboBoxLabel(){
        return this.selectedLabel ? this.selectedLabel : 'Select an Option';
    }

    /*** EVENT HANDLERS ***/
    handleChange(event) {
        this.searchedText = event.target.value;
    }

    handleInput() {
        this.isOpen = true;
    }

    handleFocus(event) {
        const funct = event.target.dataset.function;
        this.highlightCounter = null;
        this.isOpen = true;
        //this.isOpen = funct === 'combobox'? this.isOpen : true;
        this._inputHasFocus = true;
        if(funct === 'combobox') this.dispatchEvent(new CustomEvent('focus'));
    }

    // handleClick() {
    //         this.isOpen = !this.isOpen;
    //         this.highlightCounter = null;
    // }

    handleBlur(event) {
        const funct = event.target.dataset.function;
        this._inputHasFocus = false;
        if (this._cancelBlur) return;
        this.isOpen = false;
        this.hasInteracted = true;
        this.highlightCounter = null;
        if(funct === 'combobox') this.dispatchEvent(new CustomEvent('blur'));
    }

    handleSelect(event) {
        this._value = event.currentTarget.dataset.value;
        this.searchedText = event.currentTarget.dataset.label;
        this.selectedLabel = event.currentTarget.dataset.label;
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
                    this.searchedText = this.tempOptions[this.highlightCounter].label;
                    this.selectedLabel = this.tempOptions[this.highlightCounter].label;
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
    validateValue() {
        if (!this._options.length || this._value === this._pendingValue) return;
        const option = this._options.find(op => op.value === this._pendingValue);
        this.selectedLabel =  option ? option.label : '';
        this.searchedText = this.selectedLabel;
    }

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
        this.template.querySelector(`[data-focused='yes']`)?.scrollIntoView();
    }
}
