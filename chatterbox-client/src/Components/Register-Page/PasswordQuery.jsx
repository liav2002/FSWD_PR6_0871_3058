import { Paper, Typography, TextField, InputAdornment, IconButton } from '@mui/material';
import React, { useState, useEffect } from 'react'
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { motion } from 'framer-motion';
function PasswordQuery(props) {
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isNotValid, setIsNotValid] = useState(true)
    const [isNotIdentical, setIsNotIdentical] = useState(true)
    const [showPassword, setShowPassword] = useState(false)
    const [showConfrimPassword, setShowConfirmPassword] = useState(false)
    useEffect(() => { props.setCanContinue(!(isNotValid || isNotIdentical)) }, [isNotValid, isNotIdentical])
    useEffect(() => { checkIsNotValid() }, [props.password])
    useEffect(() => { checkIsNotIdentical() }, [confirmPassword])

    const checkIsNotValid = () => {
        if (props.password.includes(" ") || props.password === "") {
            setIsNotValid(true)
        }
        else {
            setIsNotValid(false)
        }
    }

    const checkIsNotIdentical = () => {
        if (confirmPassword != props.password || confirmPassword === "") {
            setIsNotIdentical(true)
        }
        else {
            setIsNotIdentical(false)
        }
    }

    return (
        <Paper sx={{minWidth:400, minHeight:330,display:'flex', flexDirection:'column', justifyContent:"space-around", alignItems:"center"}}  component={motion.div} initial={{ x: "100vw" }} animate={{x:0}} exit={{ x: "-100vw" }} key={props.key}>
            <Typography>Enter password:</Typography>
            <TextField
                type={showPassword ? 'text' : 'password'}
                error={isNotValid && props.password != ""}
                helperText={isNotValid && props.password != "" ? "Please enter a valid password!" : ""}
                variant="filled"
                onChange={e => { props.setPassword(e.target.value); }}
                value={props.password}
                label="Password"
                InputProps={{
                    endAdornment:
                        <InputAdornment position="end">
                            <IconButton
                                aria-label="toggle password visibility"
                                onClick={() => { setShowPassword(!showPassword) }}
                                edge="end">
                                {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                            </IconButton>
                        </InputAdornment>
                }}>
            </TextField>
            <Typography>Please confirm your password:</Typography>
            <TextField
                type={showConfrimPassword ? 'text' : 'password'}
                error={isNotIdentical && confirmPassword != ""}
                helperText={isNotIdentical && confirmPassword != "" ? "Passwords are not identical!" : ""}
                variant="filled"
                onChange={e => { setConfirmPassword(e.target.value); checkIsNotIdentical() }}
                value={confirmPassword}
                label="Confirm Password"
                InputProps={{
                    endAdornment:
                        <InputAdornment position="end">
                            <IconButton
                                aria-label="toggle confirm password visibility"
                                onClick={() => { setShowConfirmPassword(!showConfrimPassword) }}
                                edge="end">
                                {showConfrimPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                            </IconButton>
                        </InputAdornment>
                }}>
            </TextField>
        </Paper>
    )
}

export default PasswordQuery