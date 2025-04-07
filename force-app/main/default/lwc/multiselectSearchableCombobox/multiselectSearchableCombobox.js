import { LightningElement, api, track } from 'lwc';
import utils from './multiselectSearchableComboboxUtils';
import {FieldConstraintApi}  from './multiselectSearchableComboboxValidity';

const VIEWPORT_HEIGHT_SMALL = 834;
const EXCLUDE_KEYS = [
    'Escape', 'Enter', 'ArrowDown', 'PageDown',
    'ArrowUp', 'PageUp', 'Home', 'End', 'ArrowLeft', 'ArrowRight'
];

const ARIA_LABELLEDBY = 'aria-labelledby';
const ARIA_DESCRIBEDBY = 'aria-describedby';
const ARIA_LABEL = 'aria-label';
const ARIA_ACTIVEDESCENDANT = 'aria-activedescendant';

export default class MultiselectSearchableCombobox extends LightningElement {
    // @api messageWhenInvalid = 'Please select a valid value';
    @api required = false;
    @api label = 'Subject';
    @api pillsIcon = '';
    @api name;
    @api readonly = false;
    @api autocomplete = 'off'
    @api dropdownAlignment = 'left';
    @api messageWhenValueMissing;
    
    searchedText = '';
    highlightCounter = null;
    hasInteracted = false;
    
    @track tempOptions = [];
    @track _options = [];
    @track  _pendingValue = [];
    @track _value = [];
    
    _helpMessage;
    _variant;
    _inputIcon = 'utility:search'
    _multiselect = false;
    _dropdownHeight = 'standard';
    _dropdownVisible = false;
    _sort = false;
    _showValues = false;
    _pills = false;  
    _inputHasFocus = false;
    _cancelBlur = false;
    _cancelHighlight = false;
    _isValuesRendered = false;
    _isComponentRendered = false;
    _cancelScrolling = false;
    _search = false;
    _disabled = false;
    _ariaLabel = '';
    _ariaLabelledBy='';
    _ariaDescribedBy='';
    _activeElementDomId;
    _fieldLevelHelp = '';


    //To do
    // _spinnerActive; --no
    
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

    @api get allowSearch() {
        return this._search;
    }

    set allowSearch(val) {
        this._search = utils.normalizeBoolean(val);
        this._inputIcon = this._search ? "utility:search" : "utility:down";
    }

    @api get sort() {
        return this._sort;
    }

    set sort(val) {
        this._sort = utils.normalizeBoolean(val);
        this._options = this.sortOptions(this._options);
    }

    @api get showValues() {
        return this._showValues;
    }

    set showValues(val) {
        this._showValues = utils.normalizeBoolean(val);
    }

    @api get multiselect() {
        return this._multiselect;
    }

    set multiselect(val) {
        this._multiselect = utils.normalizeBoolean(val);
    } 

    @api get disabled() {
        return this._disabled || this.readOnly;
    }

    set disabled(val) {
        this._disabled = utils.normalizeBoolean(val);
    } 

    @api get variant() {
        return this._variant || VARIANT.STANDARD;
    }

    set variant(value) {
        this._variant = utils.normalizeVariant(value);
        this.updateClassList();
    }

    @api get dropdownHeight() {
        return this._dropdownHeight;
    }

    set dropdownHeight(height) {
        this._dropdownHeight = utils.normalizeString(height, {
            fallbackValue: 'standard',
            validValues: ['standard', 'small']
        });
    }

    @api get fieldLevelHelp() {
        return this._fieldLevelHelp;
    }

    set fieldLevelHelp(value) {
        this._fieldLevelHelp = value;
    }

    @api get ariaLabelledBy() {
        return this._ariaLabelledBy;
    }

    set ariaLabelledBy(labelledBy) {
        this._ariaLabelledBy = labelledBy;
        this.synchronizeAriaAttr();
    }

    @api get ariaLabel() {
        return this._ariaLabel;
    }

    set ariaLabel(label) {
        this._ariaLabel = label;
        this.synchronizeAriaAttr();
    }

