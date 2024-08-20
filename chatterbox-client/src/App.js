import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import './App.css';

import MainPage from './Components/Main-Page/MainPage';
import ErrorPage from './Components/Error-Page/ErrorPage';
import Temp from './Components/Main-Page/Temp';

function App() {
  return (
    <div className="App">
      <Router>
        <Routes>
          <Route path='/' element={<MainPage />} />
          <Route path='/home' element={<Temp />} />
         {/*  <Route path='/Register' element={<RegisterPage />} /> */}
          <Route path=':page' element={<ErrorPage />} />
          {/* ADD ROUTE TO ALL COMPONENTS 
          <Route path='/albums' element={<Albums />} />
          */}
        </Routes>
      </Router>
    </div>
  );
}

export default App;
