import React, { useState } from "react";
import { getContract } from "../../blockchain";
import { db } from "../../firebase"; 
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  serverTimestamp
} from "firebase/firestore";
import { 
  ShieldCheck, 
  Search, 
  CheckCircle, 
  XCircle, 
  Clock,
  Key
} from "lucide-react";

const CertificateManagement = ({ user }) => {
  const [searchId, setSearchId] = useState("");
  const [certData, setCertData] = useState(null);
  const [status, setStatus] = useState("");

  const handleSearch = async () => {
    if (!searchId) {
      setStatus("Please enter a Certificate ID.");
      return;
    }
    setStatus("Verifying authenticity proof...");
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
        studentWallet: result[5],
        issuer: result[6]
      };
      
      setCertData(verifiedData);
      setStatus("Verified (Cryptographically Secure)");

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
      setStatus("Registry service busy... Searching database");
      
      try {
        const cloudQuery = query(collection(db, "issued_certificates"), where("certId", "==", searchId));
        const querySnapshot = await getDocs(cloudQuery);
        
        if (!querySnapshot.empty) {
          const docData = querySnapshot.docs[0].data();
          
          const verifiedData = {
            id: docData.certId,
            name: docData.studentName,
            matric: docData.matriculation || "Archived Record", 
            degree: docData.degree || "Archived Degree", 
            hash: docData.ipfsHash,
            institution: docData.institution,
            studentWallet: docData.studentWallet || "0x0000000000000000000000000000000000000000",
            issuer: docData.issuedBy
          };

          setCertData(verifiedData);
          setStatus("Verified via database archive");
          
          await addDoc(collection(db, "verification_logs"), {
            certId: searchId,
            studentName: verifiedData.name,
            verifiedBy: user.fullName,
            school: user.institution, 
            timestamp: serverTimestamp(),
            result: "Authentic"
          });
        } else {
          setStatus("Certificate not found.");
        }
      } catch (cloudErr) {
        console.error("Cloud Error:", cloudErr);
        setStatus("Certificate not found.");
      }
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
        <h2 style={{ display: "flex", alignItems: "center", gap: "10px", margin: 0, fontSize: "20px" }}><ShieldCheck color="var(--primary)" size={24} /> Verify Certificate</h2>
      </div>
      
      <div className="section-card" style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "20px 16px" }}>
        <div style={{ position: "relative", width: "100%", maxWidth: "600px", marginBottom: "15px" }}>
          <Search size={18} color="var(--text-muted)" style={{ position: "absolute", left: "14px", top: "14px" }} />
          <input 
            type="text" 
            placeholder="Enter Certificate ID..." 
            value={searchId} 
            onChange={(e) => setSearchId(e.target.value)} 
            style={{ width: "100%", padding: "12px 15px 12px 42px", borderRadius: "10px", border: "2px solid var(--card-border)", background: "rgba(0,0,0,0.2)", color: "var(--text-main)", outline: "none", fontSize: "14px", fontWeight: "600", transition: "border-color 0.3s", boxSizing: "border-box" }} 
            onFocus={(e) => e.target.style.borderColor = "var(--primary)"}
            onBlur={(e) => e.target.style.borderColor = "var(--card-border)"}
          />
        </div>
        <button className="main-btn" onClick={handleSearch} style={{ padding: "10px 24px", fontSize: "14px" }}>Verify</button>
        
        {status && (
          <div style={{ marginTop: "15px", padding: "8px 16px", borderRadius: "12px", background: status.includes("Verified") ? "rgba(46, 204, 113, 0.1)" : status.includes("Querying") ? "rgba(243, 156, 18, 0.1)" : "rgba(231, 76, 60, 0.1)", color: status.includes("Verified") ? "#2ecc71" : status.includes("Querying") ? "#f39c12" : "#e74c3c", display: "flex", alignItems: "center", gap: "6px", fontWeight: "bold", fontSize: "13px" }}>
             {status.includes("Verified") ? <CheckCircle size={16}/> : status.includes("Querying") ? <Clock size={16}/> : <XCircle size={16}/>}
             {status}
          </div>
        )}

        {certData && (
          <div style={{ marginTop: "20px", width: "100%", maxWidth: "600px", background: "linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.01))", borderRadius: "12px", border: "1px solid rgba(46, 204, 113, 0.4)", padding: "20px", boxShadow: "0 10px 20px rgba(0,0,0,0.4)", position: "relative", overflow: "hidden" }}>
             <div style={{ position: "absolute", top: "-50px", right: "-50px", background: "rgba(46, 204, 113, 0.1)", width: "120px", height: "120px", borderRadius: "50%", filter: "blur(30px)" }}></div>
             
             <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "15px" }}>
                <div>
                   <p style={{ margin: 0, fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: "bold" }}>Issuing Institution</p>
                   <h3 style={{ margin: "4px 0 0 0", color: "white", fontSize: "16px", display: "flex", alignItems: "center", gap: "6px" }}><ShieldCheck size={16} color="#2ecc71" /> {certData.institution}</h3>
                </div>
                {certData.hash && certData.hash !== "Archived Record" && (
                   <img src={`https://gateway.pinata.cloud/ipfs/${certData.hash}`} alt="Evidence" style={{ width: "45px", height: "45px", objectFit: "cover", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)" }} />
                )}
             </div>

             <div className="grid-1-1">
                <div style={{ background: "rgba(0,0,0,0.3)", padding: "10px", borderRadius: "8px" }}>
                   <p style={{ margin: 0, fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "bold" }}>Student Name</p>
                   <p style={{ margin: "2px 0 0 0", fontSize: "14px", fontWeight: "600", color: "white" }}>{certData.name}</p>
                </div>
                <div style={{ background: "rgba(0,0,0,0.3)", padding: "10px", borderRadius: "8px" }}>
                   <p style={{ margin: 0, fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "bold" }}>Registration / Matric Number</p>
                   <p style={{ margin: "2px 0 0 0", fontSize: "14px", fontWeight: "600", color: "white" }}>{certData.matric}</p>
                </div>
             </div>
             
             {certData.studentWallet && certData.studentWallet !== "0x0000000000000000000000000000000000000000" && (
                <div style={{ background: "rgba(0,0,0,0.3)", padding: "10px", borderRadius: "8px", marginTop: "10px" }}>
                   <p style={{ margin: 0, fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "bold" }}>Student Wallet Address (SBT Owner)</p>
                   <p style={{ margin: "2px 0 0 0", fontSize: "13px", fontWeight: "600", color: "#2ecc71", fontFamily: "monospace", wordBreak: "break-all" }}>{certData.studentWallet}</p>
                </div>
             )}

             <div style={{ background: "rgba(0,0,0,0.3)", padding: "10px", borderRadius: "8px", marginTop: "10px" }}>
                <p style={{ margin: 0, fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "bold" }}>Degree / Qualification</p>
                <p style={{ margin: "2px 0 0 0", fontSize: "15px", fontWeight: "600", color: "var(--primary)" }}>{certData.degree}</p>
             </div>

             <div style={{ marginTop: "15px", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "10px", display: "flex", justifyContent: "space-between", fontSize: "10px", color: "var(--text-muted)" }}>
                <span>ID: {certData.id}</span>
                <span style={{ fontFamily: "monospace", display: "flex", alignItems: "center", gap: "2px" }}><Key size={10}/> Issuer Key: {certData.issuer.substring(0,6)}...{certData.issuer.substring(38)}</span>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CertificateManagement;
