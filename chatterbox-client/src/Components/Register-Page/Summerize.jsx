import { Button, Paper, Typography } from '@mui/material'
import { motion } from 'framer-motion';
import React from 'react'
import { useNavigate } from 'react-router-dom';
function Summerize(props) {
  let navigate=useNavigate()
  const username = localStorage.getItem('username')
  return (
    <Paper sx={{ minWidth: 400, minHeight: 330 ,display:'flex', flexDirection:'column', justifyContent:"space-around", alignItems:"center"}}  component={motion.div} initial={{ x: "100vw" }} animate={{x:0}} key={props.key}>
      <Typography>Welcome {username}</Typography>
      <Typography>Thanks for joining our family!</Typography>
      <Typography>You can start right now.</Typography>
      <Button variant='contained' onClick={()=>{navigate(`/home`)}}>To my workspace</Button>
      <Typography>Or return to the main menu.</Typography>
      <Button onClick={()=>{navigate('/home')}} >Back to main menu</Button>
    </Paper>
  )
}

export default Summerize