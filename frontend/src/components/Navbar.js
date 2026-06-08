import React, { useState } from "react";
import { Sun, Moon, Settings, LogOut, Menu, X } from "lucide-react";
import { useLocation } from "react-router-dom";
import { db } from "../firebase";
import { doc, updateDoc } from "firebase/firestore";

function Navbar({ toggleTheme, theme, openModal, user, setUser, isMobileMenuOpen, setIsMobileMenuOpen }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const handleLogout = async () => {
    if (user && user.uid && user.email !== "demo@demo.com" && user.email !== "gtec@demo.com") {
      try {
        await updateDoc(doc(db, "users", user.uid), { isOnline: false });
      } catch (e) {}
    }
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
          <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", textAlign: "right" }} className="hide-on-mobile">
              <span style={{ fontSize: "14px", fontWeight: "600", color: "var(--text-main)" }}>{user.fullName}</span>
              <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--primary)", textTransform: "uppercase", letterSpacing: "0.5px", background: "rgba(139, 92, 246, 0.15)", padding: "2px 8px", borderRadius: "10px", marginTop: "4px" }}>
                {user.role}
              </span>
            </div>
            <div className="avatar-container">
              <div
                className="avatar"
                onClick={() => setOpen(!open)}
                style={{ width: "42px", height: "42px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--primary)", color: "white", fontWeight: "bold", fontSize: "18px", cursor: "pointer", overflow: "hidden", padding: user.photoURL ? 0 : undefined }}
              >
                {user.photoURL ? (
                  <img src={user.photoURL} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", borderRadius: "50%" }} referrerPolicy="no-referrer" />
                ) : (
                  user.fullName?.charAt(0).toUpperCase()
                )}
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
          </div>
        )}

        {user && location.pathname === "/dashboard" && (
          <button 
            className="mobile-menu-btn" 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        )}
      </div>
    </header>
  );
}

export default Navbar;