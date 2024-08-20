import { Paper, TextField, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import React, { useEffect, useState } from 'react'
import axios from 'axios';
const url = 'http://localhost:5000';

function NameQuery(props) {
  const [isAlreadyExist, setIsAlreadyExist] = useState(false)
  const [isNotValid, setIsNotValid] = useState(false)

  useEffect(() => { props.setCanContinue(false) }, [])

  function checkUsername() {
    if (props.username.includes(" ") || props.username == "") {//maybe add more special characters
      setIsNotValid(true);
    }
    else {//check if username already exist in database
      setIsNotValid(false)
      axios.post(`${url}/new-user-username-check`,
        {
          username: props.username,
        })
        .then((response) => {
          let isExist = response.data;
          console.log(isExist);
          if (!isExist) {
            setIsAlreadyExist(false)
            props.setCanContinue(true)
          }
          else {
            setIsAlreadyExist(true);
          }
        })
        .catch((error) => {
          console.log(error);
        });
    }
  }
  return (
    <Paper sx={{ minWidth: 400, minHeight: 330 ,display:'flex', flexDirection:'column', justifyContent:"space-around", alignItems:"center"}} component={motion.div} initial={{ x: "100vw" }} animate={{ x: 0 }} exit={{ x: "-100vw" }} key={props.key}>
      <Typography>Enter a username:</Typography>
      <TextField
        error={isNotValid || isAlreadyExist}
        helperText={(isNotValid ? "Please enter a valid username!" : (isAlreadyExist ? "Username already exists!" : ""))}
        variant="filled"
        onChange={e => { props.setUsername(e.target.value) }}
        onBlur={checkUsername}
        value={props.username}
        label="Username">
      </TextField>
      <Typography>This is how you and other people would see you.</Typography>
      <Typography>So choose wisely!</Typography>
    </Paper>
  )
}

export default NameQuery