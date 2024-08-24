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
  };

  const handleChoiceContacts = async () => {
    console.log("users", users);
    if (users.length === 0) {
      try {
        const response = await fetch(`${url}/users/AllUsers?currentUserID=${currentUser.id}`, {
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


  const handleUserClick = async (user) => {
    navigate(`/contact_profil/${user.id}`)
  }

  const handleKeepClick = async (reported_msg) => {
    try {
      const response = await fetch(url + `/reports/markMessageChecked/${reported_msg.id}`, {
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
      const response = await fetch(url + `/reports/deleteReportedMessage/${reported_msg.id}`, {
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
    <div className="user-list">
      {users.map((user) => (
        <li key={user.id}>
          <button onClick={() => handleUserClick(user)}>{user.name}</button>
        </li>
      ))}
    </div>
  );


  const Content2 = () => (
    <div className="reported-message-list">
      {Reported_msg.map((reported_msg) => (
        <li key={reported_msg.id}>
          {reported_msg.text && (
            <p>{reported_msg.text}</p>
          )}

          {reported_msg.image && (
            <img src={reported_msg.image} alt="Reported Message Image" className="message-image" />
          )}
          <br />
          <button className="keep-button" onClick={() => handleKeepClick(reported_msg)}>Keep</button>
          <button onClick={() => handleDeleteClick(reported_msg)}>Delete</button>
        </li>
      ))}
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
      <div className="content-buttons">
        <button onClick={() => handleShowAllMessagesClick()}>Show All Messages</button>
        <button onClick={() => handleShowKeptMessagesClick()}>Show Kept Messages</button>
        <button onClick={() => handleShowDeletedMessagesClick()}>Show Deleted Messages</button>
      </div>

      <div className={`message-list ${showAllCheckedMsg ? 'show-section' : 'hide-section'}`}>
        <h3>Messages Checked</h3>
        {Reported_msgChecked.map((kept_msg) => (
          <li key={kept_msg.id}>
            {kept_msg.text && (
              <p>{kept_msg.text}</p>
            )}

            {kept_msg.image && (
              <img src={kept_msg.image} alt="Reported Message Image" className="message-image" />
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
              <img src={kept_msg.image} alt="Reported Message Image" className="message-image" />
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
              <img src={deleted_msg.image} alt="Reported Message Image" className="message-image" />
            )}
          </li>
        ))}
      </div>
    </div>
  );


  const LogOut = async () => {
    if (currentUser) {
      const currentTime = new Date().toLocaleString();
      const cookies = new Cookies();
      cookies.set(JSON.stringify(currentUser.email), currentTime, { path: '/' });
      localStorage.removeItem("currentUser");
    }
    navigate("/", { replace: true });
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
