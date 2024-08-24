import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import "./profil.css";

const url = 'http://localhost:5002';

export default function ContactProfil() {
  const [selectedUser, setSelectedUser] = useState(null);
  const currentUser = JSON.parse(localStorage["currentUser"]);
  const { id } = useParams();
  const navigate = useNavigate();

  const fetchContactInfos = async () => {
    try {
      const response = await fetch(`${url}/users/UserInfo?UserId=${id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (response.ok) {
        const usersData = await response.json();
        setSelectedUser(usersData.data);
      } else {
        console.error(`Request failed with status code ${response.status}`);
      }
    } catch (error) {
      console.error("An error occurred:", error);
    }
  };

  const ReturnToHome = () => navigate(`/${currentUser.phone}`);

  useEffect(() => {
    fetchContactInfos();
  }, []);

  return (
    <div className="contact-profile-container">
      <img
        src="https://img.icons8.com/?size=512&id=6483&format=png"
        onClick={ReturnToHome}
        className="return-to-home"
        alt="Return to Home"
      />
      <div className="contact-profile-main">
        <div className="contact-profile-content">
          <p className="contact-profile-title">Contact Information</p>
          {selectedUser && (
            <div className="contact-profile-info">
              <img src={selectedUser.profil} alt="Profile" />
              <div>
                <p>{selectedUser.name}</p>
                <p>{selectedUser.phone}</p>
                <p>Status: {selectedUser.status}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
