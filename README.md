
# Multiselect Searchable Combobox (LWC)

A highly customizable **Multiselect Searchable Combobox** built using the **Lightning Web Component (LWC)** framework for Salesforce. It supports features like dynamic search, keyboard navigation, error handling, custom validation, ARIA compliance, and pill-based selection display.

This component is inspired by the **LWC Base Combobox Implementation** ([Salesforce Base-Combobox Implementation](https://github.com/salesforce/base-components-recipes/tree/master/force-app/main/default/lwc/baseCombobox)).

## Features

- **Native SLDS Support**: Leverages **Salesforce Lightning Design System (SLDS)** for a consistent, standard-compliant UI.
- **Multiselect Support**: Supports **multiple selections** while maintaining a clean and intuitive UI. Selections are displayed as pills below the input field.
- **Search and Filter**: Provides search functionality to filter large sets of options, enabling users to quickly find and select options.
- **Keyboard Navigation**: Supports **keyboard navigation** for better accessibility and efficiency.
- **Custom Validation**: Allows dynamic validation using the `setCustomValidity` method, enabling custom error handling for user inputs.
- **ARIA Compliance**: Ensures accessibility with proper ARIA roles and attributes for users with disabilities.

## Demo

### 1. Single Select without Search
![Single Select without Search Image](/assets/Single_Select_without_Search.gif)

### 2. Multiselect without Search
![Multiselect without Search Image](/assets/Multiselect_without_search.gif)

### 3. Single Select with Search
![Single Select with Search Image](/assets/Single_Select_with_Search.gif)

### 4. Multiselect with Search
![Multiselect with Search Image](/assets/Multiselect_with_Search.gif)

## Usage

To use the component in your Salesforce LWC project, simply import the necessary files from the `lwc` folder. Below is an example usage of the component:

```html
<c-multiselect-searchable-combobox
    label="Select Your Skills"
    options={skillsList}
    selected-options={defaultSkills}
    pills-icon="utility:check"
    required
    show-values
    field-level-help="Choose the skills you are proficient in."
    pills
></c-multiselect-searchable-combobox>
```

### Supported Attributes

| Attribute             | Mandatory | Description                                                                                             | Default |
|-----------------------|-----------|---------------------------------------------------------------------------------------------------------|---------|
| `label`               | Yes       | Specifies the label text for the combobox.                                                              |         |
| `options`             | Yes       | An array of objects containing `label` and `value` pairs for dropdown options.                          |         |
| `selected-options`    | No        | An array of pre-selected option values (useful for default selection).                                   |         |
| `multiselect`         | No        | If set to `true`, allows multiple selections; otherwise, single selection is enabled.                   | `false` |
| `autocomplete`        | No        | If set to `true`, enables search/autocomplete functionality.                                            | `false` |
| `required`            | No        | Makes the combobox field mandatory.                                                                     | `false` |
| `readonly`            | No        | Makes the combobox field read-only.                                                                     | `false` |
| `disabled`            | No        | Disables the entire combobox.                                                                           | `false` |
| `pills`               | No        | If set to `true`, displays selected options as pills below the input.                                    | `false` |
| `input-value`         | No        | Specifies the input value for the combobox. Useful for default or custom search logic.                   |         |
| `placeholder`         | No        | Displays a placeholder inside the combobox when no value is selected.                                   |         |
| `field-level-help`    | No        | Displays help text next to the label, in the format of a tooltip.                                       |         |
| `validation`          | No        | Custom validation rules for the combobox input. See **Validation** section for more details.             |         |

### Supported Events

1. **`change` Event**: Fired when the selected options change.
   ```js
   handleSelectChange(event) {
       console.log('Selected values:', event.detail);
   }
   ```

### Supported Methods

1. **`checkValidity`**: Checks the validity of the combobox. Returns `true` if valid, `false` otherwise.
2. **`setCustomValidity`**: Sets custom validation messages for the combobox.
   ```js
   if (selectedValue !== 'us') {
       this.template.querySelector('c-multiselect-searchable-combobox').setCustomValidity('Please select "United States"');
   }
   ```

## Validation


### Validation through `setCustomValidity` method:

Use this method to perform dynamic validation from the parent component:

```js
handleSelectedOption(event) {
    console.log('Selected Value:', event.detail.value);
    if (event.detail.value !== 'us') {
        this.template.querySelector('c-multiselect-searchable-combobox').setCustomValidity('You need to select "United States"');
    } else {
        this.template.querySelector('c-multiselect-searchable-combobox').setCustomValidity('');
    }
}
```

---

## Contributing

If you have suggestions or bug fixes, feel free to fork the repository and submit a pull request. We appreciate your contributions to improve the component!

---
