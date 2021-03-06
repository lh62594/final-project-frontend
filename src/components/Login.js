import React, { Component, Fragment } from 'react';

import { NavLink } from 'react-router-dom';

import logo from '../assets/logo.png'

import { connect } from 'react-redux';

class Login extends Component {
  state = {
    firstname: "",
    lastname: "",
    username: "",
    password: "",
    email: "",
    passwordConfirmation: "",
  }

  handleChange = (e) => {
		this.setState({
			[e.target.name]: e.target.value
		})
	}

  handleSubmit = (e) => {
    e.preventDefault()

    fetch(`${this.props.url}/api/v1/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accepts": "application/json",
      },
      body: JSON.stringify(this.state)
    })
    .then(res => res.json())
    .then((response) => {
      if (response.errors) {
        alert(response.errors)
      } else {
          // we need to login at the top level where we are holding our current user!
          // setState in App to currentuser
          this.props.setCurrentUser(response.user.id)
          localStorage.setItem('jwt', response.jwt)
          this.props.history.push("/dashboards")
        }
      })
  }

  handleCreateAccount = (e) => {
    e.preventDefault()
    if (this.state.firstname === "" || this.state.lastname === "" || this.state.username === "" || this.state.password === "" || this.state.passwordConfirmation === "") {
      alert("please fill out all fields")
    } else {
      if (this.state.password === this.state.passwordConfirmation) {
        let data = {
          first_name: this.state.firstname,
          last_name: this.state.lastname,
          email: this.state.email,
          username: this.state.username,
          password: this.state.password
        }
        this.fetchCreateUser(data)
      } else {
        alert("passwords don't match")
      }
    }
  }

  componentDidMount() {
    this.props.hideNavBar()
  }

  fetchCreateUser(data) {
    fetch(`${this.props.url}/api/v1/users`, {
    // fetch(`http://localhost:3000/api/v1/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accepts": "application/json",
      },
      body: JSON.stringify(data)
    })
    .then(res => res.json())
    .then(response => {
      if (response.errors) {
        alert(response.errors)
      } else {
        this.props.setCurrentUser(response.user.id)
        localStorage.setItem('jwt', response.jwt)
        this.props.history.push("/dashboards")
      }
    })
  }

  renderLoginForm() {
    return (
      <div className="login">
        <form onSubmit={this.handleSubmit}>
        <br />

        <table className="login-table">
          <tr>
            <td><label> Username </label></td>
            <td><input value={this.state.username} name="username" onChange={this.handleChange} type="text" /> </td>
          </tr>
          <tr>
          <td><label> Password </label></td>
          <td><input
            value={this.state.password}
            name="password"
            onChange={this.handleChange}
            type="password"
          /></td>
          </tr>
          </table>

          <button className="login-btn">login</button>
          <div className="login-div">
            <span> don't have an account? </span>

            <NavLink className="sm-link" to={"/login/signup"}>create an account</NavLink>
          </div>
        </form>
      </div>
    )
  }

  renderSignupForm() {
    return (
      <div className="login">
        <form onSubmit={this.handleCreateAccount}>
          <table className="signup-table">
          <tr>
          <td><label> First Name </label></td>
          <td><input
            value={this.state.firstname}
            name="firstname"
            onChange={this.handleChange}
            type="text"
          /></td>
          </tr>
          <tr>
          <td><label> Last Name </label></td>
          <td><input
            value={this.state.lastname}
            name="lastname"
            onChange={this.handleChange}
            type="text"
          /></td>
          </tr>
          <tr>
          <td><label> Email </label></td>
          <td><input
            value={this.state.email}
            name="email"
            onChange={this.handleChange}
            type="text"
          /></td>
          </tr>
          <tr>
          <td><label> Username </label></td>
          <td><input
            value={this.state.username}
            name="username"
            onChange={this.handleChange}
            type="text"
          /></td>
          </tr>
          <tr>
          <td><label> Password </label></td>
          <td><input
            value={this.state.password}
            name="password"
            onChange={this.handleChange}
            type="password"
          /></td>
          </tr>
          <tr>
          <td><label> Confirm Password </label></td>
          <td><input
            value={this.state.passwordConfirmation}
            name="passwordConfirmation"
            onChange={this.handleChange}
            type="password"
          /></td>
          </tr>
          </table>
          <br />

          <button className="login-btn" onClick={this.handleCreateAccount}> create account </button>
        </form>
        <br />
        <NavLink className="sm-link" to={"/login"}>go back to login</NavLink>
      </div>
    )
  }

  render() {
    return (
      <div className="landing-login">
        {
          this.props.view ?
          this.renderSignupForm()
          :
          this.renderLoginForm()
        }

      </div>
    )
  }
}

function mapStateToProps(state) {
  return {
    url: state.url
  }
}

const HOC = connect(mapStateToProps)

export default HOC(Login);
