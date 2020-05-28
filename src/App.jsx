import React from "react";
import "./App.css";
import { Route } from "react-router-dom";
import Login from '../src/components/Login';
import Main from '../src/components/Main';

function App() {
  return (
    <div className="App">
      <Route exact path='/login' component={Login} />
      <Route exact path='/main' component={Main} />
    </div>
  );
}

export default App;
