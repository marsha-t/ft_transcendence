import React from "react";
import "./Register.css"

const Register: React.FC = () => {
  return (
    <div className="register_page">
      <h1  className="register_title">Create an account</h1>
      <div className="register_block">
        <form className="register_form">
          <div>
            <label htmlFor="nickname">Nickname</label>
            <input type="text" id="nickname" placeholder="Nickname"/>
          </div>
          <div>
            <label htmlFor="email">Email</label>
            <input type="email" id="email" placeholder="example@email.com"/>
          </div>
          <div>
            <label htmlFor="password">Email</label>
            <input type="password" id="password" placeholder="Password"/>
          </div>
          <button type="submit">Create an account</button>
          <p className="login_text">Already have an account?
            <a href="/login">Login</a>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Register;