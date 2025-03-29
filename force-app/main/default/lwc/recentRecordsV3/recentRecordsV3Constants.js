const COLUMNS_TO_SKIP = ['canEdit','cssCodecanEdit'];
const DEFAULT_COLUMNS = ['CreatedBy.name', 'createddate', 'name', 'id'];

// To avoid changes at more than one place
const EDIT_BUTTON_NAME = 'edit';

const EDIT_BUTTON_COLUMN = [{
    label: '',
    type: 'button-icon',
    fixedWidth: 40,
    typeAttributes: {
        label: 'Edit',
        name: EDIT_BUTTON_NAME,
        title: 'Edit',
        iconName: 'utility:edit',
        variant: 'bare',
        class: {
            fieldName: `cssCodecanEdit`
        },
    },
}]

const EDIT_BUTTON_PERMISSION_CLASSES = {
    true: 'slds-align_absolute-center',
    false: 'slds-hide',
}

const NAVIGATION_TYPE = 'standard__recordPage';
const NAVIGATION_MODE = 'edit';

const INITIAL_PAGE_SIZE = 10;

const INITIAL_RECORD_LIMIT = 10;

export default {
    COLUMNS_TO_SKIP,
    DEFAULT_COLUMNS,
    EDIT_BUTTON_NAME,
    EDIT_BUTTON_COLUMN,
    EDIT_BUTTON_PERMISSION_CLASSES,
    INITIAL_PAGE_SIZE,
    INITIAL_RECORD_LIMIT,
    NAVIGATION_TYPE,
    NAVIGATION_MODE,
}