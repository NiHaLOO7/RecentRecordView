import { createElement } from 'lwc';
import RecentRecordsV2 from 'c/recentRecordsv2';
import getAccessibleObjects from '@salesforce/apex/RecentRecordsController.getAccessibleObjects';
import getRecentRecords from '@salesforce/apex/RecentRecordsController.getRecentRecords';
import getFieldDetails from '@salesforce/apex/RecentRecordsController.getFieldDetails';
import isSystemAdmin from '@salesforce/apex/UserInfoController.isSystemAdmin';
import {setImmediate} from 'timers';
// import { NavigationMixin } from "lightning/navigation";

const accessibleObjectData = require('./data/getAccessibleObjects.json');
const getRecentRecordsData = require('./data/getRecentRecords.json');
const isSystemAdminData = require('./data/isSystemAdmin.json');
const getFieldDetailsData = require('./data/getFieldDetails.json');

const data1 = [{"canEdit": true, "createdbyid": "testid1", "createddate": "2024-04-14T08:29:02.000Z", "cssCodecanEdit": "slds-align_absolute-center", "Id": "testaccid1", "name": "Test1"}];
const data2 = [{"canEdit": true, "createdbyid": "testid2", "createddate": "2024-04-14T07:29:02.000Z", "cssCodecanEdit": "slds-align_absolute-center", "Id": "testaccid2", "name": "Test2"}];

jest.mock('c/objectFieldSelector');

import ObjectFieldSelector from 'c/objectFieldSelector';
ObjectFieldSelector.open = jest.fn();


const mockNavigate = jest.fn();

jest.mock(
    'lightning/navigation',
    () => { 
      const Navigate = Symbol("Navigate");
      const NavigationMixin = (Base) => {
        return class extends Base {
          constructor() {
            super();
            this[Navigate] = mockNavigate;
          }
        }
      };
      NavigationMixin.Navigate = Navigate;
      return {NavigationMixin: NavigationMixin}
    },
    { virtual: true }
  );

// Mocking Apex methods
jest.mock(
    '@salesforce/apex/RecentRecordsController.getAccessibleObjects',
    () => {
      const {
        createApexTestWireAdapter
      } = require('@salesforce/sfdx-lwc-jest');
      return {
        default: createApexTestWireAdapter(jest.fn())
      };
    },
    { virtual: true }
  );

  jest.mock(
    '@salesforce/apex/RecentRecordsController.getRecentRecords',
    () => {
      const {
        createApexTestWireAdapter
      } = require('@salesforce/sfdx-lwc-jest');
      return {
        default: createApexTestWireAdapter(jest.fn())
      };
    },
    { virtual: true }
  );

  jest.mock(
    '@salesforce/apex/UserInfoController.isSystemAdmin',
    () => {
      const {
        createApexTestWireAdapter
      } = require('@salesforce/sfdx-lwc-jest');
      return {
        default: createApexTestWireAdapter(jest.fn())
      };
    },
    { virtual: true }
  );

  jest.mock(
    '@salesforce/apex/RecentRecordsController.getFieldDetails',
    () => {
        return {
            default: jest.fn()
        };
    },
    { virtual: true }
);

function flushPromises() {
    return new Promise((resolve) => setImmediate(resolve));
}