    @api get ariaDescribedBy() {
        return this._ariaDescribedBy;
    }

    set ariaDescribedBy(describedBy) {
        this._ariaDescribedBy = describedBy;
        this.synchronizeAriaAttr();
    }

    get inputLabelledById() {
        return utils.getCurrentElementId(this._inputLabelledBy);
    }

    get computedAriaDescribedBy() {
        const describedByElements = [];
        if (this._helpMessage) {
            const helpText = this.template.querySelector('[data-help-text]');
            describedByElements.push(helpText);
        }
        if (typeof this.ariaDescribedBy === 'string') {
            describedByElements.push(this.ariaDescribedBy);
        }
        const ariaValues = [];
        describedByElements.forEach((element) => {
            ariaValues.push(utils.getCurrentElementId(element));
        });
        return utils.normalizeAriaAttribute(ariaValues);
    }

    get inputElement() {
        return this.template.querySelector('input');
    }

    get readonly() {
        return !this._search;
    }

    get selectedOptions () {
        return this._options.filter(op => this._value.includes(op.value));
    }

    get placeholder () {
        return this._dropdownVisible ? "Type to Search" : "Select an Option";
    }

    // Handles the setting up the place holder for the combobox input
    get inputValue() {
        if(!this.readonly) {
            if (this._dropdownVisible) return this.searchedText;
        }
        if (!this.value) return '';
        if (this._value.length === 1) return this.selectedOptions[0].label;
        if (this._value.length > 1) return this._value.length + ' options selected';
        return '';
    }

    @api get pills() {
        return this._pills && this.multiselect && this._value?.length;
    }

    set pills(val) {
        this._pills = utils.normalizeBoolean(val);
    }

    get isInvalid() {
        return this.required && this.hasInteracted && !this._value?.length;
    }

    get isLabelHidden() {
        return this.variant === utils.VARIANT.LABEL_HIDDEN;
    }
    
    get computedLabelClass() {
        return utils.classSet('slds-form-element__label')
            .add({ 'slds-assistive-text': this.isLabelHidden })
            .toString();
    }

    get computedFormElementClasses() {
        return utils.classSet(
            'slds-form-element'
        )
            .add({ 'slds-has-error': this.isInvalid  })
            .toString();
    }

    get computedDropdownTriggerClass() {
        return utils.classSet(
            'slds-combobox slds-dropdown-trigger slds-dropdown-trigger_click'
        )
            .add({ 'slds-is-open': this._dropdownVisible })
            .toString();
    }

    get computedInputClasses() {
        return utils.classSet(
            'slds-input slds-combobox__input slds-combobox__input-value'
        )
            .add({ 'slds-has-focus': this._dropdownVisible })
            .toString();
    }

    get computedDropdownClass() {
        const alignment = this.dropdownAlignment;

        let dropdownLengthClass = '';

        if (this._dropdownVisible) {
            if (this.dropdownHeight === 'standard') {
                if (window.innerHeight <= VIEWPORT_HEIGHT_SMALL) {
                    dropdownLengthClass = 'slds-dropdown_length-with-icon-7';
                } else {
                    dropdownLengthClass = 'slds-dropdown_length-with-icon-10';
                }
            } else if (this.dropdownHeight === 'small') {
                dropdownLengthClass = 'slds-dropdown_length-with-icon-5';
            }
        }

        return utils.classSet(
            `slds-listbox slds-listbox_vertical slds-dropdown slds-dropdown_fluid ${dropdownLengthClass}`
        )
            .add({
                'slds-dropdown_left':
                    alignment === 'left' || alignment === 'auto',
                'slds-dropdown_center': alignment === 'center',
                'slds-dropdown_right': alignment === 'right',
                'slds-dropdown_bottom': alignment === 'bottom-center',
                'slds-dropdown_bottom slds-dropdown_right slds-dropdown_bottom-right':
                    alignment === 'bottom-right',
                'slds-dropdown_bottom slds-dropdown_left slds-dropdown_bottom-left':
                    alignment === 'bottom-left'
            })
            .toString();
    }

