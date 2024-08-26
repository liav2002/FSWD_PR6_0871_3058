import React from "react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Cookies from "universal-cookie";
import "./signInOut.css"; 

const url = 'http://localhost:5002';

export default function Register() {
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
    const { name, value } = target;
    let newValue = value;
    if (name === 'status' && value.trim() === '') {
      newValue = 'available';
    }
    setInputs((values) => ({ ...values, [name]: newValue }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const data = JSON.stringify(inputs);
    try {
      const response = await fetch(url + `/users/registerUser`, {
        method: "POST",
        body: data,
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.status === 200 || response.status === 201) {
        alert("Welcome! You were registered successfully.");
        const res = await response.json();
        localStorage.setItem('currentUser', JSON.stringify(res.data));
        const currentTime = new Date().toLocaleString();
        const cookies = new Cookies();
        cookies.set('user_connection', currentTime, { path: '/' });
        navigate(`/${res.data.phone}`);
      }
      else if (response.status === 400) {
        const res = await response.json();
        alert(res.message);
      }
      else {
        alert("Bad Request with response code: " + response.status);
      }
    } catch (error) {
      console.error("An error occurred:", error);
    }
  };

  const profilePictureOptions = [
    {
      value: 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png',
      label: 'First photo',
    },
    {
      value: 'https://i.pinimg.com/564x/26/ea/62/26ea622c0a0260942f7830db79d3a82a.jpg',
      label: 'Second photo',
    },
    {
      value: 'https://img.freepik.com/photos-gratuite/vue-verticale-du-celebre-rocher-plage-santa-giulia_268835-3741.jpg?w=2000',
      label: 'Third photo',
    },
    {
      value: 'https://cdn.futura-sciences.com/buildsv6/images/wide1920/0/0/d/00dd1479a5_108485_chat-domestique.jpg',
      label: 'Fourth photo',
    },
  ];

  return (
    <>
      {!currentUser && (
        <div className="login-container">
          <div className="login-box">
            <h1>REGISTER</h1>
            <form onSubmit={handleSubmit} className="login-form">
              <input
                id="nameInput"
                className="inputTypeIn"
                type="text"
                name="name"
                value={inputs.name || ""}
                onChange={handleChange}
                placeholder="Name"
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
              <input
                id="phoneInput"
                className="inputTypeIn"
                type="tel"
                name="phone"
                value={inputs.phone || ""}
                onChange={handleChange}
                placeholder="Phone"
                pattern="[0-9]{3}[0-9]{3}[0-9]{4}"
                required
              />
              <input
                id="emailInput"
                className="inputTypeIn"
                type="email"
                name="email"
                value={inputs.email || ""}
                onChange={handleChange}
                placeholder="Email"
                required
              />

              <div className="profile-picture-container">
                {profilePictureOptions.map((option) => (
                  <label key={option.value} className="profile-picture-option">
                    <input
                      type="radio"
                      name="profilePictureOption"
                      value={option.value}
                      checked={inputs.profilePictureOption === option.value}
                      onChange={handleChange}
                      required
                    />
                    <img src={option.value} alt={option.label} className="profile-picture-img" />
                  </label>
                ))}
              </div>

              <input
                id="statusInput"
                className="inputTypeIn"
                type="text"
                name="status"
                value={inputs.status || ""}
                onChange={handleChange}
                placeholder="Status"
                required
              />

              <button id="registerButton" type="submit">
                REGISTER
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
