import React, { useState, useEffect } from "react";
import { db } from "../../firebase"; 
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  updateDoc,
  doc
} from "firebase/firestore";
import { 
  ShieldCheck, 
  XCircle, 
  Clock, 
  Search, 
  Database, 
  ShieldAlert,
  CheckCircle
} from "lucide-react";

const GtecPortal = ({ user }) => {
  const [pendingApps, setPendingApps] = useState([]);
  const [accreditedApps, setAccreditedApps] = useState([]);
  const [suspendedApps, setSuspendedApps] = useState([]);
  const [activeTab, setActiveTab] = useState("pending");
  const [searchTerm, setSearchTerm] = useState("");
  
  const fetchGtecData = async () => {
    try {
      const qUsers = query(collection(db, "users"), where("role", "==", "pending"));
      const uSnap = await getDocs(qUsers);
      const allUsers = uSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      const pendingGtec = allUsers.filter(u => !u.status || u.status === "pending_gtec");
      const accreditedGtec = allUsers.filter(u => u.status === "gtec_approved");
      const rejectedGtec = allUsers.filter(u => u.status === "rejected" || u.role === "rejected");

      setPendingApps(pendingGtec);
      setAccreditedApps(accreditedGtec);
      setSuspendedApps(rejectedGtec);
    } catch (err) { console.error("GTEC Fetch Error:", err); }
  };

  useEffect(() => { fetchGtecData(); }, []);

  const handleAccredit = async (appId) => {
    if (!window.confirm("Formally accredit this university?")) return;
    try {
      await updateDoc(doc(db, "users", appId), { status: "gtec_approved" });
      fetchGtecData();
    } catch (err) { console.error(err); }
  };

  const handleDecline = async (appId) => {
    if (!window.confirm("Formally decline GTEC accreditation for this institution?")) return;
    try {
      await updateDoc(doc(db, "users", appId), { status: "rejected", role: "rejected" });
      fetchGtecData();
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
    activeTab === "accredited" ? filterData(accreditedApps) :
    filterData(suspendedApps);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
        <h2 style={{ display: "flex", alignItems: "center", gap: "8px", margin: 0, fontSize: "20px" }}><ShieldAlert color="var(--accent)" size={22} /> GTEC Accreditation Portal</h2>
        <div style={{ position: "relative", width: "260px" }}>
          <Search size={16} color="var(--text-muted)" style={{ position: "absolute", left: "12px", top: "12px" }} />
          <input 
            type="text" 
            placeholder="Search institution..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: "100%", padding: "10px 12px 10px 36px", borderRadius: "10px", border: "1px solid var(--card-border)", background: "var(--card-bg)", color: "var(--text-main)", outline: "none", fontSize: "13.5px" }}
          />
        </div>
      </div>
      
      {/* Metrics Header */}
      <div className="grid-3" style={{ marginBottom: "15px" }}>
        <div className="section-card metric-card" style={{ padding: "10px 14px", display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ background: "rgba(217, 119, 6, 0.1)", padding: "8px", borderRadius: "8px", color: "var(--accent)", display: "flex", alignItems: "center" }}><Clock size={20} /></div>
          <div><p style={{ margin: 0, fontSize: "10px", color: "var(--text-muted)", fontWeight: "600", textTransform: "uppercase" }}>Awaiting GTEC Review</p>
          <h3 style={{ margin: "2px 0 0 0", fontSize: "20px" }}>{pendingApps.length}</h3></div>
        </div>
        <div className="section-card metric-card" style={{ padding: "10px 14px", display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ background: "rgba(5, 150, 105, 0.1)", padding: "8px", borderRadius: "8px", color: "var(--success)", display: "flex", alignItems: "center" }}><ShieldCheck size={20} /></div>
          <div><p style={{ margin: 0, fontSize: "10px", color: "var(--text-muted)", fontWeight: "600", textTransform: "uppercase" }}>GTEC Accredited</p>
          <h3 style={{ margin: "2px 0 0 0", fontSize: "20px" }}>{accreditedApps.length}</h3></div>
        </div>
        <div className="section-card metric-card" style={{ padding: "10px 14px", display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ background: "rgba(220, 38, 38, 0.1)", padding: "8px", borderRadius: "8px", color: "var(--danger)", display: "flex", alignItems: "center" }}><XCircle size={20} /></div>
          <div><p style={{ margin: 0, fontSize: "10px", color: "var(--text-muted)", fontWeight: "600", textTransform: "uppercase" }}>Accreditation Declined</p>
          <h3 style={{ margin: "2px 0 0 0", fontSize: "20px" }}>{suspendedApps.length}</h3></div>
        </div>
      </div>

      <div className="section-card" style={{ padding: "0", overflow: "hidden" }}>
        {/* Modern Tabs */}
        <div style={{ display: "flex", borderBottom: "1px solid var(--card-border)", background: "rgba(255, 255, 255, 0.02)" }}>
           <button className={`tab-btn ${activeTab === "pending" ? "active" : ""}`} onClick={() => setActiveTab("pending")}>
             Pending Requests {pendingApps.length > 0 && <span className="tab-badge warning">{pendingApps.length}</span>}
           </button>
           <button className={`tab-btn ${activeTab === "accredited" ? "active" : ""}`} onClick={() => setActiveTab("accredited")}>
             Accredited Universities
           </button>
           <button className={`tab-btn ${activeTab === "suspended" ? "active" : ""}`} onClick={() => setActiveTab("suspended")}>
             Declined / Suspended
           </button>
        </div>

        <div style={{ padding: "20px", overflowX: "auto" }}>
          <table className="data-table modern-hover-table" style={{ margin: 0 }}>
            <thead>
              <tr>
                <th>University Name</th>
                <th>Contact Person</th>
                <th>Accreditation Number</th>
                <th>Accreditation Document</th>
                <th style={{ textAlign: "right" }}>Actions</th>
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
                          <Database size={14} style={{ marginRight: "6px" }}/> View Accreditation PDF
                       </a>
                    ) : <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>Missing Document</span>}
                  </td>
                  <td style={{ textAlign: "right", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                    {activeTab === "pending" && (
                      <>
                        <button onClick={() => handleAccredit(app.id)} className="icon-btn btn-success" title="Approve & Accredit"><CheckCircle size={18} /></button>
                        <button onClick={() => handleDecline(app.id)} className="icon-btn btn-danger" title="Decline Accreditation"><XCircle size={18} /></button>
                      </>
                    )}
                    {activeTab === "accredited" && (
                      <span className="badge badge-success"><CheckCircle size={12} style={{marginRight: "4px"}}/> GTEC Accredited</span>
                    )}
                    {activeTab === "suspended" && (
                      <span className="badge badge-danger" style={{ background: "rgba(220,38,38,0.15)", color: "var(--danger)" }}>Declined / Suspended</span>
                    )}
                  </td>
                </tr>
              ))}
              {displayedData.length === 0 && (
                <tr>
                   <td colSpan="5" style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                     <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
                       <Search size={32} opacity={0.3} />
                       No records in this state.
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

export default GtecPortal;
