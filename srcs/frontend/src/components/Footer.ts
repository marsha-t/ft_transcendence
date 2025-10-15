import { IComponent } from "./IComponent";

export class Footer implements IComponent {
    public render(): HTMLElement {
        const footer = document.createElement('footer');
        footer.className = `bg-color-yellow pt-3`;


        const subFooter = document.createElement('div');
        subFooter.className = `bg-background py-6 rounded-[16px]
            shadow-[0_-4px_4px_rgba(0,0,0,0.50)]`;

        const content = document.createElement('p');
        content.innerHTML = `© ${new Date().getFullYear()} Transcendence. All rights reserved.`;
        
        subFooter.appendChild(content);

        footer.appendChild(subFooter);

        return footer;
    }
}
