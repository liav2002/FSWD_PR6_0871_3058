import React, { useState } from 'react'
import { Dialog, DialogActions, DialogTitle, DialogContent, DialogContentText, TextField, Button, CircularProgress, InputAdornment, IconButton, Grid } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { useNavigate } from 'react-router-dom';
import { motion} from 'framer-motion'
import axios from 'axios';
const url = 'http://localhost:5000';



function LoginMenuItem(props) {
  const [usernameCheck, setUsernameCheck] = useState("")
  const [passwordCheck, setPasswordCheck] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isNotFound, setIsNotFound] = useState(false)
  const [isCorrectPassword, setIsCorrectPassword] = useState(false)
  const [isServerCheck, setIsServerCheck] = useState(false)
  const navigate = useNavigate()

  function login() {

    axios.post(`${url}/login-check`,
      {
        username: usernameCheck,
        password: passwordCheck
      })
      .then((response) => {
        setIsServerCheck(false)
        let pass = response.data;
        console.log(pass);
        if (pass == true) {
          console.log(usernameCheck);
          localStorage.setItem('username', usernameCheck)
          setIsNotFound(false)
          setIsCorrectPassword(false)
          navigate(`/home`)
        }
        else {
          if (pass == "username not found") {
            setIsNotFound(true)
          }
          if (pass == "incorrect password") {
            setIsCorrectPassword(true)
          }
        }
      })
      .catch((error) => {
        console.log(error);
      });

  }

  const handleClose = () => {
    props.setLoginOpen(false);
  };

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

 
  return (

      <Dialog key={1} open={props.loginOpen} onClose={handleClose} maxWidth="xs" fullWidth component={motion.div} initial={{ y: "-100vh" }} animate={{ y: 0 }} exist={{ y: "-100vh" }} >
        <DialogTitle>Login</DialogTitle>
        <DialogContent >
          <TextField error={isNotFound} helperText={isNotFound ? "Username is not found!" : ""} variant="outlined" margin="normal" fullWidth label="Username"
            onChange={e => { setUsernameCheck(e.target.value); }}
            value={usernameCheck} >
          </TextField>
          <TextField fullWidth variant="outlined"
            type={showPassword ? 'text' : 'password'}
            value={passwordCheck}
            error={isCorrectPassword}
            helperText={isCorrectPassword ? "Incorrect password!" : ""}
            onChange={e => setPasswordCheck(e.target.value)}
            label="Password"
            InputProps={{
              endAdornment:
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={handleClickShowPassword}
                    edge="end">
                    {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                </InputAdornment>
            }}>
          </TextField>
          <Grid container direction={"column"} alignItems="center">
            <Grid item>
              <DialogContentText>New here?</DialogContentText>
            </Grid>
            <Grid item>
              <Button variant='outlined' onClick={() => { handleClose(); navigate("./Register") }}>Register</Button>
            </Grid>
          </Grid>
        </DialogContent>
        {isServerCheck ?
          <DialogActions >
            <CircularProgress />
          </DialogActions>
          :
          <DialogActions >
            <Button onClick={handleClose}>Cancel</Button>
            <Button variant="contained" onClick={() => { setIsServerCheck(true); login() }}>Sign in</Button>
          </DialogActions>}
      </Dialog >

  )
}

export default LoginMenuItem

