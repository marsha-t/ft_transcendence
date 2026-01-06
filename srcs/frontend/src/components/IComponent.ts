
export interface IComponent {
    render(): HTMLElement;
    cleanup?(): void ;
}
