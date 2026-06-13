import React, { useEffect, useState } from "react";
import { auth, db } from "../../firebase"; 
import { 
  collection, 
  query, 
  where, 
  setDoc,
  updateDoc,
  doc,
  serverTimestamp,
  onSnapshot
} from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { 
  ShieldAlert,
  Key,
  Database,
  CheckCircle,
  XCircle,
  Clock
} from "lucide-react";

const CreateUser = ({ user }) => {
  const [staffName, setStaffName] = useState("");
  const [staffEmail, setStaffEmail] = useState("");
  const [staffPassword, setStaffPassword] = useState("");
  const [staffRole, setStaffRole] = useState("staff");
  const [staffList, setStaffList] = useState([]);
  const [status, setStatus] = useState("");

  useEffect(() => {
    const q = query(collection(db, "users"), where("institution", "==", user.institution));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setStaffList(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(m => m.email !== user.email));
    });
    return () => unsubscribe();
  }, [user.institution, user.email]);

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    setStatus("Registering staff...");
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, staffEmail, staffPassword);
      await setDoc(doc(db, "users", userCredential.user.uid), {
        fullName: staffName,
        email: staffEmail,
        institution: user.institution,
        role: staffRole,
        addedBy: user.fullName,
        createdAt: serverTimestamp()
      });
      setStatus("Staff registered successfully!");
      setStaffName(""); setStaffEmail(""); setStaffPassword("");
    } catch (error) { setStatus(`Error: ${error.message}`); }
  };

  const handleRevokeStaff = async (staffId) => {
    if (!window.confirm("Are you sure you want to revoke this operator's access?")) return;
    try {
      await updateDoc(doc(db, "users", staffId), { status: "suspended" });
    } catch (err) { console.error(err); }
  };

  const handleRestoreStaff = async (staffId) => {
    if (!window.confirm("Are you sure you want to restore this operator's access?")) return;
    try {
      await updateDoc(doc(db, "users", staffId), { status: "active" });
    } catch (err) { console.error(err); }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
        <h2 style={{ display: "flex", alignItems: "center", gap: "8px", margin: 0, fontSize: "20px" }}><ShieldAlert color="var(--primary)" size={24} /> {user.institution} Team Roster</h2>
      </div>

      <div className="grid-1-2">
        
        {/* Registration Form */}
        <div className="section-card" style={{ alignSelf: "start", padding: "16px" }}>
          <h4 style={{ margin: "0 0 15px 0", fontSize: "14px", display: "flex", alignItems: "center", gap: "8px" }}><Key size={16} color="var(--accent)" /> Provision Operator</h4>
          
          <form onSubmit={handleCreateStaff} className="user-form" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div>
              <label style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: "600", marginBottom: "3px", display: "block" }}>Full Name</label>
              <input placeholder="Operator Name" value={staffName} onChange={(e) => setStaffName(e.target.value)} required style={{ padding: "10px 12px" }} />
            </div>
            <div>
              <label style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: "600", marginBottom: "3px", display: "block" }}>Secured Email</label>
              <input type="email" placeholder="email@institution.edu" value={staffEmail} onChange={(e) => setStaffEmail(e.target.value)} required style={{ padding: "10px 12px" }} />
            </div>
            <div>
              <label style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: "600", marginBottom: "3px", display: "block" }}>Initial Access Key (Password)</label>
              <input type="password" placeholder="Passphrase" value={staffPassword} onChange={(e) => setStaffPassword(e.target.value)} required style={{ padding: "10px 12px" }} />
            </div>
            <div>
              <label style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: "600", marginBottom: "3px", display: "block" }}>Clearance Level</label>
              <select value={staffRole} onChange={(e) => setStaffRole(e.target.value)} style={{ padding: "10px 12px" }}>
                <option value="staff">Staff (Verify Only)</option>
                <option value="registrar">Registrar (Mint & Verify)</option>
              </select>
            </div>
            <button type="submit" className="main-btn" style={{ marginTop: "5px", width: "100%", padding: "10px" }}>Cryptographic Provision</button>
          </form>
          {status && <div style={{ marginTop: "10px", padding: "8px", borderRadius: "8px", background: status.includes("successfully") ? "rgba(46, 204, 113, 0.1)" : status.includes("Registering") ? "rgba(243, 156, 18, 0.1)" : "rgba(231, 76, 60, 0.1)", color: status.includes("successfully") ? "#2ecc71" : status.includes("Registering") ? "#f39c12" : "#e74c3c", fontSize: "13px", fontWeight: "600", textAlign: "center" }}>{status}</div>}
        </div>

        {/* Directory Table */}
        <div className="section-card" style={{ padding: 0, overflow: "hidden" }}>
           <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--card-border)" }}>
             <h4 style={{ margin: 0, fontSize: "14px", display: "flex", alignItems: "center", gap: "8px" }}><Database size={16} color="var(--primary)" /> Authorized Directory</h4>
           </div>
           
           <div style={{ padding: "12px 16px", overflowX: "auto" }}>
             <table className="data-table modern-hover-table" style={{ margin: 0 }}>
               <thead>
                 <tr>
                   <th>Identity Vector</th>
                   <th>Access Level</th>
                   <th style={{textAlign: "right"}}>Status</th>
                 </tr>
               </thead>
               <tbody>
                 {staffList.map(m => (
                   <tr key={m.id}>
                     <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <strong style={{ fontSize: "15px" }}>{m.fullName}</strong>
                          {m.isOnline && (
                            <span style={{ display: "inline-block", width: "8px", height: "8px", background: "var(--success)", borderRadius: "50%", boxShadow: "0 0 8px var(--success)" }} title="Online Now"></span>
                          )}
                        </div>
                        <p style={{ margin: 0, fontSize: "12px", color: "var(--text-muted)" }}>{m.email}</p>
                     </td>
                     <td>
                        <span className={`badge ${m.role.trim().toLowerCase() === 'admin' || m.role.trim().toLowerCase() === 'registrar' ? 'badge-admin' : 'badge-staff'}`}>
                          {m.role}
                        </span>
                     </td>
                     <td style={{ textAlign: "right", display: "flex", justifyContent: "flex-end", alignItems: "center", height: "100%" }}>
                        {m.status === "suspended" ? (
                          <>
                            <span className="badge badge-danger" style={{marginRight: "10px"}}><XCircle size={12} style={{marginRight: "4px"}}/> Revoked</span>
                            <button onClick={() => handleRestoreStaff(m.id)} className="icon-btn btn-success" title="Restore Access"><CheckCircle size={18} /></button>
                          </>
                        ) : (
                          <>
                            {m.isOnline ? (
                              <span className="badge badge-success" style={{marginRight: "10px", border: "1px solid rgba(16, 185, 129, 0.5)"}}>
                                <span style={{ display: "inline-block", width: "8px", height: "8px", background: "var(--success)", borderRadius: "50%", boxShadow: "0 0 8px var(--success)", marginRight: "6px" }}></span> 
                                Online
                              </span>
                            ) : (
                              <span className="badge" style={{marginRight: "10px", background: "rgba(255,255,255,0.05)", color: "var(--text-muted)", border: "1px solid var(--card-border)"}}>
                                <Clock size={12} style={{marginRight: "4px"}}/> Offline
                              </span>
                            )}
                            <button onClick={() => handleRevokeStaff(m.id)} className="icon-btn btn-danger" title="Revoke Access"><ShieldAlert size={18} /></button>
                          </>
                        )}
                     </td>
                   </tr>
                 ))}
                 {staffList.length === 0 && (
                   <tr>
                     <td colSpan="3" style={{ textAlign: "center", padding: "30px", color: "var(--text-muted)" }}>
                        No operators provisioned yet.
                     </td>
                   </tr>
                 )}
               </tbody>
             </table>
           </div>
        </div>

      </div>
    </div>
  );
};

export default CreateUser;
