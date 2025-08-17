import React from "react";
import "./Register.css"

const Register: React.FC = () => {
  return (
    <div className="register_page">
      <div className="register_block">
        <h1>Create Account</h1>
        <form className="register_form">
          <div>
            <label htmlFor="nickname">Nickname</label>
            <input type="text" id="nickname" placeholder="Nickname"/>
          </div>
          <div>
            <label htmlFor="email">Email</label>
            <input type="email" id="email" placeholder="Email"/>
          </div>
          <div>
            <label htmlFor="password">Email</label>
            <input type="password" id="password" placeholder="Password"/>
          </div>
          <button type="submit">Register</button>
        </form>
      </div>
    </div>
  );
};

export default Register;