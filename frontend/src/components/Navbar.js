import React, { useState } from "react";
import { Sun, Moon, Settings, LogOut } from "lucide-react";

function Navbar({ toggleTheme, theme, openModal, user, setUser }) {
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
    window.location.href = "/";
  };

  return (
    <header className="navbar">
      <div className="logo">
        Authen<span>X</span>
      </div>

      {/* LINKS */}
      <div className="nav-links">
        {!user ? (
          <>
            <a href="#how">How It Works</a>
            <a href="#how">Features</a>
          </>
        ) : (
          <span style={{ fontWeight: "700", color: "var(--primary)", fontSize: "1.1rem", letterSpacing: "0.5px" }}>
            {user?.role === "superadmin" ? "AuthenX Global Control" : user.institution}
          </span>
        )}
      </div>

      <div className="nav-buttons">
        <div className="theme-toggle" onClick={toggleTheme} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
          {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
        </div>

        {/* CONDITIONAL LOGIN / AVATAR */}
        {!user ? (
          <>
            <button className="login" onClick={() => openModal("login")}>
              Login
            </button>
            <button className="signup" onClick={() => openModal("signup")}>
              Sign Up
            </button>
          </>
        ) : (
          <div className="avatar-container">
            <div
              className="avatar"
              onClick={() => setOpen(!open)}
            >
              {user.fullName?.charAt(0).toUpperCase()}
            </div>

            {open && (
              <div className="dropdown">
                <p><strong>{user.fullName}</strong></p>
                <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>{user.email}</p>

                <hr />

                <button style={{ display: "flex", alignItems: "center" }}><Settings size={16} style={{ marginRight: "8px" }} /> Account Settings</button>
                <button style={{ display: "flex", alignItems: "center" }} onClick={handleLogout}><LogOut size={16} style={{ marginRight: "8px" }} /> Logout</button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

export default Navbar;