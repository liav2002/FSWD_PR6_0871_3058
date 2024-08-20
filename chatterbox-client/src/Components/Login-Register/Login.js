import React from "react"
import { Link,useNavigate } from "react-router-dom"

import "./signInOut.css";

import { useState ,useEffect } from "react";


// const validPassword = /^\d{1,10}$/;
//const validPhone = /^\d{10}$/; // changee
const validPhone = /^$|^\d{0,10}$/;

export default function Login() {

  const [inputs, setInputs] = useState({});
  const navigate = useNavigate();
  
  

const handleChange = ({target}) => {
    let isValid=true;
    const {name,value} = target;
    
    if (name ==='phone'){
        isValid=  validPhone.test(value);
    }
    if (isValid) {
        setInputs(values => ({...values, [name]: value}))
    }

}


//submit
  const handleSubmit =  (event) => {
    event.preventDefault();
    console.log(inputs);
    let phone=inputs.phone;
    let password=inputs.password;
    console.log(phone);



  const requestOptions = {
    method: 'GET',
  };

          fetch(`users/loginUser?phone=${phone}&password=${password}`, requestOptions)
          .then(res=>{
            console.log(`Status: ${res.status}`);
            console.log('Response headers:', res.headers);
            if (res.ok) {
              console.log("im here")
              console.log(res)
              console.log("im here222")
              console.log(res.json())
                return res;
              }  else if(res.status=== 404){
                console.error(`Request failed with status code ${res.status}`);
                alert('Phone or password is wrong');
                setInputs(values => ({...values, ['password']: ""}))
                throw new Error('phone or password is wrong');

            } else {
                console.error(`Request failed with status code ${res.status}`);
                alert("User no found");
                throw new Error('User no found');

              }
        })
        .then(user=>{
            alert('You are logged in');
            console.log("im here 2")
            console.log(JSON.stringify(user)) // ?????????????????????????????
            localStorage.setItem('currentUser', JSON.stringify(user));
            if(user.name==="Admin"){
              navigate(`/admin`);
            }else{
              
              navigate(`/${user.phone}`);
            }
        })
        .catch(error=>{
            console.error('An error occurred:', error);
        })
       
        
      
    };

 

  return (
    <div className="login-container">
      <h1>WELCOME</h1>
      <form onSubmit={handleSubmit} className="login-form">
      <input 
        className="inputTypeIn"
        id="phoneInput"
        type="tel" // Changer "text" par "tel" pour le numéro de téléphone
        name="phone"
        value={inputs.phone || ""} 
        onChange={handleChange}
        placeholder="Enter your phone number:"
        required
      />

      <input
          id="passwordInput"
          className="inputTypeIn"
          // maxLength={4} 
          type="password" 
          name="password" 
          value={inputs.password || ""} 
          onChange={handleChange}
          placeholder="Enter your password:"
          required
        />
        <input id="submitButton" type="submit" name="submit" value="LOG IN" />
    </form>
    <Link className="loginLink" to="/register">
                REGISTER
    </Link>
    </div>
    
  )
}