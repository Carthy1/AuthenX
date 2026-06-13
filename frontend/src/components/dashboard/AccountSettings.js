import React, { useState } from "react";
import { db } from "../../firebase"; 
import { 
  updateDoc,
  doc
} from "firebase/firestore";
import { 
  Settings,
  User,
  ShieldCheck,
  Server,
  Lock
} from "lucide-react";

const AccountSettings = ({ user, setUser }) => {
  const [fullName, setFullName] = useState(user.fullName || "");
  const [profilePicFile, setProfilePicFile] = useState(null);
  const [status, setStatus] = useState("");

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setStatus("Updating profile...");
    try {
      let finalPicHash = user.profilePic || "";

      if (profilePicFile) {
        setStatus("Uploading secure credentials to IPFS...");
        const formData = new FormData();
        formData.append("file", profilePicFile);
        const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
          method: "POST",
          headers: {
            pinata_api_key: process.env.REACT_APP_PINATA_API_KEY,
            pinata_secret_api_key: process.env.REACT_APP_PINATA_SECRET_API_KEY,
          },
          body: formData,
        });
        const resData = await res.json();
        finalPicHash = resData.IpfsHash;
      }

      if (user.uid) {
        await updateDoc(doc(db, "users", user.uid), { fullName, profilePic: finalPicHash });
      }
      const updatedUser = { ...user, fullName, profilePic: finalPicHash };
      sessionStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      setStatus("Cryptographic profile updated successfully!");
      setProfilePicFile(null);
    } catch (err) {
      console.error(err);
      setStatus("Failed to enforce profile update.");
    }
  };

  return (
    <div>
      <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: "25px" }}><Settings size={28} color="var(--primary)" /> System Preferences</h2>
      
      <div className="grid-1-1" style={{ marginTop: "10px" }}>
        
        {/* Personal Details Card */}
        <div className="section-card">
          <h4 style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid var(--card-border)', paddingBottom: '15px', marginBottom: '20px' }}>
            <User size={20} color="var(--primary)"/> Personal Identity Map
          </h4>
          <p style={{ color: status.includes("Failed") ? "red" : "green", fontWeight: "bold", fontSize: "13px" }}>{status}</p>
          <form className="user-form" onSubmit={handleUpdateProfile}>
            <label style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: "600", display: 'flex', alignItems: 'center', gap: '6px', marginBottom: "8px" }}>
              Full Legal Name
            </label>
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} required style={{ marginBottom: "20px" }} />
            
            <label style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: "600", display: 'flex', alignItems: 'center', gap: '6px', marginBottom: "8px" }}>
               Avatar Blueprint (Web3 Profile)
            </label>
            <input type="file" accept="image/*" onChange={(e) => setProfilePicFile(e.target.files[0])} style={{ marginBottom: "20px" }} />
            
            <label style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: "600", display: 'flex', alignItems: 'center', gap: '6px', marginBottom: "8px" }}>
               Clearance Role (View Only)
            </label>
            <div style={{ padding: "14px", background: "rgba(255,255,255,0.02)", borderRadius: "8px", border: "1px solid var(--card-border)", display: "flex", justifyContent: "space-between" }}>
              <span style={{color: "var(--text-muted)", textTransform: "capitalize"}}>{user.role || "None"}</span>
              <ShieldCheck size={18} color="var(--primary)" />
            </div>

            <button type="submit" className="submit-btn" style={{ marginTop: "30px", width: "100%", padding: "14px", fontSize: "15px" }}>Enforce Profile Protocol</button>
          </form>
        </div>

        {/* System Settings & Node Configuration Card */}
        <div style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
          
          <div className="section-card" style={{ padding: "24px" }}>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid var(--card-border)', paddingBottom: '15px', marginBottom: '20px' }}>
              <Server size={20} color="#38bdf8"/> Active Node Routing
            </h4>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px", fontSize: "15px" }}>
              <span style={{ color: "var(--text-muted)" }}>Blockchain Network</span>
              <span style={{ fontWeight: "600" }}>Hardhat Localhost</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px", fontSize: "15px" }}>
              <span style={{ color: "var(--text-muted)" }}>IPFS Dist. Provider</span>
              <span style={{ fontWeight: "600" }}>Pinata Dedicated</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "15px", alignItems: "center" }}>
              <span style={{ color: "var(--text-muted)" }}>Smart Contract State</span>
              <span className="badge badge-success" style={{ fontSize: "10px" }}>Synchronized</span>
            </div>
          </div>

          <div className="section-card" style={{ padding: "24px" }}>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid var(--card-border)', paddingBottom: '15px', marginBottom: '20px' }}>
              <Lock size={20} color="#f1c40f"/> Security & Preferences
            </h4>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <div>
                <p style={{ margin: 0, fontSize: "15px", fontWeight: "600" }}>Two-Factor Authentication</p>
                <p style={{ margin: "5px 0 0 0", fontSize: "12px", color: "var(--text-muted)" }}>Require cryptographic 2FA on login.</p>
              </div>
              <div style={{ width: "44px", height: "24px", background: "var(--primary)", borderRadius: "20px", position: "relative", cursor: "pointer", flexShrink: 0 }}>
                <div style={{ width: "20px", height: "20px", background: "white", borderRadius: "50%", position: "absolute", top: "2px", right: "2px" }}></div>
              </div>
            </div>
            
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", marginTop: "10px" }}>
              <div>
                <p style={{ margin: 0, fontSize: "15px", fontWeight: "600" }}>Activity Notifications</p>
                <p style={{ margin: "5px 0 0 0", fontSize: "12px", color: "var(--text-muted)" }}>Receive alerts on massive batch mints.</p>
              </div>
              <div style={{ width: "44px", height: "24px", background: "var(--primary)", borderRadius: "20px", position: "relative", cursor: "pointer", flexShrink: 0 }}>
                <div style={{ width: "20px", height: "20px", background: "white", borderRadius: "50%", position: "absolute", top: "2px", right: "2px" }}></div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default AccountSettings;
