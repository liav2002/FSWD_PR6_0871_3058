import React from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useState, useEffect } from "react";
import "./profil.css";

const url = 'http://localhost:5002';

export default function GroupProfil() {
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [participantsList, setParticipantsList] = useState([]);
  const currentUser = JSON.parse(localStorage["currentUser"]);
  const { id } = useParams();
  const navigate = useNavigate();

  const fetchGroupInfos = async () => {
    try {
      const response = await fetch(url + `/groups/GroupInfo?GroupId=${id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (response.ok) {
        const groupData = await response.json();
        setSelectedGroup(groupData)
        fetchParticipantsInfos(groupData);
      } else {
        console.error(`Request failed with status code ${response.status}`);
      }
    } catch (error) {
      console.error('An error occurred:', error);
    }

  }

  const fetchParticipantsInfos = async (selectedGroup) => {
    console.log("list participants", selectedGroup.participantsId);
    const participantsInfoPromises = (selectedGroup.participantsId).map(async (participantId) => {
      const participantResponse = await fetch(url + `/users/UserInfo?UserId=${participantId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (participantResponse.ok) {
        const participantData = await participantResponse.json();
        return participantData;
      } else {
        console.error(`Request for participant with ID ${participantId} failed with status code ${participantResponse.status}`);
        return null;
      }
    });
    const participantsInfo = await Promise.all(participantsInfoPromises);
    const filteredParticipantsInfo = participantsInfo.filter(info => info !== null);
    setParticipantsList(filteredParticipantsInfo);
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
    fetchGroupInfos();
  }, []);

  const handleUserClick = async (user) => {
    navigate(`/contact_profil/${user.id}`)
  }

  return (
    <div>
      <img src="https://img.icons8.com/?size=512&id=6483&format=png" onClick={() => ReturnToHome()} className="returnToHome"></img>
      <div className="main_content">
        <div className="contact_info_div">

          <p className="contact_info_title">Group information:</p>
          {selectedGroup != null ? (
            <div className="user_info_container">
              <div className="user_info">
                <div>
                  <img src={selectedGroup.profil} className="img_contact_display_info" alt="Group Profile" />
                </div>
                <div className="user_details">
                  <p className="info_user_txt">{selectedGroup.title}</p>
                </div>
              </div>
              <div className="user_status">
                <p className="info_title">Description:</p>
                <span className="info_content">{selectedGroup.description}</span>
                <p className="info_title">Participants:</p>
                {participantsList.map((user) => (
                  <button onClick={() => handleUserClick(user)}>{user.name}</button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}