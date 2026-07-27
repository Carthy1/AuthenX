import React, { useState, useEffect } from "react";
import "./App.css";
import { db } from "./firebase";
import { doc, updateDoc } from "firebase/firestore";

import Navbar from "./components/Navbar";
import Modal from "./components/Modal";
import Home from "./pages/Home";
import { Routes, Route, useNavigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Verify from "./pages/VerifyNew";
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    document.body.className = theme;
  }, [theme]);

  /* ========================= */
  /* ✅ SAFE USER STATE */
  /* ========================= */
  const [user, setUser] = useState(() => {
    const stored = sessionStorage.getItem("user");
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
    const stored = sessionStorage.getItem("user");
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
    const stored = sessionStorage.getItem("user");
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
  /* ✅ INACTIVITY WATCHDOG */
  /* ========================= */
  useEffect(() => {
    if (!user) return;

    let timeoutId;
    const INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutes

    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(handleInactivityLogout, INACTIVITY_TIMEOUT);
    };

    const handleInactivityLogout = async () => {
      if (window.isAuthenxProcessOngoing) {
        console.warn("Inactivity logout postponed: an AuthenX process is currently ongoing.");
        // Check again in 1 minute to avoid checking too frequently
        timeoutId = setTimeout(handleInactivityLogout, 60 * 1000);
        return;
      }

      console.log("User inactive for 15 minutes. Logging out.");
      if (user && user.uid && user.email !== "demo@demo.com" && user.email !== "gtec@demo.com") {
        try {
          await updateDoc(doc(db, "users", user.uid), { isOnline: false });
        } catch (e) {}
      }
      sessionStorage.removeItem("user");
      setUser(null);
      window.location.href = "/";
    };

    // Events to monitor activity
    const events = ["mousemove", "mousedown", "keypress", "scroll", "click", "touchstart"];
    events.forEach(event => window.addEventListener(event, resetTimer));

    // Initialize timer
    resetTimer();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      events.forEach(event => window.removeEventListener(event, resetTimer));
    };
  }, [user]);

  /* ========================= */
  /* ✅ PRESENCE TRACKING */
  /* ========================= */
  useEffect(() => {
    if (user && user.uid && user.email !== "demo@demo.com" && user.email !== "gtec@demo.com") {
      const userRef = doc(db, "users", user.uid);
      updateDoc(userRef, { isOnline: true }).catch(() => {});
      
      const handleUnload = () => {
        updateDoc(userRef, { isOnline: false }).catch(() => {});
      };
      
      window.addEventListener("beforeunload", handleUnload);
      
      return () => {
        window.removeEventListener("beforeunload", handleUnload);
        updateDoc(userRef, { isOnline: false }).catch(() => {});
      };
    }
  }, [user]);

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
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
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
              <Dashboard isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen} />
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