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
        setSelectedGroup(groupData.data);
        fetchParticipantsInfos(groupData.data);
      } else {
        console.error(`Request failed with status code ${response.status}`);
      }
    } catch (error) {
      console.error("An error occurred:", error);
    }
  };

  const fetchParticipantsInfos = async (selectedGroup) => {
    console.log("Fetching participants for group:", selectedGroup);

    try {
        // Make the API call to get participants details using the new endpoint
        const response = await fetch(url + `/groups/GroupParticipants?GroupId=${selectedGroup.id}`);
        
        if (response.ok) {
            const result = await response.json();

            // Assuming the API returns a `data` field containing an array of participants
            const participants = result.data;

            // Log the retrieved participants for debugging
            console.log("Participants retrieved from API:", participants);

            // Set the participants list with the array of { name, id } objects
            const participantsList = participants.map(participant => ({
                id: participant.id,
                name: participant.name
            }));

            // Set the participants list to the state
            setParticipantsList(participantsList);
            console.log("Participants list set:", participantsList);
        } else {
            console.error(`Failed to fetch participants. Status code: ${response.status}`);
        }
    } catch (error) {
        console.error('An error occurred while fetching participants:', error);
    }
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
          <p className="group-profile-main-title">Group Information</p>
          {selectedGroup && (
            <div className="group-profile-info">
              <img src={selectedGroup.profil} alt="Group Profile" />
              <p className="group-profile-title">{selectedGroup.title}</p>
              <p className="group-profile-description">{selectedGroup.description}</p>
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
