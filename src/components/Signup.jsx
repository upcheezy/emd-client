import React, { Component } from "react";
import img from "../images/SC811.png";
import './Signup.css';

export default class Signup extends Component {
  state = {
    error: null,
  };

  changeHandler = (ev) => {
    this.setState({
      [ev.target.name]: ev.target.value,
    });
  };

  handleSubmit = (ev) => {
    ev.preventDefault();
    if (this.state.password === this.state.passwordconfirm) {
      this.props.onSignup(this.state);
    } else{
      alert('please make sure the passwords match.')
    }
  };

  render() {
    const { error } = this.state;
    const {accesskey} = this.props.match.params;
    let form;
    if (accesskey === 'abc') {
        form = (<div className="login-page">
        <div className="form-container">
          <form className="login-form" onSubmit={this.handleSubmit}>
            <img src={img} alt="SC811 logo" className="logo" />
            <h2>Registration Form</h2>
            <div className="login_error" role="alert">
              {error && <p>{error.message}</p>}
            </div>
            <div className="firstname">
              <label htmlFor="firstname"></label>
              <input
                type="text"
                name="firstname"
                id="firstname"
                placeholder="First Name"
                required
                onChange={this.changeHandler}
              />
            </div>
            <div className="lastname">
              <label htmlFor="lastname"></label>
              <input
                type="text"
                name="lastname"
                id="lastname"
                placeholder="Last Name"
                required
                onChange={this.changeHandler}
              />
            </div>
            <div className="email">
              <label htmlFor="email"></label>
              <input
                type="text"
                name="email"
                id="email"
                placeholder="Email"
                required
                onChange={this.changeHandler}
              />
            </div>
            <div className="uname">
              <label htmlFor="username"></label>
              <input
                type="text"
                name="username"
                id="username"
                placeholder="Username"
                required
                onChange={this.changeHandler}
              />
            </div>
            <div className="pw">
              <label htmlFor="password"></label>
              <input
                type="password"
                name="password"
                id="password"
                placeholder="Password"
                required
                onChange={this.changeHandler}
              />
            </div>
            <div className="pw-c">
              <label htmlFor="passwordconfirm"></label>
              <input
                type="password"
                name="passwordconfirm"
                id="passwordconfirm"
                placeholder="Confirm Password"
                required
                onChange={this.changeHandler}
              />
            </div>
            <input type="submit" value="Sign Up" className="signin-button" />
          </form>
        </div>
      </div>)
    } else {
        form = (<p>access key required</p>)
    }
    return form 
  }
}
