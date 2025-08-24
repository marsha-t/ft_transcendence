import { IComponent } from "../../components/IComponent";

export class About implements IComponent {
    public render(): HTMLElement {
        const container = document.createElement('div');
        const heading = document.createElement('h1');
        heading.textContent = 'About Transcendence';
        const description = document.createElement('p');
        description.textContent = 'Transcendence is a project dedicated to building a modern, full-stack web application with a focus on real-time gaming and social interactions. This platform is a testament to the power of a microservices architecture and is built with passion and precision.';

        container.appendChild(heading);
        container.appendChild(description);

        return container;
    }
}
