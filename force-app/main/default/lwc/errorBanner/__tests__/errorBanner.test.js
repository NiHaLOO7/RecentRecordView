import { createElement } from 'lwc';
import ErrorBanner from 'c/errorBanner';

describe('c-error-banner', () => {
    afterEach(() => {
        while (document.body.firstChild) {
            document.body.removeChild(document.body.firstChild);
        }
    });

    it('TODO: test case generated by CLI command, please fill in test logic', async() => {
        const element = createElement('c-error-banner', {
            is: ErrorBanner
        });
        element.message = "Error Message";
        document.body.appendChild(element);
        expect(element.shadowRoot.querySelector('.message').textContent).toBe("Error Message");
    });
});