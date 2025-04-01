import { LightningElement, wire, track } from 'lwc';
import CONSTANTS from './recentRecordsConstants';
import getAccessibleObjects from '@salesforce/apex/RecentRecordsController.getAccessibleObjects';
import getRecentRecords from '@salesforce/apex/RecentRecordsController.getRecentRecords';
import getFieldsByEntity from '@salesforce/apex/RecentRecordsController.getFieldsByEntity';
import isSystemAdmin from '@salesforce/apex/UserInfoController.isSystemAdmin';
import { NavigationMixin } from "lightning/navigation";


export default class RecentRecords  extends NavigationMixin (
    LightningElement 
){
    @track records;
    @track columns;
    @track objectOptions;
    @track fieldOptions;
    @track fields;
    requiredFieldOptions;
    objectName;
    recordLimit = CONSTANTS.INITIAL_RECORD_LIMIT; 
    sAdmin = false;


    // Pagination Logic
    currentPage = 1;
    pageSize = CONSTANTS.INITIAL_PAGE_SIZE;
    totalPages = 0;


    updateTotalPages() {
        if (this.records) {
            this.totalPages = Math.ceil(this.records.length / this.pageSize);
        }
    }

    handleNext() {
        if (this.currentPage < this.totalPages) {
            this.currentPage++;
        }
    }

    handlePrevious() {
        if (this.currentPage > 1) {
            this.currentPage--;
        }
    }

    handlePaginationSize(event) {
        const pageSize = event.detail.value;
        if(isNaN(pageSize) || ['0',0].includes(pageSize)) {
            return;
        }
        this.pageSize = parseInt(pageSize, 10);
        this.currentPage = 1;
        this.updateTotalPages()  
    }

    get prevDisableCondition() {
        return this.currentPage <= 1;
    }

    get nextDisableCondition() {
        return this.currentPage >= this.totalPages;
    }

    // gets the paginated records
    get paginatedRecords() {
        const start = (this.currentPage - 1) * this.pageSize;
        return JSON.parse(JSON.stringify(this.records)).slice(start, start + this.pageSize);
    }

    // boolean to show datatable
    get showTable() {
        return this.records && this.records.length;
    }

    // boolean to show the field selector field
    get showFieldSelector() {
        return this.isAdmin && this.showTable;
    }

    // Checks if current user is admin
    @wire(isSystemAdmin)
    wiredIsAdmin({ error, data }) {
        if (data) {
            this.handleSuccess();
            this.isAdmin = data.isAdmin;
        } else if (error) {
            this.isAdmin = false;
            this.handleError(error);
        }
    }

    // gets a list of all the accessible entities in salesforce
    @wire(getAccessibleObjects)
    wiredObjects({ error, data }) {
        if (data) {
            this.handleSuccess();
            this.objectOptions = JSON.parse(JSON.stringify(data)).sort((a, b) => a.label.localeCompare(b.label));
            // this.objectOptions = data;
        } else if (error) {
            this.handleError(error);
        }
    }

    //Gets list of the recently created records in any salesforce entity
    @wire(getRecentRecords, { objectName: '$objectName', columns: '$fields', numberOfRecords: '$recordLimit' })
    wiredRecords({ error, data }) {
        if (data) {
            this.handleSuccess();
            this.records = JSON.parse(JSON.stringify(data)).map(recordData => ({
                ...recordData.record,
                // cssCodecanEdit: recordData.canEdit ? CONSTANTS.EDIT_BUTTON_PERMISSION_CLASSES.editable : CONSTANTS.EDIT_BUTTON_PERMISSION_CLASSES.notEditable,
                cssCodecanEdit: CONSTANTS.EDIT_BUTTON_PERMISSION_CLASSES[recordData.canEdit.toString()],
                canEdit: recordData.canEdit,
                })
            );
            this.columns = this.records && this.records.length ? Array.from(this.records.reduce((keys, object) => {
                  Object.keys(object).forEach(key => keys.add(key));
                  return keys;
                }, new Set())).filter(field => !CONSTANTS.COLUMNS_TO_SKIP.includes(field))
                .map(field => ({ label: field, fieldName: field })).concat(CONSTANTS.EDIT_BUTTON_COLUMN) : [];

            this.updateTotalPages();
            
        } else if (error) {
            this.handleError(error);
        }
    }

    // handles the click event on the edit button
    handleRowAction(event) {
        const action = event.detail.action;
        const row = event.detail.row;
        switch (action.name) {
            case CONSTANTS.EDIT_BUTTON_NAME:
                this.handleNavigate(row.Id);
                break;
            default:
                break;
        }
    }

    handleNavigate(id) {
        this[NavigationMixin.Navigate]({
            type: CONSTANTS.NAVIGATION_TYPE,
            attributes: {
              recordId: id,
              objectApiName: this.objectName,
              actionName: CONSTANTS.NAVIGATION_MODE,
            },
          });
      }

    handleObjectChange(event) {
        this.objectName = event.detail.value;
        this.getFieldsByObj(this.objectName);
        console.log(this.objectName);
    }

    // Gets the list of all the fields in any salesforce entity
    getFieldsByObj(objectName) {
        getFieldsByEntity({entityName: objectName})
        .then((data) => {
            this.handleSuccess();
            this.fieldOptions = data;
            const fieldList = this.fieldOptions.map(field=>field.value);
            this.requiredFieldOptions = CONSTANTS.DEFAULT_COLUMNS.filter(defaultField => fieldList.includes(defaultField));
            console.log(JSON.stringify(this.fieldOptions));
        })
        .catch((error) => {
            this.handleError(error);
        })
        .finally(()=>{
            this.fields =  this.requiredFieldOptions;
        })
    }

    handleDualListChange(event) {
        this.fields = event.detail.value
    }

    handleLimitChange(event) {
        this.recordLimit = event.detail.value;
    }

    get recordLimitBoolean() {
        return this.recordLimit <= 0;
    }

    handleSuccess() {
        this.errorMessage = false;
    }

    handleError(error) {
        console.log(JSON.stringify(error));
        this.errorMessage = error.body.message;
    }
}