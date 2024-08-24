import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import './App.css';

import ErrorPage from './Components/Error-Page/ErrorPage';
import Login from './Components/Login-Register/Login';
import Register from './Components/Login-Register/Register';
import Home from './Components/Home/Home';
import ContactProfil from './Components/Profile/ContactProfil';
import GroupProfil from './Components/Profile/GroupProfil';
import YourProfil from './Components/Profile/YourProfil';
import NewGroup from './Components/Group/NewGroup';
import Admin from './Components/Admin/Admin';

function App() {
  return (
    <div className="App">
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/:phone" element={<Home />} />
          <Route path="contact_profil/:id" element={<ContactProfil />} />
          <Route path="group_profil/:id" element={<GroupProfil />} />
          <Route path="your_profil" element={<YourProfil />} />
          <Route path="new_group" element={<NewGroup />} />
          <Route path="/admin" element={<Admin />} />
          <Route path=':page' element={<ErrorPage />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
