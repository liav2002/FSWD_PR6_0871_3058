import React from "react";
import { useNavigate, useParams } from "react-router-dom";
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
      const response = await fetch(`${url}/groups/GroupInfo?GroupId=${id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (response.ok) {
        const groupData = await response.json();
        setSelectedGroup(groupData);
        fetchParticipantsInfos(groupData);
      } else {
        console.error(`Request failed with status code ${response.status}`);
      }
    } catch (error) {
      console.error("An error occurred:", error);
    }
  };

  const fetchParticipantsInfos = async (group) => {
    const participantsInfoPromises = group.participantsId.map(async (participantId) => {
      const participantResponse = await fetch(`${url}/users/UserInfo?UserId=${participantId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (participantResponse.ok) {
        return await participantResponse.json();
      } else {
        console.error(`Failed for participant ID: ${participantId}`);
        return null;
      }
    });
    const participantsInfo = await Promise.all(participantsInfoPromises);
    setParticipantsList(participantsInfo.filter((info) => info !== null));
  };

  const ReturnToHome = () => navigate(`/${currentUser.phone}`);

  useEffect(() => {
    fetchGroupInfos();
  }, []);

  return (
    <div className="group-profile-container">
      <div className="return-to-home-wrapper">
        <img
          src="https://img.icons8.com/?size=512&id=6483&format=png"
          onClick={ReturnToHome}
          className="return-to-home"
          alt="Return to Home"
        />
      </div>
      <div className="group-profile-main">
        <div className="group-profile-content">
          <p className="group-profile-title">Group Information</p>
          {selectedGroup && (
            <div className="group-profile-info">
              <img src={selectedGroup.profil} alt="Group Profile" />
              <p>{selectedGroup.title}</p>
              <p>{selectedGroup.description}</p>
              <p>Participants:</p>
              <ul>
                {participantsList.map((user) => (
                  <li key={user.id}>{user.name}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
