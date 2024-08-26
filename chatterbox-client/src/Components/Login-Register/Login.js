import React from "react";
import { Link, useNavigate } from "react-router-dom";
import "./signInOut.css";
import { useState, useEffect } from "react";

const validPhone = /^$|^\d{0,10}$/;
const url = 'http://localhost:5002';

export default function Login() {
  const [inputs, setInputs] = useState({});
  const navigate = useNavigate();
  const currentUser = localStorage.getItem("currentUser")
    ? JSON.parse(localStorage.getItem("currentUser"))
    : null;

  useEffect(() => {
    const secureUser = () => {

      if (currentUser) {
        navigate(`/${currentUser.phone}`, { replace: true });
      }
    };

    secureUser();
  }, [navigate]);

  const handleChange = ({ target }) => {
    let isValid = true;
    const { name, value } = target;

    if (name === 'phone') {
      isValid = validPhone.test(value);
    }
    if (isValid) {
      setInputs(values => ({ ...values, [name]: value }));
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    let phone = inputs.phone;
    let password = inputs.password;

    const requestOptions = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    };

    fetch(url + `/users/loginUser?phone=${phone}&password=${password}`, requestOptions)
      .then(res => {
        if (res.ok) {
          return res.json();
        } else if (res.status === 404) {
          alert('Phone or password is wrong');
          setInputs(values => ({ ...values, 'password': "" }));
          throw new Error('Phone or password is wrong');
        } else {
          alert("User not found");
          throw new Error('User not found');
        }
      })
      .then(user => {
        alert('You are logged in');
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
    <>
      {!currentUser && (
        <div className="login-container">
          <div className="login-box">
            <h1>WELCOME</h1>
            <form onSubmit={handleSubmit} className="login-form">
              <input
                className="inputTypeIn"
                id="phoneInput"
                type="tel"
                name="phone"
                value={inputs.phone || ""}
                onChange={handleChange}
                placeholder="Phone Number"
                required
              />

              <input
                id="passwordInput"
                className="inputTypeIn"
                type="password"
                name="password"
                value={inputs.password || ""}
                onChange={handleChange}
                placeholder="Password"
                required
              />
              <button id="submitButton" type="submit">
                LOG IN
              </button>
            </form>
            <Link className="loginLink" to="/register">
              Don’t have an account? <span className="link-text">Register</span>
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
