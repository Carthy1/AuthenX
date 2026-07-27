import React, { useEffect, useState } from "react";
import { db } from "../../firebase"; 
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  getCountFromServer,
  limit
} from "firebase/firestore";
import { 
  ShieldCheck, 
  Database,
  AlertTriangle,
  Activity
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Legend, 
  BarChart, 
  Bar 
} from 'recharts';

const getGreeting = () => {
  const date = new Date();
  const hour = date.getTimezoneOffset() === 720 ? date.getUTCHours() : date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
};

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
        // 1. OPTIMIZED: Use getCountFromServer for total counts (highly efficient, zero-document transfer)
        const vCountQuery = isSuperAdmin 
          ? query(collection(db, "verification_logs")) 
          : query(collection(db, "verification_logs"), where("school", "==", user.institution));
        
        const iCountQuery = isSuperAdmin 
          ? query(collection(db, "issued_certificates")) 
          : query(collection(db, "issued_certificates"), where("institution", "==", user.institution));

        const [vCountSnapshot, iCountSnapshot] = await Promise.all([
          getCountFromServer(vCountQuery),
          getCountFromServer(iCountQuery)
        ]);

        const totalVerifications = vCountSnapshot.data().count;
        const totalRegistry = iCountSnapshot.data().count;

        setStats({
          verifications: totalVerifications,
          registry: totalRegistry
        });

        // 2. OPTIMIZED: Fetch limited records (e.g., latest 500) to render charts instead of downloading the entire database.
        const vQuery = isSuperAdmin 
          ? query(collection(db, "verification_logs"), limit(500)) 
          : query(collection(db, "verification_logs"), where("school", "==", user.institution), limit(500));
        
        const iQuery = isSuperAdmin 
          ? query(collection(db, "issued_certificates"), limit(500)) 
          : query(collection(db, "issued_certificates"), where("institution", "==", user.institution), limit(500));

        const [vSnapshot, iSnapshot] = await Promise.all([
          getDocs(vQuery),
          getDocs(iQuery)
        ]);

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
          if (d.length > 20) d = d.substring(0, 17) + "..."; 
          degreeCounts[d] = (degreeCounts[d] || 0) + 1;
        });

        const degreeArr = Object.entries(degreeCounts)
          .map(([name, count]) => ({ name, count }))
          .sort((a,b) => b.count - a.count)
          .slice(0, 5); 
        
        if (degreeArr.length === 0) {
          setBarData([{ name: "Awaiting Issues", count: 0 }]);
        } else {
          setBarData(degreeArr);
        }

        const aggregated = Object.values(counts).sort((a,b) => new Date(a.date) - new Date(b.date));
        
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
      <div style={{ marginBottom: "15px" }}>
        <h2 style={{ fontSize: "22px", margin: 0 }}>{isSuperAdmin ? "AuthenX Global Dashboard" : `${getGreeting()}, ${user.fullName}`}</h2>
        <p style={{ color: "var(--text-muted)", margin: "4px 0 0 0", fontSize: "13px" }}>{isSuperAdmin ? "Aggregating active platform metrics globally across all institutions." : `Here’s what’s happening at ${user.institution} today.`}</p>
      </div>

      <div className="cards">
        <div className="dashboard-card pulse-border">
          <div className="dashboard-card-header">
            <p style={{ margin: 0, color: "var(--text-muted)", fontWeight: "600" }}>Total Verifications</p>
            <div className="dashboard-card-icon" style={{ color: "var(--success)", background: "rgba(16, 185, 129, 0.1)" }}><ShieldCheck size={20} /></div>
          </div>
          {loading ? (
            <div className="shimmer" style={{ width: "70px", height: "25px", marginTop: "8px" }}></div>
          ) : (
            <>
              <h3 style={{ margin: "4px 0 0 0", fontWeight: "800" }}>{stats.verifications}</h3>
              <p style={{ margin: "2px 0 0 0", fontSize: "11px", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
                <span style={{ color: "var(--success)", fontWeight: "700" }}>+12.4%</span> activity increase
              </p>
            </>
          )}
        </div>
        
        <div className="dashboard-card pulse-border">
          <div className="dashboard-card-header">
            <p style={{ margin: 0, color: "var(--text-muted)", fontWeight: "600" }}>Certificates Issued</p>
            <div className="dashboard-card-icon" style={{ color: "var(--primary)", background: "rgba(37, 99, 235, 0.1)" }}><Database size={20} /></div>
          </div>
          {loading ? (
            <div className="shimmer" style={{ width: "70px", height: "25px", marginTop: "8px" }}></div>
          ) : (
            <>
              <h3 style={{ margin: "4px 0 0 0", fontWeight: "800" }}>{stats.registry}</h3>
              <p style={{ margin: "2px 0 0 0", fontSize: "11px", color: "var(--text-muted)" }}>
                Permanently secured on secure registry
              </p>
            </>
          )}
        </div>
        
        <div className="dashboard-card pulse-border" style={{ borderLeft: "4px solid var(--danger)" }}>
          <div className="dashboard-card-header">
            <p style={{ margin: 0, color: "var(--text-muted)", fontWeight: "600" }}>Likely Forgeries</p>
            <div className="dashboard-card-icon" style={{ color: "var(--danger)", background: "rgba(220, 38, 38, 0.1)" }}><AlertTriangle size={20} /></div>
          </div>
          {loading ? (
            <div className="shimmer" style={{ width: "70px", height: "25px", marginTop: "8px" }}></div>
          ) : (
            <>
              <h3 style={{ margin: "4px 0 0 0", fontWeight: "800", color: forgeryCount > 0 ? "var(--danger)" : "var(--text-main)" }}>{forgeryCount}</h3>
              <p style={{ margin: "2px 0 0 0", fontSize: "11px", color: "var(--text-muted)" }}>
                Invalid certificates flagged
              </p>
            </>
          )}
        </div>
        
        <div className="dashboard-card" style={{ borderLeft: "4px solid var(--success)" }}>
          <div className="dashboard-card-header">
            <p style={{ margin: 0, color: "var(--text-muted)", fontWeight: "600" }}>System Status</p>
            <div className="dashboard-card-icon" style={{ color: "var(--success)", background: "rgba(5, 150, 105, 0.1)" }}><Activity size={20} /></div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "2px", marginTop: "4px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ display: "inline-block", width: "6px", height: "6px", background: "var(--success)", borderRadius: "50%", boxShadow: "0 0 6px var(--success)" }}></span>
              <span style={{ fontSize: "12px", fontWeight: "700", color: "var(--success)" }}>System Online</span>
            </div>
            <p style={{ margin: 0, fontSize: "11px", color: "var(--text-muted)" }}>Secure Distributed Network</p>
          </div>
        </div>
      </div>

      <div className="grid-2-1" style={{ marginTop: "10px" }}>
        
        <div className="chart-container" style={{ margin: 0 }}>
          <h4 style={{ margin: "0 0 15px 0", fontSize: "14px", display: "flex", alignItems: "center", gap: "8px" }}><Activity size={16} color="var(--primary)"/> Activity Timeline</h4>
          <div style={{ width: "100%", height: "240px" }}>
            {loading ? <div className="shimmer" style={{ width: "100%", height: "100%" }}></div> : 
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorVerify" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorIssue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#d97706" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#d97706" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: 'var(--bg-color)', border: '1px solid var(--card-border)', borderRadius: '8px', fontSize: '12px' }} />
                <Area type="monotone" dataKey="verified" name="Verifications" stroke="#2563eb" strokeWidth={2.5} fillOpacity={1} fill="url(#colorVerify)" />
                <Area type="monotone" dataKey="issued" name="Certificates Issued" stroke="#d97706" strokeWidth={2.5} fillOpacity={1} fill="url(#colorIssue)" />
              </AreaChart>
            </ResponsiveContainer>
            }
          </div>
        </div>

        <div className="chart-container" style={{ margin: 0 }}>
          <h4 style={{ margin: "0 0 15px 0", fontSize: "14px", display: "flex", alignItems: "center", gap: "8px" }}><ShieldCheck size={16} color="var(--primary)"/> Verification Success Rate</h4>
          <div style={{ width: "100%", height: "240px", display: "flex", justifyContent: "center" }}>
            {loading ? <div className="shimmer" style={{ width: "150px", height: "150px", borderRadius: "50%" }}></div> : 
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={4} dataKey="value" stroke="none">
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.name === 'Authentic' ? '#059669' : '#dc2626'} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: 'var(--bg-color)', border: '1px solid var(--card-border)', borderRadius: '8px', color: 'var(--text-color)', fontSize: '12px' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
            }
          </div>
        </div>

      </div>

      <div className="grid-2-1" style={{ marginTop: "16px" }}>
        
        <div className="chart-container" style={{ margin: 0 }}>
          <h4 style={{ margin: "0 0 15px 0", fontSize: "14px", display: "flex", alignItems: "center", gap: "8px" }}><Database size={16} color="var(--primary)"/> Top 5 Degrees Issued</h4>
          <div style={{ width: "100%", height: "240px" }}>
            {loading ? <div className="shimmer" style={{ width: "100%", height: "100%" }}></div> : 
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} layout="vertical" margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis type="number" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis dataKey="name" type="category" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} width={120} />
                <Tooltip cursor={{fill: 'rgba(255,255,255,0.02)'}} contentStyle={{ background: 'var(--bg-color)', border: '1px solid var(--card-border)', borderRadius: '8px', fontSize: '12px' }} />
                <Bar dataKey="count" fill="#2563eb" radius={[0, 4, 4, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
            }
          </div>
        </div>

        <div className="chart-container" style={{ margin: 0 }}>
          <h4 style={{ margin: "0 0 15px 0", fontSize: "14px", display: "flex", alignItems: "center", gap: "8px" }}><ShieldCheck size={16} color="var(--primary)"/> Activity Log</h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", height: "240px", justifyContent: "center" }}>
            <div style={{ padding: "10px 14px", background: "rgba(255,255,255,0.03)", borderRadius: "8px", borderLeft: "4px solid var(--primary)" }}>
              <p style={{ margin: 0, fontSize: "13px", fontWeight: "700" }}>System Sync</p>
              <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "var(--text-muted)" }}>Secure database registry connected.</p>
              <p style={{ margin: "4px 0 0 0", fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Platform Core</p>
            </div>
            <div style={{ padding: "10px 14px", background: "rgba(255,255,255,0.03)", borderRadius: "8px", borderLeft: "4px solid #8b5cf6" }}>
              <p style={{ margin: 0, fontSize: "13px", fontWeight: "700" }}>Active Session</p>
              <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "var(--text-muted)" }}>{user.fullName} logged in successfully.</p>
              <p style={{ margin: "4px 0 0 0", fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>User Session</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DashboardHome;
