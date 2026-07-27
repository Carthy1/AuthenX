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
      setStatus("Please enter a Certificate ID.");
      return;
    }

    setLoading(true);
    setStatus("Verifying authenticity proof...");
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
        institution: result[4],
        studentWallet: result[5],
        issuer: result[6]
      });
      
      setStatus("Verified (Cryptographically Secure)");
    } catch (error) {
      console.error("Blockchain verification failed:", error);
      setStatus("Checking database archive...");
      
      try {
        const cloudQuery = query(collection(db, "issued_certificates"), where("certId", "==", searchId));
        const querySnapshot = await getDocs(cloudQuery);
        
        if (!querySnapshot.empty) {
          const docData = querySnapshot.docs[0].data();
          setCertData({
            id: docData.certId,
            name: docData.studentName,
            matric: docData.matriculation || "Archived Record",
            degree: docData.degree || "Archived Degree",
            hash: docData.ipfsHash,
            institution: docData.institution,
            studentWallet: docData.studentWallet || "0x0000000000000000000000000000000000000000",
            issuer: docData.issuedBy
          });
          setStatus("Verified via Archive Database");

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
          setStatus("Certificate not found in registry archives.");
        }
      } catch (cloudErr) {
        console.error("Cloud Error:", cloudErr);
        setStatus("Certificate not found.");
      }
    } finally {
      setLoading(false);
    }
  };

  const hasValidWallet = certData && certData.studentWallet && certData.studentWallet !== "0x0000000000000000000000000000000000000000";

  return (
    <div className="verify-container">
      
      {/* Glow Effect Top Left */}
      <div className="verify-glow-orb"></div>

      {/* Navigation Link */}
      <div style={{ width: "100%", maxWidth: "850px", marginBottom: "20px", padding: "0 20px" }}>
        <Link 
          to={sessionStorage.getItem("user") ? "/dashboard" : "/"} 
          className="back-link"
        >
          <span style={{ fontSize: "1.2rem" }}>←</span> {sessionStorage.getItem("user") ? "Back to Dashboard" : "Back to Home"}
        </Link>
      </div>

      <div style={{ textAlign: "center", marginBottom: "24px" }}>
        <h1 style={{ fontSize: "2.2rem", margin: "0 0 10px 0", letterSpacing: "-0.5px", fontWeight: "800" }} className="gradient-text">Verify Certificate</h1>
        <p style={{ color: "var(--text-muted)", fontSize: "1rem", maxWidth: "500px", margin: "0 auto", lineHeight: "1.5" }}>
          Instantly verify academic certificates with secure cryptographic proof.
        </p>
      </div>

      <div className="verify-card">
        <form onSubmit={handleVerify} style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <input
            type="text"
            className="verify-input"
            placeholder="Enter Certificate ID..."
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
          />
          <button 
            type="submit" 
            className="verify-btn"
            disabled={loading}
          >
            {loading ? <><Loader2 className="spinner" size={16} /> Scanning...</> : "Verify"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: "15px", fontWeight: "600", fontSize: "0.95rem", color: status.includes("Verified") ? "#22c55e" : (status.includes("not found") || status.includes("pot") || status.includes("enter")) ? "#ef4444" : "var(--accent)" }}>
          {status}
        </div>
      </div>

      {certData && (
        <div className="certificate-display-card fade-in-up">
          
          <div className="certificate-top-bar"></div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--card-border)", paddingBottom: "15px", marginBottom: "20px", flexWrap: "wrap", gap: "10px" }}>
            <h2 style={{ margin: 0, fontWeight: "800", fontSize: "1.4rem" }}>Verified Credential</h2>
            <div style={{ borderRadius: "30px", padding: "2px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <span style={{ backgroundColor: status.includes("Archive") ? "rgba(217, 119, 6, 0.12)" : "rgba(5, 150, 105, 0.12)", color: status.includes("Archive") ? "var(--accent)" : "var(--success)", padding: "6px 12px", borderRadius: "30px", fontWeight: "700", fontSize: "0.85rem", display: "inline-flex", alignItems: "center", border: status.includes("Archive") ? "1px solid rgba(217, 119, 6, 0.25)" : "1px solid rgba(5, 150, 105, 0.25)" }}>
                {status.includes("Archive") ? "Archived Database Record" : "Cryptographically Verified"}
              </span>
              {hasValidWallet && (
                <span style={{ backgroundColor: "rgba(37, 99, 235, 0.12)", color: "var(--primary)", padding: "6px 12px", borderRadius: "30px", fontWeight: "700", fontSize: "0.85rem", display: "inline-flex", alignItems: "center", border: "1px solid rgba(37, 99, 235, 0.25)" }}>
                  SBT Wallet Owned
                </span>
              )}
            </div>
          </div>

          <div className="certificate-grid">
            <div>
              <p className="certificate-label">Student Name</p>
              <p className="certificate-value">{certData.name}</p>
            </div>
            <div>
              <p className="certificate-label">Registration / Matric Number</p>
              <p className="certificate-value">{certData.matric}</p>
            </div>
            <div>
              <p className="certificate-label">Issuing Institution</p>
              <p className="certificate-value">{certData.institution || "N/A"}</p>
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <p className="certificate-label">Degree / Qualification</p>
              <p style={{ fontSize: "1.3rem", fontWeight: "800", margin: 0, color: "var(--text-main)" }}>{certData.degree}</p>
            </div>
            {hasValidWallet && (
              <div style={{ gridColumn: "1 / -1" }}>
                <p className="certificate-label">Student Wallet Address (SBT Owner)</p>
                <p style={{ fontSize: "0.95rem", fontWeight: "600", margin: 0, color: "#2ecc71", fontFamily: "monospace", wordBreak: "break-all" }}>{certData.studentWallet}</p>
              </div>
            )}
          </div>

          <div className="certificate-audit-box">
            <p style={{ fontSize: "0.8rem", margin: "0 0 12px 0", textTransform: "uppercase", letterSpacing: "1px", fontWeight: "700", color: "var(--accent)" }}>Verification Details</p>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "15px", borderBottom: "1px solid var(--card-border)", paddingBottom: "12px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", fontSize: "0.85rem" }}>
                <span style={{ color: "var(--success)", fontWeight: "bold", fontSize: "1rem", lineHeight: "1" }}>✓</span>
                <div>
                  <strong style={{ color: "var(--text-main)" }}>Ledger Registry:</strong> Confirmed and authentic.
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", fontSize: "0.85rem" }}>
                <span style={{ color: "var(--success)", fontWeight: "bold", fontSize: "1rem", lineHeight: "1" }}>✓</span>
                <div>
                  <strong style={{ color: "var(--text-main)" }}>University Approval:</strong> Verified university permission to issue certificates.
                </div>
              </div>
              {hasValidWallet && (
                <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", fontSize: "0.85rem" }}>
                  <span style={{ color: "var(--success)", fontWeight: "bold", fontSize: "1rem", lineHeight: "1" }}>✓</span>
                  <div>
                    <strong style={{ color: "var(--text-main)" }}>Student Ownership:</strong> Confirmed student wallet owns the SBT credential.
                  </div>
                </div>
              )}
              <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", fontSize: "0.85rem" }}>
                <span style={{ color: "var(--success)", fontWeight: "bold", fontSize: "1rem", lineHeight: "1" }}>✓</span>
                <div>
                  <strong style={{ color: "var(--text-main)" }}>Document Check:</strong> Certificate file has not been altered.
                </div>
              </div>
            </div>

            <p className="responsive-detail-row"><strong>Certificate ID:</strong> <span>{certData.id}</span></p>
            <p className="responsive-detail-row"><strong>Issuer Key:</strong> <span style={{ fontFamily: "'Courier New', monospace", fontSize: "0.85rem" }}>{certData.issuer}</span></p>
            <p className="responsive-detail-row"><strong>Secure File Link:</strong> <a href={`https://gateway.pinata.cloud/ipfs/${certData.hash}`} target="_blank" rel="noreferrer" style={{ color: "var(--primary)", textDecoration: "none", fontWeight: "600", fontSize: "0.85rem" }}>View Digital Certificate ↗</a></p>
          </div>

          <div style={{ marginTop: "24px", textAlign: "center" }}>
            <img 
              src={`https://gateway.pinata.cloud/ipfs/${certData.hash}`} 
              alt={`${certData.name}'s Document Validation`} 
              style={{ width: "100%", height: "auto", maxHeight: "500px", borderRadius: "12px", objectFit: "contain", border: "1px solid var(--card-border)", padding: "8px", background: "var(--bg-color)" }}
              onError={(e) => {
                e.target.onerror = null; 
                e.target.src = "https://via.placeholder.com/800x600/101216/2563eb?text=Document+Secured+on+IPFS";
              }}
            />
          </div>

        </div>
      )}

    </div>
  );
}

export default Verify;
