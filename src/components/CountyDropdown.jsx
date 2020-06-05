import React, { Component } from "react";

export default class CountyDropdown extends Component {
  state = {
    counties: [],
    value: "",
    error: null,
  };

  setCounties = (counties) => {
    this.setState({
      counties,
      error: null,
    });
  };

  componentDidMount() {
    fetch("http://localhost:8000/counties", {
      method: "GET",
      headers: {
        "content-type": "application/json",
      },
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(res.status);
        }
        return res.json();
      })
      .then(this.setCounties)
      .catch((error) => this.setState({ error }));
  }

  handleDropdownChange = (e) => {
    // console.log(e.target.value)
    this.setState(
      {
        value: e.target.value,
      },
      () => {
        this.props.onAction(this.state.value);
      }
    );
    // console.log(this.state.value)
  };

  render() {
    // console.log(this.props)
    return (
      <form className="county-dropdown">
        <label htmlFor="County Search"></label>
        <select
          name="county search"
          id="county search"
          onChange={this.handleDropdownChange}
        >
          <option value="County Select" selected disabled hidden>County Select</option>
          {this.state.counties.map((county) => {
            return (
              <>
                <option value={county.countyname}>{county.countyname}</option>
              </>
            );
          })}
        </select>
      </form>
    );
  }
}
