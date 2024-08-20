import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../Main-Page/Toolbar.css"

const Toolbar = () => {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      const storedUser = localStorage.getItem("username"); 
      if (storedUser) {
        setUsername(storedUser);
      }
      setLoading(false);
    };

    fetchUser();
  }, [localStorage.getItem("username")]);

  const handleLogout = () => {
    localStorage.removeItem("username"); 
    setUsername("");
    navigate("/home", { replace: true });
  };

  const handleNavigation = (path) => {
    navigate(path);
  };

  return (
    <div>
      {localStorage.getItem("username") && (
        <div>
          <div>
            <button
              className="button1"
              onClick={() => handleNavigation("/todos")}
            >
              My To Do List
            </button>
            <button
              className="button2"
              onClick={() => handleNavigation("/posts")}
            >
              My Posts
            </button>
            <button
              className="button3"
              onClick={() => handleNavigation("/albums")}
            >
              My Albums
            </button>
            <button
              className="button2"
              onClick={() => handleNavigation("/info")}
            >
              My Info
            </button>
          </div>
          <div>
            <button className="button1" onClick={handleLogout}>
              Log Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Toolbar;