import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import './App.css';

import MainPage from './Components/Main-Page/MainPage';
import ErrorPage from './Components/Error-Page/ErrorPage';
import Temp from './Components/Main-Page/Temp';
import Appbar from './Components/Frame/Appbar';
import RegisterPage from './Components/Register-Page/RegisterPage';

function App() {
  return (
    <div className="App">
      <Router>
        <Appbar />
        <Routes>
          <Route path='/' element={<MainPage />} />
          <Route path='/home' element={<Temp />} />
         <Route path='/Register' element={<RegisterPage />} />
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