describe('c-recent-records', () => {
    afterEach(() => {
        while (document.body.firstChild) {
            document.body.removeChild(document.body.firstChild);
        }
        jest.clearAllMocks();
    });

    it('renders the component with default values', () => {
        const element = createElement('c-recent-records', {
            is: RecentRecordsV2
        });
        document.body.appendChild(element);
        const lightningInputs = element.shadowRoot.querySelectorAll('lightning-input');
        expect(lightningInputs[0].value).toBe(10);
        expect(lightningInputs[0].value).toBe(10);
    });

    it('test the success scenario of object data, record data, field data and pagination logic when current user is an admin', async() => {
        ObjectFieldSelector.open.mockRejectedValue({"status":500, "body":{"message": "Internal Server Error"}});
        getFieldDetails.mockResolvedValue(getFieldDetailsData.allData);
       
        const element = createElement('c-recent-records', {
            is: RecentRecordsV2
        });
        document.body.appendChild(element);
        getAccessibleObjects.emit(accessibleObjectData);
        getRecentRecords.emit(getRecentRecordsData.adminData);
        isSystemAdmin.emit(isSystemAdminData.trueResponse);
        await new flushPromises();
        let combobox = element.shadowRoot.querySelector('lightning-combobox');
        // let recordLimitField = element.shadowRoot.querySelector('lightning-input.recordLimit');
        let recordPerPageField = element.shadowRoot.querySelector('lightning-input.recordsPerPage');
        expect(combobox.options).toEqual(accessibleObjectData);
        expect(combobox.value).toBe(undefined);
        await recordPerPageField.dispatchEvent(new CustomEvent('change', {detail:{value: 1}}));
        await combobox.dispatchEvent(new CustomEvent('change', {detail:{value: "Account"}}));
        await flushPromises();
        combobox = element.shadowRoot.querySelector('lightning-combobox');
        expect(combobox.value).toBe('Account');
        let changeFieldButton = element.shadowRoot.querySelector('lightning-button.changeFields');
        expect(changeFieldButton).not.toBeNull();
        await changeFieldButton.click();
        await new flushPromises();
        expect(ObjectFieldSelector.open).toHaveBeenCalledWith({"objectApiName": "Account", "selectedColumns": ["CreatedBy.name","createddate", "name", "id"]});
        let dataTable = element.shadowRoot.querySelector('lightning-datatable');
        expect(dataTable).not.toBeNull();
        expect(dataTable.data.length).toBe(1);
        expect(dataTable.data).toEqual(data1);
        let pages = element.shadowRoot.querySelector('span.pages');
        expect(pages.textContent).toBe('Page 1 of 2');
        const nextButton = element.shadowRoot.querySelector('lightning-button.next');
        const prevButton = element.shadowRoot.querySelector('lightning-button.prev');
        expect(prevButton.disabled).toBeTruthy();
        await nextButton.click();
        pages = element.shadowRoot.querySelector('span.pages');
        expect(pages.textContent).toBe('Page 2 of 2');
        dataTable = element.shadowRoot.querySelector('lightning-datatable');
        expect(nextButton.disabled).toBeTruthy();
        expect(prevButton.disabled).toBeFalsy();
        expect(dataTable.data).toEqual(data2);
        await prevButton.click();
        pages = element.shadowRoot.querySelector('span.pages');
        expect(pages.textContent).toBe('Page 1 of 2');
        expect(dataTable.data).toEqual(data1);
        recordPerPageField = element.shadowRoot.querySelector('lightning-input.recordsPerPage');
        await recordPerPageField.dispatchEvent(new CustomEvent('change', {detail:{value: 0}}));
        pages = element.shadowRoot.querySelector('span.pages');
        expect(pages.textContent).toBe('Page 1 of 2');
        await recordPerPageField.dispatchEvent(new CustomEvent('change', {detail:{value: undefined}}));
        pages = element.shadowRoot.querySelector('span.pages');
        expect(pages.textContent).toBe('Page 1 of 2');
        await recordPerPageField.dispatchEvent(new CustomEvent('change', {detail:{value: 5}}));
        pages = element.shadowRoot.querySelector('span.pages');
        expect(pages.textContent).toBe('Page 1 of 1');
        expect(nextButton.disabled).toBeTruthy();
        expect(prevButton.disabled).toBeTruthy();
        expect(dataTable.data).toEqual([...data1, ...data2]);
    });

    it('test the success scenario field adding logic when current user is an admin', async() => {
        ObjectFieldSelector.open.mockResolvedValue(JSON.stringify(['id','lastmodifieddate']));
        const buttonCol = {"fixedWidth": 40, "label": "", "type": "button-icon", "typeAttributes": {"class": {"fieldName": "cssCodecanEdit"}, "iconName": "utility:edit", "label": "Edit", "name": "edit", "title": "Edit", "variant": "bare"}};
        getFieldDetails.mockResolvedValue(getFieldDetailsData.partialData);
        const element = createElement('c-recent-records', {
            is: RecentRecordsV2
        });
        document.body.appendChild(element);
        getAccessibleObjects.emit(accessibleObjectData);
        getRecentRecords.emit(getRecentRecordsData.adminData);
        isSystemAdmin.emit(isSystemAdminData.trueResponse);
        await new flushPromises();
        let combobox = element.shadowRoot.querySelector('lightning-combobox');
        expect(combobox.value).toBe(undefined);
        let recordLimitField = element.shadowRoot.querySelector('lightning-input.recordLimit');
        expect(recordLimitField.value).toBe(10);
        await recordLimitField.dispatchEvent(new CustomEvent('change', {detail:{value: 2}}));
        recordLimitField = element.shadowRoot.querySelector('lightning-input.recordLimit');
        expect(recordLimitField.value).toBe(2);
        await combobox.dispatchEvent(new CustomEvent('change', {detail:{value: "Account"}}));
        await flushPromises();
        combobox = element.shadowRoot.querySelector('lightning-combobox');
        expect(combobox.value).toBe('Account');
        let changeFieldButton = element.shadowRoot.querySelector('lightning-button.changeFields');
        expect(changeFieldButton).not.toBeNull();
        let dataTable = element.shadowRoot.querySelector('lightning-datatable');
        expect(dataTable.columns).not.toContainEqual({"fieldName": "lastmodifieddate", "label": "lastmodifieddate"});
        expect(dataTable.columns).toContainEqual(buttonCol);
        await changeFieldButton.click();
        await new flushPromises();
        getRecentRecords.emit(getRecentRecordsData.dataWithLastModified);
        await new flushPromises();
        expect(dataTable.columns).toContainEqual({"fieldName": "lastmodifieddate", "label": "lastmodifieddate"});
        ObjectFieldSelector.open.mockResolvedValue(JSON.stringify([])); 
        await new flushPromises();
        await changeFieldButton.click();
        expect(dataTable.columns).toContainEqual({"fieldName": "lastmodifieddate", "label": "lastmodifieddate"});
    });

    it('test hidden change fields button and rowActions scenario not admin user', async() => {
        getFieldDetails.mockResolvedValue(getFieldDetailsData.partialData);
        const element = createElement('c-recent-records', {
            is: RecentRecordsV2
        });
        document.body.appendChild(element);
        getAccessibleObjects.emit(accessibleObjectData);
        getRecentRecords.emit(getRecentRecordsData.standardUserData);
        isSystemAdmin.emit(isSystemAdminData.falseResponse);
        await new flushPromises();
        let combobox = element.shadowRoot.querySelector('lightning-combobox');
        expect(combobox.value).toBe(undefined);
        await combobox.dispatchEvent(new CustomEvent('change', {detail:{value: "Account"}}));
        await flushPromises();
        combobox = element.shadowRoot.querySelector('lightning-combobox');
        expect(combobox.value).toBe('Account');
        let changeFieldButton = element.shadowRoot.querySelector('lightning-button.changeFields');
        expect(changeFieldButton).toBeNull(); 
        let dataTable = element.shadowRoot.querySelector('lightning-datatable');
        expect(dataTable).not.toBeNull();
        expect(dataTable.data[0].cssCodecanEdit).toBe('slds-align_absolute-center');
        expect(dataTable.data[1].cssCodecanEdit).toBe('slds-hide');
        dataTable.dispatchEvent(new CustomEvent('rowaction', {detail:{
            action: {name:'edit'},
            row: data1[0]
        }}));
        expect(mockNavigate).toHaveBeenCalledTimes(1);
        expect(mockNavigate).toHaveBeenCalledWith({"attributes": {"actionName": "edit", "objectApiName": "Account", "recordId": "testaccid1"}, "type": "standard__recordPage"});
        dataTable.dispatchEvent(new CustomEvent('rowaction', {detail:{
            action: {name:'delete'},
            row: data1[0]
        }}));
        expect(mockNavigate).not.toHaveBeenCalledTimes(2);
    });

    it('test hidden dual list box and admin wire call gives error', async() => {
        getFieldDetails.mockRejectedValue({"status":500, "body":{"message": "Internal Server Error"}});
        const element = createElement('c-recent-records', {
            is: RecentRecordsV2
        });
        document.body.appendChild(element);
        getAccessibleObjects.emit(accessibleObjectData);
        getRecentRecords.error();
        isSystemAdmin.error();
        await new flushPromises();
        let combobox = element.shadowRoot.querySelector('lightning-combobox');
        expect(combobox.value).toBe(undefined);
        await combobox.dispatchEvent(new CustomEvent('change', {detail:{value: "Account"}}));
        await flushPromises();
        combobox = element.shadowRoot.querySelector('lightning-combobox');
        expect(combobox.value).toBe('Account');
        let changeFieldButton = element.shadowRoot.querySelector('lightning-button.changeFields');
        expect(changeFieldButton).toBeNull(); 
    });

    it('empty result from getRecentRecords scenario', async() => {
        getFieldDetails.mockRejectedValue({"status":500, "body":{"message": "Internal Server Error"}});
        const element = createElement('c-recent-records', {
            is: RecentRecordsV2
        });
        document.body.appendChild(element);
        getAccessibleObjects.emit(accessibleObjectData);
        isSystemAdmin.error();
        await new flushPromises();
        let combobox = element.shadowRoot.querySelector('lightning-combobox');
        expect(combobox.value).toBe(undefined);
        await combobox.dispatchEvent(new CustomEvent('change', {detail:{value: "Account"}}));
        await flushPromises();
        combobox = element.shadowRoot.querySelector('lightning-combobox');
        expect(combobox.value).toBe('Account');
        getRecentRecords.emit(getRecentRecordsData.emptyRecord);
        await new flushPromises();
        const dataTable = element.shadowRoot.querySelector('lightning-datatable');
        expect(dataTable).toBeNull();
    });

    it('get Accessible objects object wire adapter fails', async() => {
        const element = createElement('c-recent-records', {
            is: RecentRecordsV2
        });
        document.body.appendChild(element);
        getAccessibleObjects.error();
        isSystemAdmin.error();
        await new flushPromises();
        let combobox = element.shadowRoot.querySelector('lightning-combobox');
        expect(combobox.value).toBe(undefined);
        expect(combobox.options).toBe(undefined);
    });

});