import { LightningElement, api, track } from 'lwc';

export default class SearchableCombobox extends LightningElement {
    @api messageWhenInvalid = 'Please select a valid value';
    @api required = false;
    @api label = 'Subject';
    multiselect = false;
    
    searchedText = '';
    isOpen = false;
    highlightCounter = null;
    hasInteracted = false;
    
    @track _options = [];
    @track  _pendingValue = [];
    @track _value = [];
    @track tempOptions = [];

    
    _sort = false;
    _pills = false;  
    _selectedLabel =[];
    _inputHasFocus = false;
    _cancelBlur = false;
    _cancelHighlight = false;
    _isValuesRendered = false;
    _isComponentRendered = false;
    _cancelScrolling = false;

    /*** GETTERS & SETTERS ***/
    @api get value() {
        return this._value;
    }

    set value(val) {
        this._pendingValue = Array.isArray(val) ? val : (typeof val === 'string' ? [val] : []);
        this.validateValue();
    }

    @api get options() {
        return this.reorderOptions(this._options);
    }

    set options(val) {
        this._options = this.sortOptions(JSON.parse(JSON.stringify(val || [])));
        this.tempOptions =  this.reorderOptions(this._options);
        this.validateValue();
    }

    @api get sort() {
        return this._sort;
    }

    set sort(val) {
        this._sort = this.booleanValidator(val);
        this._options = this.sortOptions(this._options);
    }

    get selectedOptions () {
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
        const excludedKeys = [
            'Escape', 'Enter', 'ArrowDown', 'PageDown',
            'ArrowUp', 'PageUp', 'Home', 'End', 'ArrowLeft', 'ArrowRight'
        ];
        if (excludedKeys.includes(event.key) || !event.target.value.trim()) return;
        this.searchedText = event.target.value;
        this.allowHighlight();
        this.tempOptions =  this.searchedText ? 
                            this.reorderOptions(this.getTempOptions(), true) : 
                            this.reorderOptions(this._options, true);
    }

    handleInput() {
        this.isOpen = true;
    }

    handleFocus() {
        this.allowScrolling();
        this._inputHasFocus = true;
        this.tempOptions =  this.reorderOptions(this._options);
        this.isOpen = true;
        if(!this._cancelHighlight) this.highlightOptions(this.tempOptions?.[0]?.value || null);
        this.dispatchEvent(new CustomEvent('focus'));
    }

    handleBlur() {
        this._inputHasFocus = false;
        if (this._cancelBlur) return;
        this.template.querySelector('div.options').scrollIntoView({ block: "nearest" });
        this.isOpen = false;
        this.tempOptions = this._options;
        this.removeAllHighlights();
        this.allowHighlight();
        this.hasInteracted = true;
        this.searchedText = this.multiselect ? '' : this.selectedOptions[0].label;
        this.dispatchEvent(new CustomEvent('blur'));
    }

    handleSelect(event) {
        let listBoxOption = event.currentTarget.firstChild;
        if(this.multiselect) this.handleMultipleSelection(listBoxOption);
        else this.handleSingleSelection(listBoxOption);
        listBoxOption.classList.toggle("slds-is-selected");
        this.fireChange();
    }

    handleMultipleSelection(event) {
        if(this._value.includes(event.dataset.value)
        ) this._value = this._value.filter(val => val !== event.dataset.value)
        else this._value.push(event.dataset.value);

    }

    handleSingleSelection(event) {
        this._value = [event.dataset.value];
        this.template.querySelectorAll(".slds-is-selected").forEach(
            (data) => data.classList.remove("slds-is-selected"));
        this.allowBlur();
        this.handleBlur();
    }


    handleKeyDown(event) {
        this.cancelScrolling();
        const keyMap = {
            Escape: () => {
                this.isOpen = !this.isOpen;
                this.setHighlightCounter(null);
            },
            Enter: () => {
                if (this.isOpen && this.highlightCounter !== null) {
                    const enterEvent = {
                        currentTarget: { 
                            firstChild : 
                            this.template.querySelector(`[data-index='${this.highlightCounter}']`)
                        }
                    };
                    this.handleSelect(enterEvent);
                } else {
                    this.handleFocus();
                }
            },
            ArrowDown: () => this.reorderAndMoveHighlight(1),
            PageDown: () => this.reorderAndMoveHighlight(1),
            ArrowUp: () => this.reorderAndMoveHighlight(-1),
            PageUp: () => this.reorderAndMoveHighlight(-1),
            Home: () => this.highlightOptions(this.tempOptions[0]?.value || null),
            End: () => this.highlightOptions(this.tempOptions?.[this.tempOptions.length - 1]?.value || null)
        };

        if (keyMap[event.key]) keyMap[event.key](event);
    }

    reorderAndMoveHighlight(step) {
        if(!this.isOpen) {
            this.handleFocus();
            step = 0;
        }
        this.moveHighlight(step);
    }

