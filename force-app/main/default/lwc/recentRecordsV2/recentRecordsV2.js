import { LightningElement, wire, track } from 'lwc';
import CONSTANTS from './recentRecordsV2Constants';
import getAccessibleObjects from '@salesforce/apex/RecentRecordsController.getAccessibleObjects';
import getRecentRecords from '@salesforce/apex/RecentRecordsController.getRecentRecords';
import getFieldDetails from '@salesforce/apex/RecentRecordsController.getFieldDetails';
import isSystemAdmin from '@salesforce/apex/UserInfoController.isSystemAdmin';
import { NavigationMixin } from "lightning/navigation";
import objFieldSelectorModal from 'c/objectFieldSelector';


export default class RecentRecordsV2  extends NavigationMixin (
    LightningElement 
){
    @track records=[];
    @track columns;
    @track objectOptions;
    @track fields = [];

    recentRecordWire = false;
    errorMessage;
    defaultFields;
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
        if(isNaN(pageSize) || parseInt(pageSize, 10) < 1) {
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
            this.isAdmin = data.isAdmin;
            this.handleSuccess();
        } else if (error) {
            this.isAdmin = false;
            this.handleError(error);
        }
    }

    // gets a list of all the accessible entities in salesforce
    @wire(getAccessibleObjects)
    wiredObjects({ error, data }) {
        if (data) {
            this.objectOptions = data;
            this.handleSuccess();
        } else if (error) {
            this.handleError(error);
        }
    }

    flattenObject(obj, parentKey = '', res = {}){
        for (let key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                let propName = parentKey ? `${parentKey}.${key}` : key;
                if (typeof obj[key] === 'object' && obj[key] !== null && !(obj[key] instanceof Date) && !(Array.isArray(obj[key]))) {
                    this.flattenObject(obj[key], propName, res);
                } else {
                    res[propName] = obj[key];
                }
            }
        }
        return res;
    }

    //Gets list of the recently created records in any salesforce entity
    @wire(getRecentRecords, { objectName: '$objectName', columns: '$fields', numberOfRecords: '$recordLimit' })
    wiredRecords({ error, data }) {
        if (data) {
            this.handleSuccess();
            const flattened = JSON.parse(JSON.stringify(data)).map(s => this.flattenObject(s));
            console.log(JSON.stringify(flattened));

            this.records = JSON.parse(JSON.stringify(data)).map(recordData => ({
                ...this.flattenObject(recordData.record),
                cssCodecanEdit: CONSTANTS.EDIT_BUTTON_PERMISSION_CLASSES[recordData.canEdit.toString()],
                canEdit: recordData.canEdit,
                })
            );

            this.recentRecordWire = true;

            this.columns = this.records && this.records.length ? Array.from(this.records.reduce((keys, object) => {
                  Object.keys(object).forEach(key => keys.add(key));
                  return keys;
                }, new Set()))
                .filter(field => !CONSTANTS.COLUMNS_TO_SKIP.includes(field) && this.fields.map(s=>s.toLowerCase())
                .includes(field.toLowerCase())).map(field => ({ label: field, fieldName: field}))
                .concat(CONSTANTS.EDIT_BUTTON_COLUMN) : [];

            this.handlePaginationSize({detail:{value:this.pageSize}});
            
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

    handleChangeFields() {
        objFieldSelectorModal.open({
            // label:"Select Fields",
            objectApiName: this.objectName,
            selectedColumns: this.fields
        }).then(results => {
            const fieldData = JSON.parse(results);
            if(fieldData.length) {
                this.fields = fieldData;
            }
            else {
                this.fields = this.defaultFields;
            }
        }).catch(error => console.log(JSON.stringify(error)));
      }

    handleObjectChange(event) {
        this.objectName = event.detail.value;
        this.getFieldsByObj(this.objectName);
        console.log(this.objectName);
    }

    // Gets the list of all the fields in any salesforce entity
    getFieldsByObj(objectName) {
        getFieldDetails({objectName: objectName})
        .then((data) => {
            this.handleSuccess();
            // this.fieldOptions = data;
            const fieldList = data.map(field=>field.value);
            this.defaultFields = CONSTANTS.DEFAULT_COLUMNS
                                        .filter(defaultField => fieldList.includes(defaultField.split('.')[0]));
        })
        .catch((error) => {
            this.handleError(error);
        })
        .finally(()=>{
            this.fields =  this.defaultFields;
        })
    }

    handleLimitChange(event) {
        this.recordLimit = parseInt(event.detail.value, 10);
    }
    
    get showNoData() {
        return this.recentRecordWire && !this.records.length
    }

    handleSuccess() {
        this.errorMessage = false;
    }

    handleError(error) {
        console.log(JSON.stringify(error));
        this.errorMessage = error.body.message;
    }
}