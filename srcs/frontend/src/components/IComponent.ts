/**
 * Defines the contract for all components and pages in the application.
 * Any class that implements this interface must have a 'render' method
 * that returns a single HTMLElement to be displayed on the page.
 */
export interface IComponent {
    /**
     * Renders the component or page.
     * @returns The root HTMLElement of the component.
     */
    render(): HTMLElement;
}
