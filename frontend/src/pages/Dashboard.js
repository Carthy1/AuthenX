import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase"; 
import { 
  doc,
  getDoc,
  setDoc,
  onSnapshot
} from "firebase/firestore";
import { 
  Home, 
  ShieldCheck, 
  Users, 
  UploadCloud, 
  FileText, 
  Settings, 
  LogOut,
  ShieldAlert,
  Globe
} from "lucide-react";

// Import modular dashboard components
import DashboardHome from "../components/dashboard/DashboardHome";
import CertificateManagement from "../components/dashboard/CertificateManagement";
import CreateUser from "../components/dashboard/CreateUser";
import UploadPage from "../components/dashboard/UploadPage";
import VerificationLogs from "../components/dashboard/VerificationLogs";
import AccountSettings from "../components/dashboard/AccountSettings";
import TrustCouncil from "../components/dashboard/TrustCouncil";
import GtecPortal from "../components/dashboard/GtecPortal";

function Dashboard({ isMobileMenuOpen, setIsMobileMenuOpen }) {
  const [activePage, setActivePage] = useState("dashboard");
  const [user, setUser] = useState(null); 
  const [schoolLogo, setSchoolLogo] = useState(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = sessionStorage.getItem("user");
    if (!storedUser) {
      navigate("/");
      return;
    }
    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);

    // Real-time security listener to enforce rapid suspensions
    const unsubscribeAuth = onSnapshot(doc(db, "users", parsedUser.uid || parsedUser.id || "unknown"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        
        // Hard lockout protocol
        if (data.role === "suspended" || data.status === "suspended" || data.role === "rejected") {
           sessionStorage.removeItem("user");
           if (window.updateUser) window.updateUser();
           navigate("/");
           window.location.reload();
           return;
         }

        if (data.role && data.role !== parsedUser.role) {
           const updatedUser = { ...parsedUser, role: data.role };
           sessionStorage.setItem("user", JSON.stringify(updatedUser));
           setUser(updatedUser);
           if (window.updateUser) window.updateUser();
        }
      }
    });

    const fetchLogo = async () => {
      try {
        const instRef = doc(db, "institutions", parsedUser.institution);
        const instSnap = await getDoc(instRef);
        if (instSnap.exists() && instSnap.data().logoUrl) {
          setSchoolLogo(instSnap.data().logoUrl);
        }
      } catch (err) { console.error(err); }
    };
    fetchLogo();

    return () => unsubscribeAuth();
  }, [navigate]);

  if (!user) return null;

  const isAdmin = user.role?.trim().toLowerCase() === "admin" || user.role?.trim().toLowerCase() === "registrar";

  const handleSidebarLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!isAdmin) { alert("Only Admins or Registrars can update the institution logo."); return; }

    setLogoUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
        method: "POST",
        headers: {
          pinata_api_key: process.env.REACT_APP_PINATA_API_KEY,
          pinata_secret_api_key: process.env.REACT_APP_PINATA_SECRET_API_KEY,
        },
        body: formData,
      });
      const resData = await res.json();
      const ipfsHash = resData.IpfsHash;

      await setDoc(doc(db, "institutions", user.institution), {
        name: user.institution,
        logoUrl: ipfsHash,
      }, { merge: true });

      setSchoolLogo(ipfsHash);
    } catch (err) {
      console.error(err);
      alert("Logo upload failed.");
    }
    setLogoUploading(false);
  };

  const renderContent = () => {
    if (user?.role === "pending" || user?.role === "suspended") {
      const isSuspended = user?.role === "suspended";
      return (
        <div style={{ textAlign: "center", padding: "100px 20px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%" }}>
          <ShieldAlert size={80} color={isSuspended ? "#ff4757" : "#f59e0b"} style={{ marginBottom: "20px" }} />
          <h2 style={{ fontSize: "32px", margin: "0 0 10px 0", color: isSuspended ? "#ff4757" : "white" }}>
            {isSuspended ? "Platform Access Suspended" : "Application Under Review"}
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: "16px", maxWidth: "600px", margin: "0 auto", lineHeight: "1.6" }}>
            {isSuspended 
              ? "Your institutional blockchain permissions have been permanently revoked by the Global Trust Council for suspicious activity."
              : "The AuthenX Trust Council and GTEC are cryptographically verifying the institutional charter and registration documents you submitted. Your dashboard blockchain tools will unlock instantly upon approval."}
          </p>
        </div>
      );
    }

    const isAuthorizedAdmin = user?.role === "superadmin";
    const isGtec = user?.role === "gtec";
    
    switch (activePage) {
      case "certificate": return <CertificateManagement user={user} />; 
      case "create-user": 
        return isAdmin ? <CreateUser user={user} /> : <DashboardHome user={user} isSuperAdmin={isAuthorizedAdmin} />;
      case "upload": return <UploadPage user={user} />; 
      case "logs": return <VerificationLogs user={user} isSuperAdmin={isAuthorizedAdmin} />;
      case "settings": return <AccountSettings user={user} setUser={setUser} />;
      case "trust-council": return isAuthorizedAdmin ? <TrustCouncil user={user} /> : <DashboardHome user={user} isSuperAdmin={isAuthorizedAdmin} />;
      case "gtec-portal": return isGtec ? <GtecPortal user={user} /> : <DashboardHome user={user} isSuperAdmin={isAuthorizedAdmin} />;
      default: 
        if (isGtec) return <GtecPortal user={user} />;
        return <DashboardHome user={user} isSuperAdmin={isAuthorizedAdmin} />; 
    }
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-container">
        
        {/* Mobile Overlay */}
        {isMobileMenuOpen && (
          <div className="mobile-sidebar-overlay" onClick={() => setIsMobileMenuOpen(false)}></div>
        )}

        <div className={`sidebar ${isMobileMenuOpen ? "open" : ""}`}>
          <div style={{ textAlign: "center", marginBottom: "15px", position: "relative" }}>
            {user?.role === "superadmin" || user?.role === "gtec" ? (
               <div style={{ width: "90px", height: "90px", borderRadius: "50%", background: "rgba(37, 99, 235, 0.08)", border: "2px solid var(--primary)", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", color: "var(--primary)", boxShadow: "0 8px 16px rgba(0,0,0,0.3)", margin: "0 auto", marginBottom: "10px" }}>
                  <ShieldAlert size={32} />
                  <span style={{ fontSize: "12px", fontWeight: "bold", marginTop: "6px", color: "var(--text-main)", textAlign: "center", padding: "0 5px", lineHeight: "1.1" }}>
                    {user?.role === "superadmin" ? "AuthenX" : "GTEC"}
                  </span>
               </div>
            ) : (
               <label style={{ cursor: isAdmin ? "pointer" : "default", display: "inline-block" }}>
                 {schoolLogo ? (
                   <img src={`https://gateway.pinata.cloud/ipfs/${schoolLogo}`} alt="School Logo" title={isAdmin ? "Click to change logo" : ""} style={{ width: "90px", height: "90px", borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(255,255,255,0.2)", marginBottom: "10px", boxShadow: "0 8px 16px rgba(0,0,0,0.3)", opacity: logoUploading ? 0.5 : 1 }} />
                 ) : (
                   <div style={{ width: "90px", height: "90px", borderRadius: "50%", background: "rgba(37, 99, 235, 0.08)", border: "2px dashed var(--primary)", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", color: "var(--primary)", marginBottom: "10px", margin: "0 auto", opacity: logoUploading ? 0.5 : 1 }}>
                     <span style={{ fontSize: "24px", marginBottom: "2px", fontWeight: "bold" }}>+</span>
                     <span style={{ fontSize: "11px", fontWeight: "bold", textAlign: "center", padding: "0 5px", lineHeight: "1.1" }}>{logoUploading ? "..." : "Logo"}</span>
                   </div>
                 )}
                 {isAdmin && <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleSidebarLogoUpload} disabled={logoUploading} />}
               </label>
            )}
          </div>
          <div style={{ padding: "0 20px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
            {user.profilePic ? (
               <img src={`https://gateway.pinata.cloud/ipfs/${user.profilePic}`} alt="Profile" style={{ width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
            ) : user.photoURL ? (
               <img src={user.photoURL} alt="Profile" style={{ width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} referrerPolicy="no-referrer" />
            ) : (
               <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "var(--primary)", display: "flex", justifyContent: "center", alignItems: "center", fontWeight: "bold", fontSize: "18px", color: "white", flexShrink: 0 }}>
                 {user.fullName ? user.fullName[0].toUpperCase() : "U"}
               </div>
            )}
            <div>
              <p style={{ fontSize: "14px", fontWeight: "bold", margin: 0 }}>{user.fullName}</p>
              <p style={{ fontSize: "12px", color: "var(--primary)", textTransform: "capitalize", margin: 0 }}>Role: {user.role || "None"}</p>
            </div>
          </div>
          <ul style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            
            {user?.role === "superadmin" ? (
               <>
                 <li className={activePage === "dashboard" ? "active" : ""} onClick={() => { setActivePage("dashboard"); setIsMobileMenuOpen(false); }}>
                   <Globe size={18} style={{ marginRight: "10px" }} /> Global Dashboard
                 </li>
                 <li className={activePage === "trust-council" ? "active" : ""} onClick={() => { setActivePage("trust-council"); setIsMobileMenuOpen(false); }}>
                   <ShieldAlert size={18} style={{ marginRight: "10px" }} /> Trust Council
                 </li>
                 <li className={activePage === "logs" ? "active" : ""} onClick={() => { setActivePage("logs"); setIsMobileMenuOpen(false); }}>
                   <FileText size={18} style={{ marginRight: "10px" }} /> Global Logs
                 </li>
                 <li className={activePage === "settings" ? "active" : ""} onClick={() => { setActivePage("settings"); setIsMobileMenuOpen(false); }}>
                   <Settings size={18} style={{ marginRight: "10px" }} /> System Settings
                 </li>
                 <li className={activePage === "certificate" ? "active" : ""} onClick={() => { setActivePage("certificate"); setIsMobileMenuOpen(false); }}>
                   <ShieldCheck size={18} style={{ marginRight: "10px" }} /> Verify Certificate
                 </li>
               </>
            ) : user?.role === "gtec" ? (
               <>
                 <li className={activePage === "dashboard" || activePage === "gtec-portal" ? "active" : ""} onClick={() => { setActivePage("gtec-portal"); setIsMobileMenuOpen(false); }}>
                   <ShieldAlert size={18} style={{ marginRight: "10px" }} /> GTEC Approvals
                 </li>
                 <li className={activePage === "certificate" ? "active" : ""} onClick={() => { setActivePage("certificate"); setIsMobileMenuOpen(false); }}>
                   <ShieldCheck size={18} style={{ marginRight: "10px" }} /> Verify Certificate
                 </li>
               </>
            ) : (
               <>
                 <li className={activePage === "dashboard" ? "active" : ""} onClick={() => { setActivePage("dashboard"); setIsMobileMenuOpen(false); }}>
                   <Home size={18} style={{ marginRight: "10px" }} /> Overview
                 </li>
                  <li className={activePage === "certificate" ? "active" : ""} onClick={() => { setActivePage("certificate"); setIsMobileMenuOpen(false); }}>
                   <ShieldCheck size={18} style={{ marginRight: "10px" }} /> Verify Certificate
                 </li>
                 {isAdmin && (
                   <li className={activePage === "create-user" ? "active" : ""} onClick={() => { setActivePage("create-user"); setIsMobileMenuOpen(false); }}>
                     <Users size={18} style={{ marginRight: "10px" }} /> Staff Directory
                   </li>
                 )}
                 <li className={activePage === "upload" ? "active" : ""} onClick={() => { setActivePage("upload"); setIsMobileMenuOpen(false); }}>
                   <UploadCloud size={18} style={{ marginRight: "10px" }} /> Issue Certificate
                 </li>
                 <li className={activePage === "logs" ? "active" : ""} onClick={() => { setActivePage("logs"); setIsMobileMenuOpen(false); }}>
                   <FileText size={18} style={{ marginRight: "10px" }} /> Activity Logs
                 </li>
                 <li className={activePage === "settings" ? "active" : ""} onClick={() => { setActivePage("settings"); setIsMobileMenuOpen(false); }}>
                   <Settings size={18} style={{ marginRight: "10px" }} /> Account Settings
                 </li>
               </>
            )}

            <hr style={{ border: "none", borderTop: "1px solid var(--card-border)", margin: "15px 0" }} />
            
            <li style={{ color: '#ff4757', cursor: 'pointer', fontWeight: 'bold', display: "flex", alignItems: "center" }} onClick={() => { sessionStorage.removeItem("user"); navigate("/"); window.location.reload(); }}>
               <LogOut size={18} style={{ marginRight: "10px" }} /> Sign Out
            </li>
          </ul>
        </div>
        <div className="main">{renderContent()}</div>
      </div>
    </div>
  );
}

export default Dashboard;