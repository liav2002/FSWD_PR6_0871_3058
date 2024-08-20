import { Paper } from "@mui/material";
import { motion } from "framer-motion";
import React, { useEffect } from "react";
import { LocalizationProvider, StaticDatePicker } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import TextField from "@mui/material/TextField";

function BirthDateQuery(props) {
  const today = new Date();
  const eighteenYearsAgo = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
  useEffect(()=>props.setCanContinue(false),[])

  return (
    <Paper
      sx={{
        minWidth: 400,
        minHeight: 330,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-around",
        alignItems: "center",
      }}
      component={motion.div}
      initial={{ x: "100vw" }}
      animate={{ x: 0 }}
      exit={{ x: "-100vw" }}
      key={props.key}
    >
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <StaticDatePicker
          displayStaticWrapperAs="desktop"
          value={props.birthdate}
          onChange={(newValue) => {
            props.setBirthdate(newValue);
            props.setCanContinue(true)
          }}
          renderInput={(params) => <TextField {...params} />}
          maxDate={eighteenYearsAgo} // Restrict dates to be at least 18 years ago
        />
      </LocalizationProvider>
    </Paper>
  );
}

export default BirthDateQuery;
