export function renderHeader(): string {
    return `
      <header class="header">
        <nav>
          <ul>
            <li><a href="/" data-nav>Home</a></li>
            <li><a href="/about" data-nav>Creators</a></li>
            <li><a href="/login" data-nav>Login</a></li>
            <li><a href="/register" data-nav>Register</a></li>
          </ul>
        </nav>
      </header>
    `;
  }