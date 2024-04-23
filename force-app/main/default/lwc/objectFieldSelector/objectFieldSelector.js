import {api, track } from 'lwc';
import getFieldDetails from '@salesforce/apex/RecentRecordsController.getFieldDetails';
import LightningModal from 'lightning/modal';

export default class ObjectFieldSelector extends LightningModal {
    _objectApiName;
    @track _selectedColumns = [];

    @track columns = [];
    @track cacheStorage = {};
    showInsertButton = false;

    @api
    get selectedColumns() {
        return this._selectedColumns;
    }
    set selectedColumns(value) {
        if(this.selectedColumns !== value) {
            this._selectedColumns = Array.from(new Set(JSON.parse(JSON.stringify(value))));
        }
    }

    @api
    get objectApiName() {
        return this._objectApiName;
    }
    set objectApiName(value) {
        if(this.objectApiName !== value) {
            this._objectApiName = value;
            this.getColumnData(this.objectApiName);
        }
    }

    getColumnData(value) {
        if(this.cacheStorage[value]){
            this.mapColumnData(value, this.cacheStorage[value]);
        } 
        else {
            this.getColumnDataFromSalesforce(value);
        }
    }

    getColumnDataFromSalesforce(value) {
        getFieldDetails({objectName: value})
        .then((data) => {
            this.cacheStorage[value] = data;
            this.mapColumnData(value, data);
        }).catch((error) => {
            console.log(JSON.stringify(error));
        })
    }

    mapColumnData(objectApiName, colData) {
        const data = {object: objectApiName, columns: colData}
        this.columns.push(data);
        console.log(JSON.stringify(this.columns));

    }

    handleOptionChange(event) {
        const fieldNumber = parseInt(event.target.dataset.id, 10);
        const fieldValue = event.target.value;
        const fieldLabel = event.target.dataset.label;
        const isRelatedColumn = event.target.dataset.related;
        if(fieldNumber + 1 < this.columns.length) {
            this.columns.splice(fieldNumber + 1);
        }
        if(isRelatedColumn === "true") {
            this.getColumnData(fieldLabel);
            this.showInsertButton = false;
        }
        else {
            this.showInsertButton = true;
        }
        this.columns[fieldNumber].selectedColumn = fieldValue;
    }

    handleInsertClick() {
        this._selectedColumns.push(this.selectedCol)
        this._selectedColumns = Array.from(new Set(this._selectedColumns));
        console.log(JSON.stringify(this.selectedColumns));
        this.resetComponent(); 
    }

    handleCancel() {
        this.close();
    }

    handleSave() {
        this.close(JSON.stringify(Array.from(new Set(this.selectedColumns))));
    }

    resetComponent() {
        // this.columns.splice(1);
        this.columns = [];
        this.showInsertButton = false;
        this.getColumnData(this.objectApiName);
    }

    handleItemRemove(event) {
        // const name = event.detail.item.name;
        const index = event.detail.index;
        this._selectedColumns.splice(index, 1);
    }

    get selectedCol() {
        return (this.columns.map(col => col.selectedColumn)).join('.');
    }

    // Ready for dynamic query
    get selectedColumnsPills() {
        return this.selectedColumns && this.selectedColumns.length ? this._selectedColumns.map(col => ({label:col, name:col})) : [];
    }

}