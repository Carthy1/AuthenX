import React, { useState, useEffect } from "react";
import { auth, db } from "../../firebase"; 
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  updateDoc,
  doc
} from "firebase/firestore";
import { sendPasswordResetEmail } from "firebase/auth";
import { 
  ShieldCheck, 
  XCircle, 
  Clock, 
  Search, 
  Database, 
  Key, 
  ShieldAlert,
  CheckCircle
} from "lucide-react";

const TrustCouncil = ({ user }) => {
  const [pendingApps, setPendingApps] = useState([]);
  const [activeApps, setActiveApps] = useState([]);
  const [suspendedApps, setSuspendedApps] = useState([]);
  const [activeTab, setActiveTab] = useState("pending");
  const [searchTerm, setSearchTerm] = useState("");
  
  const fetchTrustCouncilData = async () => {
    try {
      // SuperAdmin pending queue only shows institutions already accredited by GTEC
      const qPending = query(collection(db, "users"), where("role", "==", "pending"), where("status", "==", "gtec_approved"));
      const pSnap = await getDocs(qPending);
      setPendingApps(pSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      const qActive = query(collection(db, "users"), where("role", "==", "admin"), where("status", "==", "active"));
      const aSnap = await getDocs(qActive);
      setActiveApps(aSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      
      const qSuspended = query(collection(db, "users"), where("role", "==", "suspended"), where("status", "==", "suspended"));
      const sSnap = await getDocs(qSuspended);
      setSuspendedApps(sSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchTrustCouncilData(); }, []);

  const handleApprove = async (appId) => {
    if (!window.confirm("Approve this institution to mint certificates?")) return;
    try {
      await updateDoc(doc(db, "users", appId), { role: "admin", status: "active" });
      fetchTrustCouncilData();
    } catch (err) { console.error(err); }
  };

  const handleReject = async (appId) => {
    if (!window.confirm("Permanently reject this application?")) return;
    try {
      await updateDoc(doc(db, "users", appId), { role: "rejected", status: "rejected" });
      fetchTrustCouncilData();
    } catch (err) { console.error(err); }
  };

  const handleResetPassword = async (email) => {
    if (!window.confirm(`Send an official platform password reset link to ${email}?`)) return;
    try {
      await sendPasswordResetEmail(auth, email);
      alert(`✅ Password reset link was successfully dispatched to ${email}.`);
    } catch (err) {
      console.error(err);
      alert("❌ Failed to send reset email.");
    }
  };

  const handleSuspend = async (appId, institution) => {
    if (!window.confirm("CRITICAL: Immediately suspend this institution's blockchain access?")) return;
    try {
      await updateDoc(doc(db, "users", appId), { role: "suspended", status: "suspended" });

      if (institution) {
          const qStaff = query(collection(db, "users"), where("institution", "==", institution));
          const staffSnap = await getDocs(qStaff);
          const updates = staffSnap.docs.map(staffDoc => {
             if (staffDoc.id !== appId) {
                 return updateDoc(doc(db, "users", staffDoc.id), { status: "suspended" });
             }
             return Promise.resolve();
          });
          await Promise.all(updates);
      }
      fetchTrustCouncilData();
    } catch (err) { console.error(err); }
  };

  const handleReactivate = async (appId, institution) => {
    if (!window.confirm("Restore this institution's blockchain access?")) return;
    try {
      await updateDoc(doc(db, "users", appId), { role: "admin", status: "active" });

      if (institution) {
          const qStaff = query(collection(db, "users"), where("institution", "==", institution));
          const staffSnap = await getDocs(qStaff);
          const updates = staffSnap.docs.map(staffDoc => {
             if (staffDoc.id !== appId) {
                 return updateDoc(doc(db, "users", staffDoc.id), { status: "active" });
             }
             return Promise.resolve();
          });
          await Promise.all(updates);
      }
      fetchTrustCouncilData();
    } catch (err) { console.error(err); }
  };

  const filterData = (list) => {
    if (!searchTerm) return list;
    return list.filter(app => 
      (app.institution && app.institution.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (app.email && app.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (app.registrationNumber && app.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  };

  const displayedData = 
    activeTab === "pending" ? filterData(pendingApps) :
    activeTab === "active" ? filterData(activeApps) :
    filterData(suspendedApps);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
        <h2 style={{ display: "flex", alignItems: "center", gap: "8px", margin: 0, fontSize: "20px" }}><ShieldAlert color="#e74c3c" size={22} /> Target Governance (SuperAdmin)</h2>
        <div style={{ position: "relative", width: "260px" }}>
          <Search size={16} color="var(--text-muted)" style={{ position: "absolute", left: "12px", top: "12px" }} />
          <input 
            type="text" 
            placeholder="Search institution or ID..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: "100%", padding: "10px 12px 10px 36px", borderRadius: "10px", border: "1px solid var(--card-border)", background: "var(--card-bg)", color: "var(--text-main)", outline: "none", fontSize: "13.5px" }}
          />
        </div>
      </div>
      
      {/* Metrics Header */}
      <div className="grid-3" style={{ marginBottom: "15px" }}>
        <div className="section-card metric-card" style={{ padding: "10px 14px", display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ background: "rgba(243, 156, 18, 0.1)", padding: "8px", borderRadius: "8px", color: "var(--warning)", display: "flex", alignItems: "center" }}><Clock size={20} /></div>
          <div><p style={{ margin: 0, fontSize: "10px", color: "var(--text-muted)", fontWeight: "600", textTransform: "uppercase" }}>GTEC Accredited (Pending Node)</p>
          <h3 style={{ margin: "2px 0 0 0", fontSize: "20px" }}>{pendingApps.length}</h3></div>
        </div>
        <div className="section-card metric-card" style={{ padding: "10px 14px", display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ background: "rgba(46, 204, 113, 0.1)", padding: "8px", borderRadius: "8px", color: "var(--success)", display: "flex", alignItems: "center" }}><ShieldCheck size={20} /></div>
          <div><p style={{ margin: 0, fontSize: "10px", color: "var(--text-muted)", fontWeight: "600", textTransform: "uppercase" }}>Active Blockchain Nodes</p>
          <h3 style={{ margin: "2px 0 0 0", fontSize: "20px" }}>{activeApps.length}</h3></div>
        </div>
        <div className="section-card metric-card" style={{ padding: "10px 14px", display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ background: "rgba(231, 76, 60, 0.1)", padding: "8px", borderRadius: "8px", color: "var(--danger, #e74c3c)", display: "flex", alignItems: "center" }}><XCircle size={20} /></div>
          <div><p style={{ margin: 0, fontSize: "10px", color: "var(--text-muted)", fontWeight: "600", textTransform: "uppercase" }}>Suspended Ops</p>
          <h3 style={{ margin: "2px 0 0 0", fontSize: "20px" }}>{suspendedApps.length}</h3></div>
        </div>
      </div>

      <div className="section-card" style={{ padding: "0", overflow: "hidden" }}>
        {/* Modern Tabs */}
        <div style={{ display: "flex", borderBottom: "1px solid var(--card-border)", background: "rgba(255, 255, 255, 0.02)" }}>
           <button className={`tab-btn ${activeTab === "pending" ? "active" : ""}`} onClick={() => setActiveTab("pending")}>
             Pending Activations {pendingApps.length > 0 && <span className="tab-badge warning">{pendingApps.length}</span>}
           </button>
           <button className={`tab-btn ${activeTab === "active" ? "active" : ""}`} onClick={() => setActiveTab("active")}>
             Active Universities
           </button>
           <button className={`tab-btn ${activeTab === "suspended" ? "active" : ""}`} onClick={() => setActiveTab("suspended")}>
             Suspended Terminals {suspendedApps.length > 0 && <span className="tab-badge danger">{suspendedApps.length}</span>}
           </button>
        </div>

        <div style={{ padding: "20px", overflowX: "auto" }}>
          <table className="data-table modern-hover-table" style={{ margin: 0 }}>
            <thead>
              <tr>
                <th>Network Node</th>
                <th>Administrator Vector</th>
                <th>Registration ID</th>
                <th>Evidence Artifacts</th>
                <th style={{ textAlign: "right" }}>Governance Action</th>
              </tr>
            </thead>
            <tbody>
              {displayedData.map(app => (
                <tr key={app.id}>
                  <td>
                     <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{ width: "36px", height: "36px", background: "var(--primary)", borderRadius: "8px", display: "flex", justifyContent: "center", alignItems: "center", color: "white", fontWeight: "bold" }}>
                           {app.institution ? app.institution[0].toUpperCase() : "I"}
                        </div>
                        <strong style={{ fontSize: "15px" }}>{app.institution}</strong>
                     </div>
                  </td>
                  <td>
                     <p style={{ margin: 0, fontWeight: "600" }}>{app.fullName}</p>
                     <p style={{ margin: 0, fontSize: "12px", color: "var(--text-muted)" }}>{app.email}</p>
                  </td>
                  <td><span style={{ fontFamily: "monospace", color: "var(--text-muted)" }}>{app.registrationNumber || "N/A"}</span></td>
                  <td>
                    {app.accreditationHash ? (
                      <a href={`https://gateway.pinata.cloud/ipfs/${app.accreditationHash}`} target="_blank" rel="noreferrer" download className="evidence-link">
                         <Database size={14} style={{ marginRight: "6px" }}/> Review Accreditation PDF
                      </a>
                    ) : <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>Missing</span>}
                  </td>
                  <td style={{ textAlign: "right", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                    {activeTab === "pending" && (
                      <>
                        <button onClick={() => handleApprove(app.id)} className="icon-btn btn-success" title="Approve & Activate Blockchain"><CheckCircle size={18} /></button>
                        <button onClick={() => handleReject(app.id)} className="icon-btn btn-danger" title="Reject Instantly"><XCircle size={18} /></button>
                      </>
                    )}
                    {activeTab === "active" && (
                      <>
                        <button onClick={() => handleResetPassword(app.email)} className="icon-btn btn-warning" title="Reset Operator Keys"><Key size={18} /></button>
                        <button onClick={() => handleSuspend(app.id, app.institution)} className="icon-btn btn-danger" title="Force Suspension"><ShieldAlert size={18} /></button>
                      </>
                    )}
                    {activeTab === "suspended" && (
                      <>
                        <button onClick={() => handleReactivate(app.id, app.institution)} className="icon-btn btn-success" title="Restore Clearance"><CheckCircle size={18} /></button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {displayedData.length === 0 && (
                <tr>
                   <td colSpan="5" style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                     <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
                       <Search size={32} opacity={0.3} />
                       No records found for "{searchTerm}" in this state.
                     </div>
                   </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TrustCouncil;
