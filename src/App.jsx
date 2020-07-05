import React, { Component } from "react";
import "./App.css";
import { Route, Switch, Redirect, withRouter } from "react-router-dom";
import Login from '../src/components/Login';
import Main from '../src/components/Main';
import Signup from '../src/components/Signup';

class App extends Component {
  state = {
    isAuth: false
  }

  componentDidMount() {
    let token = window.localStorage.getItem('token')
    if (!token) {
      return
    }
    this.setState({isAuth: true})
  }

  Login = (loginData) => {
    fetch("https://shielded-sands-48155.herokuapp.com/login", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "Access-Control-Allow-Origin": "*"
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
        if (data.token) {
          window.localStorage.setItem('token',data.token)
          this.setState({isAuth: true})
          this.props.history.push('/')
        }
      })
      .catch((error) => this.setState({ error }));
  }

  Signup = (SignupData) => {
    fetch("https://shielded-sands-48155.herokuapp.com/signup", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify(SignupData),
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(res.status);
        }
        return res.json();
      })
      .then(() => {
        this.Login(SignupData)
      })
      .catch((error) => this.setState({ error }));
  }
  
  render() {
    let routes = (
      <Switch>
        <Route exact path='/' render={() => {
          return <Login onLogin={this.Login} />
        }} />
        <Route exact path='/signup/:accesskey' render={(routeProps) => {
          return <Signup onSignup={this.Signup} {...routeProps} />
        }} />
        <Redirect to='/' />
      </Switch>
    )
    if (this.state.isAuth) {
      routes = (
        <Switch>
          <Route exact path='/' component={Main} />
        </Switch>
      )
    }
    return (
      <div className="App">
        {routes}
      </div>
    );
  }
}

export default withRouter(App);
