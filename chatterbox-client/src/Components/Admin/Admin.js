import React, { useState, useEffect } from "react";
import "./Admin.css";
import { useNavigate } from "react-router-dom";
import Cookies from "universal-cookie";

const url = 'http://localhost:5002';

export default function Admin() {
  const [selectedChoice, setSelectedChoice] = useState("contacts");
  const [users, setUsers] = useState([]);
  const [Reported_msg, setReported_msg] = useState([]);
  const [Reported_msgChecked, setReported_msgChecked] = useState([]);
  const [msg_kept, setMsg_kept] = useState([]);
  const [deleted_msg, setDeleted_msg] = useState([]);
  const [showAllCheckedMsg, setShowAllCheckedMsg] = useState(false);
  const [showKept, setShowKept] = useState(false);
  const [showDeleted, setShowDeleted] = useState(false);
  const navigate = useNavigate();
  const cookies = new Cookies();
  const currentUser = JSON.parse(localStorage["currentUser"]);


  useEffect(() => {
    AllReported();
    handleChoiceContacts();
  }, []);


  const handleChoiceClick = (choice) => {
    setSelectedChoice(choice);
    if (choice === "contacts") {
      handleChoiceContacts();
    }

    else if (choice === "messages to check") {
      AllReported();
    }

    // else if (choice === "All checked messages") {

    // }
  };

  const handleChoiceContacts = async () => {
    console.log("users", users);
    if (users.length === 0) {
      try {
        const response = await fetch(`${url}/users/AllUsersIncludeAdmins`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        if (response.ok) {
          const usersData = await response.json();
          setUsers(usersData.data);
        } else {
          console.error(`Request failed with status code ${response.status}`);
        }
      } catch (error) {
        console.error('An error occurred:', error);
      }
    }
  };

  const AllReported = async () => {
    let reported_msgData = [];

    if (Reported_msg.length === 0) {
      try {
        const response = await fetch(url + `/reports/getAllReportedMsg`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        if (response.ok) {
          reported_msgData = await response.json();
          reported_msgData = reported_msgData.data;

        } else {
          console.error(`Request failed with status code ${response.status}`);
        }
      } catch (error) {
        console.error('An error occurred:', error);
      }
    } else {
      reported_msgData = Reported_msg;
    }

    const newReportedMsg = [];
    const newReportedMsgChecked = [];
    const newMsgKept = [];
    const newDeletedMsg = [];

    reported_msgData.forEach((reportedMsg) => {

      console.log("res", reportedMsg.checked);

      if (reportedMsg.checked === 0) {
        newReportedMsg.push(reportedMsg);
      } else if (reportedMsg.checked === 1 && reportedMsg.deleted === 0) {
        newReportedMsgChecked.push(reportedMsg);
        newMsgKept.push(reportedMsg);
      } else if (reportedMsg.checked === 1 && reportedMsg.deleted === 1) {
        newReportedMsgChecked.push(reportedMsg);
        newDeletedMsg.push(reportedMsg);
      }
    });

    setReported_msg(newReportedMsg);
    setReported_msgChecked(newReportedMsgChecked);
    setMsg_kept(newMsgKept);
    setDeleted_msg(newDeletedMsg);
  };

  // Function to navigate back to home
  const ReturnToHome = () => {
    navigate(`/${currentUser.phone}`); // Redirect to the home route
  };


  const handleUserClick = async (user) => {
    navigate(`/contact_profil/${user.id}`)
  }


  const handleKeepClick = async (reported_msg) => {
    try {
      const response = await fetch(url + `/reports/markMessageChecked/${reported_msg.msgId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setReported_msg(prevReportedMsg => prevReportedMsg.filter(msg => msg.id !== reported_msg.id));
        setReported_msgChecked(prevCheckedMsg => [...prevCheckedMsg, reported_msg]);
        setMsg_kept(prevCheckedMsg => [...prevCheckedMsg, reported_msg]);

      } else {
        console.error(`Request failed with status code ${response.status}`);
      }
    } catch (error) {
      console.error('An error occurred:', error);
    }
  };


  const handleDeleteClick = async (reported_msg) => {
    try {
      const response = await fetch(url + `/reports/deleteReportedMessage/${reported_msg.msgId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setReported_msg(prevReportedMsg => prevReportedMsg.filter(msg => msg.id !== reported_msg.id));
        setReported_msgChecked(prevCheckedMsg => [...prevCheckedMsg, reported_msg]);
        setDeleted_msg(prevCheckedMsg => [...prevCheckedMsg, reported_msg]);
      } else {
        console.error(`Request failed with status code ${response.status}`);
      }
    } catch (error) {
      console.error('An error occurred:', error);
    }
  };


  const Content1 = () => (
    <div className="admin-contacts-section">
      {users.map((user) => (
        <div 
          key={user.id} 
          className={`admin-contact-item ${user.isAdmin ? 'admin-contact-item-gold' : ''}`}
        >
          <img src={user.profil} alt={user.name} className="admin-contact-avatar" />
          <div className="admin-contact-details">
            <h3 className="admin-contact-name">{user.name}</h3>
            <button onClick={() => handleUserClick(user)} className="admin-contact-button">
              View Profile
            </button>
          </div>
        </div>
      ))}
    </div>
  );


  const Content2 = () => (
    <div className="admin-reported-message-list">
      {Reported_msg.map((reported_msg) => {
        // Find the sender and receiver from the users array
        const sender = users.find(user => user.id === reported_msg.sender);
        const receiver = users.find(user => user.id === reported_msg.receiver);

        return (
          <li key={reported_msg.id} className="admin-reported-item">
            {reported_msg.text && (
              <p className="admin-reported-text">{reported_msg.text}</p>
            )}

            {reported_msg.image && (
              <img src={reported_msg.image} alt="Reported Message Image" className="admin-message-image" />
            )}

            <p className="admin-reported-sender-receiver">
              Sent by: {sender ? sender.name : 'Unknown'} to {receiver ? receiver.name : 'Unknown'}
            </p>

            <div className="admin-reported-actions">
              <button className="admin-keep-button" onClick={() => handleKeepClick(reported_msg)}>Keep</button>
              <button className="admin-delete-button" onClick={() => handleDeleteClick(reported_msg)}>Delete</button>
            </div>
          </li>
        );
      })}
    </div>
  );


  const handleShowAllMessagesClick = () => {
    console.log("All messages", Reported_msgChecked);

    setShowAllCheckedMsg(true);
    setShowKept(false);
    setShowDeleted(false);
  };


  const handleShowKeptMessagesClick = () => {
    console.log("messages gardes", msg_kept);

    setShowAllCheckedMsg(false);
    setShowKept(true);
    setShowDeleted(false);
  };


  const handleShowDeletedMessagesClick = () => {
    console.log("deleted", deleted_msg);

    setShowAllCheckedMsg(false);
    setShowKept(false);
    setShowDeleted(true);
  };


  const Content3 = () => (
    <div>
      <div className="admin-content-buttons">
        <button className="admin-button" onClick={() => handleShowAllMessagesClick()}>Show All Messages</button>
        <button className="admin-button" onClick={() => handleShowKeptMessagesClick()}>Show Kept Messages</button>
        <button className="admin-button" onClick={() => handleShowDeletedMessagesClick()}>Show Deleted Messages</button>
      </div>
  
      <div className={`admin-message-list ${showAllCheckedMsg ? 'show-section' : 'hide-section'}`}>
        <h3 className="admin-list-title">Messages Checked</h3>
        {Reported_msgChecked.map((kept_msg) => {
          const sender = users.find(user => user.id === kept_msg.sender);
          const receiver = users.find(user => user.id === kept_msg.receiver);
  
          return (
            <li key={kept_msg.id} className="admin-message-item">
              {kept_msg.text && (
                <p className="admin-message-text">{kept_msg.text}</p>
              )}
              {kept_msg.image && (
                <img src={kept_msg.image} alt="Reported Message Image" className="admin-message-image" />
              )}
              <p className="admin-message-sender">
                Sent by: {sender?.name || "Unknown"} to {receiver?.name || "Unknown"}
              </p>
            </li>
          );
        })}
      </div>
  
      <div className={`admin-message-list ${showKept ? 'show-section' : 'hide-section'}`}>
        <h3 className="admin-list-title">Kept Messages</h3>
        {msg_kept.map((kept_msg) => {
          const sender = users.find(user => user.id === kept_msg.sender);
          const receiver = users.find(user => user.id === kept_msg.receiver);
  
          return (
            <li key={kept_msg.id} className="admin-message-item">
              {kept_msg.text && (
                <p className="admin-message-text">{kept_msg.text}</p>
              )}
              {kept_msg.image && (
                <img src={kept_msg.image} alt="Reported Message Image" className="admin-message-image" />
              )}
              <p className="admin-message-sender">
                Sent by: {sender?.name || "Unknown"} to {receiver?.name || "Unknown"}
              </p>
            </li>
          );
        })}
      </div>
  
      <div className={`admin-message-list ${showDeleted ? 'show-section' : 'hide-section'}`}>
        <h3 className="admin-list-title">Deleted Messages</h3>
        {deleted_msg.map((deleted_msg) => {
          const sender = users.find(user => user.id === deleted_msg.sender);
          const receiver = users.find(user => user.id === deleted_msg.receiver);
  
          return (
            <li key={deleted_msg.id} className="admin-message-item">
              {deleted_msg.text && (
                <p className="admin-message-text">{deleted_msg.text}</p>
              )}
              {deleted_msg.image && (
                <img src={deleted_msg.image} alt="Reported Message Image" className="admin-message-image" />
              )}
              <p className="admin-message-sender">
                Sent by: {sender?.name || "Unknown"} to {receiver?.name || "Unknown"}
              </p>
            </li>
          );
        })}
      </div>
    </div>
  );
  
  


  return (
    <div className="admin-container">

      <div className="admin-menu">
        {/* Changed the LogOut button to the ReturnToHome button */}
        <img src="https://img.icons8.com/?size=512&id=6483&format=png" onClick={() => ReturnToHome()} className="admin-return-home-icon" alt="Return to Home" />
        <button className={`admin-menu-button ${selectedChoice === 'contacts' ? 'active' : ''}`} onClick={() => handleChoiceClick("contacts")}>Contacts</button>
        <button className={`admin-menu-button ${selectedChoice === 'messages to check' ? 'active' : ''}`} onClick={() => handleChoiceClick("messages to check")}>Messages to Check</button>
        <button className={`admin-menu-button ${selectedChoice === 'All checked messages' ? 'active' : ''}`} onClick={() => handleChoiceClick("All checked messages")}>All Checked Messages</button>
      </div>

      <div className="admin-content">
        {selectedChoice === "contacts" && <Content1 />}
        {selectedChoice === "messages to check" && <Content2 />}
        {selectedChoice === "All checked messages" && <Content3 />}
      </div>
    </div>
  );
}
