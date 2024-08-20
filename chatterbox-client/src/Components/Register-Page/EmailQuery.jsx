import { Paper, TextField, FormControlLabel, Checkbox, FormGroup } from '@mui/material';
import { motion } from 'framer-motion';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
const url = 'http://localhost:5000';


function EmailQuery(props) {
  const [isAlreadyExist, setIsAlreadyExist] = useState(false)
  const [isNotValid, setIsNotValid] = useState(true)
  const [isAgree, setIsAgree] = useState(false)
  useEffect(() => { props.setCanContinue((!isAlreadyExist) && (!isNotValid) && (isAgree)) }, [isAlreadyExist, isNotValid, isAgree])

  function checkEmail() {
    if (/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(props.email)) {// - /^[a-zA-Z_](\.[0-9a-zA-Z_])*@([a-z])+\.((co\.([a-z]{2})) | com)$/ why wont work?
      axios.post(`${url}/new-user-email-check`,
        {
          email: props.email,
        })
        .then((response) => {
          let isExist = response.data;
          console.log(isExist);
          if (!isExist) {
            setIsAlreadyExist(false)
            setIsNotValid(false)
          }
          else {
            setIsAlreadyExist(true)
            setIsNotValid(false)
          }
        })
        .catch((error) => {
          console.log(error);
        });
    }
    else {
      setIsNotValid(true)
      setIsAlreadyExist(false)
    }
  }

  return (
    <Paper sx={{minWidth:400, minHeight:330,display:'flex', flexDirection:'column', justifyContent:"space-around", alignItems:"center"}}  component={motion.div} initial={{ x: "100vw" }} animate={{x:0}} exit={{ x: "-100vw" }} key={props.key}>
      <TextField
        error={(isNotValid || isAlreadyExist) && (props.email != "")}
        helperText={(isNotValid && (props.email != "") ? "Please enter a valid email!" : ((isAlreadyExist && (props.email != "")) ? "Email already in use by another user!" : ""))}
        variant="filled"
        onChange={e => { props.setEmail(e.target.value) }}
        value={props.email}
        onBlur={checkEmail}
        label="Email">
      </TextField>
      <FormGroup>
        <FormControlLabel control={<Checkbox checked={props.doMail} onClick={() => { props.setDoMail(!props.doMail) }} />} label="I want news to be sent to my email." />
        <FormControlLabel control={<Checkbox checked={isAgree} onClick={() => { setIsAgree(!isAgree) }} />} label="I agree to the terms and services" />
      </FormGroup>
    </Paper>
  )
}

export default EmailQuery