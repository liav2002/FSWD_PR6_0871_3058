import React from "react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

const url = "http://localhost:5002";

export default function YourProfil() {
  const currentUser = JSON.parse(localStorage["currentUser"]);
  const [name, setName] = useState(currentUser.name);
  const [email, setEmail] = useState(currentUser.email);
  const [status, setStatus] = useState(currentUser.status);
  const [password, setPassword] = useState(currentUser.password);
  const [image, setImage] = useState(currentUser.profil);
  const navigate = useNavigate();

  const handleNameChange = async (event) => {
    setName(event.target.value);
  };
  const handleStatusChange = async (event) => {
    setStatus(event.target.value);
  };
  const handlePasswordChange = async (event) => {
    setPassword(event.target.value);
  };
  const handleEmailChange = async (event) => {
    setEmail(event.target.value);
  };
  const handleImageChange = async (event) => {
    const selectedImg = event.target.files[0];
    const imageURL = URL.createObjectURL(selectedImg);
    setImage(imageURL);
  };
  const ReturnToHome = async () => {
    navigate(`/${currentUser.phone}`);
  };
  const SaveChange = async () => {
    try {
      const response = await fetch(
        url +
          `/users/updateUserInfo?id=${currentUser.id}&name=${name}&status=${status}&password=${password}&email=${email}&profil=${image}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          }
        }
      );
      if (!response.ok) {
        throw new Error("Request failed for updating user");
      }
      let user = JSON.parse(localStorage.getItem("currentUser"));
      user.name = name;
      user.email = email;
      user.profil = image;
      user.status = status;
      user.password = password;
      localStorage.removeItem(currentUser);
      localStorage.setItem("currentUser", JSON.stringify(user));
      alert("Your profile is updated successfully.");
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    <div className="your-profile-container">
      <div className="return-to-home-wrapper">
        <img
          src="https://img.icons8.com/?size=512&id=6483&format=png"
          onClick={() => ReturnToHome()}
          className="return-to-home"
          alt="Return"
        />
      </div>
      <div className="your-profile-main">
        <div className="your-profile-content">
          <p className="your-profile-title">Your Profile</p>
          {currentUser != null ? (
            <div className="your-profile-info">
              <div className="your-profile-image-container">
                <label htmlFor="imageInput">
                  <img
                    src={image !== "" ? image : currentUser.profil}
                    className="your-profile-img"
                    alt="User Profile"
                  />
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
                  value={name !== "" ? name : currentUser.name}
                  className="your-profile-input"
                  onChange={handleNameChange}
                />
                <input
                  type="text"
                  value={email !== "" ? email : currentUser.email}
                  className="your-profile-input"
                  onChange={handleEmailChange}
                />
                <p>{currentUser.phone}</p>
                <select
                  value={status}
                  onChange={handleStatusChange}
                  className="your-profile-select"
                >
                  <option value="available">available</option>
                  <option value="busy">busy</option>
                </select>
                <input
                  type="password"
                  value={password !== "" ? password : currentUser.password}
                  className="your-profile-input"
                  placeholder="New Password"
                  onChange={handlePasswordChange}
                />
                <button onClick={() => SaveChange()} className="your-profile-save-btn">
                  Save
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
