import React from 'react'
import { useParams } from 'react-router-dom';
import './ErrorPage.css'

function ErrorPage() {
  let { page } = useParams();
  return (
    <div>
      <h1 className='header404'><b>404</b></h1>
      <div className='body'>oops! something went wrong, it seems "{page}" is missing.</div>
    </div>

  )
}

export default ErrorPage