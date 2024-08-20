import React from "react"
import { useNavigate } from "react-router-dom"
import { useParams } from "react-router-dom";

import { useState ,useEffect } from "react";




export default function YourProfil() {
   // const [selectedUser, setSelectedUser] = useState(null);
    const currentUser = JSON.parse(localStorage["currentUser"]);
    const [name, setName] = useState(currentUser.name);
    const [email, setEmail] = useState(currentUser.email);
    const [status, setStatus] = useState(currentUser.status);
    const [password, setPassword] = useState(currentUser.password);
    const [image, setImage] = useState(currentUser.profil);
    const navigate = useNavigate();

    const handleNameChange=async(event)=>{
        setName(event.target.value)

    }
    const handleStatusChange=async(event)=>{
        setStatus(event.target.value)

    }
    const handlePasswordChange=async(event)=>{
        setPassword(event.target.value)

    }
    const handleEmailChange=async(event)=>{
        setEmail(event.target.value)

    }
    const handleImageChange=async(event)=>{
       // setImage(event.target.value)
       const selectedImg=event.target.files[0];
        const imageURL = URL.createObjectURL(selectedImg);
        setImage(imageURL); // a voir l'URL ne marche pas si on redemarre le client
       

    }
    const ReturnToHome = async () => {
        navigate(`/${currentUser.phone}`)
       }
    const SaveChange =async()=>{
        try {
            const response = await fetch(
              `/users/profil?id=${currentUser.id}&name=${name}&status=${status}&password=${password}&email=${email}&profil=${image}`,
              {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                },
              }
            );
            if (!response.ok) {
              throw new Error("Request failed for updating user");
            }
            const contentType = response.headers.get("Content-Type");
            if (contentType && contentType.includes("application/json")) {
              const data = await response.json();
              console.log(data);
            //   setMessages(prevState => {
            //     // Loop over your list
            //     return prevState.map((item) => {
            //         // Check for the item with the specified id and update it
            //         return item.id === msg.id ? {...item, flagged: data} : item
            //     })
            // })
            }
            let user=JSON.parse(localStorage.getItem("currentUser"));
            user.name=name;
            user.email=email;
            user.profil=image;
            user.status=status;
            user.password=password;
            localStorage.removeItem(currentUser);
            localStorage.setItem("currentUser", JSON.stringify(user));
            alert("Your profil is updated successfully.");
            
          } catch (error) {
            console.error("Error:", error);
          }

    }

    return(
        <div>
        <img src="https://img.icons8.com/?size=512&id=6483&format=png" onClick={()=>ReturnToHome()} className="returnToHome"></img>
     <div className="main_content">
     <div className="contact_info_div">
       <p className="contact_info_title">Your profil:</p>
       {currentUser != null ? (
         <div className="user_info_container">
           <div className="user_info">
             <div>
               {/* <img src={currentUser.profil} className="img_contact_display_info" alt="User Profile" /> */}
               <label htmlFor="imageInput">
                <img
                    src={image !== "" ? image : currentUser.profil}
                    className="img_contact_display_info"
                    alt="User Profile"
                />
                </label>
                <input
                id="imageInput"
                type="file"
                accept="image/*"
                // style={{ display: "none" }}
                onChange={handleImageChange}
                />
             </div>
             <div className="user_details">
               <p className="info_user_txt"> Your name:</p>
               <input type="text" value={name !== "" ? name : currentUser.name} className="info_user_txt" onChange={handleNameChange}/>
               <p className="info_user_txt">{currentUser.phone}</p>
               <input className="info_user_txt" type="text" value={email !== "" ? email : currentUser.email} onChange={handleEmailChange} />
             </div>
           </div>
           <div className="user_status">
             <p className="info_title">Info:</p>
             <input type="text" value={status !== "" ? status : currentUser.status} className="info_content" onChange={handleStatusChange}/>
           </div>
           <div className="user_status">
             <p className="info_title">Your password:</p>
             <input type="text" value={password !== "" ? password : currentUser.password} className="info_content" onChange={handlePasswordChange}/>
           </div>
           <button onClick={()=>SaveChange()}>Save</button>
         </div>
       ) : null}
     </div>
   </div>
   </div>
   
    );
}