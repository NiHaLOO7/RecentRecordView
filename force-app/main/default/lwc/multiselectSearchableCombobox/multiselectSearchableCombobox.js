import { LightningElement, api, track } from 'lwc';

export default class SearchableCombobox extends LightningElement {
    @api messageWhenInvalid = 'Please select a valid value';
    @api required = false;
    @api label = 'Subject';
    @api sort = false;
    multiselect = true;
    @track _options = [];
    
    searchedText = '';
    isOpen = false;
    highlightCounter = null;
    hasInteracted = false;
    ValLabelDict = {};
    
    isRendered = false;

    _pills = false;
    _value = [];
    _pendingValue = [];
    _selectedLabel =[];
    _inputHasFocus = false;
    _cancelBlur = false;

    /*** GETTERS & SETTERS ***/
    @api get value() {
        return this._value;
    }

    set value(val) {
        console.log('val', val)
        this._pendingValue = typeof val === 'string' ? [val] : typeof val === 'object' ? val : [];
        this.validateValue();
    }

    @api get options() {
        // console.log('getter')
        return this.reorderOptions();
    }

    set options(val) {
        this._options = JSON.parse(JSON.stringify(val || []));
        // console.log('setter')
        this.reorderOptions();
        this.validateValue();
    }

    get selectedOptions () {
        // console.log(this._options.filter(op => this._value.includes(op.value)));
        return this._options.filter(op => this._value.includes(op.value));
    }

    get placeholder () {
        return this.isOpen ? "Type to Search" : "Select an Option";
    }

    // Handles the setting up the place holder for the combobox input
    get inputValue() {
        if (this.isOpen) return this.searchedText;
        if (!this.value) return '';
        if (this._value.length === 1) return this.selectedOptions[0].label;
        if (this._value.length > 1) return this._value.length + ' options selected';
        return '';
    }


    get tempOptions() {
        let options =  this.options;
        if(!(this._options && this._options?.length)) return [];
        const selOpts = this._options.filter(op => this._value.includes(op.value))?.map(op => op?.label || '')|| [];
        if (!this.isOpen || !this.searchedText || (!this.multiselect && this.isOpen && (selOpts?.[0] || '') === this.searchedText)) {
            options = this._options;
        } else {
            options = this._options.filter((op) =>
                      op.label.toLowerCase().includes(this.searchedText.toLowerCase()) ||
                      this._value.includes(op.value)
                  );
        }
        return this.highlightOptions(options);
    }
    

    @api get pills() {
        return this._pills && this.multiselect;
    }

    set pills(val) {
        this._pills = this.booleanValidator(val);
    }

    get isInvalid() {
        return this.required && this.hasInteracted && (!this._value?.length || true);
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
    }

    handleInput() {
        console.log("input")
        this.isOpen = true;
    }

    handleFocus() {
        console.log("focus")

        this._inputHasFocus = true;
        this.isOpen = true;
        this.dispatchEvent(new CustomEvent('focus'));
    }

    handleBlur() {
        console.log("blur")

        console.log('blur',this._cancelBlur)
        this._inputHasFocus = false;
        if (this._cancelBlur) return;
        this.isOpen = false;
        this.hasInteracted = true;
        this.searchedText = this.multiselect ? '' : this.selectedOptions[0].label;
        // this.reorderOptions();
        this.dispatchEvent(new CustomEvent('blur'));
    }

    handleSelect(event) {
        let listBoxOption = event.currentTarget.firstChild;
        if(this.multiselect) this.handleMultipleSelection(listBoxOption);
        else this.handleSingleSelection(listBoxOption);
        console.log(JSON.stringify(this._value))
        listBoxOption.classList.toggle("slds-is-selected");

        this.fireChange();
    }

    handleMultipleSelection(event) {
        if(this._value.includes(event.dataset.value)
        ) this._value = this._value.filter(val => val !== event.dataset.value)
        else this._value.push(event.dataset.value);

    }

    handleSingleSelection(event) {
        console.log('data');
        this._value = [event.dataset.value];
        this.template.querySelectorAll(".slds-is-selected").forEach(
            (data) => data.classList.remove("slds-is-selected"));
        this.allowBlur();
        this.handleBlur();
    }


