import React from "react"
import { Link, useNavigate } from "react-router-dom"
import "./signInOut.css";
import { useState } from "react";

const validPhone = /^$|^\d{0,10}$/;
const url = 'http://localhost:5002';

export default function Login() {

  const [inputs, setInputs] = useState({});
  const navigate = useNavigate();


  const handleChange = ({ target }) => {
    let isValid = true;
    const { name, value } = target;

    if (name === 'phone') {
      isValid = validPhone.test(value);
    }
    if (isValid) {
      setInputs(values => ({ ...values, [name]: value }))
    }
  }


  const handleSubmit = (event) => {
    event.preventDefault();
    console.log(inputs);
    let phone = inputs.phone;
    let password = inputs.password;
    console.log(phone);

    const requestOptions = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    };

    fetch(url + `/users/loginUser?phone=${phone}&password=${password}`, requestOptions)
      .then(res => {
        console.log(`Status: ${res.status}`);
        console.log('Response headers:', res.headers);
        if (res.ok) {
          return res.json();
        } else if (res.status === 404) {
          console.error(`Request failed with status code ${res.status}`);
          alert('Phone or password is wrong');
          setInputs(values => ({ ...values, 'password': "" }));
          throw new Error('Phone or password is wrong');
        } else {
          console.error(`Request failed with status code ${res.status}`);
          alert("User not found");
          throw new Error('User not found');
        }
      })
      .then(user => {
        alert('You are logged in');
        console.log("User data:", JSON.stringify(user));
        localStorage.setItem('currentUser', JSON.stringify(user.data));
        if (user.name === "Admin") {
          navigate(`/admin`);
        } else {
          navigate(`/${user.data.phone}`);
        }
      })
      .catch(error => {
        console.error('An error occurred:', error);
      });
  };


  return (
    <div className="login-container">
      <h1>WELCOME</h1>
      <form onSubmit={handleSubmit} className="login-form">
        <input
          className="inputTypeIn"
          id="phoneInput"
          type="tel" 
          name="phone"
          value={inputs.phone || ""}
          onChange={handleChange}
          placeholder="Enter your phone number:"
          required
        />

        <input
          id="passwordInput"
          className="inputTypeIn"
          type="password"
          name="password"
          value={inputs.password || ""}
          onChange={handleChange}
          placeholder="Enter your password:"
          required
        />
        <input id="submitButton" type="submit" name="submit" value="LOG IN" />
      </form>
      <Link className="loginLink" to="/register">
        REGISTER
      </Link>
    </div>
  )
}