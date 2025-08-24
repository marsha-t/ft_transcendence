import { IComponent } from "../../components/IComponent";

export class Game implements IComponent {
    public render(): HTMLElement {
        const container = document.createElement('div');
        const heading = document.createElement('h1');
        heading.textContent = 'Game Room';
        const description = document.createElement('p');
        description.textContent = 'The game will be rendered here.';

        container.appendChild(heading);
        container.appendChild(description);

        return container;
    }
}
