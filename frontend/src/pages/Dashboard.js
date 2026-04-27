import React, { useEffect, useState } from "react";
import { getContract } from "../blockchain";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase"; 
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  setDoc,
  getDoc,
  updateDoc,
  doc,
  serverTimestamp,
  getCountFromServer,
  onSnapshot 
} from "firebase/firestore";
import { createUserWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import Papa from "papaparse";
import { 
  Home, 
  ShieldCheck, 
  Users, 
  UploadCloud, 
  FileText, 
  Settings, 
  Activity, 
  Database,
  AlertTriangle,
  ShieldAlert,
  Shield,
  LogOut,
  User,
  Camera,
  Lock,
  Server,
  Globe,
  Key,
  Bell,
  Search, 
  CheckCircle, 
  XCircle, 
  Clock 
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, BarChart, Bar } from 'recharts';

/**
 * SUB-COMPONENT: DashboardHome
 */
const DashboardHome = ({ user, isSuperAdmin }) => {
  const [stats, setStats] = useState({ verifications: 0, registry: 0 });
  const [chartData, setChartData] = useState([]);
  const [pieData, setPieData] = useState([{ name: "Authentic", value: 1 }, { name: "Forged", value: 0 }]);
  const [barData, setBarData] = useState([]);
  const [forgeryCount, setForgeryCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const vQuery = isSuperAdmin ? query(collection(db, "verification_logs")) : query(collection(db, "verification_logs"), where("school", "==", user.institution));
        const vSnapshot = await getDocs(vQuery);
        
        const iQuery = isSuperAdmin ? query(collection(db, "issued_certificates")) : query(collection(db, "issued_certificates"), where("institution", "==", user.institution));
        const iSnapshot = await getDocs(iQuery);

        setStats({
          verifications: vSnapshot.size,
          registry: iSnapshot.size
        });

        // Build Chart Data (Group by date)
        const counts = {};
        
        const processDoc = (doc, type) => {
          const t = doc.data().timestamp;
          if (t && t.toDate) {
            const dateStr = t.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            if (!counts[dateStr]) counts[dateStr] = { date: dateStr, issued: 0, verified: 0 };
            counts[dateStr][type] += 1;
          }
        };

        let authenticCount = 0;
        let forgedCount = 0;

        vSnapshot.docs.forEach(doc => {
          processDoc(doc, 'verified');
          if (doc.data().result === "Authentic") authenticCount++;
          else forgedCount++;
        });

        iSnapshot.docs.forEach(doc => processDoc(doc, 'issued'));

        setForgeryCount(forgedCount);
        
        if (authenticCount > 0 || forgedCount > 0) {
          setPieData([
            { name: "Authentic", value: authenticCount },
            { name: "Forged", value: forgedCount }
          ]);
        }

        // Degree distribution map
        const degreeCounts = {};
        iSnapshot.docs.forEach(doc => {
          let d = doc.data().degree || "Unknown";
          if (d.length > 20) d = d.substring(0, 17) + "..."; // constrain label lengths
          degreeCounts[d] = (degreeCounts[d] || 0) + 1;
        });

        const degreeArr = Object.entries(degreeCounts)
          .map(([name, count]) => ({ name, count }))
          .sort((a,b) => b.count - a.count)
          .slice(0, 5); // strict top 5 rule
        
        if (degreeArr.length === 0) {
          setBarData([{ name: "Awaiting Issues", count: 0 }]);
        } else {
          setBarData(degreeArr);
        }

        const aggregated = Object.values(counts).sort((a,b) => new Date(a.date) - new Date(b.date));
        
        // Mock empty state if brand new
        if (aggregated.length === 0) {
          const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          aggregated.push({ date: today, issued: 0, verified: 0 });
        }
        
        setChartData(aggregated);

      } catch (err) {
        console.error("Stats Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [user.institution, isSuperAdmin]);

  return (
    <>
      <div style={{ marginBottom: "30px" }}>
        <h2 style={{ fontSize: "28px", margin: 0 }}>{isSuperAdmin ? "AuthenX Global Command 🌎" : `Good morning, ${user.fullName}! 👋`}</h2>
        <p style={{ color: "var(--text-muted)", margin: "5px 0 0 0" }}>{isSuperAdmin ? "Aggregating active platform metrics globally across all institutions." : `Here’s what’s happening at ${user.institution} today.`}</p>
      </div>

      <div className="cards">
        <div className="dashboard-card pulse-border">
          <div className="dashboard-card-header">
            <p style={{ margin: 0, color: "var(--text-muted)", fontWeight: "600" }}>Total Verifications</p>
            <div className="dashboard-card-icon"><ShieldCheck size={20} /></div>
          </div>
          {loading ? <div className="shimmer" style={{ width: "70px", height: "40px", marginTop: "15px" }}></div> : <h3 style={{ fontSize: "2.5rem", margin: "15px 0 0 0" }}>{stats.verifications}</h3>}
        </div>
        
        <div className="dashboard-card pulse-border">
          <div className="dashboard-card-header">
            <p style={{ margin: 0, color: "var(--text-muted)", fontWeight: "600" }}>Certificates Issued</p>
            <div className="dashboard-card-icon" style={{ color: "#38bdf8", background: "rgba(56, 189, 248, 0.1)" }}><Database size={20} /></div>
          </div>
          {loading ? <div className="shimmer" style={{ width: "70px", height: "40px", marginTop: "15px" }}></div> : <h3 style={{ fontSize: "2.5rem", margin: "15px 0 0 0" }}>{stats.registry}</h3>}
        </div>
        
        <div className="dashboard-card pulse-border" style={{ borderLeft: "4px solid #ff7675" }}>
          <div className="dashboard-card-header">
            <p style={{ margin: 0, color: "var(--text-muted)", fontWeight: "600" }}>Likely Forgeries</p>
            <div className="dashboard-card-icon" style={{ color: "#ff7675", background: "rgba(255, 118, 117, 0.1)" }}><AlertTriangle size={20} /></div>
          </div>
          {loading ? <div className="shimmer" style={{ width: "70px", height: "40px", marginTop: "15px" }}></div> : <h3 style={{ fontSize: "2.5rem", margin: "15px 0 0 0" }}>{forgeryCount}</h3>}
        </div>
        
        <div className="dashboard-card" style={{ borderLeft: "4px solid #2ecc71" }}>
          <div className="dashboard-card-header">
            <p style={{ margin: 0, color: "var(--text-muted)", fontWeight: "600" }}>System Status</p>
            <div className="dashboard-card-icon" style={{ color: "#2ecc71", background: "rgba(46, 204, 113, 0.1)" }}><Activity size={20} /></div>
          </div>
          <div style={{ display: "flex", alignItems: "center", marginTop: "15px" }}>
             <span className="badge badge-success">Online & Secured</span>
          </div>
        </div>
      </div>

      <div className="content" style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "25px", marginTop: "10px" }}>
        
        <div className="chart-container" style={{ margin: 0 }}>
          <h4 style={{ margin: "0 0 20px 0", display: "flex", alignItems: "center", gap: "10px" }}><Activity size={18} color="var(--primary)"/> Network Activity Timeline</h4>
          <div style={{ width: "100%", height: "250px" }}>
            {loading ? <div className="shimmer" style={{ width: "100%", height: "100%" }}></div> : 
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorVerify" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorIssue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: 'var(--bg-color)', border: '1px solid var(--card-border)', borderRadius: '8px' }} />
                <Area type="monotone" dataKey="verified" name="Verifications" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorVerify)" />
                <Area type="monotone" dataKey="issued" name="Certificates Issued" stroke="#38bdf8" strokeWidth={3} fillOpacity={1} fill="url(#colorIssue)" />
              </AreaChart>
            </ResponsiveContainer>
            }
          </div>
        </div>

        <div className="chart-container" style={{ margin: 0 }}>
          <h4 style={{ margin: "0 0 20px 0", display: "flex", alignItems: "center", gap: "10px" }}><ShieldCheck size={18} color="var(--primary)"/> Integrity Ratio</h4>
          <div style={{ width: "100%", height: "250px", display: "flex", justifyContent: "center" }}>
            {loading ? <div className="shimmer" style={{ width: "200px", height: "200px", borderRadius: "50%" }}></div> : 
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="45%" innerRadius={60} outerRadius={85} paddingAngle={5} dataKey="value" stroke="none">
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.name === 'Authentic' ? '#2ecc71' : '#ff7675'} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: 'var(--bg-color)', border: '1px solid var(--card-border)', borderRadius: '8px', color: 'var(--text-color)' }} />
                <Legend iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
            }
          </div>
        </div>

      </div>

      <div className="content" style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "25px", marginTop: "25px" }}>
        
        <div className="chart-container" style={{ margin: 0 }}>
          <h4 style={{ margin: "0 0 20px 0", display: "flex", alignItems: "center", gap: "10px" }}><Database size={18} color="#38bdf8"/> Top 5 Degrees Minted</h4>
          <div style={{ width: "100%", height: "250px" }}>
            {loading ? <div className="shimmer" style={{ width: "100%", height: "100%" }}></div> : 
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} layout="vertical" margin={{ top: 10, right: 30, left: 40, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis type="number" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis dataKey="name" type="category" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} width={120} />
                <Tooltip cursor={{fill: 'rgba(255,255,255,0.02)'}} contentStyle={{ background: 'var(--bg-color)', border: '1px solid var(--card-border)', borderRadius: '8px' }} />
                <Bar dataKey="count" fill="#38bdf8" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
            }
          </div>
        </div>

        <div className="chart-container" style={{ margin: 0 }}>
          <h4 style={{ margin: "0 0 20px 0", display: "flex", alignItems: "center", gap: "10px" }}><ShieldCheck size={18} color="var(--primary)"/> Immutable Audit Log</h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ padding: "12px", background: "rgba(255,255,255,0.03)", borderRadius: "10px", borderLeft: "3px solid #38bdf8" }}>
              <p style={{ margin: 0, fontSize: "14px" }}><strong>Registry Sync:</strong> Smart Contract initialized perfectly.</p>
              <p style={{ margin: "5px 0 0 0", fontSize: "11px", color: "var(--text-muted)" }}>Platform Core</p>
            </div>
            <div style={{ padding: "12px", background: "rgba(255,255,255,0.03)", borderRadius: "10px", borderLeft: "3px solid #8b5cf6" }}>
              <p style={{ margin: 0, fontSize: "14px" }}><strong>Active Session:</strong> {user.fullName} authenticated via cryptographic module.</p>
              <p style={{ margin: "5px 0 0 0", fontSize: "11px", color: "var(--text-muted)" }}>Auth Node</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

