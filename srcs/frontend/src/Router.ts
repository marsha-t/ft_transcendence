import { MainPage } from './pages/Main/Main';
import { AboutPage } from './pages/About/About';
import { RegisterPage } from './pages/Register/Register';
import { LoginPage } from './pages/Login/Login';
import { GamePage } from './pages/Game/Game';

export class Router {
  private container: HTMLElement;
  private routes: Record<string, () => string>;

  constructor(containerSelector: string) {
    this.container = document.querySelector(containerSelector)!;
    this.routes = {
      '/': MainPage,
      '/about': AboutPage,
      '/register': RegisterPage,
      '/login': LoginPage,
      '/game': GamePage
    };
  }

  navigate(path: string) {
    this.container.innerHTML = this.routes[path]?.() ?? '<h2>Page not found</h2>';
    history.pushState({}, '', path);
  }
}
