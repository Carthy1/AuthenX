import React, { useState } from "react";
import { ethers } from "ethers";
import { getContract } from "../../blockchain";
import { db } from "../../firebase"; 
import { 
  collection, 
  addDoc, 
  writeBatch,
  doc,
  serverTimestamp
} from "firebase/firestore";
import Papa from "papaparse";
import { 
  ShieldAlert,
  CheckCircle,
  XCircle,
  Clock,
  Activity,
  Database
} from "lucide-react";

const UploadPage = ({ user }) => {
  const [activeTab, setActiveTab] = useState("single");
  const [status, setStatus] = useState("");
  
  // Single Issue State
  const [certId, setCertId] = useState("");
  const [studentName, setStudentName] = useState("");
  const [matricNumber, setMatricNumber] = useState("");
  const [degree, setDegree] = useState("");
  const [studentWallet, setStudentWallet] = useState("");
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
    if (!isAuthorized) { setStatus("Permission Denied."); return; }
    if (!file) { setStatus("Select a file!"); return; }

    const trimmedWallet = studentWallet.trim();
    if (trimmedWallet && !ethers.isAddress(trimmedWallet)) {
      setStatus("Failed: Please enter a valid Ethereum wallet address or leave it blank.");
      return;
    }

    const trimmedCertId = certId.trim();
    if (!trimmedCertId) { setStatus("Please enter a Certificate ID."); return; }

    setStatus("Verifying ID availability on blockchain...");
    try {
      const contractCheck = await getContract();
      const existing = await contractCheck.verifyCertificate(trimmedCertId);
      if (existing && existing[0] && existing[0].length > 0) {
        setStatus(`Failed: Certificate ID "${trimmedCertId}" is already registered on the blockchain.`);
        return;
      }
    } catch (err) {
      // Expected: CertificateNotFound means ID is available for issuance
    }

    setStatus("Storing certificate securely...");
    try {
      window.isAuthenxProcessOngoing = true;
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
      if (!ipfsHash) {
        throw new Error("IPFS Upload Failed: Missing or Invalid Pinata API Keys.");
      }

      const targetWallet = trimmedWallet || "0x0000000000000000000000000000000000000000";
      setStatus(`Registering on secure ledger...`);
      const contract = await getContract();
      const tx = await contract.issueCertificate(certId, studentName, matricNumber, degree, ipfsHash, user.institution, targetWallet);
      
      setStatus("Awaiting verification confirmation...");
      await tx.wait();

      await addDoc(collection(db, "issued_certificates"), {
        certId, 
        studentName, 
        matriculation: matricNumber,
        degree,
        institution: user.institution, 
        ipfsHash, 
        studentWallet: targetWallet,
        issuedBy: user.fullName, 
        timestamp: serverTimestamp()
      });

      setStatus("Success: Record issued.");
      setCertId(""); setStudentName(""); setMatricNumber(""); setDegree(""); setStudentWallet(""); setFile(null);
    } catch (error) { 
      console.error(error);
      setStatus(`Failed: ${error.message || "Transaction explicitly reverted by Node"}`); 
    } finally {
      window.isAuthenxProcessOngoing = false;
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

  // Helper for throttled concurrency uploads to Pinata IPFS
  const executeThrottledUploads = async (rows, concurrencyLimit = 5) => {
    const results = [];
    for (let i = 0; i < rows.length; i += concurrencyLimit) {
      const chunk = rows.slice(i, i + concurrencyLimit);
      setBatchProgress(`Storing certificates securely ${i + 1} to ${Math.min(i + concurrencyLimit, rows.length)} of ${rows.length}...`);
      
      const chunkPromises = chunk.map(async (row) => {
        const formData = new FormData();
        formData.append("file", row.matchedFile);
        const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
          method: "POST",
          headers: {
            pinata_api_key: process.env.REACT_APP_PINATA_API_KEY,
            pinata_secret_api_key: process.env.REACT_APP_PINATA_SECRET_API_KEY,
          },
          body: formData,
        });
        if (!res.ok) {
          throw new Error(`Secure storage upload failed for ${row.matchedFile.name}`);
        }
        const resData = await res.json();
        return { ...row, ipfsHash: resData.IpfsHash };
      });

      const chunkResults = await Promise.all(chunkPromises);
      results.push(...chunkResults);
    }
    return results;
  };

  const issueBatchToBlockchain = async () => {
    if (!isAuthorized) { setStatus("Permission Denied."); return; }
    if (parsedData.length === 0) { setStatus("No parsed CSV data."); return; }
    if (batchImages.length === 0) { setStatus("Please upload image files."); return; }

    setStatus("Initializing Batch Process...");
    setBatchProgress("Pre-validating data context and image files...");

    try {
      window.isAuthenxProcessOngoing = true;
      const validRows = [];
      for (let i = 0; i < parsedData.length; i++) {
        const row = parsedData[i];
        const cId = row.CertID || row.certId;
        const sName = row.StudentName || row.studentName;
        const mNum = row.Matriculation || row.matriculation;
        const deg = row.Degree || row.degree;
        const imgName = row.ImageFileName || row.imageFileName;
        const sWallet = row.StudentWallet || row.studentWallet || "0x0000000000000000000000000000000000000000";

        if (!cId || !sName || !mNum || !deg || !imgName) {
          console.warn(`Skipping Row ${i + 1}: Missing fields.`);
          continue;
        }

        const matchedFile = batchImages.find(f => f.name === imgName);
        if (!matchedFile) {
          setStatus(`Missing image file: ${imgName}. Halting batch.`);
          setBatchProgress("");
          window.isAuthenxProcessOngoing = false;
          return;
        }

        validRows.push({ ...row, matchedFile, cId, sName, mNum, deg, sWallet });
      }

      if (validRows.length === 0) {
        setStatus("Failed: No valid rows containing all required fields.");
        setBatchProgress("");
        window.isAuthenxProcessOngoing = false;
        return;
      }

      // 1. OPTIMIZED: Throttled parallel IPFS Uploads (concurrency limit = 5)
      const ipfsHashes = await executeThrottledUploads(validRows, 5);

      // 2. Batch Smart Contract Call
      const contract = await getContract();
      const ids = ipfsHashes.map(r => r.cId);
      const studentNames = ipfsHashes.map(r => r.sName);
      const matricNumbers = ipfsHashes.map(r => r.mNum);
      const degrees = ipfsHashes.map(r => r.deg);
      const hashes = ipfsHashes.map(r => r.ipfsHash);
      const wallets = ipfsHashes.map(r => r.sWallet);

      setBatchProgress(`Registering batch of ${ipfsHashes.length} certificate(s)... Please authorize.`);
      const tx = await contract.issueCertificatesBatch(ids, studentNames, matricNumbers, degrees, hashes, user.institution, wallets);
      
      setBatchProgress("Finalizing registration on secure registry...");
      await tx.wait();

      // 3. Batch Firestore Writing
      setBatchProgress("Saving to cloud directory...");
      const CHUNK_SIZE = 500;
      const chunks = [];
      for (let i = 0; i < ipfsHashes.length; i += CHUNK_SIZE) {
        chunks.push(ipfsHashes.slice(i, i + CHUNK_SIZE));
      }

      for (const chunk of chunks) {
        const batch = writeBatch(db);
        chunk.forEach((row) => {
          const docRef = doc(collection(db, "issued_certificates"));
          batch.set(docRef, {
            certId: row.cId,
            studentName: row.sName,
            matriculation: row.mNum,
            degree: row.deg,
            institution: user.institution,
            ipfsHash: row.ipfsHash,
            studentWallet: row.sWallet,
            issuedBy: user.fullName,
            timestamp: serverTimestamp()
          });
        });
        await batch.commit();
      }

      setBatchProgress("");
      setStatus(`Success: Batch issued ${ipfsHashes.length} records.`);
      setCsvFile(null);
      setBatchImages([]);
      setParsedData([]);

    } catch (err) {
      console.error(err);
      setStatus(`Batch Failed: ${err.message || err}`);
      setBatchProgress("");
    } finally {
      window.isAuthenxProcessOngoing = false;
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px" }}>
        <h2 style={{ display: "flex", alignItems: "center", gap: "10px", margin: 0 }}><Database color="var(--primary)" size={28} /> Issue Certificates</h2>
        
        <div style={{ display: "flex", background: "rgba(255, 255, 255, 0.05)", borderRadius: "14px", padding: "4px", border: "1px solid var(--card-border)" }}>
           <button 
             onClick={() => setActiveTab("single")} 
             style={{ padding: "10px 20px", border: "none", borderRadius: "10px", background: activeTab === "single" ? "var(--primary)" : "transparent", color: activeTab === "single" ? "white" : "var(--text-muted)", fontWeight: "600", cursor: "pointer", transition: "all 0.3s" }}
           >
             Single Issue
           </button>
           <button 
             onClick={() => setActiveTab("batch")} 
             style={{ padding: "10px 20px", border: "none", borderRadius: "10px", background: activeTab === "batch" ? "var(--primary)" : "transparent", color: activeTab === "batch" ? "white" : "var(--text-muted)", fontWeight: "600", cursor: "pointer", transition: "all 0.3s" }}
           >
             Batch Issue
           </button>
        </div>
      </div>

      <div className="section-card" style={{ padding: "35px" }}>
        {!isAuthorized && (
          <div style={{ background: "rgba(231, 76, 60, 0.1)", border: "1px solid rgba(231, 76, 60, 0.4)", color: "#e74c3c", padding: "15px", borderRadius: "12px", marginBottom: "25px", display: "flex", alignItems: "center", gap: "10px", fontWeight: "bold" }}>
             <ShieldAlert size={20} /> Access Denied: Only users with 'Registrar' role can issue certificates. Your role: {user.role || 'none'}
          </div>
        )}
        
        {status && (
          <div style={{ marginBottom: "25px", padding: "15px", borderRadius: "12px", background: (status.includes("Failed") || status.includes("interrupted")) ? "rgba(231, 76, 60, 0.1)" : status.includes("Success") ? "rgba(46, 204, 113, 0.1)" : "rgba(243, 156, 18, 0.1)", color: (status.includes("Failed") || status.includes("interrupted")) ? "#e74c3c" : status.includes("Success") ? "#2ecc71" : "#f39c12", display: "flex", alignItems: "center", gap: "10px", fontWeight: "bold" }}>
             {status.includes("Success") ? <CheckCircle size={20}/> : (status.includes("Failed") || status.includes("interrupted")) ? <XCircle size={20}/> : <Clock size={20}/>}
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
            <form onSubmit={issueSingleToBlockchain} className="grid-1-1">
              
              <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                <div>
                  <label style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: "600", marginBottom: "8px", display: "block" }}>Certificate ID</label>
                  <input placeholder="e.g. AUTH-2026-X89C" value={certId} onChange={(e) => setCertId(e.target.value)} required disabled={!isAuthorized} className="search-input" style={{ width: "100%" }} />
                </div>
                <div>
                  <label style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: "600", marginBottom: "8px", display: "block" }}>Student Name</label>
                  <input placeholder="Full Legal Name" value={studentName} onChange={(e) => setStudentName(e.target.value)} required disabled={!isAuthorized} className="search-input" style={{ width: "100%" }} />
                </div>
                <div>
                  <label style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: "600", marginBottom: "8px", display: "block" }}>Registration / Matric Number</label>
                  <input placeholder="Identifier" value={matricNumber} onChange={(e) => setMatricNumber(e.target.value)} required disabled={!isAuthorized} className="search-input" style={{ width: "100%" }} />
                </div>
                <div>
                  <label style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: "600", marginBottom: "8px", display: "block" }}>Degree / Qualification</label>
                  <input placeholder="e.g. B.Sc. Computer Science" value={degree} onChange={(e) => setDegree(e.target.value)} required disabled={!isAuthorized} className="search-input" style={{ width: "100%" }} />
                </div>
                <div>
                  <label style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: "600", marginBottom: "8px", display: "block" }}>Student Wallet Address (Optional)</label>
                  <input placeholder="e.g. 0x71C... or leave blank" value={studentWallet} onChange={(e) => setStudentWallet(e.target.value)} disabled={!isAuthorized} className="search-input" style={{ width: "100%" }} />
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                 <label style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: "600", display: "block" }}>Upload Certificate File</label>
                 
                 <div style={{ border: "2px dashed var(--primary)", borderRadius: "16px", padding: "40px 20px", textAlign: "center", background: "rgba(139, 92, 246, 0.05)", flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", transition: "all 0.3s" }}>
                    <Database size={40} color="var(--primary)" style={{ marginBottom: "15px" }} />
                    <p style={{ margin: "0 0 10px 0", fontWeight: "600" }}>Upload Certificate Image (PDF/PNG)</p>
                    <p style={{ margin: "0 0 20px 0", fontSize: "12px", color: "var(--text-muted)" }}>This file will be securely stored online when issued.</p>
                    
                    <label style={{ background: "var(--primary)", color: "white", padding: "10px 20px", borderRadius: "10px", cursor: "pointer", fontWeight: "600", display: "inline-block" }}>
                       Select File
                       <input type="file" onChange={(e) => setFile(e.target.files[0])} required disabled={!isAuthorized} style={{ display: "none" }} />
                    </label>
                    {file && <p style={{ marginTop: "15px", color: "var(--success)", fontWeight: "bold", fontSize: "14px" }}>Selected: {file.name}</p>}
                 </div>
 
                 <button type="submit" className="main-btn" disabled={!isAuthorized} style={{ width: "100%", padding: "18px", fontSize: "16px" }}>
                   Issue Certificate
                 </button>
              </div>

            </form>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
              <div style={{ background: "rgba(139, 92, 246, 0.1)", padding: "20px", borderRadius: "12px", border: "1px solid var(--primary)", display: "flex", gap: "15px" }}>
                <Activity size={24} color="var(--primary)" />
                <div>
                  <h4 style={{ margin: "0 0 5px 0", color: "var(--primary)", fontSize: "16px" }}>Batch Certificate Upload</h4>
                  <p style={{ margin: 0, fontSize: "14px", color: "var(--text-muted)", lineHeight: "1.6" }}>
                    1. Upload a correctly formatted CSV: <strong>CertID, StudentName, Matriculation, Degree, ImageFileName, StudentWallet (optional)</strong>.<br/>
                    2. Upload all corresponding certificate files simultaneously.<br/>
                    3. Ensure your digital signature account is authorized.
                  </p>
                </div>
              </div>

              <div className="grid-1-1">
                 <div style={{ border: "1px solid var(--card-border)", borderRadius: "12px", padding: "25px", background: "var(--card-bg)" }}>
                    <label style={{ fontSize: "14px", color: "var(--text-main)", fontWeight: "600", display: "block", marginBottom: "15px" }}>1. Certificate Details (CSV File)</label>
                    <input type="file" accept=".csv" onChange={parseCSV} disabled={!isAuthorized} className="search-input" style={{ width: "100%", cursor: "pointer" }} />
                    {csvFile && <p style={{ color: "var(--success)", margin: "10px 0 0 0", fontSize: "13px", fontWeight: "bold" }}>Loaded: {csvFile.name} ({parsedData.length} schema rows)</p>}
                 </div>

                 <div style={{ border: "1px solid var(--card-border)", borderRadius: "12px", padding: "25px", background: "var(--card-bg)" }}>
                    <label style={{ fontSize: "14px", color: "var(--text-main)", fontWeight: "600", display: "block", marginBottom: "15px" }}>2. Certificate Files (PDF/PNG)</label>
                    <input type="file" multiple accept="image/*,.pdf" onChange={handleBatchImages} disabled={!isAuthorized} className="search-input" style={{ width: "100%", cursor: "pointer" }} />
                    {batchImages.length > 0 && <p style={{ color: "var(--success)", margin: "10px 0 0 0", fontSize: "13px", fontWeight: "bold" }}>Queued {batchImages.length} artifact(s).</p>}
                 </div>
              </div>

              <button onClick={issueBatchToBlockchain} className="main-btn" disabled={!isAuthorized || parsedData.length === 0 || batchImages.length === 0} style={{ width: "100%", padding: "18px", fontSize: "16px", alignSelf: "center", background: (isAuthorized && parsedData.length > 0 && batchImages.length > 0) ? "linear-gradient(135deg, var(--primary), var(--secondary))" : "#bdc3c7" }}>
                Upload & Issue Batch
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UploadPage;