    get _constraint() {
        if (!this._constraintApi) {
            this._constraintApi = new FieldConstraintApi(() => this, {
                valueMissing: () =>
                    !this.disabled &&
                    this.required &&
                    utils.isEmptyList(this._value)
            });
        }
        return this._constraintApi;
    }

    /*** API METHODS ***/
    @api get validity() {
        return this._constraint.validity;
    }

    @api
    checkValidity() {
        return this._constraint.checkValidity();
    }

    @api
    reportValidity() {
        return this._constraint.reportValidity((message) => {
            this._helpMessage = message;
        });
    }

    @api
    setCustomValidity(message) {
        this._constraint.setCustomValidity(message);
    }

    @api
    showHelpMessageIfInvalid() {
        this.reportValidity();
    }


    /*** EVENT HANDLERS ***/
    handleChange(event) {
        if (EXCLUDE_KEYS.includes(event.key) || !event.target.value?.trim() ) return;
        this.searchedText = event.target.value;
        this.allowHighlight();
        this.tempOptions =  this.searchedText ? 
                            this.reorderOptions(this.getTempOptions(), true) : 
                            this.reorderOptions(this._options, true);
    }

    handleInput() {
        this._dropdownVisible = true;
    }

    preventDefaultAndStopPropagation(event) {
        event.preventDefault();
        event.stopPropagation();
    }

    handleTriggerClick(event) {
        event.stopPropagation();
        this.toggleDropdownIfOptionExists();
    }

    toggleDropdownIfOptionExists() {
        this.allowScrolling();
        this.tempOptions =  this.reorderOptions(this._options);
        if(this.tempOptions?.length) this._dropdownVisible = this.allowSearch ? true : !this._dropdownVisible;
        if(!this._cancelHighlight) this.highlightOptions(this.tempOptions?.[0]?.value || null);
        inputElement.focus();
    }

    handleFocus() {
        this._inputHasFocus = true;
        this.dispatchEvent(new CustomEvent('focus'));
    }

    handleBlur() {
        this._inputHasFocus = false;
        if (this._cancelBlur) return;
        this.template.querySelector('div.options').scrollIntoView({ block: "nearest" });
        this._dropdownVisible = false;
        this.tempOptions = this._options;
        this.removeAllHighlights();
        this.allowHighlight();
        this.hasInteracted = true;
        this.searchedText = this.multiselect ? '' : this.selectedOptions[0].label;
        this.dispatchEvent(new CustomEvent('blur'));
    }

    handleSelect(event) {
        event.stopPropagation(); 
        let listBoxOption = event.currentTarget.firstChild;
        this.handleOptionSelection(listBoxOption);    
    }


    handleOptionSelection(event) {
        if(this.multiselect) this.handleMultipleSelection(event);
        else this.handleSingleSelection(event);
        event.classList.toggle("slds-is-selected");
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
            Escape: (event) => {
                this.preventDefaultAndStopPropagation(event);
                this._dropdownVisible ?  this.handleBlur() : this.toggleDropdownIfOptionExists();
            },
            Enter: (event) => {
                this.preventDefaultAndStopPropagation(event);
                if (this._dropdownVisible && this.highlightCounter !== null) {
                    const enterEvent = this.template.querySelector(`[data-index='${this.highlightCounter}']`);
                    this.handleOptionSelection(enterEvent);
                } else {
                    this.toggleDropdownIfOptionExists();
                }
            },
            ArrowDown: (event) => {
                this.preventDefaultAndStopPropagation(event);
                this.reorderAndMoveHighlight(1)}
                ,
            PageDown: (event) => {
                this.preventDefaultAndStopPropagation(event);
                this.reorderAndMoveHighlight(1)}
                ,
            ArrowUp: (event) => {
                this.preventDefaultAndStopPropagation(event);
                this.reorderAndMoveHighlight(-1)}
                ,
            PageUp: (event) => {
                this.preventDefaultAndStopPropagation(event);
                this.reorderAndMoveHighlight(-1)}
                ,
            Home: (event) => {
                this.preventDefaultAndStopPropagation(event);
                this.highlightOptions(this.tempOptions[0]?.value || null)}
                ,
            End: (event) => {
                this.preventDefaultAndStopPropagation(event);
                this.highlightOptions(this.tempOptions?.[this.tempOptions.length - 1]?.value || null)
            }
        };

