import { createElement } from 'lwc';
import ObjectFieldSelector from 'c/objectFieldSelector';
import getFieldDetails from '@salesforce/apex/RecentRecordsController.getFieldDetails';
import {setImmediate} from 'timers';
import LightningModal from 'lightning/modal';

const getFieldDetailsData = require('./data/getFieldDetailsData.json');

LightningModal.prototype.close = jest.fn();

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

// Constants
const OBJECT_API_NAME = 'Account';
const SELECTED_COLUMNS = ['createdbyid', 'createddate', 'name', 'id'];


describe('c-my-modal', () => {
    afterEach(() => {
        while (document.body.firstChild) {
            document.body.removeChild(document.body.firstChild);
        }
    });

    it('testing the existence of model component', async () => {
        getFieldDetails.mockRejectedValue(getFieldDetailsData.data1)
        const element = createElement('c-mymodal', {
            is: ObjectFieldSelector
        });
        document.body.appendChild(element);
        element.objectApiName = OBJECT_API_NAME;
        element.selectedColumns = SELECTED_COLUMNS;
        expect(element.shadowRoot.querySelector('lightning-modal-header').label).toBe('Select Columns');
        expect(element.shadowRoot.querySelector('lightning-modal-body')).not.toBe('Select Columns');
    });

    it('testing all the success scenario and adding new fields and saving and cancelling', async () => {
        getFieldDetails.mockResolvedValue(getFieldDetailsData.data1)
        const element = createElement('c-mymodal', {
            is: ObjectFieldSelector
        });
        document.body.appendChild(element);
        element.objectApiName = undefined;
        element.selectedColumns = [];
        await new flushPromises();
        element.objectApiName = OBJECT_API_NAME;
        element.selectedColumns = [...SELECTED_COLUMNS, 'id'];
        expect(element.shadowRoot.querySelector('lightning-modal-header').label).toBe('Select Columns');
        await new flushPromises();
        expect(getFieldDetails.mock.calls[0][0]).toEqual({"objectName": "Account"});
        let options = element.shadowRoot.querySelectorAll(`select option`);
        expect(options.length).toBe(74);
        expect(options[1].textContent).toBe('Deleted');
        let insertBox = element.shadowRoot.querySelector('lightning-layout-item.insertBox');
        expect(insertBox).toBeNull();
        await options[1].click();
        await new flushPromises();
        insertBox = element.shadowRoot.querySelector('lightning-layout-item.insertBox');
        expect(insertBox).not.toBeNull();
        expect(options[3].textContent).toBe('User (Owner) >');
        let select = element.shadowRoot.querySelectorAll('select');
        expect(select.length).toBe(1);
        getFieldDetails.mockResolvedValue(getFieldDetailsData.data2)
        await new flushPromises();
        await options[3].click();
        await new flushPromises();
        select = element.shadowRoot.querySelectorAll('select');
        expect(select.length).toBe(2);
        options = element.shadowRoot.querySelectorAll(`select option`);
        expect(options.length).toBe(145);
        await options[1].click();
        await new flushPromises();
        select = element.shadowRoot.querySelectorAll('select');
        expect(select.length).toBe(1);
        await options[3].click();
        await new flushPromises();
        select = element.shadowRoot.querySelectorAll('select');
        expect(select.length).toBe(2);
        expect(options[78].textContent).toBe('Full Name');
        expect(options[78].value).toBe('name');
        await options[78].click();
        insertBox = element.shadowRoot.querySelector('lightning-layout-item.insertBox');
        expect(insertBox).not.toBeNull();
        expect(element.shadowRoot.querySelector('.insertWrapperString').textContent).toBe('Owner.name');
        expect(element.shadowRoot.querySelector('.fieldPickerAttributeCategory').textContent).toBe('API Name: Owner.name');
        let insertBtn = element.shadowRoot.querySelector('input.inputBtn');
        await insertBtn.click();
        let pills = element.shadowRoot.querySelector('lightning-pill-container');
        expect(pills.items).toEqual([{"label": "createdbyid", "name": "createdbyid"}, {"label": "createddate", "name": "createddate"}, {"label": "name", "name": "name"}, {"label": "id", "name": "id"}, {"label": "Owner.name", "name": "Owner.name"}]);
        await pills.dispatchEvent(new CustomEvent('itemremove',{detail:{index:0}}));
        expect(pills.items).toEqual([{"label": "createddate", "name": "createddate"}, {"label": "name", "name": "name"}, {"label": "id", "name": "id"}, {"label": "Owner.name", "name": "Owner.name"}]);
        const save = element.shadowRoot.querySelector('lightning-button.save');
        await save.click();
        expect(LightningModal.prototype.close).toHaveBeenCalledTimes(1);
        expect(LightningModal.prototype.close).toHaveBeenNthCalledWith(1,JSON.stringify(["createddate","name","id","Owner.name"]));
        const close = element.shadowRoot.querySelector('lightning-button.close');
        await close.click();
        expect(LightningModal.prototype.close).toHaveBeenCalledTimes(2);
    });
});