import React, { useState, useEffect, useRef } from "react";
import { useParams } from 'react-router-dom';
import "./styles.css";
import { useNavigate } from "react-router-dom";
import Cookies from "universal-cookie";
const url = 'http://localhost:5002';


export default function Home() {
  const { phone } = useParams();
  const [isAdmin, setIsAdmin] = useState(false);
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [usersWithUnread, setUsersWithUnread] = useState([]);
  const [groupsWithUnread, setGroupsWithUnread] = useState([]);
  const [messages, setMessages] = useState([]);
  const [showWindow, setShowWindow] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [selectedImage, setSelectedImage] = useState("");
  const [DisplayMenu, setDisplayMenu] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState(null);
  const [messageToEditId, setMessageToEditId] = useState(null);
  const [editedMessage, setEditedMessage] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [participantsList, setParticipantsList] = useState([]);

  const currentUser = localStorage.getItem("currentUser")
    ? JSON.parse(localStorage.getItem("currentUser"))
    : null;

  const fetchAdmin = async () => {
    if (currentUser) {
      try {
        const response = await fetch(url + `/users/isAdmin?currentUserID=${currentUser.id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        if (response.ok) {
          const resp = await response.json();
          if (resp.data.isAdmin === 1) setIsAdmin(true);
          else setIsAdmin(false);
        } else {
          console.error(`Request failed with status code ${response.status}`);
        }
      } catch (error) {
        console.error('An error occurred:', error);
      }
    }
  };

  fetchAdmin();

  const navigate = useNavigate();
  const cookies = new Cookies();
  const audioRef = useRef(null);


  const handleSearchChange = (event) => {
    setSearchValue(event.target.value);
  };

  const filteredUsers = Array.isArray(users) ? users.filter((user) =>
    "phone" in user ?
      user.name && user.name.toLowerCase().includes(searchValue.toLowerCase())
      : (user.title && user.title.toLowerCase().includes(searchValue.toLowerCase()))
  ) : [];



  const handleUserClick = async (user) => {
    setSelectedUser(user);
    setShowWindow(true);
  
    try {
      const response = await fetch(
        url + `/messages/messagesWithCurrentUser?currentId=${currentUser.id}&selectedUserId=${user.id}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
  
      if (response.ok) {
        const messagesData = await response.json();
        setMessages(messagesData.data);
        if (messagesData.data.length > 0) {
          markMessagesAsRead(currentUser, user);
        }
      } else {
        console.error(`Request failed with status code ${response.status}`);
      }
    } catch (error) {
      console.error('An error occurred:', error);
    }

    setUsersWithUnread((prevSenderIds) => {
      return prevSenderIds.filter((senderId) => user.id !== senderId);
    });
  };
  
  const useAutoRefreshMessages = (selectedUser, showWindow, refreshInterval = 2000) => {
    const intervalRef = useRef(null);

    useEffect(() => {
      const fetchAndMarkMessages = async () => {
        try {
          let response, messagesData;

          if ("phone" in selectedUser) {
            response = await fetch(
              `${url}/messages/messagesWithCurrentUser?currentId=${currentUser.id}&selectedUserId=${selectedUser.id}`,
              {
                method: 'GET',
                headers: {
                  'Content-Type': 'application/json',
                },
              }
            );
          } 

          else {
            response = await fetch(
              `${url}/messages/messagesWithCurrentGroup?currentId=${currentUser.id}&groupId=${selectedUser.id}`,
              {
                method: 'GET',
                headers: {
                  'Content-Type': 'application/json',
                },
              }
            );
          }

          if (response.ok) {
            messagesData = await response.json();
            setMessages(messagesData.data);
          }

          await markMessagesAsRead(currentUser, selectedUser);

          await fetchUnreadMessages();

        } catch (error) {
          console.error('An error occurred during auto-refresh:', error);
        }
      };

      const fetchUnreadMessages = async () => {
        if (currentUser) {
          try {
            const response = await fetch(url + `/messages/getUnreadSenderIDs?currentUserId=${currentUser.id}`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
              },
            });
            if (response.status === 200) {
              const sendersId = await response.json();
              setUsersWithUnread(sendersId.data);
            } else {
              console.error(`Request failed with status code ${response.status}`);
            }
          } catch (error) {
            console.error('An error occurred:', error);
          }

          try {
            const response = await fetch(url + `/messages/getUnreadSenderIDsGroup?currentUserId=${currentUser.id}`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
              },
            });
            if (response.ok) {
              const sendersIdGroup = await response.json();
              setGroupsWithUnread(sendersIdGroup.data);
            } else {
              console.error(`Request failed with status code ${response.status}`);
            }
          } catch (error) {
            console.error('An error occurred:', error);
          }
        }
      };

      if (selectedUser && showWindow) {
        intervalRef.current = setInterval(fetchAndMarkMessages, refreshInterval);
      } else {
        intervalRef.current = setInterval(fetchUnreadMessages, refreshInterval);
      }

      return () => {
        clearInterval(intervalRef.current);
      };
    }, [selectedUser, showWindow, refreshInterval]);
  };

  const markMessagesAsRead = async (CurrentUser, SelectedUser) => {
    const currentUserId = CurrentUser.id;
    const selectedUserId = SelectedUser.id;

    // Case 1: Mark messages as read for individual user
    if ("phone" in SelectedUser) {
      try {
        const response = await fetch(`${url}/messages/markMessagesAsRead`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            currentUserId: currentUserId,  // Send the current user's ID
            selectedUserId: selectedUserId // Send the selected user's ID
          })
        });

        if (response.ok) {
          setMessages(prevState => {
            // Update the messages in the state to reflect the 'read' status
            return prevState.map((item) => {
              return item.receiver === currentUserId && item.sender === selectedUserId && item.isItGroup === false
                ? { ...item, isItRead: true }
                : item;
            });
          });
        } else {
          console.error(`Request failed with status code ${response.status}`);
        }
      } catch (error) {
        console.error('An error occurred:', error);
      }
    } 
    // Case 2: Mark messages as read for group
    else {
      try {
        const response = await fetch(`${url}/messages/markMessagesGroupAsRead`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            currentUserId: currentUserId,  // Send the current user's ID
            selectedUserId: selectedUserId // Send the selected group's ID
          })
        });

        if (response.ok) {
          const data = await response.json();
          if (data.length > 0) {
            setMessages(prevState => {
              // Update the group messages in the state to reflect the 'read' status
              return prevState.map((item) => {
                return data.includes(item.id) ? { ...item, isItRead: true } : item;
              });
            });
          }
        } else {
          console.error(`Request failed with status code ${response.status}`);
        }
      } catch (error) {
        console.error('An error occurred:', error);
      }
    }
  };
  
  useAutoRefreshMessages(selectedUser, showWindow);

  const handleGroupClick = async (group) => {
    const groupId = group.id;
    setSelectedUser(group);
  
    try {
      const response = await fetch(
        url + `/messages/messagesWithCurrentGroup?groupId=${groupId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
  
      if (response.ok) {
        const messagesData = await response.json();

        if (messagesData.data && messagesData.data.length > 0) {
          setMessages(messagesData.data);
          markMessagesAsRead(currentUser, group);
        } else {
          setMessages([]); 
        }
      } else if (response.status === 404) {
        setMessages([]); 
      } else {
        console.error(`Request failed with status code ${response.status}`);
      }
    } catch (error) {
      console.error('An error occurred:', error);
    }
  
    setGroupsWithUnread((prevSenderIds) => {
      return prevSenderIds.filter((senderId) => group.id !== senderId);
    });
  
    fetchParticipantsInfos(group);
    setShowWindow(true);
  };

  const handleNewMessageChange = (event) => {
    setNewMessage(event.target.value);
  };

  const handleImageChange = (event) => {
    const selectedImg = event.target.files[0];
    const imageURL = URL.createObjectURL(selectedImg);
    setSelectedImage(imageURL);
  };


  const handleSubmitNewMessage = async (event) => {
    event.preventDefault();
    const actualDate = new Date();
    const hours = actualDate.getHours();
    const min = actualDate.getMinutes();
    const sec = actualDate.getSeconds();

    const year = actualDate.getFullYear();
    const month = String(actualDate.getMonth() + 1).padStart(2, '0');
    const day = String(actualDate.getDate()).padStart(2, '0');

    let Isgroup = false;
    if ("adminId" in selectedUser) {
      Isgroup = true
    }
    else {
      Isgroup = false;
    }

    const newMessageData = {
      sender: currentUser.id,
      receiver: selectedUser.id,
      text: newMessage,
      date: `${year}-${month}-${day}`,
      hour: `${hours}:${min}:${sec}`,
      isItRead: false,
      isItGroup: Isgroup,
      modified: false,
      readedBy: JSON.stringify([])
    };

    if (selectedImage) {
      newMessageData.image = selectedImage;
    }
    else {
      newMessageData.image = "";
    }

    try {
      const response = await fetch(url + "/messages/addMessage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newMessageData), 
      });
      if (response.ok) {
        const NewMsgId = await response.json();
        newMessageData["id"] = NewMsgId.id;
        setMessages([...messages, newMessageData]);
        setNewMessage("");
        setSelectedImage("");
      } else {
        console.error("Failed to add the new message.");
      }
    } catch (error) {
      console.error("An error occurred while adding the new message:", error);
    }
  };


  const fetchUsers = async () => {
    if (currentUser) {
      try {
        const response = await fetch(url + `/users/AllUsersAndGroups?currentUserID=${currentUser.id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        if (response.ok) {
          const usersData = await response.json();
          setUsers(usersData.data.users);
          setGroups(usersData.data.groups)
        } else {
          console.error(`Request failed with status code ${response.status}`);
        }
      } catch (error) {
        console.error('An error occurred:', error);
      }
    }
  };


  const handleMessageClick = async (msgId) => {
    setSelectedMessageId(msgId);
    setDisplayMenu(!DisplayMenu);
  }


  const handleDeleteMessage = async (msgId) => {
    try {
      const response = await fetch(url + `/messages/deleteMessage?id=${msgId}`, {
        method: "DELETE",
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error("Request failed for deleting message");
      }
      const data = await response.json();
      setMessages((prevMsg) => {
        return prevMsg.filter((msg) => msg.id !== msgId);
      });

    } catch (error) {
      console.error("Error:", error);
    }
  }


  const handleEditMessage = async (msgId, msgText) => {
    setEditedMessage(msgText);
    setMessageToEditId(msgId)
    try {
      const response = await fetch(
        url + `/messages/modifiedMessage?id=${msgId}&modified=${true}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      if (!response.ok) {
        throw new Error("Request failed for updating messages");
      }
      const contentType = response.headers.get("Content-Type");
      if (contentType && contentType.includes("application/json")) {
        const data = await response.json();
        setMessages(prevState => {
          return prevState.map((item) => {
            return item.id === msgId ? { ...item, modified: data } : item
          })
        })
      }


    } catch (error) {
      console.error("Error:", error);
    }

  }

  const handleSubmitEdit = async (event, msgId) => {
    event.preventDefault();

    try {
      const requestData = {
        text: editedMessage
      };

      const response = await fetch(url + `/messages/updateMessage?id=${msgId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });



      if (response.ok) {
        const messageIndex = messages.findIndex((msg) => msg.id === msgId);

        if (messageIndex !== -1) {
          const updatedMessage = JSON.parse(JSON.stringify(messages[messageIndex]));

          updatedMessage.text = editedMessage;
          updatedMessage.modified = 1;

          const updatedMessages = [
            ...messages.slice(0, messageIndex),
            updatedMessage,
            ...messages.slice(messageIndex + 1),
          ];

          setMessages(updatedMessages);
        }
      } else {
        console.error("Failed to update message.");
      }
    } catch (error) {
      console.error("An error occurred while updating message:", error);
    }

    setEditedMessage("");
    setMessageToEditId(null);
  };


  const handleReportMessage = async (msg) => {
    try {
      const response = await fetch(`${url}/messages/reportMessage?id=${msg.id}&report=true`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        }
      });

      if (response.ok) {
        setMessages((prevMessages) =>
          prevMessages.map((message) =>
            message.id === msg.id ? { ...message, reported: 1 } : message
          )
        );

        const newReportedMsg = {
          msgId: msg.id,
          sender: msg.sender,
          receiver: msg.receiver,
          text: msg.text,
          date: new Date(msg.date).toISOString().slice(0, 19).replace('T', ' '),
          hour: msg.hour,
          image: msg.image || null,
          isItGroup: msg.isItGroup,
        };

        const reportResponse = await fetch(`${url}/reports/addReportedMessage`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newReportedMsg),
        });

        if (!reportResponse.ok) {
          console.error("Failed to add the reported message.");
        } 
      } else {
        console.error("Failed to update the message status.");
      }
    } catch (error) {
      console.error("An error occurred while reporting the message:", error);
    }
  };


  const RemoveReport = async (msgId) => {
    try { 
      const response = await fetch(url + `/reports/cancelReportByClient?msgId=${msgId}`, {
        method: "DELETE",
        headers: {
          'Content-Type': 'application/json',
      },
      });
      if (!response.ok) {
        throw new Error("Request failed for deleting reported message");
      }
      const data = await response.json();

      setMessages((prevMessages) =>
        prevMessages.map((message) =>
          message.id === msgId ? { ...message, reported: 0 } : message
        )
      );

    } catch (error) {
      console.error("Error:", error);
    }
  }


  const AddNewGroup = async () => {
    if (currentUser) {
      navigate(`/new_group`);
    }
    else {
      navigate('/')
    }
  }


  const DisplayProfilContact = async () => {
    if ("phone" in selectedUser) {
      navigate(`/contact_profil/${selectedUser.id}`)
    } else {
      navigate(`/group_profil/${selectedUser.id}`)
    }
  }


  const DisplayYourInfos = async () => {
    if (currentUser) {
      navigate(`/your_profil`)
    } else {
      navigate('/')
    }
  }


  const LogOut = async () => {
    if (currentUser) {
      const currentTime = new Date().toLocaleString();
      const cookies = new Cookies();
      cookies.set(JSON.stringify(currentUser.email), currentTime, { path: '/' });
      localStorage.removeItem("currentUser");
    }
    navigate("/", { replace: true });
  }


  const fetchParticipantsInfos = async (selectedGroup) => {

    try {
        const response = await fetch(url + `/groups/GroupParticipants?GroupId=${selectedGroup.id}`);
        
        if (response.ok) {
            const result = await response.json();

            const participants = result.data;

            const participantsList = participants.map(participant => ({
                id: participant.id,
                name: participant.name
            }));

            setParticipantsList(participantsList);
        } else {
            console.error(`Failed to fetch participants. Status code: ${response.status}`);
        }
    } catch (error) {
        console.error('An error occurred while fetching participants:', error);
    }
  };

  const handleAdminClick = () => {
    navigate("/admin");
  };

  const handleRemoveParticipantClick = async (group) => {
    try {
      const response = await fetch(`${url}/groups/RemoveParticipant?GroupId=${group.id}&ParticipantId=${currentUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      });
  
      if (response.ok) {
        setGroups((prevGroups) => prevGroups.filter((g) => g.id !== group.id));
      } else if (response.status === 404) {
        console.error('Group not found.');
      } else {
        console.error('Failed to delete group.');
      }
    } catch (error) {
      console.error('An error occurred while deleting the group:', error);
    }
  };
  

  useEffect(() => {
    fetchUsers();
  }, []);

  let uniqueKey = 0;
  const userList = filteredUsers.map((user) => {
    uniqueKey++;

    return (
      <div>
        <li key={uniqueKey} className="contact_list">
          <div className="contact_container" onClick={() => handleUserClick(user)}>
            <span>
              <img src={user.profil} className="img_contact" alt="Profile"></img>
            </span>
            <span>{user.name}</span>
            {usersWithUnread.includes(user.id) ? (
              <span>
                <img
                  src="https://img.icons8.com/?size=512&id=FkQHNSmqWQWH&format=png"
                  className="greenIcon"
                  alt="Unread"
                ></img>
              </span>
            ) : null}
          </div>
        </li>
      </div>
    )
  });

  uniqueKey = 0;
  const groupList = groups.map((group)=>{
    uniqueKey++;
    return(
      <li key={uniqueKey} className="contact_list">
        <div className="contact_container" onClick={() => handleGroupClick(group)}>
          <span><img src={group.profil.replace(/['"]/g, "")} className="img_contact"></img></span>
          <span >{group.title.replace(/['"]/g, "")}</span>
          {groupsWithUnread.includes(group.id) ? <span><img src="https://img.icons8.com/?size=512&id=FkQHNSmqWQWH&format=png" className="greenIcon"></img></span> : ""}
        </div>
        <button
            className="remove-button"
            onClick={() => handleRemoveParticipantClick(group)}
          >
            <img
              src="https://th.bing.com/th/id/OIP.2LKH2iNiSM4bdgoBvjyK9AHaJI?rs=1&pid=ImgDetMain"
              alt="Remove"
              className="remove-icon"
            />
          </button>
      </li>)
  });


  const playAudio = () => {
    if (audioRef.current) {
      audioRef.current.play();
    }
  };

  if (currentUser && currentUser.phone == phone) {
    return (
      <div className="home-container">
        <div className="left-div">
          <div className="button-container">
            <span>
              <img
                src="https://icon-library.com/images/logout-icon-png/logout-icon-png-20.jpg"
                onClick={() => LogOut()}
                className="log_out_icon"
                alt="Logout"
              />
            </span>

            <button onClick={() => AddNewGroup()} className="new-group-button">
              New Group
            </button>

            {isAdmin && (
              <span>
                <img
                  src="https://icon-library.com/images/admin-icon-png/admin-icon-png-28.jpg"
                  onClick={() => handleAdminClick()}
                  className="admin-icon"
                  alt="Admin"
                />
              </span>
            )}
          </div>

          <div className="contact_container" onClick={() => DisplayYourInfos()}>
            <span>
              <img src={currentUser.profil} className="img_contact" alt="Profile" />
            </span>
            <span>{currentUser.name}</span>
          </div>

          <div style={{ display: "flex", alignItems: "center" }}>
            <p>Last connection: </p>
            {currentUser && cookies.get(JSON.stringify(currentUser.email)) != null ? (
              <span>
                <p>{cookies.get(JSON.stringify(currentUser.email))}</p>
              </span>
            ) : null}
          </div>

          <input
            type="text"
            placeholder="Search..."
            value={searchValue}
            onChange={handleSearchChange}
            className="search-bar"
          />

          <ul className="ul_list_contact">
            {userList}
            {groupList}
          </ul>
        </div>

        <div className="right-div">
          {showWindow && (
            <div className="chat-container">
              <div className="contact_container" onClick={() => DisplayProfilContact()}>
                {selectedUser && (
                  <>
                    <span>
                      <img src={selectedUser.profil.replace(/['"]/g, "")} className="img_contact" alt="Selected User Profile" />
                    </span>
                    <span>
                      {"phone" in selectedUser ? selectedUser.name.replace(/['"]/g, "") : selectedUser.title.replace(/['"]/g, "")}
                    </span>
                  </>
                )}
              </div>

              <div className="messages-container">
                {Array.isArray(messages) && messages.map((msg) => {
                  const isMyMessage = parseInt(msg.sender) === parseInt(currentUser.id);
                  const messageClass = isMyMessage ? "my-message" : "other-message";

                  return (
                    <div key={msg.id} className={messageClass} onClick={() => !messageToEditId && handleMessageClick(msg.id)}>
                      {!isMyMessage && msg.isItGroup === 1 && (
                        <p className="participants_name">
                          {participantsList.find((user) => Number(user.id) === Number(msg.sender))?.name || "Unknown Participant"}
                        </p>
                      )}

                      {messageToEditId === msg.id ? (
                        <form onSubmit={(event) => handleSubmitEdit(event, msg.id)}>
                          <textarea
                            className="edit-message-input"
                            value={editedMessage}
                            onChange={(e) => setEditedMessage(e.target.value)}
                          />
                          <button type="submit" className="save-button">Save</button>
                        </form>
                      ) : (
                        <p className="message-text">{msg.text}</p>
                      )}

                      {msg.image && <img src={msg.image} className="img_msg" alt="Message image" />}

                      <p className="message-date">{new Date(msg.date).toLocaleDateString()} {msg.hour}</p>

                      <img
                        src={msg.isItRead ? "https://www.clipartmax.com/png/small/28-289625_single-tick-whtsapp-gray-2-clip-art-double-check-icon-png.png" : "http://www.clipartbest.com/cliparts/dir/LB8/dirLB85i9.png"}
                        className="read-confirm"
                        alt={msg.isItRead ? "Read" : "Not read"}
                      />

                      {!isMyMessage && msg.reported === 1 && (
                        <img
                          src="https://image.similarpng.com/very-thumbnail/2021/06/Attention-sign-icon.png"
                          className="reported"
                          alt="Reported"
                        />
                      )}

                      {isMyMessage && selectedMessageId === msg.id && DisplayMenu && !messageToEditId && (
                        <div className="message-options">
                          <button className="option-button" onClick={() => handleEditMessage(msg.id, msg.text)}>Edit</button>
                          <button className="option-button" onClick={() => handleDeleteMessage(msg.id)}>Delete</button>
                        </div>
                      )}

                      {!isMyMessage && selectedMessageId === msg.id && DisplayMenu && !messageToEditId && (
                        <div className="message-options">
                          {msg.reported === 1 ? (
                            <button className="option-button" onClick={() => RemoveReport(msg.id)}>Unreport</button>
                          ) : (
                            <button className="option-button" onClick={() => handleReportMessage(msg)}>Report</button>
                          )}
                        </div>
                      )}

                      {msg.modified === 1 && (
                        <p className="modified-indicator">
                          {isMyMessage ? "This message was edited" : "This message was edited by the sender"}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>


              {selectedUser && (
                <form onSubmit={handleSubmitNewMessage} className="chat-input-form">
                  <audio
                    ref={audioRef}
                    src="http://commondatastorage.googleapis.com/codeskulptor-assets/week7-brrring.m4a"
                  />
                  <textarea
                    value={newMessage}
                    onChange={handleNewMessageChange}
                    placeholder="Write a new message..."
                  />
                  <input type="file" accept="image/*" onChange={handleImageChange} />
                  {selectedImage && (
                    <img src={selectedImage} alt="Selected Image" className="selected_image_newMsg" />
                  )}
                  <button type="submit" onClick={playAudio}>
                    Send
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>

    );
  }
  else {
    return (
      <div>
        <h1 className='header404'><b>404</b></h1>
        <div className='body'>oops! something went wrong.</div>
      </div>);
  }

}