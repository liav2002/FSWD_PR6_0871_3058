import React from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useState, useEffect } from "react";

const url = 'http://localhost:5002';

export default function ContactProfil() {
  const [selectedUser, setSelectedUser] = useState(null);
  const currentUser = JSON.parse(localStorage["currentUser"]);
  const { id } = useParams();
  const navigate = useNavigate();

  const fetchContactInfos = async () => {
    try {
      const response = await fetch(url + `/users/UserInfo?UserId=${id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (response.ok) {
        const usersData = await response.json();
        setSelectedUser(usersData)
      } else {
        console.error(`Request failed with status code ${response.status}`);
      }
    } catch (error) {
      console.error('An error occurred:', error);
    }

  }

  const ReturnToHome = async () => {
    if (currentUser) {
      if (currentUser.name === "Admin") {
        navigate(`/admin`);
      }
      else {
        navigate(`/${currentUser.phone}`);
      }
    }
  }

  useEffect(() => {
    fetchContactInfos();
  }, []);


  return (
    <div>
      <img src="https://img.icons8.com/?size=512&id=6483&format=png" onClick={() => ReturnToHome()} className="returnToHome"></img>
      <div className="main_content">
        <div className="contact_info_div">
          <p className="contact_info_title">Contact information:</p>
          {selectedUser != null ? (
            <div className="user_info_container">
              <div className="user_info">
                <div>
                  <img src={selectedUser.profil} className="img_contact_display_info" alt="User Profile" />
                </div>
                <div className="user_details">
                  <p className="info_user_txt">{selectedUser.name}</p>
                  <br />
                  <p className="info_user_txt">{selectedUser.phone}</p>
                </div>
              </div>
              <div className="user_status">
                <span className="info_title">Status:</span>
                <span className="info_content">{selectedUser.status}</span>
              </div>

            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}