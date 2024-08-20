import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Temp() {
    const navigate = useNavigate();
    
    useEffect(() => {    
        navigate(`/home`);}, [])

    return (
        <></>
    );
  }
  
  export default Temp;