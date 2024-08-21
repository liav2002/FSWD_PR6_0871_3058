import React, { useState, useEffect } from "react";
import "./Admin.css";
import { useNavigate } from "react-router-dom";
import Cookies from "universal-cookie";

const url = 'http://localhost:5002';

export default function Admin() {
  const [selectedChoice, setSelectedChoice] = useState("contacts"); 
  const [users, setUsers] = useState([]);
  const [Flagged_msg, setFlagged_msg] = useState([]); 
  const [Flagged_msgChecked, setFlagged_msgChecked] = useState([]);
  const [msg_kept, setMsg_kept] = useState([]); 
  const [deleted_msg, setDeleted_msg] = useState([]); 
  const [showAllCheckedMsg, setShowAllCheckedMsg] = useState(false);
  const [showKept, setShowKept] = useState(false);
  const [showDeleted, setShowDeleted] = useState(false);
  const navigate = useNavigate();
  const cookies = new Cookies();
  const currentUser = JSON.parse(localStorage["currentUser"]);


  useEffect(() => {
    AllFlagged();
    handleChoiceContacts();
  }, []);


  const handleChoiceClick = (choice) => {
    setSelectedChoice(choice);
    if (choice === "contacts") {
      handleChoiceContacts();
    }
  };

  const handleChoiceContacts = async () => {
    console.log("users", users);
    if (users.length === 0) {
      try {
        const response = await fetch(url + `/users/AllUsers`, {
          method: 'GET',
          headers: {
              'Content-Type': 'application/json',
          },
      });
        if (response.ok) {
          const usersData = await response.json();
          setUsers(usersData);
        } else {
          console.error(`Request failed with status code ${response.status}`);
        }
      } catch (error) {
        console.error('An error occurred:', error);
      }
    }
  };

  const AllFlagged = async () => {
    let flagged_msgData = [];

    if (Flagged_msg.length === 0) {
      try {
        const response = await fetch(url + `/flagged_msg/getAllFlaggedMsg`, {
          method: 'GET',
          headers: {
              'Content-Type': 'application/json',
          },
      });
        if (response.ok) {
          flagged_msgData = await response.json();

        } else {
          console.error(`Request failed with status code ${response.status}`);
        }
      } catch (error) {
        console.error('An error occurred:', error);
      }
    } else {
      flagged_msgData = Flagged_msg;
    }

    const newFlaggedMsg = [];
    const newFlaggedMsgChecked = [];
    const newMsgKept = [];
    const newDeletedMsg = [];

    flagged_msgData.forEach((flaggedMsg) => {

      console.log("res", flaggedMsg.checked);

      if (flaggedMsg.checked === 0) {
        newFlaggedMsg.push(flaggedMsg);
      } else if (flaggedMsg.checked === 1 && flaggedMsg.deleted === 0) {
        newFlaggedMsgChecked.push(flaggedMsg);
        newMsgKept.push(flaggedMsg);
      } else if (flaggedMsg.checked === 1 && flaggedMsg.deleted === 1) {
        newFlaggedMsgChecked.push(flaggedMsg);
        newDeletedMsg.push(flaggedMsg);
      }
    });

    setFlagged_msg(newFlaggedMsg);
    setFlagged_msgChecked(newFlaggedMsgChecked);
    setMsg_kept(newMsgKept);
    setDeleted_msg(newDeletedMsg);
  };


  const handleUserClick = async (user) => {
    navigate(`/contact_profil/${user.id}`)
  }

  const handleKeepClick = async (flagged_msg) => {
    try {
      const response = await fetch(url + `/flagged_msg/markMessageChecked/${flagged_msg.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
      },
      });

      if (response.ok) {
        setFlagged_msg(prevFlaggedMsg => prevFlaggedMsg.filter(msg => msg.id !== flagged_msg.id));
        setFlagged_msgChecked(prevCheckedMsg => [...prevCheckedMsg, flagged_msg]);
        setMsg_kept(prevCheckedMsg => [...prevCheckedMsg, flagged_msg]);

      } else {
        console.error(`Request failed with status code ${response.status}`);
      }
    } catch (error) {
      console.error('An error occurred:', error);
    }
  };


  const handleDeleteClick = async (flagged_msg) => {
    try {
      const response = await fetch(url + `/flagged_msg/deleteFlaggedMessage/${flagged_msg.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
      },
      });

      if (response.ok) {
        setFlagged_msg(prevFlaggedMsg => prevFlaggedMsg.filter(msg => msg.id !== flagged_msg.id));
        setFlagged_msgChecked(prevCheckedMsg => [...prevCheckedMsg, flagged_msg]);
        setDeleted_msg(prevCheckedMsg => [...prevCheckedMsg, flagged_msg]);
      } else {
        console.error(`Request failed with status code ${response.status}`);
      }
    } catch (error) {
      console.error('An error occurred:', error);
    }
  };


  const Content1 = () => (
    <div className="user-list">
      {users.map((user) => (
        <li key={user.id}>
          <button onClick={() => handleUserClick(user)}>{user.name}</button>
        </li>
      ))}
    </div>
  );


  const Content2 = () => (
    <div className="flagged-message-list">
      {Flagged_msg.map((flagged_msg) => (
        <li key={flagged_msg.id}>
          {flagged_msg.text && (
            <p>{flagged_msg.text}</p>
          )}

          {flagged_msg.image && (
            <img src={flagged_msg.image} alt="Flagged Message Image" className="message-image" />
          )}
          <br />
          <button className="keep-button" onClick={() => handleKeepClick(flagged_msg)}>Keep</button>
          <button onClick={() => handleDeleteClick(flagged_msg)}>Delete</button>
        </li>
      ))}
    </div>
  );


  const handleShowAllMessagesClick = () => {
    console.log("All messages", Flagged_msgChecked);

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
      <div className="content-buttons">
        <button onClick={() => handleShowAllMessagesClick()}>Show All Messages</button>
        <button onClick={() => handleShowKeptMessagesClick()}>Show Kept Messages</button>
        <button onClick={() => handleShowDeletedMessagesClick()}>Show Deleted Messages</button>
      </div>

      <div className={`message-list ${showAllCheckedMsg ? 'show-section' : 'hide-section'}`}>
        <h3>Messages Checked</h3>
        {Flagged_msgChecked.map((kept_msg) => (
          <li key={kept_msg.id}>
            {kept_msg.text && (
              <p>{kept_msg.text}</p>
            )}

            {kept_msg.image && (
              <img src={kept_msg.image} alt="Flagged Message Image" className="message-image" />
            )}

          </li>
        ))}
      </div>

      <div className={`message-list ${showKept ? 'show-section' : 'hide-section'}`}>
        <h3>Kept Messages</h3>
        {msg_kept.map((kept_msg) => (
          <li key={kept_msg.id}>
            {kept_msg.text && (
              <p>{kept_msg.text}</p>
            )}

            {kept_msg.image && (
              <img src={kept_msg.image} alt="Flagged Message Image" className="message-image" />
            )}
          </li>
        ))}
      </div>

      <div className={`message-list ${showDeleted ? 'show-section' : 'hide-section'}`}>
        <h3>Deleted Messages</h3>
        {deleted_msg.map((deleted_msg) => (
          <li key={deleted_msg.id}>
            {deleted_msg.text && (
              <p>{deleted_msg.text}</p>
            )}

            {deleted_msg.image && (
              <img src={deleted_msg.image} alt="Flagged Message Image" className="message-image" />
            )}
          </li>
        ))}
      </div>
    </div>
  );

  const LogOut = async () => {
    const currentTime = new Date().toLocaleString();
    const cookies = new Cookies();
    cookies.set(JSON.stringify(currentUser.email), currentTime, { path: '/' });
    navigate(`/`)
  }

  return (
    <div className="admin-container">

      <div className="menu">
        <img src="https://icon-library.com/images/logout-icon-png/logout-icon-png-20.jpg" onClick={() => LogOut()} className="log_out_icon"></img>
        <button onClick={() => handleChoiceClick("contacts")}>contacts</button>
        <button onClick={() => handleChoiceClick("messages to check")}>messages to check</button>
        <button onClick={() => handleChoiceClick("All checked messages")}>All checked messages</button>
      </div>

      <div className="content">
        {selectedChoice === "contacts" && <Content1 />}
        {selectedChoice === "messages to check" && <Content2 />}
        {selectedChoice === "All checked messages" && <Content3 />}
      </div>
    </div>
  );
}
