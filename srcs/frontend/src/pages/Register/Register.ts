export function RegisterPage(): string {
    return `
      <section class="register-page">
        <h2>Create an Account</h2>
        <form id="register-form">
          <label>Nickname <input type="text" required></label>
          <label>Email <input type="email" required></label>
          <label>Password <input type="password" required></label>
          <button type="submit">Register</button>
        </form>
      </section>
    `;
  }
  