import React, { useEffect, useState } from "react";
import { db } from "../../firebase"; 
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy,
  limit
} from "firebase/firestore";
import { 
  FileText,
  Search,
  CheckCircle,
  XCircle
} from "lucide-react";

const VerificationLogs = ({ user, isSuperAdmin }) => {
  const [logs, setLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchLogs = async () => {
      // OPTIMIZED: Apply limit(100) to capping query results
      const q = isSuperAdmin 
        ? query(collection(db, "verification_logs"), orderBy("timestamp", "desc"), limit(100))
        : query(collection(db, "verification_logs"), where("school", "==", user.institution), orderBy("timestamp", "desc"), limit(100));
        
      const querySnapshot = await getDocs(q);
      setLogs(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    fetchLogs();
  }, [user.institution, isSuperAdmin]);

  const displayedLogs = searchTerm 
    ? logs.filter(l => 
        (l.studentName && l.studentName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (l.certId && l.certId.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (l.school && l.school.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : logs;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px" }}>
        <h2 style={{ display: "flex", alignItems: "center", gap: "10px", margin: 0 }}><FileText color="var(--primary)" size={28} /> {isSuperAdmin ? "Global Activity Logs" : "Activity Logs"}</h2>
        <div style={{ position: "relative", width: "300px" }}>
          <Search size={18} color="var(--text-muted)" style={{ position: "absolute", left: "15px", top: "14px" }} />
          <input 
            type="text" 
            placeholder="Search student or ID..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: "100%", padding: "12px 15px 12px 42px", borderRadius: "12px", border: "1px solid var(--card-border)", background: "var(--card-bg)", color: "var(--text-main)", outline: "none", fontSize: "14px" }}
          />
        </div>
      </div>
      
      <div className="section-card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "20px", overflowX: "auto" }}>
          <table className="data-table modern-hover-table" style={{ margin: 0 }}>
            <thead>
              <tr>
                <th>Timestamp</th>
                {isSuperAdmin && <th>Institution</th>}
                <th>Certificate ID</th>
                <th>Student Name</th>
                <th>Verified By</th>
                <th style={{ textAlign: "right" }}>Result</th>
              </tr>
            </thead>
            <tbody>
              {displayedLogs.map(log => (
                <tr key={log.id}>
                  <td>
                    <p style={{ margin: 0, fontWeight: "600", fontSize: "14px" }}>{log.timestamp?.toDate().toLocaleDateString()}</p>
                    <p style={{ margin: 0, fontSize: "11px", color: "var(--text-muted)" }}>{log.timestamp?.toDate().toLocaleTimeString()}</p>
                  </td>
                  {isSuperAdmin && <td><span style={{ fontWeight: "bold", color: "var(--primary)" }}>{log.school}</span></td>}
                  <td><span style={{ fontFamily: "monospace", color: "var(--text-muted)", fontSize: "13px" }}>{log.certId}</span></td>
                  <td><strong>{log.studentName}</strong></td>
                  <td>{log.verifiedBy}</td>
                  <td style={{ textAlign: "right" }}>
                    <span className="badge" style={{ background: log.result === "Authentic" ? "rgba(46, 204, 113, 0.15)" : "rgba(231, 76, 60, 0.15)", color: log.result === "Authentic" ? "#2ecc71" : "#e74c3c" }}>
                      {log.result === "Authentic" ? <CheckCircle size={12} style={{marginRight: "4px"}}/> : <XCircle size={12} style={{marginRight: "4px"}}/>}
                      {log.result}
                    </span>
                  </td>
                </tr>
              ))}
              {displayedLogs.length === 0 && (
                <tr>
                   <td colSpan="6" style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                     <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
                       <Search size={32} opacity={0.3} />
                       No logs found.
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

export default VerificationLogs;
