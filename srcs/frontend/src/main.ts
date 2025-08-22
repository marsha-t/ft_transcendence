// main.ts
document.getElementById("header")!.innerHTML = `
  <h1>Pong Tournament</h1>
  <nav>
    <a href="/" data-link>Home</a>
    <a href="/about" data-link>About</a>
    <a href="/register" data-link>Register</a>
    <a href="/login" data-link>Login</a>
    <a href="/game" data-link>Game</a>
  </nav>
`;

document.getElementById("footer")!.innerHTML = `
  <p>© 2025 Pong Tournament</p>
`;
console.log("Hello from main.ts!");
