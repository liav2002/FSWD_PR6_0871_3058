import { Alert, Button, Paper, Typography, AlertTitle, TextField } from '@mui/material';
import { motion } from 'framer-motion';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Reaptcha from 'reaptcha';

function VerifyAccount(props) {
  const [verificationCode, setVarificationCode] = useState("");
  const [isHuman, setIsHuman] = useState(false);
  const [isAccessing, setAccessing] = useState(false)
  const [isNotValid, setIsNotValid] = useState(false)
  const url = 'http://localhost:5000';
  const captchaSiteKey = "6Ld9CJchAAAAAAilSyF7kvbpzM8nrVsbmgWpmgYq";

  const onVerify = (recaptchaResponse) => {
    setIsHuman(true);
  };

  useEffect(() => {
    sendMail();
  }, []);

  function sendMail() {
    axios.post(`${url}/email-verification-send-code`,
      {
        username: props.username,
        email: props.email
      })
      .then((response) => {
        console.log(response);
      })
      .catch((error) => {
        console.log(error);
      });
  }

  function submit(e) {
    setAccessing(true)
    if (isHuman) {
      axios.post(`${url}/email-verification-check-code`,
        {
          username: props.username,
          email: props.email,
          code: verificationCode
        })
        .then((response) => {
          console.log(response.data)
          if (response.data) {
            props.submitInfo();
          }
          else {
            setIsNotValid(true)
          }
        })
        .catch((error) => {
          console.log(error);
        }
        );
    }
  }
  return (
    <Paper sx={{ minWidth: 400, minHeight: 330,display:'flex', flexDirection:'column', justifyContent:"space-around", alignItems:"center" }} component={motion.div} initial={{ x: "100vw" }} animate={{x:0}} exit={{ x: "-100vw" }} key={props.key}>
      <Typography>Verification code has been sent to your mail:</Typography>
      <Typography>{props.email}</Typography>
      <TextField
        error={isNotValid}
        helperText={isNotValid ? "Invalid varification code!" : ""}
        variant="filled"
        onChange={e => { setVarificationCode(e.target.value) }}
        value={verificationCode}
        label="Verification code">
      </TextField>
      <Reaptcha sitekey={captchaSiteKey} onVerify={onVerify} />
      {((!isHuman) && isAccessing) &&
        <Alert severity="error">
          <AlertTitle>Beep Boop</AlertTitle>
          <strong>You are a robot!</strong>
        </Alert>
      }
      <Button variant="contained" onClick={submit}>submit</Button>
      <br></br>
      <Typography>I did not get any mail!</Typography>
      <Typography>Please check your spam.</Typography>
      <Typography>or</Typography>
      <Button onClick={sendMail}>resend mail</Button>
    </Paper>
  )
}

export default VerifyAccount