import React, { useState, useEffect, useRef } from "react";
import "./styles.css";
import { useNavigate } from "react-router-dom";
import Cookies from "universal-cookie";
const url = 'http://localhost:5002';


export default function Home() {
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
  const [SelectedMessageId, setSelectedMessageId] = useState(null);
  const [FlaggedMessages, setFlaggedMessage] = useState([]);
  const [MessagesToEditId, setMessageToEditId] = useState(null);
  const [editedMessage, setEditedMessage] = useState("");
  // const [countMessagesUnread, setCountMessagesUnread] = useState([]);
  const [searchValue, setSearchValue] = useState("");
  const [participantsList, setParticipantsList] = useState([]);

  const currentUser = localStorage.getItem("currentUser")
    ? JSON.parse(localStorage.getItem("currentUser"))
    : null;

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

    try {
      const response = await fetch(
        url + `/messages/messagesWithCurrentUser?currentId=${currentUser.id}&selectedUserId=${user.id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
      );
      console.log(`Status: ${response.status}`);
      console.log('Response headers:', response.headers);

      if (response.ok) {
        const messagesData = await response.json();
        console.log('Messages:', messagesData);
        setMessages(messagesData.data);
        if (messagesData.length > 0) {
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
    setShowWindow(true);
  };


  const markMessagesAsRead = async (CurrentUser, SelectedUser) => {
    const currentUserId = CurrentUser.id;
    const selectedUserId = SelectedUser.id;
    if ("phone" in SelectedUser) {
      try {
        const response = await fetch(url + '/messages/markMessagesAsRead', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            currentUserId,
            selectedUserId
          })
        });

        if (response.ok) {
          console.log('Messages marked as read');

          setMessages(prevState => {
            // Loop over your list
            return prevState.map((item) => {
              // Check for the item with the specified id and update it
              return item.receiver == currentUserId && item.isItGroup == false ? { ...item, isItRead: true } : item
            })
          })
        } else {
          console.error(`Request failed with status code ${response.status}`);
        }
      } catch (error) {
        console.error('An error occurred:', error);
      }
    } else {
      try {
        const response = await fetch(url + '/messages/markMessagesGroupAsRead', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            currentUserId,
            selectedUserId
          })
        });

        if (response.ok) {
          const data = await response.json();
          if (data.length > 0) {
            setMessages(prevState => {
              // Loop over your list
              return prevState.map((item) => {
                // Check if the item's ID is in the list of IDs from the server response
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


  const handleGroupClick = async (group) => {
    const groupId = group.id;
    setSelectedUser(group);
    try {
      const response = await fetch(
        url + `/messages/messagesWithCurrentGroup?groupId=${groupId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
      );
      console.log(`Status: ${response.status}`);
      console.log('Response headers:', response.headers);

      if (response.ok) {
        const messagesData = await response.json();
        console.log("\n\n\n\n" ,"hibffhfdgbhdsffdvfdvfd");
        console.log('Messages:', messagesData);
        setMessages(messagesData);
        if (messagesData.length > 0) {
          markMessagesAsRead(currentUser, group);
        }
      } else {
        console.error(`Request failed with status code ${response.status}`);
      }
    } catch (error) {
      console.error('An error occurred:', error);
    }
    // markMessagesAsRead(currentUser, group);
    setGroupsWithUnread((prevSenderIds) => {
      return prevSenderIds.filter((senderId) => group.id !== senderId);
    });


    fetchParticipantsInfos(group);
    setShowWindow(true);
    //return null;
  }

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
    console.log("image", selectedImage)

    const actualDate = new Date();
    const hours = actualDate.getHours();
    const min = actualDate.getMinutes();
    const sec = actualDate.getSeconds();

    const year = actualDate.getFullYear();
    const month = String(actualDate.getMonth() + 1).padStart(2, '0');
    const day = String(actualDate.getDate()).padStart(2, '0');

    // verifiy if the selectedUser is a group
    let Isgroup = false;
    if ("adminId" in selectedUser) {
      Isgroup = true
    }
    else {
      Isgroup = false;
    }

    // Create a new message object with the necessary data
    const newMessageData = {
      sender: currentUser.id,
      receiver: selectedUser.id,
      text: newMessage,
      date: `${year}-${month}-${day}`,
      hour: `${hours}:${min}:${sec}`,
      // image: selectedImage,
      isItRead: false,
      isItGroup: Isgroup,
      modified: false,
      readedBy: JSON.stringify([])
      // Add any other data needed for the server request
    };

    if (selectedImage) {
      newMessageData.image = selectedImage;
    }
    else {
      newMessageData.image = "";
    }

    try {
      // Send a POST request to the server to add the new message
      const response = await fetch(url + "/messages/addMessage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newMessageData), 
      });
      console.log("response: msg ajoute", response)
      if (response.ok) {
        // If the server successfully added the message, update the messages list
        //const responseData = await response.json();
        const NewMsgId = await response.json();
        newMessageData["id"] = NewMsgId.id;
        setMessages([...messages, newMessageData]);
        // setMessages([...messages, responseData]);
        // Clear the new message and selected image after adding
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


  const fetchUnreadMessges = async () => {
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
          console.log(sendersId);
        } else {
          console.error(`Request failed with status code ${response.status}`);
        }
      } catch (error) {
        console.error('An error occurred:', error);
      }

      // for groups messages unread
      try {
        const response = await fetch(url + `/messages/getUnreadSenderIDsGroup?currentUserId=${currentUser.id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        if (response.ok) {
          console.log("fdsgjvfjsdvfdsjvfdshvfdshvf")
          const sendersIdGroup = await response.json();
          setGroupsWithUnread(sendersIdGroup.data);
          console.log(sendersIdGroup);
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
      console.log(data);
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
        console.log(data);
        setMessages(prevState => {
          // Loop over your list
          return prevState.map((item) => {
            // Check for the item with the specified id and update it
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
    const actualDate = new Date();
    const hours = actualDate.getHours();
    const min = actualDate.getMinutes();
    const sec = actualDate.getSeconds();

    const year = actualDate.getFullYear();
    const month = String(actualDate.getMonth() + 1).padStart(2, '0');
    const day = String(actualDate.getDate()).padStart(2, '0');
    const date = `${year}-${month}-${day}`;
    const hour = `${hours}:${min}:${sec}`;
    console.log("nouvelle heure:", hour)

    try {
      const requestData = {
        text: editedMessage,
        date: date,
        hour: hour,
      };

      // Send a PUT request to the server to update the message
      const response = await fetch(url + `/messages/updateMessage?id=${msgId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });



      if (response.ok) {
        // Find the index of the message in the messages array
        const messageIndex = messages.findIndex((msg) => msg.id === msgId);

        if (messageIndex !== -1) {
          // Create a deep copy of the message at the found index
          const updatedMessage = JSON.parse(JSON.stringify(messages[messageIndex]));

          // Update the text, hour, and date fields of the copied message
          updatedMessage.text = editedMessage;
          updatedMessage.date = date;
          updatedMessage.hour = hour;
          console.log("msg modifie", updatedMessage)

          // Create a new array with the updated message at the found index
          const updatedMessages = [
            ...messages.slice(0, messageIndex),
            updatedMessage,
            ...messages.slice(messageIndex + 1),
          ];

          // Set the state with the updated messages array
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


  // const handleReportMessage = async (msg) => {
  //   const newFlaggedMessage = {
  //     msgId: msg.id,
  //     checked: false,
  //     sender: msg.sender,
  //     receiver: msg.receiver,
  //     text: msg.text,
  //     date: new Date(msg.date).toISOString().slice(0, 19).replace('T', ' '), // Format the date
  //     hour: msg.hour,
  //     image: msg.image,
  //     isItGroup: msg.isItGroup,
  //     deleted: false
  //   };
  //   console.log(newFlaggedMessage);
  //   try {
  //     // Send a POST request to the server to add the new message
  //     const response = await fetch(url + "/messages/reportMessage", {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //       body: JSON.stringify(newFlaggedMessage),
  //     });
  //     if (response.ok) {
  //       // If the server successfully added the message, update the messages list
  //       //const responseData = await response.json();
  //       const NewFlaggedMsgId = await response.json();
  //       newFlaggedMessage["id"] = NewFlaggedMsgId;
  //       setFlaggedMessage([...FlaggedMessages, newFlaggedMessage])

  //     } else {

  //       console.error("Failed to add the new flagged message.");
  //     }
  //   } catch (error) {
  //     console.error("An error occurred while adding the new flagged message:", error);
  //   }

  //   try {
  //     const response = await fetch(
  //       url + `/messages/flagged?id=${msg.id}&flagged=${true}`, //lior
  //       {
  //         method: "PUT",
  //         headers: {
  //           "Content-Type": "application/json",
  //         },
  //       }
  //     );
  //     if (!response.ok) {
  //       throw new Error("Request failed for updating messages");
  //     }
  //     const contentType = response.headers.get("Content-Type");
  //     if (contentType && contentType.includes("application/json")) {
  //       const data = await response.json();
  //       console.log(data);
  //       setMessages(prevState => {
  //         // Loop over your list
  //         return prevState.map((item) => {
  //           // Check for the item with the specified id and update it
  //           return item.id === msg.id ? { ...item, flagged: data } : item
  //         })
  //       })
  //     }


  //   } catch (error) {
  //     console.error("Error:", error);
  //   }
  // }


  // const RemoveReport = async (msgId) => {
  //   try { 
  //     const response = await fetch(url + `/messages/id?id=${msgId}`, { //lior
  //       method: "DELETE",
  //       headers: {
  //         'Content-Type': 'application/json',
  //     },
  //     });
  //     if (!response.ok) {
  //       throw new Error("Request failed for deleting flagged message");
  //     }
  //     const data = await response.json();
  //     console.log(data);
  //     setFlaggedMessage((prevMsg) => {
  //       return prevMsg.filter((flagged_msg) => flagged_msg.id !== msgId);
  //     });

  //   } catch (error) {
  //     console.error("Error:", error);
  //   }

  //   try {
  //     const response = await fetch(
  //       url + `/messages/flagged?id=${msgId}&flagged=${false}`, //lior
  //       {
  //         method: "PUT",
  //         headers: {
  //           "Content-Type": "application/json",
  //         },
  //       }
  //     );
  //     if (!response.ok) {
  //       throw new Error("Request failed for updating messages");
  //     }
  //     const contentType = response.headers.get("Content-Type");
  //     if (contentType && contentType.includes("application/json")) {
  //       const data = await response.json();
  //       console.log(data);
  //       setMessages(prevState => {
  //         // Loop over your list
  //         return prevState.map((item) => {
  //           // Check for the item with the specified id and update it
  //           return item.id === msgId ? { ...item, flagged: data } : item
  //         })
  //       })
  //     }


  //   } catch (error) {
  //     console.error("Error:", error);
  //   }

  // }


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

    console.log("list participants", selectedGroup.participantsId);
    const participantsInfoPromises = (selectedGroup.participantsId).map(async (participantId) => {
      const participantResponse = await fetch(`/users/UserInfo?UserId=${participantId}`);
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


  useEffect(() => {
    fetchUsers();
    fetchUnreadMessges();
  }, []);

  let uniqueKey = 0;
  const userList = filteredUsers.map((user) => {
    uniqueKey++;

    return (
      <div>
        <li key={uniqueKey} className="contact_list">
          <div className="contact_container" onClick={() => handleUserClick(user)}>
            <span><img src={user.profil} className="img_contact"></img></span>
            <span >{user.name}</span>
            {usersWithUnread.includes(user.id) ? <span><img src="https://img.icons8.com/?size=512&id=FkQHNSmqWQWH&format=png" className="greenIcon"></img></span> : ""}
          </div>
        </li>
        </div>
      )
  });

  uniqueKey = 0;
  console.log("dfhkvgfhkvdf8888", groups)
  const groupList = groups.map((group)=>{
    uniqueKey++;
    return(
    <li key={uniqueKey} className="contact_list">
          <div className="contact_container" onClick={() => handleGroupClick(group)}>
            <span><img src={group.profil} className="img_contact"></img></span>
            <span >{group.title}</span>
            {console.log("djsgasjdgadghasjdghhasgd")}
            {groupsWithUnread.includes(group.id) ? <span><img src="https://img.icons8.com/?size=512&id=FkQHNSmqWQWH&format=png" className="greenIcon"></img></span> : ""}
          </div>
        </li>)
  })


  const playAudio = () => {
    if (audioRef.current) {
      audioRef.current.play();
    }
  };

  if (currentUser) {
    return (
      <div className="container">
        <div className="left-div">
          <div>
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

            <div className="contact_container" onClick={() => DisplayYourInfos()}>
              <span>
                <img src={currentUser.profil} className="img_contact" alt="Profile" />
              </span>
              <span>{currentUser.name}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center' }}>
              <p>Last connection: </p>
              {currentUser && cookies.get(JSON.stringify(currentUser.email)) != null ? (
                <span>
                  <p>{cookies.get(JSON.stringify(currentUser.email))}</p>
                </span>
              ) : null}
            </div>
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
            {groupList }
            {console.log('userList')}
            {console.log(userList)}
            {/* Uncomment and modify this section according to your needs 
            
                            <li key={user.id} className="contact_list">
                  <div className="contact_container" onClick={() => handleGroupClick(user)}>
                    <span><img src={user.profil} className="img_contact" alt="Group Profile" /></span>
                    <span>{user.title}</span>
                  </div>
                </li>
            
            */}
          </ul>
        </div>

        <div className="right-div speech-wrapper">
          {showWindow && (
            <div>
              <div className="contact_container" onClick={() => DisplayProfilContact()}>
                {selectedUser && (
                  <>
                    <span>
                      <img
                        src={selectedUser.profil}
                        className="img_contact"
                        alt="Selected User Profile"
                      />
                    </span>
                    <span>
                      {"phone" in selectedUser ? selectedUser.name : selectedUser.title}
                    </span>
                  </>
                )}
              </div>

              <div className="messages-container">
                {Array.isArray(messages) && messages.map((msg) => (
                  <li
                    key={msg.id}
                    className={`${msg.sender === currentUser?.id
                      ? "sender-right bubble alt"
                      : "sender-left bubble"
                    } msg_list `}
                    onClick={() => handleMessageClick(msg.id)}
                  >
                    {msg.id === MessagesToEditId ? (
                      <div>
                        <form onSubmit={(event) => handleSubmitEdit(event, msg.id)}>
                          <textarea
                            value={editedMessage}
                            onChange={(event) => setEditedMessage(event.target.value)}
                          />
                          <button type="submit">Save</button>
                        </form>
                        <div
                          className={`${msg.sender === currentUser?.id ? "bubble-arrow alt" : "bubble-arrow"}`}
                        ></div>
                      </div>
                    ) : (
                      <>
                        {msg.isItGroup && (
                          <p className="participants_name">
                            {participantsList.find((user) => user.id === msg.sender)?.name}
                          </p>
                        )}
                        {msg.text && <p>{msg.text}</p>}
                        {msg.image && <img src={msg.image} className="img_msg" alt="Message image" />}
                        <p>{new Date(msg.date).toLocaleDateString()}</p>
                        <p>{msg.hour}</p>
                        {msg.isItRead ? (
                          <img
                            src="http://www.clipartbest.com/cliparts/dir/LB8/dirLB85i9.png"
                            className="readed_img"
                            alt="Read"
                          />
                        ) : (
                          <img
                            src="https://clipart-library.com/new_gallery/7-71944_green-tick-transparent-transparent-tick.png"
                            className="readed_img"
                            alt="Not read"
                          />
                        )}
                        {msg.sender !== currentUser?.id && msg.flagged && (
                          <img
                            src="https://image.similarpng.com/very-thumbnail/2021/06/Attention-sign-icon.png"
                            className="flagged_icon"
                            alt="Flagged"
                          />
                        )}
                        {msg.sender === currentUser?.id && msg.modified && <p>Modified</p>}
                        <div className={`${msg.sender === currentUser?.id ? "bubble-arrow alt" : "bubble-arrow"}`}></div>
                      </>
                    )}
                    {DisplayMenu && SelectedMessageId === msg.id && (
                      <div className="message-menu">
                        <button onClick={() => handleDeleteMessage(msg.id)}>Delete</button>
                        {msg.image === "" && msg.sender === currentUser?.id && (
                          <button onClick={() => handleEditMessage(msg.id, msg.text)}>Modify</button>
                        )}
                      </div>
                    )}
                  </li>
                ))}
              </div>

              {selectedUser && (
                <form onSubmit={handleSubmitNewMessage}>
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