    /*** HELPER METHODS ***/
    moveHighlight(step) {
        this._inputHasFocus = true;
        this.isOpen = true;
        const focusedElement = this.template.querySelector('div.slds-has-focus');
        let index = null;
        try {
            index = this.tempOptions?.findIndex(op => op.value === focusedElement?.dataset?.value);
            if (index === -1) index = null;
        } catch (error) {
            index = null;
        }
        if (index === null) {
            index = step > 0 ? 0 : this.tempOptions.length - 1;
        } else {
            index = (index + step + this.tempOptions.length) % this.tempOptions.length;
        }
        const value = this.tempOptions[index]?.value;
        if (value) {
            this.highlightOptions(value);
        }
    }
    
    highlightOptions(value) {
        this.removeAllHighlights();
        if (value === null) return;
    
        const currentData = this.template.querySelector(`[data-value='${value}']`);
        if (!currentData) return;
        this.setHighlightCounter(parseInt(currentData.dataset.index, 10));
        currentData.classList.add('slds-has-focus');
        currentData.scrollIntoView({ block: "nearest" });
    }

    setHighlightCounter(value) {
        this.highlightCounter = ![undefined].includes(value) ? value : parseInt((this.template.querySelector('div.slds-is-focus')?.dataset?.index || 0));
    }
    

    removeAllHighlights() {
        this.template.querySelectorAll('.slds-has-focus')?.forEach(data =>{ 
            data?.classList?.remove('slds-has-focus');
        })
    }

    validateValue() {
        if (!this._options.length || JSON.stringify(this._value) === JSON.stringify(this._pendingValue)) return;
        if (!this.multiselect) this._pendingValue = this._pendingValue.length > 0 ? [this._pendingValue[0]] : [];
        const valueList = this._options.filter(op =>  this._pendingValue.includes(op.value))?.map(op => op?.value || '');
        this._value = valueList;
        if (this._isValuesRendered) {
            this.updateSelectedOptions(this._value);
        }
    }

      // This method updates the option selection depending on the values
    updateSelectedOptions(valueList) {
        for (let opt of this._options) {
          let option = this.template.querySelector(`[data-value="${opt.value}"]`);
          if (valueList.includes(opt.value)) {
                option.classList.add("slds-is-selected");
          } else if (option.classList.contains("slds-is-selected")) {
                option.classList.remove("slds-is-selected");
          }
        }
    }

    sortOptions(options) {
        if (!options.length) return [];
        options = this.sort ? [...options].sort((a, b) => a?.label.localeCompare(b?.label)) : options;
        return options;
    }

    reorderOptions(options, changeEvent = false) {
        if (!options.length) return [];
        if (this.isOpen && !changeEvent) return this.tempOptions;
        options = this.sortOptions(options);
        if(!this._value.length) return options;
        const selectedOptions = options.filter(op => this._value.includes(op.value));
        const unselectedOptions = options.filter(op => !this._value.includes(op.value));
        selectedOptions.sort((a, b) => a.value.localeCompare(b.value));
        options = [...selectedOptions, ...unselectedOptions];
        return options;
        
    }

    booleanValidator(boolValue) {
        if( !boolValue || boolValue.toString().toLowerCase() === 'false') return false;
        return true;
    }

    getTempOptions() {
        if(!(this._options && this._options?.length)) return [];
        const selOpts = this._options.filter(op => this._value.includes(op.value))?.map(op => op?.label || '')|| [];
        if (!this.isOpen || !this.searchedText || 
            (!this.multiselect && this.isOpen && 
            (selOpts?.[0] || '') === this.searchedText)) options = this._options;
        else return this._options.filter((op) =>
                      op.label.toLowerCase().includes(this.searchedText.toLowerCase()) ||
                      this._value.includes(op.value)
                  );
    }

    // Methods to control pills
    // This method handles the removal of the pill
    removePill(event) {
        let deletedValue = event.detail.name;
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
        this.fireChange();
    }

    handleMouseEnter(event) {
        this.removeAllHighlights();
        this.setHighlightCounter(parseInt(event.currentTarget.dataset.index));
        event.currentTarget.classList.add('slds-has-focus');
    }

    handleMouseLeave(event) {
        this.setHighlightCounter(null);
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

    cancelHighlight() {
        this._cancelHighlight = true;
    }

    allowHighlight() {
        this._cancelHighlight = false;
    }

    cancelScrolling (){
        this._cancelScrolling = true;
    }

    allowScrolling() {
        this._cancelScrolling = false;
    }

    handleDropdownMouseDown(event) {
        if (event.button === 0) this.cancelBlur();
    }

    handleDropdownMouseUp() {
        this.allowBlur();
    }

    handleDropdownMouseLeave() {
        this.allowBlur();
        this.cancelHighlight();
        if(this.multiselect) this.template.querySelector('input.slds-combobox__input')?.focus();
        else if (!this._inputHasFocus) this.handleBlur();
    }
    
    handleDropdownMouseEnter() {
        if(this.multiselect) this.cancelBlur();
    }

    renderedCallback() {
        if(!this._cancelScrolling) this.template.querySelector(`div.slds-is-selected`)?.scrollIntoView({ block: "nearest" });
        if(!this._isValuesRendered && this._value.length) {
            this.updateSelectedOptions(this._value);
            this._isValuesRendered = true;
        }
        this._isComponentRendered = true;
        this.setHighlightCounter();
    }
}
