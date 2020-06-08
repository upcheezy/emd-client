import React, { Component } from "react";
import "./App.css";
import { Route } from "react-router-dom";
import Login from '../src/components/Login';
import Main from '../src/components/Main';
import Signup from '../src/components/Signup';

class App extends Component {
  state = {}

  Login = (loginData) => {
    console.log(loginData);
    fetch("http://localhost:8000/login", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(loginData),
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(res.status);
        }
        return res.json();
      })
      .then((data) => {
        console.log(data);
        if (data.token) {
          window.location.replace('/main')
        }
      })
      .catch((error) => this.setState({ error }));
  }

  Signup = (SignupData) => {
    fetch("http://localhost:8000/signup", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(SignupData),
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(res.status);
        }
        return res.json();
      })
      .then((data) => {
        console.log(data);
      })
      .catch((error) => this.setState({ error }));
  }
  
  render() {
    return (
      <div className="App">
        <Route exact path='/login' render={() => {
          return <Login onLogin={this.Login} />
        }} />
        <Route exact path='/main' component={Main} />
        <Route exact path='/signup/:accesskey' render={(routeProps) => {
          return <Signup onSignup={this.Signup} {...routeProps} />
        }} />
      </div>
    );
  }
}

export default App;