    handleKeyDown(event) {
        const keyMap = {
            Escape: () => {
                this.isOpen = !this.isOpen;
                this.highlightCounter = null;
            },
            Enter: () => {
                if (this.isOpen && this.highlightCounter !== null) {
                    const enterEvent = {currentTarget: this.template.querySelector(`[data-selected='yes']`)};
                    // this.searchedText  = labelValuePair.label;
                    this.handleSelect(enterEvent);
                    // this.allowBlur();
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
        console.log('this._pendingValue',JSON.stringify(this._pendingValue))
        console.log('this._value',JSON.stringify(this._value))
        if (!this._options.length || JSON.stringify(this._value) === JSON.stringify(this._pendingValue)) return;
        const valueList = this._options.filter(op =>  this._pendingValue.includes(op.value))?.map(op => op?.value || '');
        // this.searchedText =  option ? option.label : '';
        console.log(JSON.stringify('valuelist', valueList));
        this._value = valueList.length ? valueList : [];
    }

    reorderOptions() {
        if (!this._options.length) return this._options;
        this._options = this.sort ? [...this._options].sort((a, b) => a?.label.localeCompare(b?.label)) : this._options;;
        if(!this.value.length) return this._options;
        const selectedOptions = this._options.filter(op => this._value.includes(op.value));
        const unselectedOptions = this._options.filter(op => !this._value.includes(op.value));
        selectedOptions.sort((a, b) => a.value.localeCompare(b.value));
        this._options = [...selectedOptions, ...unselectedOptions];
        if(!this.isOpen && !this.multiselect) this.highlightCounter = this._options.some(op => this._value.includes(op.value)) ? this._options.findIndex(op => this._value.includes(op.value)) : null;
        else if(!this.isOpen && this.multiselect) this.highlightCounter = 0;
        return this._options;
        
    }

    booleanValidator(boolValue) {
        console.log('boolValue', boolValue);
        if( !boolValue || boolValue.toString().toLowerCase() === 'false') return false;
        return true;
    }

    highlightOptions(options) {
        return options.map((option, index) => {
            let element = this.template ? this.template.querySelector(`[data-value='${option.value}']`) : null;
            if(element) {
                if(index === this.highlightCounter) element?.classList.add('slds-has-focus') || null;
                else  element?.classList.remove('slds-has-focus') || null;
            }
            return {...option,
            isSelected: this._value.includes(option.value),
            focused: index === this.highlightCounter ? 'yes' : ''}
        });
    }

    // Methods to control pills
    // This method handles the removal of the pill
    removePill(event) {
        let deletedValue = event.detail.name;
        console.log("deletedValue", deletedValue);
        // if (!(this.selectedOptions.length === 1) || this.zeroSelectionAllowed) {
        this.unselectTheOption(deletedValue);
        // }
    }

    // This is to unselect an option when the pills of that option is removed
    unselectTheOption(deletedValue) {
        this._value = this._value.filter(
            (val) => val !== deletedValue
        );
        let focusedData = this.template.querySelector(`[data-value=${deletedValue}]`);
        focusedData.classList.remove('slds-is-selected');
        // console.log('focusedData',focusedData.classList);
        // if(focusedData && focusedData.classList.includes('slds-is-selected') || false) focusedData.classList.remove('slds-is-selected');
        this.fireChange();
        // this.template
        // .querySelector(`[data-name="${deletedValue}"]`)
        // .classList.remove("slds-is-selected");
        // this.sendValues(this.selectedOptions);
    }

    handleMouseEnter(event) {
        this.template.querySelector('div.slds-has-focus')?.classList?.remove('slds-has-focus');
        this.highlightCounter = parseInt(event.currentTarget.dataset.index);
        event.currentTarget.classList.add('slds-has-focus');
    }

    handleMouseLeave(event) {
        event.currentTarget.classList.remove('slds-has-focus');
    }

    fireChange() {
        this.dispatchEvent(new CustomEvent('change', { detail: { value: this._value[0] } }));
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
        this.allowBlur();
        if(this.multiselect) this.template.querySelector('input.slds-combobox__input')?.focus();
        else if (!this._inputHasFocus) this.isOpen = false;
    }
    
    handleDropdownMouseEnter() {
        if(this.multiselect) this.cancelBlur();
    }

    renderedCallback() {
        if(!this.isRendered && this._value.length) {
            this._value.forEach(val => {
                this.template.querySelector(`[data-value=${val}]`)?.classList.add('slds-is-selected');
            })
            this.isRendered = true;
        }
        this.template.querySelector(`[data-focused='yes']`)?.scrollIntoView({ block: "nearest" });
    }
}
