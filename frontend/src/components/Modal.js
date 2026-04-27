import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db, googleProvider } from "../firebase";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signInWithPopup,
  sendPasswordResetEmail
} from "firebase/auth";
import { doc, setDoc, getDoc, getDocFromServer } from "firebase/firestore";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "react-hot-toast";

const GLOBAL_QUICK_CACHE = [
  { name: "Harvard University", country: "United States" },
  { name: "Massachusetts Institute of Technology", country: "United States" },
  { name: "University of Oxford", country: "United Kingdom" },
  { name: "University of Toronto", country: "Canada" },
  { name: "University of Melbourne", country: "Australia" },
  { name: "Kwame Nkrumah University of Science and Technology", country: "Ghana" },
  { name: "University of Energy and Natural Resources", country: "Ghana" }
];

function Modal({ type, close }) {
  const [mode, setMode] = useState(type);
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState("");
  const [institution, setInstitution] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [pin, setPin] = useState("");
  const [registrationNo, setRegistrationNo] = useState("");
  const [accreditationFile, setAccreditationFile] = useState(null);

  const [schoolQuery, setSchoolQuery] = useState("");
  const [schoolSuggestions, setSchoolSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const navigate = useNavigate();

  const handleOutside = (e) => {
    if (e.target.className === "modal-overlay") close();
  };

  useEffect(() => {
    const searchSchools = async () => {
      if (schoolQuery.length >= 2 && schoolQuery !== institution) {
        // Step 1: Instant cache hits
        const localMatches = GLOBAL_QUICK_CACHE.filter(s => 
          s.name.toLowerCase().includes(schoolQuery.toLowerCase())
        );
        if (localMatches.length > 0) {
          setSchoolSuggestions(localMatches);
        }

        // Step 2: Global lookup in background
        setIsSearching(true);
        try {
          const response = await fetch(`https://universities.hipolabs.com/search?name=${encodeURIComponent(schoolQuery)}`);
          if (!response.ok) throw new Error("API failed");
          const data = await response.json();
          const uniqueSchools = [...localMatches]; // Keep local hits at top
          const seen = new Set(localMatches.map(s => s.name));
          
          for (let d of data) {
            if (!seen.has(d.name)) {
              seen.add(d.name);
              uniqueSchools.push(d);
            }
          }
          setSchoolSuggestions(uniqueSchools.slice(0, 8));
        } catch (err) {
          console.error("University API Error:", err);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSchoolSuggestions([]);
        setIsSearching(false);
      }
    };

    const timeoutId = setTimeout(searchSchools, 300);
    return () => clearTimeout(timeoutId);
  }, [schoolQuery, institution]);

  const finalizeLogin = (userData) => {
    localStorage.setItem("user", JSON.stringify(userData));
    // Trigger any global state updates if needed
    if (window.updateUser) window.updateUser();
    close();
    navigate("/dashboard");
  };

  const handleSignup = async () => {
    if (!fullName || !email || !password || !institution || !registrationNo || !accreditationFile) {
      toast.error("Please complete all fields, including Registration & Evidence!");
      return;
    }
    setLoading(true);

    const safetyTimeout = setTimeout(() => {
        setLoading(false);
        toast.error("Request timed out. Check your IPFS keys.");
    }, 25000);

    try {
      // 1. Upload IPFS Document
      const formData = new FormData();
      formData.append("file", accreditationFile);
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

      // 2. Create User Profile
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const isSuperAdmin = email.trim().toLowerCase() === "superadmin@authenx.com";

      await setDoc(doc(db, "users", user.uid), {
        fullName,
        institution,
        email,
        pin,
        role: isSuperAdmin ? "superadmin" : "pending", 
        registrationNumber: registrationNo,
        accreditationHash: ipfsHash,
        createdAt: new Date().toISOString()
      });

      clearTimeout(safetyTimeout);
      toast.success("Application Submitted! Under review by Trust Council.");
      setMode("login");
    } catch (error) {
      clearTimeout(safetyTimeout);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    setLoading(true);

    if (email === "demo@demo.com") {
      finalizeLogin({
        uid: "demo123",
        email: "demo@demo.com",
        fullName: "Demo Admin",
        institution: "Demo University",
        role: "superadmin"
      });
      setLoading(false);
      return;
    }

    const safetyTimeout = setTimeout(() => {
        setLoading(false);
        toast.error("Cloud connection timed out.");
    }, 10000);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      const userDocRef = doc(db, "users", user.uid);
      let userData = null;

      // Force fetch from server to get the latest role/institution
      try {
        const userDoc = await getDocFromServer(userDocRef);
        userData = userDoc.data();
      } catch (serverError) {
        const cachedDoc = await getDoc(userDocRef);
        userData = cachedDoc.data();
      }

      if (userData?.role === "suspended" || userData?.status === "suspended" || userData?.role === "rejected") {
        clearTimeout(safetyTimeout);
        toast.error("Access Revoked by the Trust Council.");
        auth.signOut();
        setLoading(false);
        return;
      }

      clearTimeout(safetyTimeout);

      // ✅ INTEGRATED: Now passing role, uid, and institution to the session
      finalizeLogin({
        uid: user.uid,
        email: user.email,
        fullName: userData?.fullName || "Admin User",
        institution: userData?.institution || "Independent Institution",
        role: userData?.role || "staff" // Fallback to staff
      });

    } catch (error) {
      clearTimeout(safetyTimeout);
      toast.error("Invalid credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        toast.error("Access Denied: Account not registered for SSO.");
        auth.signOut();
        setLoading(false);
        return;
      }

      const userData = userDoc.data();

      if (userData?.role === "pending") {
        toast.error("Application under review by Trust Council.");
        auth.signOut();
        setLoading(false);
        return;
      }

      if (userData?.role === "suspended" || userData?.status === "suspended" || userData?.role === "rejected") {
        toast.error("Access Revoked by the Trust Council.");
        auth.signOut();
        setLoading(false);
        return;
      }

      finalizeLogin({
        uid: user.uid,
        email: user.email,
        fullName: userData?.fullName || user.displayName,
        institution: userData?.institution,
        role: userData?.role
      });
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };


  const handleForgotPassword = async () => {
    let targetEmail = email;
    if (!targetEmail) {
      targetEmail = window.prompt("Enter your registered Admin Email to receive a cryptographic password reset link:");
      if (!targetEmail) return; 
    }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, targetEmail);
      toast.success(`Reset link dispatched to ${targetEmail}.`);
      close();
    } catch (err) {
      console.error(err);
      toast.error("Error resolving email node.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOutside}>
      {loading && (
        <div className="loader-overlay">
          <div className="loader-box">
            <div className="spinner"></div>
            <p>Connecting to AuthenX Cloud...</p>
          </div>
        </div>
      )}

      <div className="modal">
        <div className="modal-toggle">
          <span className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>Login</span>
          <span className={mode === "signup" ? "active" : ""} onClick={() => setMode("signup")}>Sign Up</span>
        </div>

        {mode === "login" && (
          <div style={{ marginBottom: "20px" }}>
            <h2 style={{ marginBottom: "20px" }}>Institutional Login</h2>
            <button className="google-btn" onClick={handleGoogleLogin}>
              <img src="https://fonts.gstatic.com/s/i/productlogos/googleg/v6/24px.svg" alt="G" width="18"/>
              Secure SSO Authentication
            </button>
            <div className="divider">OR USE INSTITUTIONAL CREDENTIALS</div>
          </div>
        )}

        {mode === "login" ? (
          <>
            <input placeholder="Admin Email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <div style={{ position: "relative", marginBottom: "10px" }}>
              <input type={showPassword ? "text" : "password"} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: "100%", boxSizing: "border-box" }} />
              <span onClick={() => setShowPassword(!showPassword)} style={{ position: "absolute", right: "12px", top: "16px", cursor: "pointer", color: "var(--text-muted)" }}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "20px", padding: "0 5px" }}>
              <span onClick={handleForgotPassword} style={{ fontSize: "13px", color: "var(--primary)", cursor: "pointer", fontWeight: "600" }}>Recover Password?</span>
            </div>
            <button className="main-btn" onClick={handleLogin}>Access Dashboard</button>
          </>
        ) : (
          <>
            <h2 style={{ marginBottom: "20px" }}>Institutional Application</h2>
            
            <div style={{ display: "flex", gap: "12px" }}>
              <input placeholder="Admin Name" value={fullName} style={{ flex: 1 }} onChange={(e) => setFullName(e.target.value)} />
              <input placeholder="Official Email" value={email} style={{ flex: 1 }} onChange={(e) => setEmail(e.target.value)} />
            </div>
            
            <div style={{ position: "relative" }}>
              <input 
                placeholder="Search University (e.g. UENR, KNUST...)" 
                value={schoolQuery} 
                onChange={(e) => setSchoolQuery(e.target.value)}
                autoComplete="off"
              />
              {(schoolSuggestions.length > 0 || isSearching) && (
                <ul className="school-dropdown">
                  {schoolSuggestions.map((s, i) => (
                    <li key={i} className="school-item" onClick={() => { 
                        setInstitution(s.name); 
                        setSchoolQuery(s.name); 
                        setSchoolSuggestions([]); 
                        setIsSearching(false);
                      }}>
                      <strong>{s.name}</strong> <br/> 
                      <small>{s.country} 🌍</small>
                    </li>
                  ))}
                  {isSearching && (
                    <li className="school-item" style={{ textAlign: "center", fontStyle: "italic", color: "var(--primary)", background: "rgba(139, 92, 246, 0.05)" }}>
                      Searching global registries... ⏳
                    </li>
                  )}
                </ul>
              )}
            </div>

            <input placeholder="Official Registration / Accreditation Number" value={registrationNo} onChange={(e) => setRegistrationNo(e.target.value)} />
            
            <div style={{ width: "100%", padding: "12px", background: "rgba(139, 92, 246, 0.05)", borderRadius: "12px", border: "1px dashed rgba(139, 92, 246, 0.4)", margin: "8px 0 16px 0", boxSizing: "border-box" }}>
              <label style={{ fontSize: "14px", color: "var(--text-muted)", display: "block", marginBottom: "8px", fontWeight: "600" }}>Upload Accreditation Evidence (PDF/JPG)</label>
              <input type="file" onChange={(e) => setAccreditationFile(e.target.files[0])} style={{ background: "transparent", border: "none", padding: 0 }} />
            </div>

            <div style={{ display: "flex", gap: "12px", marginBottom: "20px" }}>
               <div style={{ position: "relative", flex: 1 }}>
                 <input type={showPassword ? "text" : "password"} placeholder="Create Password" value={password} style={{ width: "100%", boxSizing: "border-box" }} onChange={(e) => setPassword(e.target.value)} />
                 <span onClick={() => setShowPassword(!showPassword)} style={{ position: "absolute", right: "12px", top: "16px", cursor: "pointer", color: "var(--text-muted)" }}>
                   {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                 </span>
               </div>
              <input type="password" placeholder="Security PIN" value={pin} style={{ flex: 1 }} onChange={(e) => setPin(e.target.value)} />
            </div>
            
            <button className="main-btn" onClick={handleSignup}>Submit Application</button>
          </>
        )}
      </div>
    </div>
  );
}

export default Modal;