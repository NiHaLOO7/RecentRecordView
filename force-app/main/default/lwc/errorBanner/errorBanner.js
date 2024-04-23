import { LightningElement, api } from 'lwc';

export default class ErrorBanner extends LightningElement {
    @api message;
}