/**
 * SUB-COMPONENT: CertificateManagement
 */
const CertificateManagement = ({ user }) => {
  const [searchId, setSearchId] = useState("");
  const [certData, setCertData] = useState(null);
  const [status, setStatus] = useState("");

  const handleSearch = async () => {
    if (!searchId) {
      setStatus("Please enter a Certificate ID.");
      return;
    }
    setStatus("Querying blockchain... ⏳");
    setCertData(null); 

    try {
      const contract = await getContract();
      const result = await contract.verifyCertificate(searchId);

      const verifiedData = {
        id: searchId,
        name: result[0],
        matric: result[1],
        degree: result[2],
        hash: result[3],
        institution: result[4], 
        issuer: result[5]
      };
      
      setCertData(verifiedData);
      setStatus("✅ Cryptographically Verified!");

      await addDoc(collection(db, "verification_logs"), {
        certId: searchId,
        studentName: verifiedData.name,
        verifiedBy: user.fullName,
        school: user.institution, 
        timestamp: serverTimestamp(),
        result: "Authentic"
      });
    } catch (error) {
      console.error("Blockchain verification failed:", error);
      setStatus("Blockchain node error... Searching Cloud Archive ☁️");
      
      try {
        const cloudQuery = query(collection(db, "issued_certificates"), where("certId", "==", searchId));
        const querySnapshot = await getDocs(cloudQuery);
        
        if (!querySnapshot.empty) {
          const docData = querySnapshot.docs[0].data();
          
          const verifiedData = {
            id: docData.certId,
            name: docData.studentName,
            matric: "Archived Record", 
            degree: "Archived Degree", 
            hash: docData.ipfsHash,
            institution: docData.institution,
            issuer: docData.issuedBy
          };

          setCertData(verifiedData);
          setStatus("✅ Verified via Cloud Archive (Blockchain node offline)");
          
          await addDoc(collection(db, "verification_logs"), {
            certId: searchId,
            studentName: verifiedData.name,
            verifiedBy: user.fullName,
            school: user.institution, 
            timestamp: serverTimestamp(),
            result: "Authentic"
          });
        } else {
          setStatus("❌ Certificate not found globally or forged.");
        }
      } catch (cloudErr) {
        console.error("Cloud Error:", cloudErr);
        setStatus("❌ Certificate not found or potentially forged.");
      }
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px" }}>
        <h2 style={{ display: "flex", alignItems: "center", gap: "10px", margin: 0 }}><ShieldCheck color="var(--primary)" size={28} /> Cryptographic Verification Terminal</h2>
      </div>
      
      <div className="section-card" style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "40px 20px" }}>
        <div style={{ position: "relative", width: "100%", maxWidth: "600px", marginBottom: "20px" }}>
          <Search size={22} color="var(--text-muted)" style={{ position: "absolute", left: "20px", top: "18px" }} />
          <input 
            type="text" 
            placeholder="Input strictly formatted Certificate ID..." 
            value={searchId} 
            onChange={(e) => setSearchId(e.target.value)} 
            style={{ width: "100%", padding: "18px 20px 18px 55px", borderRadius: "16px", border: "2px solid var(--card-border)", background: "rgba(0,0,0,0.2)", color: "var(--text-main)", outline: "none", fontSize: "16px", fontWeight: "600", transition: "border-color 0.3s", boxSizing: "border-box" }} 
            onFocus={(e) => e.target.style.borderColor = "var(--primary)"}
            onBlur={(e) => e.target.style.borderColor = "var(--card-border)"}
          />
        </div>
        <button className="main-btn" onClick={handleSearch} style={{ padding: "15px 40px", fontSize: "16px" }}>Execute Protocol</button>
        
        {status && (
          <div style={{ marginTop: "25px", padding: "10px 20px", borderRadius: "20px", background: status.includes("✅") ? "rgba(46, 204, 113, 0.1)" : status.includes("⏳") ? "rgba(243, 156, 18, 0.1)" : "rgba(231, 76, 60, 0.1)", color: status.includes("✅") ? "#2ecc71" : status.includes("⏳") ? "#f39c12" : "#e74c3c", display: "flex", alignItems: "center", gap: "8px", fontWeight: "bold" }}>
             {status.includes("✅") ? <CheckCircle size={18}/> : status.includes("⏳") ? <Clock size={18}/> : <XCircle size={18}/>}
             {status}
          </div>
        )}

        {certData && (
          <div style={{ marginTop: "40px", width: "100%", maxWidth: "650px", background: "linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.01))", borderRadius: "24px", border: "1px solid rgba(46, 204, 113, 0.4)", padding: "30px", boxShadow: "0 20px 40px rgba(0,0,0,0.4)", position: "relative", overflow: "hidden" }}>
             <div style={{ position: "absolute", top: "-50px", right: "-50px", background: "rgba(46, 204, 113, 0.1)", width: "150px", height: "150px", borderRadius: "50%", filter: "blur(40px)" }}></div>
             
             <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "25px" }}>
                <div>
                   <p style={{ margin: 0, fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px", fontWeight: "bold" }}>Verified Origin</p>
                   <h3 style={{ margin: "5px 0 0 0", color: "white", fontSize: "22px", display: "flex", alignItems: "center", gap: "8px" }}><ShieldCheck size={20} color="#2ecc71" /> {certData.institution}</h3>
                </div>
                {certData.hash && certData.hash !== "Archived Record" && (
                   <img src={`https://gateway.pinata.cloud/ipfs/${certData.hash}`} alt="Evidence" style={{ width: "60px", height: "60px", objectFit: "cover", borderRadius: "12px", border: "2px solid rgba(255,255,255,0.1)" }} />
                )}
             </div>

             <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                <div style={{ background: "rgba(0,0,0,0.3)", padding: "15px", borderRadius: "12px" }}>
                   <p style={{ margin: 0, fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "bold" }}>Student / Subject</p>
                   <p style={{ margin: "5px 0 0 0", fontSize: "16px", fontWeight: "600", color: "white" }}>{certData.name}</p>
                </div>
                <div style={{ background: "rgba(0,0,0,0.3)", padding: "15px", borderRadius: "12px" }}>
                   <p style={{ margin: 0, fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "bold" }}>Registration / Matric Number</p>
                   <p style={{ margin: "5px 0 0 0", fontSize: "16px", fontWeight: "600", color: "white" }}>{certData.matric}</p>
                </div>
             </div>

             <div style={{ background: "rgba(0,0,0,0.3)", padding: "15px", borderRadius: "12px", marginTop: "15px" }}>
                <p style={{ margin: 0, fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "bold" }}>Degree / Qualification Achieved</p>
                <p style={{ margin: "5px 0 0 0", fontSize: "18px", fontWeight: "600", color: "var(--primary)" }}>{certData.degree}</p>
             </div>

             <div style={{ marginTop: "25px", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "15px", display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--text-muted)" }}>
                <span>ID: {certData.id}</span>
                <span style={{ fontFamily: "monospace", display: "flex", alignItems: "center", gap: "4px" }}><Key size={12}/> Issuer: {certData.issuer.substring(0,8)}...{certData.issuer.substring(36)}</span>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * SUB-COMPONENT: TrustCouncil
 */
const TrustCouncil = ({ user }) => {
  const [pendingApps, setPendingApps] = useState([]);
  const [activeApps, setActiveApps] = useState([]);
  const [suspendedApps, setSuspendedApps] = useState([]);
  const [activeTab, setActiveTab] = useState("pending");
  const [searchTerm, setSearchTerm] = useState("");
  
  const fetchTrustCouncilData = async () => {
    try {
      const qPending = query(collection(db, "users"), where("role", "==", "pending"));
      const pSnap = await getDocs(qPending);
      setPendingApps(pSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      const qActive = query(collection(db, "users"), where("role", "==", "admin"));
      const aSnap = await getDocs(qActive);
      setActiveApps(aSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      
      const qSuspended = query(collection(db, "users"), where("status", "==", "suspended"));
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
      await updateDoc(doc(db, "users", appId), { role: "rejected" });
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px" }}>
        <h2 style={{ display: "flex", alignItems: "center", gap: "10px", margin: 0 }}><ShieldAlert color="#e74c3c" size={28} /> Target Governance</h2>
        <div style={{ position: "relative", width: "300px" }}>
          <Search size={18} color="var(--text-muted)" style={{ position: "absolute", left: "15px", top: "14px" }} />
          <input 
            type="text" 
            placeholder="Search institution or ID..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: "100%", padding: "12px 15px 12px 42px", borderRadius: "12px", border: "1px solid var(--card-border)", background: "var(--card-bg)", color: "var(--text-main)", outline: "none", fontSize: "14px" }}
          />
        </div>
      </div>
      
      {/* Metrics Header */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px", marginBottom: "30px" }}>
        <div className="section-card metric-card" style={{ padding: "20px", display: "flex", alignItems: "center", gap: "15px" }}>
          <div style={{ background: "rgba(243, 156, 18, 0.1)", padding: "15px", borderRadius: "12px", color: "var(--warning)" }}><Clock size={32} /></div>
          <div><p style={{ margin: 0, fontSize: "13px", color: "var(--text-muted)", fontWeight: "600", textTransform: "uppercase" }}>Pending Reviews</p>
          <h3 style={{ margin: "5px 0 0 0", fontSize: "28px" }}>{pendingApps.length}</h3></div>
        </div>
        <div className="section-card metric-card" style={{ padding: "20px", display: "flex", alignItems: "center", gap: "15px" }}>
          <div style={{ background: "rgba(46, 204, 113, 0.1)", padding: "15px", borderRadius: "12px", color: "var(--success)" }}><ShieldCheck size={32} /></div>
          <div><p style={{ margin: 0, fontSize: "13px", color: "var(--text-muted)", fontWeight: "600", textTransform: "uppercase" }}>Active Nodes</p>
          <h3 style={{ margin: "5px 0 0 0", fontSize: "28px" }}>{activeApps.length}</h3></div>
        </div>
        <div className="section-card metric-card" style={{ padding: "20px", display: "flex", alignItems: "center", gap: "15px" }}>
          <div style={{ background: "rgba(231, 76, 60, 0.1)", padding: "15px", borderRadius: "12px", color: "var(--danger, #e74c3c)" }}><XCircle size={32} /></div>
          <div><p style={{ margin: 0, fontSize: "13px", color: "var(--text-muted)", fontWeight: "600", textTransform: "uppercase" }}>Suspended Ops</p>
          <h3 style={{ margin: "5px 0 0 0", fontSize: "28px" }}>{suspendedApps.length}</h3></div>
        </div>
      </div>

      <div className="section-card" style={{ padding: "0", overflow: "hidden" }}>
        {/* Modern Tabs */}
        <div style={{ display: "flex", borderBottom: "1px solid var(--card-border)", background: "rgba(255, 255, 255, 0.02)" }}>
           <button className={`tab-btn ${activeTab === "pending" ? "active" : ""}`} onClick={() => setActiveTab("pending")}>
             Pending Applications {pendingApps.length > 0 && <span className="tab-badge warning">{pendingApps.length}</span>}
           </button>
           <button className={`tab-btn ${activeTab === "active" ? "active" : ""}`} onClick={() => setActiveTab("active")}>
             Active Universities
           </button>
           <button className={`tab-btn ${activeTab === "suspended" ? "active" : ""}`} onClick={() => setActiveTab("suspended")}>
             Suspended Terminals {suspendedApps.length > 0 && <span className="tab-badge danger">{suspendedApps.length}</span>}
           </button>
        </div>

        <div style={{ padding: "20px" }}>
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
                         <Database size={14} style={{ marginRight: "6px" }}/> Review On IPFS
                      </a>
                    ) : <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>Missing</span>}
                  </td>
                  <td style={{ textAlign: "right", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                    {activeTab === "pending" && (
                      <>
                        <button onClick={() => handleApprove(app.id)} className="icon-btn btn-success" title="Approve Verification"><CheckCircle size={18} /></button>
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

/**
 * SUB-COMPONENT: CreateUser
 */
const CreateUser = ({ user }) => {
  const [staffName, setStaffName] = useState("");
  const [staffEmail, setStaffEmail] = useState("");
  const [staffPassword, setStaffPassword] = useState("");
  const [staffRole, setStaffRole] = useState("staff");
  const [staffList, setStaffList] = useState([]);
  const [status, setStatus] = useState("");

  const fetchStaff = async () => {
    try {
      const q = query(collection(db, "users"), where("institution", "==", user.institution));
      const querySnapshot = await getDocs(q);
      setStaffList(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(m => m.email !== user.email));
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchStaff(); }, [user.institution]);

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    setStatus("Registering staff... ⏳");
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
      setStatus("✅ Staff registered successfully!");
      setStaffName(""); setStaffEmail(""); setStaffPassword("");
      fetchStaff();
    } catch (error) { setStatus(`❌ Error: ${error.message}`); }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px" }}>
        <h2 style={{ display: "flex", alignItems: "center", gap: "10px", margin: 0 }}><ShieldAlert color="var(--primary)" size={28} /> {user.institution} Team Roster</h2>
      </div>

      <div className="content" style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "25px" }}>
        
        {/* Registration Form */}
        <div className="section-card" style={{ alignSelf: "start" }}>
          <h4 style={{ margin: "0 0 20px 0", display: "flex", alignItems: "center", gap: "8px" }}><Key size={18} color="var(--accent)" /> Provision Operator</h4>
          
          <form onSubmit={handleCreateStaff} className="user-form" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div>
              <label style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "600", marginBottom: "4px", display: "block" }}>Full Name</label>
              <input placeholder="Operator Name" value={staffName} onChange={(e) => setStaffName(e.target.value)} required />
            </div>
            <div>
              <label style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "600", marginBottom: "4px", display: "block" }}>Secured Email</label>
              <input type="email" placeholder="email@institution.edu" value={staffEmail} onChange={(e) => setStaffEmail(e.target.value)} required />
            </div>
            <div>
              <label style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "600", marginBottom: "4px", display: "block" }}>Initial Access Key (Password)</label>
              <input type="password" placeholder="Passphrase" value={staffPassword} onChange={(e) => setStaffPassword(e.target.value)} required />
            </div>
            <div>
              <label style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "600", marginBottom: "4px", display: "block" }}>Clearance Level</label>
              <select value={staffRole} onChange={(e) => setStaffRole(e.target.value)} style={{ padding: "14px 16px" }}>
                <option value="staff">Staff (Verify Only)</option>
                <option value="registrar">Registrar (Mint & Verify)</option>
              </select>
            </div>
            <button type="submit" className="main-btn" style={{ marginTop: "10px", width: "100%" }}>Cryptographic Provision</button>
          </form>
          {status && <div style={{ marginTop: "15px", padding: "10px", borderRadius: "10px", background: status.includes("✅") ? "rgba(46, 204, 113, 0.1)" : status.includes("⏳") ? "rgba(243, 156, 18, 0.1)" : "rgba(231, 76, 60, 0.1)", color: status.includes("✅") ? "#2ecc71" : status.includes("⏳") ? "#f39c12" : "#e74c3c", fontSize: "14px", fontWeight: "600", textAlign: "center" }}>{status}</div>}
        </div>

        {/* Directory Table */}
        <div className="section-card" style={{ padding: 0, overflow: "hidden" }}>
           <div style={{ padding: "20px", borderBottom: "1px solid var(--card-border)" }}>
             <h4 style={{ margin: 0, display: "flex", alignItems: "center", gap: "8px" }}><Database size={18} color="var(--primary)" /> Authorized Directory</h4>
           </div>
           
           <div style={{ padding: "20px" }}>
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
                        <strong style={{ fontSize: "15px" }}>{m.fullName}</strong>
                        <p style={{ margin: 0, fontSize: "12px", color: "var(--text-muted)" }}>{m.email}</p>
                     </td>
                     <td>
                        <span className={`badge ${m.role.trim().toLowerCase() === 'admin' || m.role.trim().toLowerCase() === 'registrar' ? 'badge-admin' : 'badge-staff'}`}>
                          {m.role}
                        </span>
                     </td>
                     <td style={{ textAlign: "right" }}>
                        <span className="badge badge-success"><CheckCircle size={12} style={{marginRight: "4px"}}/> Active</span>
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

/**
 * SUB-COMPONENT: UploadPage
 */
const UploadPage = ({ user }) => {
  const [activeTab, setActiveTab] = useState("single");
  const [status, setStatus] = useState("");
  
  // Single Issue State
  const [certId, setCertId] = useState("");
  const [studentName, setStudentName] = useState("");
  const [matricNumber, setMatricNumber] = useState("");
  const [degree, setDegree] = useState("");
  const [file, setFile] = useState(null); 

  // Batch Issue State
  const [csvFile, setCsvFile] = useState(null);
  const [batchImages, setBatchImages] = useState([]);
  const [parsedData, setParsedData] = useState([]);
  const [batchProgress, setBatchProgress] = useState("");

  const normalizedRole = user?.role?.trim().toLowerCase();
  const isAuthorized = normalizedRole === "admin" || normalizedRole === "registrar";

  const issueSingleToBlockchain = async (e) => {
    e.preventDefault(); 
    if (!isAuthorized) { setStatus("❌ Permission Denied."); return; }
    if (!file) { setStatus("❌ Select a file!"); return; }

    setStatus("Uploading to IPFS... ⏳");
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

      setStatus(`Finalizing on Blockchain...`);
      const contract = await getContract();
      const tx = await contract.issueCertificate(certId, studentName, matricNumber, degree, ipfsHash, user.institution);
      
      setStatus("Awaiting Metamask confirmation... 🦊");
      await tx.wait();

      await addDoc(collection(db, "issued_certificates"), {
        certId, 
        studentName, 
        matriculation: matricNumber,
        degree,
        institution: user.institution, 
        ipfsHash, 
        issuedBy: user.fullName, 
        timestamp: serverTimestamp()
      });

      setStatus("🎉 SUCCESS! Record issued.");
      setCertId(""); setStudentName(""); setMatricNumber(""); setDegree(""); setFile(null);
    } catch (error) { 
      console.error(error);
      setStatus(`❌ Failed: ${error.message || "Transaction explicitly reverted by Node"}`); 
    }
  };

  const parseCSV = (e) => {
    const file = e.target.files[0];
    setCsvFile(file);
    if (file) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: function(results) {
          setParsedData(results.data);
        }
      });
    }
  };

  const handleBatchImages = (e) => {
    const filesArray = Array.from(e.target.files);
    setBatchImages(filesArray);
  };

  const issueBatchToBlockchain = async () => {
    if (!isAuthorized) { setStatus("❌ Permission Denied."); return; }
    if (parsedData.length === 0) { setStatus("❌ No parsed CSV data."); return; }
    if (batchImages.length === 0) { setStatus("❌ Please upload image files."); return; }

    setStatus("Initializing Batch Process... ⏳");
    
    try {
      const contract = await getContract();
      let successCount = 0;

      for (let i = 0; i < parsedData.length; i++) {
        const row = parsedData[i];
        
        // Ensure required columns exist
        const cId = row.CertID || row.certId;
        const sName = row.StudentName || row.studentName;
        const mNum = row.Matriculation || row.matriculation;
        const deg = row.Degree || row.degree;
        const imgName = row.ImageFileName || row.imageFileName;

        if (!cId || !sName || !mNum || !deg || !imgName) {
           console.warn(`Skipping Row ${i+1}: Missing fields.`);
           continue;
        }

        // Find the matched image file
        const matchedFile = batchImages.find(f => f.name === imgName);
        if (!matchedFile) {
          setStatus(`❌ Missing image file: ${imgName}. Halting batch.`);
          return;
        }

        setBatchProgress(`Uploading ${imgName} to IPFS... (${i+1}/${parsedData.length})`);
        
        // Pinata Upload
        const formData = new FormData();
        formData.append("file", matchedFile);
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

        setBatchProgress(`Minting Record for ${sName}... Please confirm in Metamask.`);
        const tx = await contract.issueCertificate(cId, sName, mNum, deg, ipfsHash, user.institution);
        await tx.wait();

        await addDoc(collection(db, "issued_certificates"), {
          certId: cId, 
          studentName: sName, 
          matriculation: mNum,
          degree: deg,
          institution: user.institution, 
          ipfsHash, 
          issuedBy: user.fullName, 
          timestamp: serverTimestamp()
        });

        successCount++;
      }

      setBatchProgress("");
      setStatus(`🎉 SUCCESS! Batch issued ${successCount} records.`);
      setCsvFile(null);
      setBatchImages([]);
      setParsedData([]);

    } catch (err) {
      console.error(err);
      setStatus("❌ Batch interrupted or failed.");
      setBatchProgress("");
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px" }}>
        <h2 style={{ display: "flex", alignItems: "center", gap: "10px", margin: 0 }}><Database color="var(--primary)" size={28} /> Mint Records</h2>
        
        <div style={{ display: "flex", background: "rgba(255, 255, 255, 0.05)", borderRadius: "14px", padding: "4px", border: "1px solid var(--card-border)" }}>
           <button 
             onClick={() => setActiveTab("single")} 
             style={{ padding: "10px 20px", border: "none", borderRadius: "10px", background: activeTab === "single" ? "var(--primary)" : "transparent", color: activeTab === "single" ? "white" : "var(--text-muted)", fontWeight: "600", cursor: "pointer", transition: "all 0.3s" }}
           >
             Single Mint
           </button>
           <button 
             onClick={() => setActiveTab("batch")} 
             style={{ padding: "10px 20px", border: "none", borderRadius: "10px", background: activeTab === "batch" ? "var(--primary)" : "transparent", color: activeTab === "batch" ? "white" : "var(--text-muted)", fontWeight: "600", cursor: "pointer", transition: "all 0.3s" }}
           >
             Batch Pipeline
           </button>
        </div>
      </div>

      <div className="section-card" style={{ padding: "35px" }}>
        {!isAuthorized && (
          <div style={{ background: "rgba(231, 76, 60, 0.1)", border: "1px solid rgba(231, 76, 60, 0.4)", color: "#e74c3c", padding: "15px", borderRadius: "12px", marginBottom: "25px", display: "flex", alignItems: "center", gap: "10px", fontWeight: "bold" }}>
             <ShieldAlert size={20} /> Access Denied: Only users with 'Registrar' clearance can mint records. Your clearance: {user.role || 'none'}
          </div>
        )}
        
        {status && (
          <div style={{ marginBottom: "25px", padding: "15px", borderRadius: "12px", background: status.includes("❌") ? "rgba(231, 76, 60, 0.1)" : status.includes("🎉") ? "rgba(46, 204, 113, 0.1)" : "rgba(243, 156, 18, 0.1)", color: status.includes("❌") ? "#e74c3c" : status.includes("🎉") ? "#2ecc71" : "#f39c12", display: "flex", alignItems: "center", gap: "10px", fontWeight: "bold" }}>
             {status.includes("🎉") ? <CheckCircle size={20}/> : status.includes("❌") ? <XCircle size={20}/> : <Clock size={20}/>}
             {status}
          </div>
        )}
        
        {batchProgress && (
          <div style={{ marginBottom: "25px", padding: "15px", borderRadius: "12px", background: "rgba(14, 165, 233, 0.1)", color: "#38bdf8", display: "flex", alignItems: "center", gap: "10px", fontWeight: "bold" }}>
             <Activity size={20}/> {batchProgress}
          </div>
        )}

        <div style={{ opacity: isAuthorized ? 1 : 0.5, pointerEvents: isAuthorized ? "auto" : "none" }}>
          
          {activeTab === "single" ? (
            <form onSubmit={issueSingleToBlockchain} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "25px" }}>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                <div>
                  <label style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: "600", marginBottom: "8px", display: "block" }}>Cryptographic Cert ID</label>
                  <input placeholder="e.g. AUTH-2026-X89C" value={certId} onChange={(e) => setCertId(e.target.value)} required disabled={!isAuthorized} className="search-input" style={{ width: "100%" }} />
                </div>
                <div>
                  <label style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: "600", marginBottom: "8px", display: "block" }}>Student / Subject Name</label>
                  <input placeholder="Full Legal Name" value={studentName} onChange={(e) => setStudentName(e.target.value)} required disabled={!isAuthorized} className="search-input" style={{ width: "100%" }} />
                </div>
                <div>
                  <label style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: "600", marginBottom: "8px", display: "block" }}>Matriculation / Registry Number</label>
                  <input placeholder="Identifier" value={matricNumber} onChange={(e) => setMatricNumber(e.target.value)} required disabled={!isAuthorized} className="search-input" style={{ width: "100%" }} />
                </div>
                <div>
                  <label style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: "600", marginBottom: "8px", display: "block" }}>Degree / Qualification Achieved</label>
                  <input placeholder="e.g. B.Sc. Computer Science" value={degree} onChange={(e) => setDegree(e.target.value)} required disabled={!isAuthorized} className="search-input" style={{ width: "100%" }} />
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                 <label style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: "600", display: "block" }}>Upload Digital Artifact</label>
                 
                 <div style={{ border: "2px dashed var(--primary)", borderRadius: "16px", padding: "40px 20px", textAlign: "center", background: "rgba(139, 92, 246, 0.05)", flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", transition: "all 0.3s" }}>
                    <Database size={40} color="var(--primary)" style={{ marginBottom: "15px" }} />
                    <p style={{ margin: "0 0 10px 0", fontWeight: "600" }}>Upload Certificate Image (PDF/PNG)</p>
                    <p style={{ margin: "0 0 20px 0", fontSize: "12px", color: "var(--text-muted)" }}>This artifact will be pinned immutably to IPFS upon minting.</p>
                    
                    <label style={{ background: "var(--primary)", color: "white", padding: "10px 20px", borderRadius: "10px", cursor: "pointer", fontWeight: "600", display: "inline-block" }}>
                       Select File
                       <input type="file" onChange={(e) => setFile(e.target.files[0])} required disabled={!isAuthorized} style={{ display: "none" }} />
                    </label>
                    {file && <p style={{ marginTop: "15px", color: "var(--success)", fontWeight: "bold", fontSize: "14px" }}>✅ {file.name}</p>}
                 </div>

                 <button type="submit" className="main-btn" disabled={!isAuthorized} style={{ width: "100%", padding: "18px", fontSize: "16px" }}>
                   Initiate Blockchain Mint
                 </button>
              </div>

            </form>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
              <div style={{ background: "rgba(139, 92, 246, 0.1)", padding: "20px", borderRadius: "12px", border: "1px solid var(--primary)", display: "flex", gap: "15px" }}>
                <Activity size={24} color="var(--primary)" />
                <div>
                  <h4 style={{ margin: "0 0 5px 0", color: "var(--primary)", fontSize: "16px" }}>Batch Upload Pipeline</h4>
                  <p style={{ margin: 0, fontSize: "14px", color: "var(--text-muted)", lineHeight: "1.6" }}>
                    1. Upload a correctly formatted CSV: <strong>CertID, StudentName, Matriculation, Degree, ImageFileName</strong>.<br/>
                    2. Upload all corresponding image artifacts simultaneously.<br/>
                    3. Ensure your Web3 wallet is connected and adequately funded for gas.
                  </p>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                 <div style={{ border: "1px solid var(--card-border)", borderRadius: "12px", padding: "25px", background: "var(--card-bg)" }}>
                    <label style={{ fontSize: "14px", color: "var(--text-main)", fontWeight: "600", display: "block", marginBottom: "15px" }}>1. Data Context (CSV)</label>
                    <input type="file" accept=".csv" onChange={parseCSV} disabled={!isAuthorized} className="search-input" style={{ width: "100%", cursor: "pointer" }} />
                    {parsedData.length > 0 && <p style={{ color: "var(--success)", margin: "10px 0 0 0", fontSize: "13px", fontWeight: "bold" }}>✅ Loaded {parsedData.length} schema rows.</p>}
                 </div>

                 <div style={{ border: "1px solid var(--card-border)", borderRadius: "12px", padding: "25px", background: "var(--card-bg)" }}>
                    <label style={{ fontSize: "14px", color: "var(--text-main)", fontWeight: "600", display: "block", marginBottom: "15px" }}>2. Image Artifacts</label>
                    <input type="file" multiple accept="image/*,.pdf" onChange={handleBatchImages} disabled={!isAuthorized} className="search-input" style={{ width: "100%", cursor: "pointer" }} />
                    {batchImages.length > 0 && <p style={{ color: "var(--success)", margin: "10px 0 0 0", fontSize: "13px", fontWeight: "bold" }}>✅ Queued {batchImages.length} artifact(s).</p>}
                 </div>
              </div>

              <button onClick={issueBatchToBlockchain} className="main-btn" disabled={!isAuthorized || parsedData.length === 0 || batchImages.length === 0} style={{ width: "100%", padding: "18px", fontSize: "16px", alignSelf: "center", background: (isAuthorized && parsedData.length > 0 && batchImages.length > 0) ? "linear-gradient(135deg, var(--primary), var(--secondary))" : "#bdc3c7" }}>
                Execute Pipeline Protocol
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * SUB-COMPONENT: VerificationLogs
 */
const VerificationLogs = ({ user, isSuperAdmin }) => {
  const [logs, setLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchLogs = async () => {
      const q = isSuperAdmin 
        ? query(collection(db, "verification_logs"), orderBy("timestamp", "desc"))
        : query(collection(db, "verification_logs"), where("school", "==", user.institution), orderBy("timestamp", "desc"));
        
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
        <h2 style={{ display: "flex", alignItems: "center", gap: "10px", margin: 0 }}><FileText color="var(--primary)" size={28} /> {isSuperAdmin ? "Global Audit Firehose" : "Registry Activity Logs"}</h2>
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
        <div style={{ padding: "20px" }}>
          <table className="data-table modern-hover-table" style={{ margin: 0 }}>
            <thead>
              <tr>
                <th>Timestamp</th>
                {isSuperAdmin && <th>Target Institution</th>}
                <th>Certificate ID</th>
                <th>Verified Subject</th>
                <th>Validator Node</th>
                <th style={{ textAlign: "right" }}>Execution Result</th>
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

/**
 * SUB-COMPONENT: AccountSettings
 */
const AccountSettings = ({ user, setUser }) => {
  const [fullName, setFullName] = useState(user.fullName || "");
  const [profilePicFile, setProfilePicFile] = useState(null);
  const [status, setStatus] = useState("");

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setStatus("Updating profile... ⏳");
    try {
      let finalPicHash = user.profilePic || "";

      if (profilePicFile) {
        setStatus("Uploading secure credentials to IPFS... ⏳");
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
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      setStatus("✅ Cryptographic profile updated successfully!");
      setProfilePicFile(null);
    } catch (err) {
      console.error(err);
      setStatus("❌ Failed to enforce profile update.");
    }
  };

  return (
    <div>
      <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: "25px" }}><Settings size={28} color="var(--primary)" /> System Preferences</h2>
      
      <div className="content" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "25px", marginTop: "10px" }}>
        
        {/* Personal Details Card */}
        <div className="section-card">
          <h4 style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid var(--card-border)', paddingBottom: '15px', marginBottom: '20px' }}>
            <User size={20} color="var(--primary)"/> Personal Identity Map
          </h4>
          <p style={{ color: status.includes("❌") ? "red" : "green", fontWeight: "bold", fontSize: "13px" }}>{status}</p>
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

/**
 * MAIN COMPONENT: Dashboard
 */
function Dashboard() {
  const [activePage, setActivePage] = useState("dashboard");
  const [user, setUser] = useState(null); 
  const [schoolLogo, setSchoolLogo] = useState(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
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
           localStorage.removeItem("user");
           if (window.updateUser) window.updateUser();
           navigate("/");
           window.location.reload();
           return;
        }

        if (data.role && data.role !== parsedUser.role) {
           const updatedUser = { ...parsedUser, role: data.role };
           localStorage.setItem("user", JSON.stringify(updatedUser));
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
              : "The AuthenX Trust Council is cryptographically verifying the institutional charter and registration documents you submitted. Your dashboard blockchain tools will unlock instantly upon approval."}
          </p>
        </div>
      );
    }

    const isAuthorizedAdmin = user?.role === "superadmin";
    
    switch (activePage) {
      case "certificate": return <CertificateManagement user={user} />; 
      case "create-user": 
        return isAdmin ? <CreateUser user={user} /> : <DashboardHome user={user} isSuperAdmin={isAuthorizedAdmin} />;
      case "upload": return <UploadPage user={user} />; 
      case "logs": return <VerificationLogs user={user} isSuperAdmin={isAuthorizedAdmin} />;
      case "settings": return <AccountSettings user={user} setUser={setUser} setSchoolLogo={setSchoolLogo} />;
      case "trust-council": return isAuthorizedAdmin ? <TrustCouncil user={user} /> : <DashboardHome user={user} isSuperAdmin={isAuthorizedAdmin} />;
      default: return <DashboardHome user={user} isSuperAdmin={isAuthorizedAdmin} />; 
    }
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-container">
        <div className="sidebar">
          <div style={{ textAlign: "center", marginBottom: "30px", position: "relative" }}>
            {user?.role === "superadmin" ? (
               <div style={{ width: "160px", height: "160px", borderRadius: "50%", background: "rgba(139, 92, 246, 0.1)", border: "2px solid var(--primary)", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", color: "var(--primary)", boxShadow: "0 10px 20px rgba(0,0,0,0.3)", margin: "0 auto", marginBottom: "15px" }}>
                  <ShieldAlert size={50} />
                  <span style={{ fontSize: "16px", fontWeight: "bold", marginTop: "10px", color: "var(--text-main)" }}>AuthenX Core</span>
               </div>
            ) : (
              <label style={{ cursor: isAdmin ? "pointer" : "default", display: "inline-block" }}>
                {schoolLogo ? (
                  <img src={`https://gateway.pinata.cloud/ipfs/${schoolLogo}`} alt="School Logo" title={isAdmin ? "Click to change logo" : ""} style={{ width: "160px", height: "160px", borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(255,255,255,0.2)", marginBottom: "15px", boxShadow: "0 10px 20px rgba(0,0,0,0.3)", opacity: logoUploading ? 0.5 : 1 }} />
                ) : (
                  <div style={{ width: "160px", height: "160px", borderRadius: "50%", background: "rgba(139, 92, 246, 0.1)", border: "2px dashed var(--primary)", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", color: "var(--primary)", marginBottom: "15px", margin: "0 auto", opacity: logoUploading ? 0.5 : 1 }}>
                    <span style={{ fontSize: "36px", marginBottom: "5px" }}>+</span>
                    <span style={{ fontSize: "14px", fontWeight: "bold", textAlign: "center", padding: "0 5px" }}>{logoUploading ? "Uploading..." : "Upload Logo"}</span>
                  </div>
                )}
                {isAdmin && <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleSidebarLogoUpload} disabled={logoUploading} />}
              </label>
            )}
          </div>
          <div style={{ padding: "0 20px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
            {user.profilePic ? (
              <img src={`https://gateway.pinata.cloud/ipfs/${user.profilePic}`} alt="Profile" style={{ width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
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
                 <li className={activePage === "dashboard" ? "active" : ""} onClick={() => setActivePage("dashboard")}>
                   <Globe size={18} style={{ marginRight: "10px" }} /> Global Overview
                 </li>
                 <li className={activePage === "trust-council" ? "active" : ""} onClick={() => setActivePage("trust-council")}>
                   <ShieldAlert size={18} style={{ marginRight: "10px" }} /> Trust Council
                 </li>
                 <li className={activePage === "logs" ? "active" : ""} onClick={() => setActivePage("logs")}>
                   <FileText size={18} style={{ marginRight: "10px" }} /> Global Audit Logs
                 </li>
                 <li className={activePage === "settings" ? "active" : ""} onClick={() => setActivePage("settings")}>
                   <Settings size={18} style={{ marginRight: "10px" }} /> System Controls
                 </li>
                 <li className={activePage === "certificate" ? "active" : ""} onClick={() => setActivePage("certificate")}>
                   <ShieldCheck size={18} style={{ marginRight: "10px" }} /> Verification Portal
                 </li>
               </>
            ) : (
               <>
                 <li className={activePage === "dashboard" ? "active" : ""} onClick={() => setActivePage("dashboard")}>
                   <Home size={18} style={{ marginRight: "10px" }} /> Overview
                 </li>
                 <li className={activePage === "certificate" ? "active" : ""} onClick={() => setActivePage("certificate")}>
                   <ShieldCheck size={18} style={{ marginRight: "10px" }} /> Verify Credential
                 </li>
                 {isAdmin && (
                   <li className={activePage === "create-user" ? "active" : ""} onClick={() => setActivePage("create-user")}>
                     <Users size={18} style={{ marginRight: "10px" }} /> Team Roster
                   </li>
                 )}
                 <li className={activePage === "upload" ? "active" : ""} onClick={() => setActivePage("upload")}>
                   <UploadCloud size={18} style={{ marginRight: "10px" }} /> Issue Record
                 </li>
                 <li className={activePage === "logs" ? "active" : ""} onClick={() => setActivePage("logs")}>
                   <FileText size={18} style={{ marginRight: "10px" }} /> Local Audit Logs
                 </li>
                 <li className={activePage === "settings" ? "active" : ""} onClick={() => setActivePage("settings")}>
                   <Settings size={18} style={{ marginRight: "10px" }} /> Account Settings
                 </li>
               </>
            )}

            <hr style={{ border: "none", borderTop: "1px solid var(--card-border)", margin: "15px 0" }} />
            
            <li style={{ color: '#ff4757', cursor: 'pointer', fontWeight: 'bold', display: "flex", alignItems: "center" }} onClick={() => { localStorage.removeItem("user"); navigate("/"); window.location.reload(); }}>
              <LogOut size={18} style={{ marginRight: "10px" }} /> Sign Out
            </li>
          </ul>
        </div>
        <div className="main">{renderContent()}</div>
      </div>
    </div>
  );
}

// ✅ DEFAULT EXPORT (Ensures App.js can import it correctly)
export default Dashboard;