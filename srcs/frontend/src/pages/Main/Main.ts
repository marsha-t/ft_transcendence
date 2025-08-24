import { IComponent } from '../../components/IComponent';

export class Main implements IComponent {
  public render(): HTMLElement {
    const container = document.createElement('div');
    container.textContent = 'Welcome to Transcendence';
    return container;
  }
}