        if (keyMap[event.key]) keyMap[event.key](event);
    }

    reorderAndMoveHighlight(step) {
        if(!this._dropdownVisible) {
            this.toggleDropdownIfOptionExists();
            step = 0;
        }
        this.moveHighlight(step);
    }

    /*** HELPER METHODS ***/
    moveHighlight(step) {
        this._inputHasFocus = true;
        this._dropdownVisible = true;
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
        this._activeElementDomId = currentData.id;
        this.synchronizeAriaAttr();
    }

    setHighlightCounter(value) {
        this.highlightCounter = ![undefined].includes(value) ? value : parseInt((this.template.querySelector('div.slds-is-focus')?.dataset?.index || 0));
    }
    

    removeAllHighlights() {
        this.template.querySelectorAll('.slds-has-focus')?.forEach(data =>{ 
            data?.classList?.remove('slds-has-focus');
        })
        this._activeElementDomId = null;

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
        if (this._dropdownVisible && !changeEvent) return this.tempOptions;
        options = this.sortOptions(options);
        if(!this._value.length) return options;
        const selectedOptions = options.filter(op => this._value.includes(op.value));
        const unselectedOptions = options.filter(op => !this._value.includes(op.value));
        selectedOptions.sort((a, b) => a.value.localeCompare(b.value));
        options = [...selectedOptions, ...unselectedOptions];
        return options;
        
    }

    getTempOptions() {
        if(!(this._options && this._options?.length)) return [];
        const selOpts = this._options.filter(op => this._value.includes(op.value))?.map(op => op?.label || '')|| [];
        if (!this._dropdownVisible || !this.searchedText || 
            (!this.multiselect && this._dropdownVisible && 
            (selOpts?.[0] || '') === this.searchedText)) options = this._options;
        else return this._options.filter((op) =>
                      op.label.toLowerCase().includes(this.searchedText.toLowerCase()) ||
                      this._value.includes(op.value)
                  );
    }

    // Methods to control pills
    // This method handles the removal of the pill
    removePill(event) {
        if(this.disabled) return;
        let deletedValue = event.detail.name;
        this.hasInteracted = true;
        this.unselectTheOption(deletedValue);
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
        const fireValue = this.multiselect ? this._value : this._value[0];
        this.dispatchEvent(new CustomEvent('change', { detail: { value: fireValue } }));
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

    handleComboboxReady(e) {
        this._labelForId = e.detail.id;
    }

    synchronizeAriaAttr() {
        const input = this.template.querySelector('input');
        const label = this.template.querySelector('label');
        if (input) {
            utils.synchronizeAttrs(input, {
                [ARIA_LABELLEDBY]: this.inputLabelledById,
                [ARIA_DESCRIBEDBY]: this.computedAriaDescribedBy,
                [ARIA_ACTIVEDESCENDANT]: this._activeElementDomId,
                [ARIA_LABEL]: this.inputLabel
            });
            if(!label) return;
            utils.synchronizeAttrs(label, {
                for: input.id
            });
        }
        
    }

    updateClassList() {
        utils.classListMutation(this.classList, {
            'slds-form-element_stacked': this.variant === utils.VARIANT.LABEL_STACKED,
            'slds-form-element_horizontal':
                this.variant === utils.VARIANT.LABEL_INLINE
        });
    }

    connectedCallback() {
        this.classList.add('slds-form-element');
        this.updateClassList();
    }

    renderedCallback() {
        if(!this._isValuesRendered && this._value.length) {
            this.updateSelectedOptions(this._value);
            this._isValuesRendered = true;
        }
        if(!this._isComponentRendered && !this._search) {
            const input = this.template.querySelector('input.slds-combobox__input');
            if (input) {
                input.style.cursor = 'pointer';
                this._isComponentRendered = true;
            }
        }
        this.setHighlightCounter();
        this.synchronizeAriaAttr();
    }
}
