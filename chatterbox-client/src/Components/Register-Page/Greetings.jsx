import { Button, Paper, Typography } from '@mui/material'
import React from 'react'
import { motion } from 'framer-motion'

function Greetings(props) {
  return (
    <Paper sx={{ minWidth: 400, minHeight: 330,display:'flex', flexDirection:'column', justifyContent:"space-around", alignItems:"center" }} component={motion.div} exit={{ x: "-100vw" }} key={props.key}>
      <Typography>Thank you for choosing our site!</Typography>
      <Typography>But first we need to know you a little bit better...</Typography>
      <Typography>Just a few minutes for endless possiblities!</Typography>
      <Button onClick={props.handleNext}>Start</Button>
    </Paper>
  )
}

export default Greetings