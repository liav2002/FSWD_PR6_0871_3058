import React from "react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import "./profil.css";

const url = 'http://localhost:5002';

export default function YourProfil() {
  const currentUser = JSON.parse(localStorage["currentUser"]);
  const [name, setName] = useState(currentUser.name);
  const [email, setEmail] = useState(currentUser.email);
  const [status, setStatus] = useState(currentUser.status);
  const [password, setPassword] = useState(currentUser.password);
  const [image, setImage] = useState(currentUser.profil);
  const navigate = useNavigate();

  const handleNameChange = (event) => setName(event.target.value);
  const handleStatusChange = (event) => setStatus(event.target.value);
  const handlePasswordChange = (event) => setPassword(event.target.value);
  const handleEmailChange = (event) => setEmail(event.target.value);

  const handleImageChange = (event) => {
    const selectedImg = event.target.files[0];
    const imageURL = URL.createObjectURL(selectedImg);
    setImage(imageURL);
  };

  const ReturnToHome = () => navigate(`/${currentUser.phone}`);

  const SaveChange = async () => {
    try {
      const response = await fetch(
        `${url}/users/updateUserInfo?id=${currentUser.id}&name=${name}&status=${status}&password=${password}&email=${email}&profil=${image}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      if (!response.ok) throw new Error("Request failed for updating user");
      const data = await response.json();
      console.log(data);
      alert("Your profile is updated successfully.");
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    <div className="your-profile-container">
      <img
        src="https://img.icons8.com/?size=512&id=6483&format=png"
        onClick={ReturnToHome}
        className="return-to-home"
        alt="Return to Home"
      />
      <div className="your-profile-main">
        <div className="your-profile-content">
          <p className="your-profile-title">Your Profile</p>
          <div className="your-profile-info">
            <div className="your-profile-image-container">
              <label htmlFor="imageInput">
                <img src={image || currentUser.profil} alt="Profile" />
              </label>
              <input
                id="imageInput"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
              />
            </div>
            <div className="your-profile-details">
              <input
                type="text"
                value={name}
                onChange={handleNameChange}
                placeholder="Your Name"
              />
              <input
                type="text"
                value={email}
                onChange={handleEmailChange}
                placeholder="Your Email"
              />
              <p>{currentUser.phone}</p>
              <input
                type="text"
                value={status}
                onChange={handleStatusChange}
                placeholder="Your Status"
              />
              <input
                type="text"
                value={password}
                onChange={handlePasswordChange}
                placeholder="Your Password"
              />
            </div>
          </div>
          <button onClick={SaveChange}>Save</button>
        </div>
      </div>
    </div>
  );
}
