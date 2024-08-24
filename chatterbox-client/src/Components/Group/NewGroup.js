import React from "react"
import { useNavigate } from "react-router-dom"
import "./newGroup.css";
import { useState, useEffect } from "react";

const url = 'http://localhost:5002';

export default function NewGroup() {
  const [users, setUsers] = useState([]);
  const [UsersAddedId, setUsersAddedId] = useState([]);
  const [UsersAdded, setUsersAdded] = useState([]);
  const [inputs, setInputs] = useState({});
  const currentUser = JSON.parse(localStorage["currentUser"]);
  const navigate = useNavigate();


  const fetchUsers = async () => {
    
    try {
      const response = await fetch(url + `/users/AllUsers?currentUserID=${currentUser.id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        
        const usersData = await response.json();
        console.log(usersData.data)
        setUsers(usersData.data);
      } else {
        console.error(`Request failed with status code ${response.status}`);
      }
    } catch (error) {
      console.error('An error occurred:', error);
    }
  };


  const profilePictureOptions = [
    {
      id: 'option1',
      value: 'https://images.pexels.com/photos/3680219/pexels-photo-3680219.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500',
      label: 'Première photo',
    },
    {
      id: 'option2',
      value: 'https://wallpapercave.com/wp/wp7810895.jpg',
      label: 'Deuxième photo',
    },
    {
      id: 'option3',
      value: 'https://th.bing.com/th/id/R.e7a8537e53847dcf87308787365cbc8a?rik=ON1No9YH9vnJZA&riu=http%3a%2f%2fpupuce67.p.u.pic.centerblog.net%2fo%2f6ecab6ca.jpg&ehk=W2IyMsVf%2blm4rcArrFVqbrcbB%2ftpSrxqpCbRoQP%2fVuM%3d&risl=&pid=ImgRaw&r=0',
      label: 'Troisième photo',
    },
  ];


  const AddUserToGroup = async (user) => {
    setUsersAddedId([...UsersAddedId, user.id]);
    setUsersAdded([...UsersAdded, user]);
  }


  const handleChange = ({ target }) => {
    const { name, value } = target;
    let newValue = value;

    if (name === 'title') {
    } if (name === 'description') {
      console.log("");
    }
    if (name === 'profilePictureOption') {
      setInputs((values) => ({ ...values, profil: newValue }));
    } else {
      setInputs((values) => ({ ...values, [name]: newValue }));
    }
  };


  const handleSubmit = async (event) => {
    event.preventDefault();
    setUsersAddedId([...UsersAddedId, currentUser.id]);
    const participantsIdString = JSON.stringify([...UsersAddedId, currentUser.id]);
    inputs["participantsId"] = JSON.parse(participantsIdString);
    // inputs["participantsId"] = JSON.stringify(UsersAdded);
    inputs["adminId"] = currentUser.id;

    const data = JSON.stringify(inputs);
    console.log(inputs);

    try {
      const response = await fetch(url + "/groups/AddGroup", {
        method: "POST",
        body: data,
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log(`Status: ${response.status}`);
      console.log("Response headers:", response.headers);


      if (response.status === 200 || response.status === 201) {

        alert("group created successfully.");
        const res = await response.json();
        console.log("client", res);
        navigate(`/${currentUser.phone}`);

      } else {
        console.error(`Request failed with status code ${response.status}`);
      }
    } catch (error) {
      console.error("An error occurred:", error);
    }
  };


  const RemoveAddUser = async (user) => {
    const updatedUsersAdded = UsersAdded.filter((user_added) => user_added.id !== user.id);
    setUsersAdded(updatedUsersAdded);
    const updatedUsersAddedId = UsersAddedId.filter((user_addedId) => user_addedId.id !== user.id);
    setUsersAddedId(updatedUsersAddedId);

  }

  const ReturnToHome = () => navigate(`/${currentUser.phone}`);

  useEffect(() => {
    fetchUsers();
  }, []);


  return (
    <form onSubmit={handleSubmit}>
      <div className="container-group">
        <div className="return-to-home-wrapper">
          <img
            src="https://img.icons8.com/?size=512&id=6483&format=png"
            onClick={ReturnToHome}
            className="return-to-home"
            alt="Return to Home"
          />
        </div>
        <div className="left-div-group">
          <p>Contacts: </p>
          {users.map((user) => (
            <li key={user.id} className="add_user_to_group_list">
              <div className="contact_container" onClick={() => AddUserToGroup(user)}>
                <span><img src={user.profil} className="img_contact"></img></span>
                <span>{user.name}</span>
              </div>
            </li>
          ))}
        </div>
        <div className="right-div-group">
          <h3>Create a New Group</h3>
          <p>Users added:</p>
          {UsersAdded.map((user) => (
            <li key={user.id} className="add_user_to_group_list">
              <div className="contact_container">
                <span><img src={user.profil} className="img_contact"></img></span>
                <span>{user.name}</span>
                <span>
                  <img src="https://img.icons8.com/?size=512&id=6483&format=png"
                      onClick={() => RemoveAddUser(user)}
                      className="remove_add_user_icon"></img>
                </span>
              </div>
            </li>
          ))}
          <input id="titleInput" className="inputTypeIn" type="text" name="title" value={inputs.title || ""} onChange={handleChange} placeholder="Enter Group Title:" required />
          <textarea value={inputs.description || ""} name="description" onChange={handleChange} placeholder="Write a description..."></textarea>
          <div className="profile-picture-container">
            {profilePictureOptions.map((option) => (
              <label key={option.value} className="profile-picture-option">
                <input type="radio" name="profil" value={option.value} checked={inputs.profil === option.value} onChange={handleChange} required />
                <img src={option.value} alt={option.label} className="profile-picture-img" />
              </label>
            ))}
          </div>
          <input id="CreateButton" type="submit" name="submit" value="Create Group" />
        </div>
      </div>
    </form>
  );
}