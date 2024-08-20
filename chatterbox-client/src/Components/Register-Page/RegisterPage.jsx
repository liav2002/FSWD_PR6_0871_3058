import React from 'react'
import EmailQuery from './EmailQuery'
import { useState } from 'react'
import UsernameQuery from './UsernameQuery';
import PasswordQuery from './PasswordQuery';
import BirthDateQuery from './BirthDateQuery';
import { useNavigate } from 'react-router-dom';
import VerifyAccount from './VerifyAccount';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import Button from '@mui/material/Button';
import { StepLabel } from '@mui/material';
import Greetings from './Greetings';
import Summerize from './Summerize';
import { AnimatePresence, motion } from 'framer-motion';
import axios from 'axios';

function RegisterPage() {
  const [newUsername, setNewUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [doMail, setDoMail] = useState(true);
  const [birthdate, setBirthdate] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  const [canContinue, setCanContinue] = useState(false)
  let navigate = useNavigate();
  const stepperSteps = ['Username', 'Password', 'Birthdate', 'Email'];//summerize at the end


  const handleNext = () => {
    setActiveStep(activeStep + 1);
  };

  const url = 'http://localhost:5000';

  function submitInfo() {
    const userinfo = {
      username: newUsername,
      password: password,
      email: email,
      doMail: doMail,
      birthDate: birthdate
    }
    console.log(userinfo)
    axios.post(`${url}/new-user`,userinfo)
      .then((response) => {
        console.log(response);
        localStorage.setItem('username', newUsername)
        handleNext()
      })
      .catch((error) => {
        console.log(error);
      });

  }
  const queries = [
    <Greetings handleNext={handleNext} key={0}/>,
    <UsernameQuery username={newUsername} setUsername={setNewUsername} setCanContinue={setCanContinue} key={1} />,
    <PasswordQuery password={password} setPassword={setPassword} setCanContinue={setCanContinue} key={2}/>,
    <BirthDateQuery birthdate={birthdate} setBirthdate={setBirthdate} setCanContinue={setCanContinue} key={3}/>,
    <EmailQuery email={email} setEmail={setEmail} setDoMail={setDoMail} doMail={doMail} setCanContinue={setCanContinue} key={4} />,
    <VerifyAccount email={email} username={newUsername} submitInfo={submitInfo} key={5}/>,
    <Summerize key={6} />
  ];
  return (
    <div>
      <h2 style={{marginTop: 0}}>CREATE A NEW ACCOUNT</h2>
      <Button onClick={() => navigate('../')}>already have an account?</Button>
      <Stepper activeStep={activeStep - 1}>
        {stepperSteps.map((label, index) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
      <AnimatePresence mode="wait">
        {queries[activeStep]}
      </AnimatePresence>
      <AnimatePresence mode="wait">
        {
          activeStep >= 1 && activeStep <= 4 && canContinue &&
          <Button key={1} onClick={handleNext} sx={{ mr: 1 }} component={motion.div} initial={{ y: "100vh" }} animate={{y:0}} exit={{ y: "100vh" }} disabled={!canContinue} >
            Next
          </Button>
        }
      </AnimatePresence>
    </div >
  )
}

export default RegisterPage