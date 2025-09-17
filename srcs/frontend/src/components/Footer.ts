import { IComponent } from "./IComponent";

export class Footer implements IComponent {
    public render(): HTMLElement {
        const footer = document.createElement('footer');
        const content = document.createElement('p');
        content.innerHTML = `© ${new Date().getFullYear()} Transcendence. All rights reserved.`;
        footer.appendChild(content);

        return footer;
    }
}
