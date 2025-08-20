import React from "react";
import "./Login.css"

const Login: React.FC = () => {
  return (
    <div className="login_page">
      <h1 className="login_title">Welcome Back</h1>
      <div className="login_block">
        <form className="login_form">
          <p className="register_text">Don’t have an account yet?
            <a href="/register">Register</a>
          </p>
          <div>
            <label htmlFor="nickname">Nickname</label>
            <input type="text" id="nickname" placeholder="Nickname"/>
          </div>
          <div>
            <label htmlFor="password">Password</label>
            <input type="password" id="password" placeholder="Password"></input>
          </div>
          <button type="submit">Login</button>
        </form>

      </div>

    </div>
  )
};

export default Login;