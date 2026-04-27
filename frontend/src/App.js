import React, { useState, useEffect } from "react";
import "./App.css";

import Navbar from "./components/Navbar";
import Modal from "./components/Modal";
import Home from "./pages/Home";
import { Routes, Route, useNavigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Verify from "./pages/Verify";
import ProtectedRoute from "./components/ProtectedRoute"; 
import { Toaster } from "react-hot-toast";

function RouteTrigger({ type, setModal }) {
  const navigate = useNavigate();
  useEffect(() => {
    setModal(type);
    navigate("/", { replace: true });
  }, [type, setModal, navigate]);
  return null;
}

function App() {
  const [theme, setTheme] = useState("dark"); // Base state is dark
  const [modal, setModal] = useState(null);

  useEffect(() => {
    document.body.className = theme;
  }, [theme]);

  /* ========================= */
  /* ✅ SAFE USER STATE */
  /* ========================= */
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    try {
      const parsed = JSON.parse(stored);
      return parsed && parsed.email ? parsed : null;
    } catch {
      return null;
    }
  });

  /* ========================= */
  /* ✅ LOAD USER ON REFRESH */
  /* ========================= */
  useEffect(() => {
    const stored = localStorage.getItem("user");
    try {
      const parsed = JSON.parse(stored);
      if (parsed && parsed.email) {
        setUser(parsed);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    }
  }, []);

  /* ========================= */
  /* ✅ UPDATE USER AFTER LOGIN */
  /* ========================= */
  window.updateUser = () => {
    const stored = localStorage.getItem("user");
    try {
      const parsed = JSON.parse(stored);
      if (parsed && parsed.email) {
        setUser(parsed);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    }
  };

  /* ========================= */
  /* ✅ MODAL OPEN FUNCTION */
  /* ========================= */
  window.openModal = setModal;

  return (
    <div className="app-container">

      {/* ========================= */}
      {/* ✅ AMBIENT BACKGROUNDS & TOASTER */}
      {/* ========================= */}
      <div className="ambient-orb orb-1"></div>
      <div className="ambient-orb orb-2"></div>
      <Toaster 
        position="top-center" 
        toastOptions={{ 
          className: "glass-toast", 
          duration: 4000,
          style: {
            background: 'var(--card-bg)',
            color: 'var(--text-main)',
            border: '1px solid var(--card-border)',
            backdropFilter: 'blur(10px)'
          }
        }} 
      />

      {/* ========================= */}
      {/* ✅ NAVBAR */}
      {/* ========================= */}
      <Navbar
        toggleTheme={() =>
          setTheme(theme === "light" ? "dark" : "light")
        }
        theme={theme}
        openModal={setModal}
        user={user}
        setUser={setUser}
      />

      {/* ========================= */}
      {/* ✅ ROUTES */}
      {/* ========================= */}
      <Routes>
        <Route path="/" element={<Home />} />
        
        <Route path="/login" element={<RouteTrigger type="login" setModal={setModal} />} />
        <Route path="/signup" element={<RouteTrigger type="signup" setModal={setModal} />} />

        {/* ✅ Step 2: Wrap the Dashboard route with the Bouncer */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        
        <Route path="/verify" element={<Verify />} /> 
      </Routes>

      {/* ========================= */}
      {/* ✅ MODAL */}
      {/* ========================= */}
      {modal && (
        <Modal type={modal} close={() => setModal(null)} />
      )}
    </div>
  );
}

export default App;