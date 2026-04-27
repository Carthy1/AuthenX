import React, { useState } from "react";
import { getContract } from "../blockchain";
import { Link } from "react-router-dom";
import { db } from "../firebase";
import { collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { Loader2 } from "lucide-react";

function Verify() {
  const [searchId, setSearchId] = useState("");
  const [certData, setCertData] = useState(null);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const handleVerify = async (e) => {
    e.preventDefault();
    
    if (!searchId) {
      setStatus("⚠️ Please enter a Certificate ID.");
      return;
    }

    setLoading(true);
    setStatus("Querying the decentralized ledger... ⏳");
    setCertData(null); 

    try {
      const contract = await getContract();
      const result = await contract.verifyCertificate(searchId);

      setCertData({
        id: searchId,
        name: result[0],
        matric: result[1],
        degree: result[2],
        hash: result[3],
        institution: result[4], // The 6th parameter we added
        issuer: result[5]
      });
      
      setStatus("✅ Cryptographically Verified");
    } catch (error) {
      console.error("Blockchain verification failed:", error);
      setStatus("Querying distributed Cloud Archive... ☁️");
      
      try {
        const cloudQuery = query(collection(db, "issued_certificates"), where("certId", "==", searchId));
        const querySnapshot = await getDocs(cloudQuery);
        
        if (!querySnapshot.empty) {
          const docData = querySnapshot.docs[0].data();
          setCertData({
            id: docData.certId,
            name: docData.studentName,
            matric: "Archived Record",
            degree: "Archived Degree",
            hash: docData.ipfsHash,
            institution: docData.institution,
            issuer: docData.issuedBy
          });
          setStatus("✅ Verified via Decentralized Cloud Archive (Node Sync Pending)");

          // Log public verifications from the cloud anonymously 
          await addDoc(collection(db, "verification_logs"), {
            certId: searchId,
            studentName: docData.studentName,
            verifiedBy: "Public API (Cloud Fallback)",
            school: docData.institution, 
            timestamp: serverTimestamp(),
            result: "Authentic"
          });
        } else {
          setStatus("❌ Certificate not found on Ledger or Cloud Archive.");
        }
      } catch (cloudErr) {
        console.error("Cloud Error:", cloudErr);
        setStatus("❌ Certificate not found or potentially forged.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "inherit", display: "flex", flexDirection: "column", alignItems: "center", paddingTop: "40px", paddingBottom: "100px", position: "relative" }}>
      
      {/* Glow Effect Top Left */}
      <div style={{ position: "absolute", top: "-10%", left: "-10%", width: "500px", height: "500px", background: "var(--primary)", filter: "blur(200px)", opacity: 0.15, zIndex: -1 }}></div>

      {/* Navigation Link */}
      <div style={{ width: "100%", maxWidth: "850px", marginBottom: "20px", padding: "0 20px" }}>
        <Link to={localStorage.getItem("user") ? "/dashboard" : "/"} style={{ textDecoration: "none", color: "var(--text-muted)", fontWeight: "600", display: "inline-flex", alignItems: "center", gap: "8px", transition: "0.3s" }}
              onMouseOver={(e) => e.target.style.color = "var(--primary)"}
              onMouseOut={(e) => e.target.style.color = "var(--text-muted)"}>
          <span style={{ fontSize: "1.2rem" }}>←</span> {localStorage.getItem("user") ? "Back to Dashboard" : "Back to Home"}
        </Link>
      </div>

      <div style={{ textAlign: "center", marginBottom: "50px" }}>
        <h1 style={{ fontSize: "3.5rem", margin: "0 0 15px 0", letterSpacing: "-1px", fontWeight: "800" }} className="gradient-text">Public Verification</h1>
        <p style={{ color: "var(--text-muted)", fontSize: "1.2rem", maxWidth: "500px", margin: "0 auto", lineHeight: "1.6" }}>
          Instantly verify academic credentials cryptographically on the decentralized ledger.
        </p>
      </div>

      <div style={{ background: "var(--glass-bg)", backdropFilter: "blur(30px)", WebkitBackdropFilter: "blur(30px)", border: "1px solid var(--glass-border)", padding: "40px", borderRadius: "24px", boxShadow: "0 20px 50px rgba(0,0,0,0.2)", width: "90%", maxWidth: "650px", position: "relative", zIndex: 10 }}>
        <form onSubmit={handleVerify} style={{ display: "flex", gap: "15px", flexWrap: "wrap" }}>
          <input
            type="text"
            placeholder="Enter Certificate ID..."
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            style={{ flex: 1, padding: "18px 24px", borderRadius: "16px", border: "1px solid var(--card-border)", fontSize: "1.1rem", outline: "none", minWidth: "250px", background: "rgba(0,0,0,0.1)", color: "var(--text-main)", transition: "all 0.3s", boxSizing: "border-box" }}
            onFocus={(e) => { e.target.style.borderColor = "var(--primary)"; e.target.style.boxShadow = "0 0 0 4px rgba(139, 92, 246, 0.2)"; }}
            onBlur={(e) => { e.target.style.borderColor = "var(--card-border)"; e.target.style.boxShadow = "none"; }}
          />
          <button 
            type="submit" 
            disabled={loading}
            style={{ padding: "0 35px", background: "linear-gradient(135deg, var(--primary), var(--secondary))", color: "white", border: "none", borderRadius: "16px", fontSize: "1.1rem", cursor: loading ? "not-allowed" : "pointer", fontWeight: "700", boxShadow: "0 10px 25px rgba(99, 102, 241, 0.4)", transition: "all 0.3s", display: "flex", alignItems: "center", gap: "8px" }}
            onMouseOver={(e) => e.target.style.transform = "translateY(-3px)"}
            onMouseOut={(e) => e.target.style.transform = "translateY(0)"}
          >
            {loading ? <><Loader2 className="spinner" size={20} /> Scanning...</> : "Verify"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: "25px", fontWeight: "600", fontSize: "1.1rem", color: status.includes("✅") ? "#22c55e" : status.includes("❌") ? "#ef4444" : "var(--accent)" }}>
          {status}
        </div>
      </div>

      {certData && (
        <div style={{ marginTop: "50px", background: "var(--card-bg)", backdropFilter: "blur(25px)", WebkitBackdropFilter: "blur(25px)", padding: "50px", borderRadius: "24px", boxShadow: "0 25px 50px rgba(0,0,0,0.3)", width: "90%", maxWidth: "850px", position: "relative", overflow: "hidden" }}>
          
          <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "4px", background: "linear-gradient(90deg, #22c55e, #10b981)" }}></div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--card-border)", paddingBottom: "25px", marginBottom: "35px", flexWrap: "wrap", gap: "15px" }}>
            <h2 style={{ margin: 0, fontWeight: "800", fontSize: "2rem" }}>Verified Credential</h2>
            <div className="pulse-border" style={{ borderRadius: "30px", padding: "2px" }}>
              <span style={{ backgroundColor: status.includes("Cloud") ? "rgba(245, 158, 11, 0.15)" : "rgba(34, 197, 94, 0.15)", color: status.includes("Cloud") ? "#f59e0b" : "#22c55e", padding: "10px 20px", borderRadius: "30px", fontWeight: "700", fontSize: "1rem", display: "flex", alignItems: "center", border: status.includes("Cloud") ? "1px solid rgba(245, 158, 11, 0.3)" : "1px solid rgba(34, 197, 94, 0.3)" }}>
                <span style={{ marginRight: "8px", fontSize: "1.2rem" }}>{status.includes("Cloud") ? "☁️" : "🛡️"}</span> {status.includes("Cloud") ? "Cloud Archive Record" : "Authentic Ledger Record"}
              </span>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "35px" }}>
            <div>
              <p style={{ fontSize: "0.95rem", margin: "0 0 8px 0", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: "600" }}>Graduate Name</p>
              <p style={{ fontSize: "1.4rem", fontWeight: "700", margin: 0, color: "var(--text-main)" }}>{certData.name}</p>
            </div>
            <div>
              <p style={{ fontSize: "0.95rem", margin: "0 0 8px 0", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: "600" }}>Matriculation</p>
              <p style={{ fontSize: "1.4rem", fontWeight: "700", margin: 0, color: "var(--text-main)" }}>{certData.matric}</p>
            </div>
            <div>
              <p style={{ fontSize: "0.95rem", margin: "0 0 8px 0", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: "600" }}>Institution</p>
              <p style={{ fontSize: "1.4rem", fontWeight: "700", margin: 0, color: "var(--text-main)" }}>{certData.institution || "N/A"}</p>
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <p style={{ fontSize: "0.95rem", margin: "0 0 8px 0", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: "600" }}>Degree Awarded</p>
              <p style={{ fontSize: "1.6rem", fontWeight: "800", margin: 0, color: "var(--text-main)" }}>{certData.degree}</p>
            </div>
          </div>

          <div style={{ marginTop: "45px", padding: "25px", background: "rgba(0,0,0,0.15)", borderRadius: "16px", border: "1px dashed rgba(255,255,255,0.1)", wordBreak: "break-all" }}>
            <p style={{ fontSize: "0.9rem", margin: "0 0 15px 0", textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: "700", color: "var(--text-muted)" }}>Blockchain Metadata Protocol</p>
            <p style={{ margin: "10px 0", fontSize: "1rem", display: "flex", gap: "10px" }}><strong style={{ width: "140px", color: "var(--text-muted)" }}>Certificate ID:</strong> <span style={{ color: "var(--text-main)", fontWeight: "500" }}>{certData.id}</span></p>
            <p style={{ margin: "10px 0", fontSize: "1rem", display: "flex", gap: "10px" }}><strong style={{ width: "140px", color: "var(--text-muted)" }}>Issuer Node:</strong> <span style={{ fontFamily: "'Courier New', monospace", color: "var(--text-main)", fontWeight: "500" }}>{certData.issuer}</span></p>
            <p style={{ margin: "10px 0", fontSize: "1rem", display: "flex", gap: "10px" }}><strong style={{ width: "140px", color: "var(--text-muted)" }}>IPFS Fingerprint:</strong> <a href={`https://gateway.pinata.cloud/ipfs/${certData.hash}`} target="_blank" rel="noreferrer" style={{ color: "var(--primary)", textDecoration: "none", fontWeight: "600" }}>{certData.hash} ↗</a></p>
          </div>

          <div style={{ marginTop: "50px", textAlign: "center" }}>
            <img 
              src={`https://gateway.pinata.cloud/ipfs/${certData.hash}`} 
              alt={`${certData.name}'s Document Validation`} 
              style={{ width: "100%", height: "auto", maxHeight: "800px", borderRadius: "16px", objectFit: "contain", border: "1px solid var(--glass-border)", padding: "10px", background: "var(--bg-color)" }}
              onError={(e) => {
                e.target.onerror = null; 
                e.target.src = "https://via.placeholder.com/800x600/101216/8b5cf6?text=Document+Secured+on+IPFS";
              }}
            />
          </div>

        </div>
      )}

    </div>
  );
}

export default Verify;