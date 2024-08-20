import React from "react"
import { useNavigate } from "react-router-dom"
import { useParams } from "react-router-dom";

import { useState ,useEffect } from "react";
import "./profil.css";




export default function GroupProfil() {
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [participantsList, setParticipantsList]=useState([]);
    const currentUser = JSON.parse(localStorage["currentUser"]);
    const { id } = useParams();
    const navigate = useNavigate();

    const fetchGroupInfos = async () => {
        try {
            const response = await fetch(`/chat_groups/GroupInfo?GroupId=${id}`); // Appeler la route GET que vous avez créée
            if (response.ok) {
              const groupData = await response.json();
              setSelectedGroup(groupData) // Mettre à jour la variable d'état 'users' avec les utilisateurs récupérés
              fetchParticipantsInfos(groupData);
          } else {
              console.error(`Request failed with status code ${response.status}`);
            }
          } catch (error) {
            console.error('An error occurred:', error);
          }

    }

    const fetchParticipantsInfos = async (selectedGroup) => {
    //   try {
    //     const response = await fetch(`/users/ParticipantsInfo?GroupId=${id}`); // Appeler la route GET pour récupérer les participants du groupe
    //     if (response.ok) {
    //       const participantsData = await response.json();
          
    //       // Récupérer les participantsId du groupe
    //       const participantsIds = participantsData.participantsId;
    //       console.log("participantsIds", participantsIds);
    //       // Appeler la route GET pour récupérer les informations des participants
           console.log("list participants",selectedGroup.participantsId);
           const participantsInfoPromises = (selectedGroup.participantsId).map(async (participantId) => {
            const participantResponse = await fetch(`/users/UserInfo?UserId=${participantId}`);
            if (participantResponse.ok) {
              const participantData = await participantResponse.json();
              return participantData; // Renvoie les informations du participant
            } else {
              console.error(`Request for participant with ID ${participantId} failed with status code ${participantResponse.status}`);
              return null;
            }
          });
          
          // Attendre que toutes les requêtes de récupération d'informations soient terminées
          const participantsInfo = await Promise.all(participantsInfoPromises);
          
          // Filtrer les participantsInfo pour éliminer les entrées null
          const filteredParticipantsInfo = participantsInfo.filter(info => info !== null);
          
          setParticipantsList(filteredParticipantsInfo); // Mettre à jour la variable d'état 'participantsList' avec les informations des participants
        // } else {
        //   console.error(`Request failed with status code ${response.status}`);
        // }
    //   } catch (error) {
    //     console.error('An error occurred:', error);
    //   }
    }
    

    const ReturnToHome = async () => {
      if(currentUser.name==="Admin"){
        navigate(`/admin`);
      }
      else{
        navigate(`/${currentUser.phone}`);
      }
    }
  
  useEffect(() => {
    fetchGroupInfos();
    // fetchParticipantsInfos();
  }, []);

  const handleUserClick = async (user) => {
    navigate(`/contact_profil/${user.id}`)
  }
  
    return(
      
        <div>
           <img src="https://img.icons8.com/?size=512&id=6483&format=png" onClick={()=>ReturnToHome()} className="returnToHome"></img>
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
                  {/* <p className="info_user_txt">{selectedUser.phone}</p> */}
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