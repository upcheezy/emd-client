import React, { Component } from "react";
import img from "../images/SC811.png";
import "./Login.css";

class Login extends Component {
  state = {
    error: null,
  };

  changeHandler = (ev) => {
    this.setState({
      [ev.target.name]: ev.target.value
    })
  }

  handleSubmit = (ev) => {
    ev.preventDefault()

    this.props.onLogin(this.state)
  }

  render() {
    const { error } = this.state;
    return (
      <div className="login-page">
        <div className="form-container">
          <form className="login-form" onSubmit={this.handleSubmit}>
            <img src={img} alt="SC811 logo" className="logo" />
            <div className="login_error" role="alert">
              {error && <p>{error.message}</p>}
            </div>
            <div className="uname">
              <label htmlFor="username"></label>
              <input type="text" name="username" id="username" placeholder='username' required onChange={this.changeHandler} />
            </div>
            <div className="pw">
              <label htmlFor="password"></label>
              <input type="password" name="password" id="password" placeholder='password' required onChange={this.changeHandler} />
            </div>
            <button type="submit">Login</button>
          </form>
        </div>
      </div>
    );
  }
}

export default Login;
