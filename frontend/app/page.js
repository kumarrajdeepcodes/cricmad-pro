"use client";
import { useState, useEffect } from "react";
import io from "socket.io-client";
import axios from "axios";
import { 
  Home, Trophy, User, Menu, Plus, X, ShoppingBag, BarChart2, Flame, Bell, Activity, 
  Settings, Lock, Unlock, ArrowLeft, Clock, MessageSquare, Undo2, Search, Phone, 
  Mail, MessageCircle, RefreshCw, ChevronRight, Trash2, Key, Eye, Edit3, Smartphone, 
  Video, Users, Award, Handshake, LifeBuoy, TrendingUp, Send, Filter, Target, Zap,
  ShoppingCart, Tag, Star, LogIn
} from 'lucide-react';

// REPLACE WITH YOUR BACKEND URL
const BACKEND_URL = "https://cricmad-pro.onrender.com"; 
const socket = io(BACKEND_URL);

// --- MOCK STORE DATA ---
const PRODUCTS = [
  { id: 1, name: "MRF Genius Grand Edition", category: "bats", price: "₹12,499", rating: 4.8, img: "🏏" },
  { id: 2, name: "SG Test Leather Ball", category: "balls", price: "₹899", rating: 4.5, img: "🔴" },
  { id: 3, name: "Team India Jersey 2025", category: "jerseys", price: "₹1,999", rating: 4.9, img: "👕" },
  { id: 4, name: "Nivia Shining Star Football", category: "football", price: "₹999", rating: 4.6, img: "⚽" },
  { id: 5, name: "SS Ton English Willow", category: "bats", price: "₹8,999", rating: 4.7, img: "🏏" },
  { id: 6, name: "DSC Batting Gloves", category: "kits", price: "₹1,200", rating: 4.3, img: "🧤" },
  { id: 7, name: "Kookaburra White Ball", category: "balls", price: "₹1,100", rating: 4.8, img: "⚪" },
  { id: 8, name: "CSK IPL Jersey", category: "jerseys", price: "₹1,499", rating: 4.7, img: "👕" },
  { id: 9, name: "Adidas Telstar Football", category: "football", price: "₹2,499", rating: 4.9, img: "⚽" },
  { id: 10, name: "Full Cricket Kit Bag", category: "kits", price: "₹5,499", rating: 4.6, img: "🎒" },
];

export default function App() {
  const [activeTab, setActiveTab] = useState("home");
  const [showMenu, setShowMenu] = useState(false);
  const [liveMatches, setLiveMatches] = useState([]); 
  const [pastMatches, setPastMatches] = useState([]); 
  const [myMatches, setMyMatches] = useState([]);
  const [match, setMatch] = useState(null); 
  
  // Search & Insights State
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchCategory, setSearchCategory] = useState("matches"); 
  const [insightQuery, setInsightQuery] = useState("");
  const [playerStats, setPlayerStats] = useState(null);
  const [insightLoading, setInsightLoading] = useState(false);

  // Store State
  const [storeCategory, setStoreCategory] = useState("all");

  // Auth & OTP State
  const [user, setUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authStep, setAuthStep] = useState(1); // 1: Input Contact, 2: OTP, 3: Username(New)
  const [contactType, setContactType] = useState("email"); // email or mobile
  const [contactValue, setContactValue] = useState("");
  const [otpValue, setOtpValue] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [isMasterLogin, setIsMasterLogin] = useState(false); // Toggle for password login
  const [masterPassword, setMasterPassword] = useState("");

  const [step, setStep] = useState(1);
  const [seriesName, setSeriesName] = useState("");
  const [teamAName, setTeamAName] = useState("India");
  const [teamBName, setTeamBName] = useState("Australia");
  const [totalOvers, setTotalOvers] = useState(5);
  const [teamASquad, setTeamASquad] = useState([]);
  const [teamBSquad, setTeamBSquad] = useState([]);
  const [tempPlayerName, setTempPlayerName] = useState("");
  const [playerRole, setPlayerRole] = useState("Batsman");
  const [isCaptain, setIsCaptain] = useState(false);
  const [isVC, setIsVC] = useState(false);
  const [isWK, setIsWK] = useState(false);
  
  const [tossWinner, setTossWinner] = useState("");
  const [tossDecision, setTossDecision] = useState("Bat");

  const [selectedStriker, setSelectedStriker] = useState("");
  const [selectedNonStriker, setSelectedNonStriker] = useState("");
  const [selectedBowler, setSelectedBowler] = useState("");
  const [striker2, setStriker2] = useState("");
  const [nonStriker2, setNonStriker2] = useState("");
  const [bowler2, setBowler2] = useState("");
  
  const [detailMatch, setDetailMatch] = useState(null);
  const [detailViewMode, setDetailViewMode] = useState("summary");
  
  // Scoring & Commentary State
  const [showWicketType, setShowWicketType] = useState(false);
  const [showBowlerChange, setShowBowlerChange] = useState(false);
  const [showCommModal, setShowCommModal] = useState(false);
  const [pendingScore, setPendingScore] = useState(null); 
  const [shotType, setShotType] = useState("");
  const [commText, setCommText] = useState("");

  const canScore = user && match && (user.role === 'superadmin' || match.createdBy === user.id);

  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");
    if(savedToken && savedUser) setUser(JSON.parse(savedUser));

    fetchAllMatches();
    socket.on("score_update", (data) => {
      setMatch((prev) => (prev && prev._id === data._id ? data : prev));
      fetchAllMatches();
    });
  }, []);

  const fetchAllMatches = async () => {
    try {
      const liveRes = await axios.get(`${BACKEND_URL}/api/matches/live`);
      setLiveMatches(liveRes.data);
      const pastRes = await axios.get(`${BACKEND_URL}/api/matches/completed`);
      setPastMatches(pastRes.data);
    } catch (e) { console.error("Error"); }
  };

  const fetchMyMatches = async () => {
      if(!user) return;
      try {
          const token = localStorage.getItem("token");
          const res = await axios.get(`${BACKEND_URL}/api/matches/my`, { headers: { Authorization: `Bearer ${token}` } });
          setMyMatches(res.data);
      } catch(e) { console.error("Fetch failed"); }
  };

  // --- NEW AUTH LOGIC ---
  const handleSendOtp = async () => {
      if(!contactValue) return alert("Enter valid contact");
      try {
          await axios.post(`${BACKEND_URL}/api/auth/send-otp`, { contact: contactValue });
          setAuthStep(2);
          alert("OTP Sent! Check your Backend Terminal/Console.");
      } catch(e) { alert("Failed to send OTP"); }
  };

  const handleVerifyOtp = async () => {
      try {
          const res = await axios.post(`${BACKEND_URL}/api/auth/verify-otp`, { contact: contactValue, otp: otpValue, username: newUsername });
          if(res.data.newUser) {
              setAuthStep(3); // Go to username input
          } else {
              loginSuccess(res.data);
          }
      } catch(e) { alert("Invalid OTP"); }
  };

  const handleMasterLogin = async () => {
      try {
          const res = await axios.post(`${BACKEND_URL}/api/auth/login-master`, { email: contactValue, password: masterPassword });
          loginSuccess(res.data);
      } catch(e) { alert("Invalid Credentials"); }
  };

  const loginSuccess = (data) => {
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      setUser(data.user);
      setShowAuthModal(false);
      // Reset Auth State
      setAuthStep(1); setContactValue(""); setOtpValue(""); setNewUsername(""); setMasterPassword("");
  };

  const logout = () => { localStorage.removeItem("token"); localStorage.removeItem("user"); setUser(null); setActiveTab("home"); };
  const joinMatch = (matchData) => { setMatch(matchData); setShowSearch(false); socket.emit("join_match", matchData._id); setActiveTab("live"); };
  const openDetailView = (m) => { setDetailMatch(m); setShowSearch(false); setDetailViewMode("summary"); setActiveTab("detail"); };

  const addPlayer = (team) => {
    if (!tempPlayerName) return;
    const newPlayer = { name: tempPlayerName, role: playerRole, isCaptain, isVC, isWK, isOut: false, oversBowled: 0 };
    if (team === 'A') setTeamASquad([...teamASquad, newPlayer]); else setTeamBSquad([...teamBSquad, newPlayer]);
    setTempPlayerName(""); setIsCaptain(false); setIsVC(false); setIsWK(false); setPlayerRole("Batsman");
  };

  const nextStep = () => {
      if (step === 1 && (!teamAName || !teamBName)) return alert("Enter Team Names");
      if (step === 2 && teamASquad.length < 2) return alert(`Add at least 2 players for ${teamAName}`);
      if (step === 3 && teamBSquad.length < 2) return alert(`Add at least 2 players for ${teamBName}`);
      setStep(step + 1);
  };

  const securePost = async (url, data) => {
      const token = localStorage.getItem("token");
      try { await axios.post(url, data, { headers: { Authorization: `Bearer ${token}` } }); } 
      catch (e) { 
          if(e.response?.status === 403) alert("⚠️ Access Denied: You are not the scorer for this match!"); 
          else alert("Action failed"); 
      }
  };

  const startMatch = async () => {
    if (!selectedStriker || !selectedNonStriker || !selectedBowler) return alert("Select all openers");
    if (!tossWinner) return alert("Select Toss Winner");
    const token = localStorage.getItem("token");
    try {
      const res = await axios.post(`${BACKEND_URL}/api/match/start`, {
        teamAName, teamBName, teamASquad, teamBSquad, totalOvers, seriesName,
        tossWinner, tossDecision,
        striker: selectedStriker, nonStriker: selectedNonStriker, openingBowler: selectedBowler
      }, { headers: { Authorization: `Bearer ${token}` } });
      joinMatch(res.data); fetchAllMatches();
    } catch (e) { alert("Setup failed"); }
  };

  const deleteMatch = async (id, e) => {
      e.stopPropagation(); if(!confirm("Delete this match?")) return;
      const token = localStorage.getItem("token");
      try { await axios.delete(`${BACKEND_URL}/api/match/${id}`, { headers: { Authorization: `Bearer ${token}` } }); fetchMyMatches(); fetchAllMatches(); } catch(e) { alert("Delete failed"); }
  };

  const startSecondInnings = async () => {
    if (!striker2 || !nonStriker2 || !bowler2) return alert("Select all players");
    await securePost(`${BACKEND_URL}/api/match/start-second-innings`, { matchId: match._id, striker: striker2, nonStriker: nonStriker2, openingBowler: bowler2 });
  };

  const initiateScoreUpdate = (runs, isWicket, isWide, wicketType = "") => {
      setPendingScore({ runs, isWicket, isWide, wicketType });
      setShotType(""); setCommText("");
      setShowCommModal(true); 
  };

  const confirmScoreUpdate = async () => {
      if (!match || !pendingScore) return;
      const payload = { matchId: match._id, ...pendingScore, shotType, commText };
      await securePost(`${BACKEND_URL}/api/match/update`, payload); 
      setShowCommModal(false); setShowWicketType(false);
  };

  const undoLastBall = async () => { if (!match) return; await securePost(`${BACKEND_URL}/api/match/undo`, { matchId: match._id }); };
  const changeBowler = async (name) => { await securePost(`${BACKEND_URL}/api/match/new-bowler`, { matchId: match._id, bowlerName: name }); setShowBowlerChange(false); };
  const changeBatter = async (name) => { await securePost(`${BACKEND_URL}/api/match/new-batter`, { matchId: match._id, batterName: name }); };

  const fetchPlayerStats = async (queryName) => {
      if(!queryName) return;
      setInsightLoading(true);
      setPlayerStats(null);
      try { 
          const res = await axios.get(`${BACKEND_URL}/api/stats/full/${queryName}`); 
          setPlayerStats(res.data); 
      } catch(e) { 
          if(activeTab === 'insights') alert("Player not found in database.");
      } finally {
          setInsightLoading(false);
      }
  };

  const getStoreProducts = () => {
      if(storeCategory === 'all') return PRODUCTS;
      return PRODUCTS.filter(p => p.category === storeCategory);
  };

  const liveGroups = liveMatches.reduce((groups, m) => { const series = m.seriesName || "Friendly"; if(!groups[series]) groups[series] = []; groups[series].push(m); return groups; }, {});
  const pastGroups = pastMatches.reduce((groups, m) => { const series = m.seriesName || "Friendly"; if(!groups[series]) groups[series] = []; groups[series].push(m); return groups; }, {});

  const getFilteredMatches = () => {
      const allMatches = [...liveMatches, ...pastMatches];
      if (!searchQuery) return [];
      return allMatches.filter(m => {
          if (searchCategory === "tournament") {
              return m.seriesName?.toLowerCase().includes(searchQuery.toLowerCase());
          } else if (searchCategory === "matches") {
              return m.teamA?.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                     m.teamB?.name.toLowerCase().includes(searchQuery.toLowerCase());
          }
          return false;
      });
  };

  const MatchCard = ({ m, isLive }) => {
      const formatType = (m.matchSettings?.totalOvers || 20) <= 20 ? "T20" : "ODI";
      return (
        <div onClick={() => isLive ? joinMatch(m) : openDetailView(m)} className="min-w-[280px] bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition cursor-pointer snap-start">
            <div className="flex justify-between items-start mb-3 border-b border-gray-100 pb-2">
                <span className="text-[10px] font-bold text-gray-500 uppercase truncate max-w-[180px]">{m.seriesName}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${formatType === 'T20' ? 'bg-black text-white' : 'bg-blue-100 text-blue-700'}`}>{formatType}</span>
            </div>
            <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-[10px] text-white font-bold">{m.teamA?.name?.substring(0,1)}</div>
                        <span className="font-bold text-gray-900 text-sm">{m.teamA?.name}</span>
                    </div>
                    {isLive && m.innings === 2 && <span className="font-mono text-sm font-bold text-gray-900">{m.score?.runs}/{m.score?.wickets}</span>}
                    {!isLive && <span className="font-mono text-sm font-bold text-gray-500">{m.score?.runs}/{m.score?.wickets}</span>}
                </div>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center text-[10px] text-white font-bold">{m.teamB?.name?.substring(0,1)}</div>
                        <span className="font-bold text-gray-900 text-sm">{m.teamB?.name}</span>
                    </div>
                    {isLive && m.innings === 1 && <span className="font-mono text-sm font-bold text-gray-900">{m.score?.runs}/{m.score?.wickets}</span>}
                    {!isLive && <span className="font-mono text-sm font-bold text-gray-500">{m.innings1Score?.runs || 0}/{m.innings1Score?.wickets || 0}</span>}
                </div>
            </div>
            <div className="text-xs font-medium pt-2 border-t border-gray-100">
                {isLive ? (
                    <span className="text-red-600 flex items-center gap-1 animate-pulse"><div className="w-2 h-2 bg-red-600 rounded-full"></div> Live • {m.score?.overs}.{m.score?.balls} Overs</span>
                ) : (
                    <span className="text-blue-600">{m.resultMsg || "Match Completed"}</span>
                )}
            </div>
        </div>
      );
  };

  const Scorecard = ({ teamName, squad }) => (
      <div className="bg-[#1F2937] p-4 rounded-xl border border-gray-700">
          <h3 className="text-white font-bold mb-3 border-b border-gray-600 pb-2">{teamName} Batting</h3>
          <table className="w-full text-left text-sm">
              <thead><tr className="text-gray-500 text-xs uppercase"><th className="pb-2">Batter</th><th className="pb-2">R</th><th className="pb-2">B</th><th className="pb-2">SR</th></tr></thead>
              <tbody className="text-gray-300">
                  {squad.map((p, i) => {
                      const sr = p.ballsFaced > 0 ? ((p.runsScored / p.ballsFaced) * 100).toFixed(0) : 0;
                      return (<tr key={i} className="border-b border-gray-800"><td className="py-2 font-medium flex flex-col"><span>{p.name} {p.isCaptain && '(C)'} {p.isWK && '(WK)'}</span><span className="text-[10px] text-red-400">{p.isOut ? (p.howOut || "out") : "not out"}</span></td><td className="py-2 font-bold text-white">{p.runsScored || 0}</td><td className="py-2">{p.ballsFaced || 0}</td><td className="py-2">{sr}</td></tr>);
                  })}
              </tbody>
          </table>
          <h3 className="text-white font-bold mt-6 mb-3 border-b border-gray-600 pb-2">Bowling</h3>
          <table className="w-full text-left text-sm">
              <thead><tr className="text-gray-500 text-xs uppercase"><th className="pb-2">Bowler</th><th className="pb-2">O</th><th className="pb-2">R</th><th className="pb-2">W</th><th className="pb-2">Eco</th></tr></thead>
              <tbody className="text-gray-300">
                  {squad.filter(p => (p.oversBowled || 0) > 0).map((p, i) => (<tr key={i} className="border-b border-gray-800"><td className="py-2 font-medium">{p.name}</td><td className="py-2">{p.oversBowled}</td><td className="py-2">{p.runsConceded || 0}</td><td className="py-2 font-bold text-white">{p.wicketsTaken || 0}</td><td className="py-2">{(p.runsConceded / (p.oversBowled || 1)).toFixed(1)}</td></tr>))}
              </tbody>
          </table>
      </div>
  );

  const BottomNav = () => (
    <div className="fixed bottom-0 w-full bg-white border-t border-gray-200 p-2 flex justify-around items-center z-50 safe-area-bottom shadow-lg text-gray-700">
      <button onClick={() => { setActiveTab("home"); fetchAllMatches(); }} className={`flex flex-col items-center ${activeTab === 'home' ? 'text-red-600' : 'text-gray-400'}`}><Home size={22} /><span className="text-[10px] mt-1 font-bold">Home</span></button>
      <button onClick={() => { setActiveTab("live"); setMatch(null); }} className={`flex flex-col items-center ${activeTab === 'live' ? 'text-red-600' : 'text-gray-400'}`}><Activity size={22} /><span className="text-[10px] mt-1 font-bold">Live</span></button>
      {user ? <button onClick={() => { setStep(1); setTeamASquad([]); setTeamBSquad([]); setActiveTab("setup"); }} className="bg-red-600 -mt-8 p-4 rounded-full border-4 border-white shadow-xl"><Plus size={28} color="white" /></button> : <div className="w-12"></div>}
      <button onClick={() => { setActiveTab("my_matches"); fetchMyMatches(); }} className={`flex flex-col items-center ${activeTab === 'my_matches' ? 'text-red-600' : 'text-gray-400'}`}><Trophy size={22} /><span className="text-[10px] mt-1 font-bold">My Games</span></button>
      <button onClick={() => setShowMenu(true)} className="flex flex-col items-center text-gray-400"><Menu size={22} /><span className="text-[10px] mt-1 font-bold">More</span></button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans pb-24 selection:bg-red-500 selection:text-white">
      {/* HEADER */}
      <div className="fixed top-0 w-full bg-white shadow-sm p-4 z-40 flex justify-between items-center border-b border-gray-200">
         <div className="flex items-center gap-2"><div className="bg-red-600 w-8 h-8 rounded-lg flex items-center justify-center shadow-lg"><Flame size={20} color="white"/></div><h1 className="font-black text-xl text-gray-800 tracking-tight">Cric<span className="text-red-600">Mad</span></h1></div>
         
         <div className="flex items-center gap-3">
             <button onClick={() => setShowSearch(true)} className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full text-gray-600 hover:bg-gray-200 transition"><Search size={18}/></button>
             {user ? <div className="flex items-center gap-2"><span className="text-xs text-gray-600 font-bold bg-gray-100 px-3 py-1 rounded-full">{user.name}</span><button onClick={logout} className="text-gray-400 hover:text-red-600"><Lock size={18} /></button></div> : <button onClick={() => { setShowAuthModal(true); setIsMasterLogin(false); setAuthStep(1); }} className="bg-red-600 hover:bg-red-700 text-white px-4 py-1.5 rounded-full text-xs font-bold transition shadow-md">Login</button>}
         </div>
      </div>

      {/* AUTH MODAL (OTP UPDATE) */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white p-8 rounded-3xl w-full max-w-sm text-center shadow-2xl relative">
                <button onClick={() => setShowAuthModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-black"><X size={20}/></button>
                <h3 className="text-gray-900 font-black text-2xl mb-1">{isMasterLogin ? "Master Login" : "Welcome Back"}</h3>
                <p className="text-xs text-gray-500 mb-6">{isMasterLogin ? "Super Admin Access" : "Login with OTP"}</p>

                {isMasterLogin ? (
                    // --- MASTER PASSWORD LOGIN ---
                    <div className="space-y-3">
                        <input className="w-full p-3 bg-gray-50 rounded-xl text-black border border-gray-200" placeholder="Master Email" value={contactValue} onChange={e => setContactValue(e.target.value)} />
                        <input type="password" className="w-full p-3 bg-gray-50 rounded-xl text-black border border-gray-200" placeholder="Password" value={masterPassword} onChange={e => setMasterPassword(e.target.value)} />
                        <button onClick={handleMasterLogin} className="w-full bg-black text-white p-3 rounded-xl font-bold shadow-lg">Login as Master</button>
                        <button onClick={() => setIsMasterLogin(false)} className="text-xs text-gray-500 underline">Back to User Login</button>
                    </div>
                ) : (
                    // --- OTP LOGIN FLOW ---
                    <div className="space-y-3">
                        {authStep === 1 && (
                            <>
                                <div className="flex bg-gray-100 rounded-lg p-1 mb-2">
                                    <button onClick={() => setContactType("email")} className={`flex-1 py-1 text-xs font-bold rounded-md ${contactType==="email" ? "bg-white shadow text-black" : "text-gray-500"}`}>Email</button>
                                    <button onClick={() => setContactType("mobile")} className={`flex-1 py-1 text-xs font-bold rounded-md ${contactType==="mobile" ? "bg-white shadow text-black" : "text-gray-500"}`}>Mobile</button>
                                </div>
                                <input className="w-full p-3 bg-gray-50 rounded-xl text-black border border-gray-200" placeholder={contactType === "email" ? "Enter Email" : "Enter Mobile Number"} value={contactValue} onChange={e => setContactValue(e.target.value)} />
                                <button onClick={handleSendOtp} className="w-full bg-red-600 hover:bg-red-700 text-white p-3 rounded-xl font-bold shadow-lg transition">Get OTP</button>
                            </>
                        )}
                        {authStep === 2 && (
                            <>
                                <p className="text-xs text-green-600 font-bold">OTP Sent to {contactValue}</p>
                                <input className="w-full p-3 bg-gray-50 rounded-xl text-black border border-gray-200 text-center font-mono text-lg tracking-widest" placeholder="XXXXXX" value={otpValue} onChange={e => setOtpValue(e.target.value)} maxLength={6} />
                                <button onClick={handleVerifyOtp} className="w-full bg-green-600 hover:bg-green-700 text-white p-3 rounded-xl font-bold shadow-lg transition">Verify & Login</button>
                            </>
                        )}
                        {authStep === 3 && (
                            <>
                                <p className="text-xs text-blue-600 font-bold">New Account! Pick a Username</p>
                                <input className="w-full p-3 bg-gray-50 rounded-xl text-black border border-gray-200" placeholder="Username" value={newUsername} onChange={e => setNewUsername(e.target.value)} />
                                <button onClick={handleVerifyOtp} className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-xl font-bold shadow-lg transition">Complete Signup</button>
                            </>
                        )}
                        {authStep === 1 && <button onClick={() => { setIsMasterLogin(true); setContactValue(""); }} className="text-xs text-gray-400 font-bold mt-4 flex items-center justify-center gap-1 w-full"><Key size={12}/> Master Login</button>}
                    </div>
                )}
            </div>
        </div>
      )}

      {/* GLOBAL SEARCH OVERLAY */}
      {showSearch && (
        <div className="fixed inset-0 bg-white z-50 p-4 animate-in fade-in slide-in-from-top-10 duration-200">
            <div className="flex items-center gap-3 mb-6">
                <Search className="text-gray-400"/>
                <input className="flex-1 text-lg font-bold outline-none text-gray-900 placeholder-gray-300" placeholder="Search..." autoFocus value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                <button onClick={() => {setShowSearch(false); setSearchQuery(""); setPlayerStats(null);}} className="text-gray-500 hover:text-black font-bold text-sm">Cancel</button>
            </div>
            
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                {["Matches", "Tournament", "Player"].map(cat => (
                    <button key={cat} onClick={() => { setSearchCategory(cat.toLowerCase()); setSearchQuery(""); setPlayerStats(null); }} className={`px-4 py-2 rounded-full text-sm font-bold border transition ${searchCategory === cat.toLowerCase() ? 'bg-black text-white border-black' : 'bg-white text-gray-500 border-gray-200'}`}>
                        {cat}
                    </button>
                ))}
            </div>

            <div className="space-y-4">
                {searchCategory === 'player' ? (
                    <div>
                        <div className="flex gap-2 mb-4"><input className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200" placeholder="Enter full player name..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} /><button onClick={() => fetchPlayerStats(searchQuery)} className="bg-red-600 text-white px-4 rounded-xl font-bold">Go</button></div>
                        {playerStats && (
                            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xl">
                                <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-3 flex items-center justify-center text-2xl">👤</div>
                                <h3 className="text-xl font-bold text-center mb-4">{playerStats.name || "Unknown"}</h3>
                                <div className="grid grid-cols-3 gap-2 text-center">
                                    <div className="bg-gray-50 p-2 rounded-lg"><p className="text-[10px] text-gray-500">MAT</p><p className="font-bold">{playerStats.matches}</p></div>
                                    <div className="bg-gray-50 p-2 rounded-lg"><p className="text-[10px] text-gray-500">RUNS</p><p className="font-bold text-blue-600">{playerStats.runs}</p></div>
                                    <div className="bg-gray-50 p-2 rounded-lg"><p className="text-[10px] text-gray-500">WKT</p><p className="font-bold text-green-600">{playerStats.wickets}</p></div>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-3">
                        {getFilteredMatches().length > 0 ? getFilteredMatches().map(m => (
                            <div key={m._id} onClick={() => isLive ? joinMatch(m) : openDetailView(m)} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 cursor-pointer hover:bg-white hover:shadow-md transition">
                                <div><p className="text-xs text-gray-400 font-bold uppercase">{m.seriesName}</p><p className="font-bold text-gray-900">{m.teamA?.name} vs {m.teamB?.name}</p></div>
                                <ChevronRight size={16} className="text-gray-400"/>
                            </div>
                        )) : searchQuery && <p className="text-center text-gray-400 mt-10">No results found.</p>}
                    </div>
                )}
            </div>
        </div>
      )}

      {/* --- STORE TAB (NEW FEATURE) --- */}
      {activeTab === 'store' && (
        <div className="pt-20 px-4 pb-20 bg-gray-50 min-h-screen">
            {/* Store Header */}
            <div className="flex items-center justify-between mb-6">
                <button onClick={() => setActiveTab('home')} className="bg-white p-2 rounded-full border border-gray-200 shadow-sm"><ArrowLeft size={20}/></button>
                <h1 className="text-xl font-black text-gray-900 flex items-center gap-2">CricMad Store</h1>
                <div className="relative">
                    <ShoppingBag className="text-gray-900"/>
                    <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full font-bold">2</span>
                </div>
            </div>

            {/* Promo Banner */}
            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl p-6 text-white mb-8 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 opacity-20"><Tag size={120} /></div>
                <h2 className="text-3xl font-black mb-1 relative z-10">Season Sale</h2>
                <p className="text-yellow-100 font-bold mb-4 relative z-10">Flat 50% Off on Kits</p>
                <button className="bg-white text-orange-600 px-4 py-2 rounded-lg text-xs font-bold shadow-sm relative z-10">Shop Now</button>
            </div>

            {/* Category Filter */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
                {['All', 'Bats', 'Balls', 'Jerseys', 'Football', 'Kits'].map(cat => (
                    <button key={cat} onClick={() => setStoreCategory(cat.toLowerCase())} className={`px-5 py-2 rounded-full text-xs font-bold border whitespace-nowrap transition ${storeCategory === cat.toLowerCase() ? 'bg-black text-white border-black' : 'bg-white text-gray-500 border-gray-200'}`}>
                        {cat}
                    </button>
                ))}
            </div>

            {/* Product Grid */}
            <div className="grid grid-cols-2 gap-4">
                {getStoreProducts().map(item => (
                    <div key={item.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-lg transition">
                        <div className="h-32 bg-gray-50 rounded-lg mb-3 flex items-center justify-center text-5xl">{item.img}</div>
                        <div className="flex items-center gap-1 mb-1">
                            <Star size={12} className="text-yellow-400 fill-yellow-400"/>
                            <span className="text-[10px] font-bold text-gray-500">{item.rating}</span>
                        </div>
                        <h3 className="font-bold text-sm text-gray-900 leading-tight mb-2 h-10 overflow-hidden">{item.name}</h3>
                        <div className="flex items-center justify-between">
                            <span className="font-black text-lg text-gray-900">{item.price}</span>
                            <button onClick={() => alert('Added to cart!')} className="bg-black text-white p-2 rounded-lg hover:bg-gray-800"><ShoppingCart size={16}/></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      )}

      {/* --- INSIGHTS TAB (NEW FEATURE) --- */}
      {activeTab === 'insights' && (
        <div className="pt-20 px-4 pb-20 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <button onClick={() => setActiveTab('home')} className="bg-white p-2 rounded-full border border-gray-200 shadow-sm"><ArrowLeft size={20}/></button>
                <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2"><BarChart2 className="text-purple-600"/> CricInsights</h1>
            </div>

            {/* Search Box */}
            <div className="bg-white p-2 rounded-2xl shadow-sm border border-gray-200 flex gap-2 mb-8">
                <input className="flex-1 p-3 outline-none text-gray-900 font-medium" placeholder="Search Player Name (e.g. Virat)" value={insightQuery} onChange={e => setInsightQuery(e.target.value)}/>
                <button onClick={() => fetchPlayerStats(insightQuery)} className="bg-purple-600 text-white p-3 rounded-xl hover:bg-purple-700 transition shadow-lg">{insightLoading ? <RefreshCw className="animate-spin"/> : <Search />}</button>
            </div>

            {/* Results Area */}
            {playerStats ? (
                <div className="animate-in slide-in-from-bottom-5 fade-in duration-500">
                    {/* Profile Card */}
                    <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 mb-6 text-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-purple-500 to-indigo-600 opacity-20"></div>
                        <div className="w-24 h-24 bg-white rounded-full mx-auto mb-4 flex items-center justify-center text-4xl shadow-md relative z-10 border-4 border-purple-50">👤</div>
                        <h2 className="text-2xl font-black text-gray-900 mb-1">{playerStats.name}</h2>
                        <p className="text-sm text-green-600 font-bold bg-green-50 inline-block px-3 py-1 rounded-full mb-6">Available to Play</p>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                <p className="text-xs text-gray-400 font-bold uppercase mb-1">Matches</p>
                                <p className="text-3xl font-black text-gray-900">{playerStats.matches}</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                <p className="text-xs text-gray-400 font-bold uppercase mb-1">High Score</p>
                                <p className="text-3xl font-black text-yellow-600">{Math.max(...(playerStats.recentScores || [0]))}</p>
                            </div>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100">
                            <div className="flex items-center gap-2 mb-2 text-blue-600"><Target size={18}/><span className="font-bold text-sm">Total Runs</span></div>
                            <p className="text-3xl font-black text-gray-900">{playerStats.runs}</p>
                        </div>
                        <div className="bg-red-50 p-5 rounded-2xl border border-red-100">
                            <div className="flex items-center gap-2 mb-2 text-red-600"><Zap size={18}/><span className="font-bold text-sm">Wickets</span></div>
                            <p className="text-3xl font-black text-gray-900">{playerStats.wickets}</p>
                        </div>
                    </div>

                    {/* Recent Form Graph */}
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                        <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2"><TrendingUp className="text-green-600"/> Recent Form</h3>
                        <div className="flex items-end justify-between h-32 gap-2">
                            {playerStats.recentScores && playerStats.recentScores.length > 0 ? playerStats.recentScores.map((score, i) => (
                                <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                                    <span className="text-xs font-bold text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity mb-1">{score}</span>
                                    <div className="w-full bg-purple-200 rounded-t-lg hover:bg-purple-500 transition-colors relative" style={{ height: `${Math.max(score, 10)}%` }}></div>
                                    <span className="text-[10px] text-gray-400 font-bold">M{i+1}</span>
                                </div>
                            )) : <div className="text-gray-400 text-sm w-full text-center">No recent data available.</div>}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="text-center mt-20 opacity-50">
                    <BarChart2 size={60} className="mx-auto mb-4 text-gray-300"/>
                    <p className="text-gray-400 font-bold">Search a player to see analytics</p>
                </div>
            )}
        </div>
      )}

      {/* --- CONTACT SUPPORT TAB (NEW & ATTRACTIVE) --- */}
      {activeTab === 'contact' && (
        <div className="pt-20 px-4 pb-20">
            {/* Header Gradient */}
            <div className="bg-gradient-to-r from-red-600 to-rose-800 rounded-3xl p-8 text-white mb-8 text-center shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 opacity-10"><Phone size={200} /></div>
                <button onClick={() => setActiveTab('home')} className="absolute top-4 left-4 text-white/70 hover:text-white"><ArrowLeft /></button>
                <h1 className="text-3xl font-black mb-2 relative z-10">Contact Us</h1>
                <p className="text-red-100 relative z-10">Need help? Tell us more & we'll assist you.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Card 1: Association */}
                <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                    <div className="bg-blue-50 w-14 h-14 rounded-full flex items-center justify-center mb-4 text-blue-600"><Handshake size={28}/></div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">Association</h3>
                    <p className="text-sm text-gray-500 mb-4">For partnering with us</p>
                    <div className="space-y-2 mb-6 text-sm text-gray-600">
                        <p className="flex items-center gap-2"><Mail size={14} className="text-gray-400"/> partners@cricmad.in</p>
                        <p className="flex items-center gap-2"><Phone size={14} className="text-gray-400"/> +91 9876543210</p>
                    </div>
                    <button className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold shadow-lg shadow-blue-200 transition active:scale-95">Book a Demo</button>
                </div>

                {/* Card 2: Support */}
                <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                    <div className="bg-green-50 w-14 h-14 rounded-full flex items-center justify-center mb-4 text-green-600"><LifeBuoy size={28}/></div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">Support</h3>
                    <p className="text-sm text-gray-500 mb-4">For player queries</p>
                    <div className="space-y-2 mb-6 text-sm text-gray-600">
                        <p className="flex items-center gap-2"><Mail size={14} className="text-gray-400"/> support@cricmad.in</p>
                        <p className="flex items-center gap-2"><Phone size={14} className="text-gray-400"/> +91 8141665555</p>
                    </div>
                    <button className="w-full py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold shadow-lg shadow-green-200 transition active:scale-95 flex items-center justify-center gap-2"><MessageCircle size={18}/> Whatsapp</button>
                </div>

                {/* Card 3: Sales */}
                <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                    <div className="bg-purple-50 w-14 h-14 rounded-full flex items-center justify-center mb-4 text-purple-600"><TrendingUp size={28}/></div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">Sales</h3>
                    <p className="text-sm text-gray-500 mb-4">For growing with us</p>
                    <div className="space-y-2 mb-6 text-sm text-gray-600">
                        <p className="flex items-center gap-2"><Mail size={14} className="text-gray-400"/> sales@cricmad.in</p>
                        <p className="flex items-center gap-2"><Phone size={14} className="text-gray-400"/> +91 8141665533</p>
                    </div>
                    <button className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold shadow-lg shadow-purple-200 transition active:scale-95 flex items-center justify-center gap-2"><MessageCircle size={18}/> Whatsapp</button>
                </div>
            </div>
        </div>
      )}

      {/* --- HOME TAB (REARRANGED LAYOUT) --- */}
      {activeTab === 'home' && (
        <div className="pt-16 pb-20">
           {/* 1. HERO SECTION */}
           <div className="bg-gradient-to-br from-[#d32f2f] to-[#b71c1c] text-white pt-10 pb-16 px-6 rounded-b-[40px] shadow-2xl mb-10 relative overflow-hidden">
               <div className="absolute top-0 right-0 opacity-10"><Trophy size={300} /></div>
               <div className="relative z-10">
                   <h1 className="text-4xl font-black mb-4 leading-tight">We make grassroots cricketers <span className="text-yellow-400">heroes</span>; one match at a time.</h1>
                   <p className="text-red-100 mb-8 font-medium text-sm">Download the award winning app and start scoring for free.</p>
                   <div className="flex gap-3">
                       <button className="bg-black text-white px-5 py-2 rounded-lg flex items-center gap-2 text-xs font-bold shadow-lg border border-gray-800"><img src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" className="h-6" alt="Play Store"/></button>
                       <button className="bg-black text-white px-5 py-2 rounded-lg flex items-center gap-2 text-xs font-bold shadow-lg border border-gray-800"><span className="text-xl"></span> App Store</button>
                   </div>
               </div>
           </div>

           {/* 2. LIVE MATCHES (COMPACT SCROLLING CARDS) */}
           <div className="px-4 mb-8">
               <div className="flex items-center justify-between mb-4">
                   <h3 className="text-gray-900 font-bold flex items-center gap-2"><Activity size={18} className="text-red-600"/> Live Now</h3>
                   {liveMatches.length > 0 && <span className="text-xs text-red-600 font-bold animate-pulse">● {liveMatches.length} Live</span>}
               </div>
               
               {/* Horizontal Scroll Container */}
               {liveMatches.length > 0 ? (
                   <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
                       {liveMatches.map((m) => <MatchCard key={m._id} m={m} isLive={true} />)}
                   </div>
               ) : (
                   <div className="text-center p-6 bg-white rounded-2xl border border-dashed border-gray-300"><p className="text-gray-400 text-sm font-medium">No live matches.</p></div>
               )}
           </div>

           {/* 3. FEATURES SECTION (Why CricMad?) */}
           <div className="px-6 mb-12">
               <h2 className="text-2xl font-black text-center text-gray-900 mb-8">Why CricMad?</h2>
               <div className="space-y-8">
                   <div className="flex gap-4 items-start">
                       <span className="text-5xl font-black text-gray-200">01</span>
                       <div>
                           <h3 className="font-bold text-lg text-gray-900">Live Scoring</h3>
                           <p className="text-sm text-gray-500 leading-relaxed">Get instant updates on ongoing matches with professional live scoring, ball by ball.</p>
                       </div>
                   </div>
                   <div className="flex gap-4 items-start">
                       <span className="text-5xl font-black text-gray-200">02</span>
                       <div>
                           <h3 className="font-bold text-lg text-gray-900">Scorecard</h3>
                           <p className="text-sm text-gray-500 leading-relaxed">Explore player performances and match outcomes with a detailed, TV-style scorecard.</p>
                       </div>
                   </div>
                   <div className="flex gap-4 items-start">
                       <span className="text-5xl font-black text-gray-200">03</span>
                       <div>
                           <h3 className="font-bold text-lg text-gray-900">Organise Tournaments</h3>
                           <p className="text-sm text-gray-500 leading-relaxed">Seamlessly organize tournaments, manage teams, and plan your schedules better.</p>
                       </div>
                   </div>
                   <div className="flex gap-4 items-start">
                       <span className="text-5xl font-black text-gray-200">04</span>
                       <div>
                           <h3 className="font-bold text-lg text-gray-900">CricInsights</h3>
                           <p className="text-sm text-gray-500 leading-relaxed">Get in-depth analysis of matches, players and opponents with AI-driven insights.</p>
                       </div>
                   </div>
               </div>
           </div>

           {/* 4. RECENT MATCHES (COMPACT SCROLLING CARDS) */}
           <div className="px-4">
               <h3 className="text-gray-900 font-bold mb-4 flex items-center gap-2"><Clock size={18} className="text-blue-600"/> Recent Results</h3>
               {pastMatches.length > 0 ? (
                   <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
                       {pastMatches.map((m) => <MatchCard key={m._id} m={m} isLive={false} />)}
                   </div>
               ) : (
                   <div className="text-gray-500 text-sm text-center">No completed matches.</div>
               )}
           </div>

           {/* JOIN TEAM FOOTER */}
           <div className="mt-12 bg-white p-8 text-center border-t border-gray-200">
               <div className="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"><Users className="text-red-600"/></div>
               <h3 className="text-xl font-bold text-gray-900 mb-2">Join CricMad Team</h3>
               <p className="text-sm text-gray-500 mb-6">Love technology & sports? Check available spots and apply.</p>
               <button className="bg-teal-600 text-white font-bold py-3 px-6 rounded-lg text-sm shadow-lg hover:bg-teal-700 transition">Check Available Spots</button>
           </div>
        </div>
      )}

      {/* --- MY MATCHES TAB (Updated UI) --- */}
      {activeTab === 'my_matches' && (
          <div className="pt-24 px-4 pb-20">
              <h2 className="text-2xl font-black text-gray-900 mb-6">My Matches</h2>
              {!user ? <div className="text-center text-gray-500 p-10 bg-white rounded-2xl shadow-sm border border-gray-200">Please login to manage your matches.</div> :
               myMatches.length === 0 ? <div className="text-center text-gray-500 p-10 bg-white rounded-2xl shadow-sm border border-gray-200">You haven't created any matches yet.</div> :
               myMatches.map(m => (
                   <div key={m._id} onClick={() => joinMatch(m)} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-3 flex justify-between items-center cursor-pointer hover:border-blue-500 group">
                       <div><p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">{m.seriesName}</p><p className="font-bold text-gray-900">{m.teamA?.name} vs {m.teamB?.name}</p><p className="text-xs text-green-600 font-bold mt-1">{m.status.toUpperCase()}</p></div><button onClick={(e) => deleteMatch(m._id, e)} className="p-2 bg-red-50 rounded-full text-red-500 hover:bg-red-600 hover:text-white transition border border-red-100"><Trash2 size={16} /></button>
                   </div>
               ))
              }
          </div>
      )}

      {/* DETAIL VIEW (Updated Colors) */}
      {activeTab === 'detail' && detailMatch && (
        <div className="pt-20 px-4 pb-20 bg-gray-50 min-h-screen">
           <button onClick={() => setActiveTab("home")} className="flex items-center gap-2 text-gray-500 mb-4 hover:text-black font-bold text-sm"><ArrowLeft size={16} /> Back</button>
           <div className="bg-white p-6 rounded-3xl text-center mb-6 shadow-xl border border-gray-100"><div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">🏆</div><h1 className="text-2xl font-black text-gray-900">{detailMatch.winner} Won</h1><p className="text-gray-500 font-medium text-sm mb-6">{detailMatch.resultMsg}</p><div className="grid grid-cols-2 gap-4 text-left bg-gray-50 p-4 rounded-2xl border border-gray-100"><div><p className="text-[10px] text-gray-400 uppercase font-bold">1st Innings</p><p className="font-bold text-gray-900 text-lg">{detailMatch.teamB?.name}</p><p className="text-xl text-gray-600 font-mono">{detailMatch.innings1Score?.runs}/{detailMatch.innings1Score?.wickets}</p></div><div className="text-right"><p className="text-[10px] text-gray-400 uppercase font-bold">2nd Innings</p><p className="font-bold text-gray-900 text-lg">{detailMatch.teamA?.name}</p><p className="text-xl text-gray-600 font-mono">{detailMatch.score?.runs}/{detailMatch.score?.wickets}</p></div></div></div>
           <div className="flex gap-2 mb-4 overflow-x-auto pb-2"><button onClick={() => setDetailViewMode("summary")} className={`px-5 py-2 rounded-full text-xs font-bold whitespace-nowrap shadow-sm transition ${detailViewMode==='summary'?'bg-red-600 text-white':'bg-white text-gray-500 border border-gray-200'}`}>Summary</button><button onClick={() => setDetailViewMode("scorecardA")} className={`px-5 py-2 rounded-full text-xs font-bold whitespace-nowrap shadow-sm transition ${detailViewMode==='scorecardA'?'bg-red-600 text-white':'bg-white text-gray-500 border border-gray-200'}`}>{detailMatch.teamA?.name}</button><button onClick={() => setDetailViewMode("scorecardB")} className={`px-5 py-2 rounded-full text-xs font-bold whitespace-nowrap shadow-sm transition ${detailViewMode==='scorecardB'?'bg-red-600 text-white':'bg-white text-gray-500 border border-gray-200'}`}>{detailMatch.teamB?.name}</button><button onClick={() => setDetailViewMode("comm")} className={`px-5 py-2 rounded-full text-xs font-bold whitespace-nowrap shadow-sm transition ${detailViewMode==='comm'?'bg-red-600 text-white':'bg-white text-gray-500 border border-gray-200'}`}>Commentary</button></div>
           {detailViewMode === 'summary' && <div className="text-center text-gray-400 text-sm mt-8">Select a scorecard to view detailed stats.</div>}
           {detailViewMode === 'scorecardA' && <Scorecard teamName={detailMatch.teamA?.name} squad={detailMatch.teamA?.squad} />}
           {detailViewMode === 'scorecardB' && <Scorecard teamName={detailMatch.teamB?.name} squad={detailMatch.teamB?.squad} />}
           {detailViewMode === 'comm' && <div className="space-y-3">{detailMatch.commentary && detailMatch.commentary.map((c, i) => (<div key={i} className="flex gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm"><span className="font-black text-gray-900 w-12 text-right">{c.over}</span><span className="text-gray-600 text-sm leading-relaxed">{c.msg}</span></div>))}</div>}
        </div>
      )}

      {/* SETUP TAB (Dark Mode retained for contrast) */}
      {activeTab === 'setup' && user && (
        <div className="pt-24 px-6 pb-20 bg-[#111827] min-h-screen text-white fixed inset-0 overflow-y-auto z-50">
           <button onClick={() => setActiveTab("home")} className="absolute top-6 left-6 text-gray-400"><X/></button>
           <div className="flex items-center gap-3 mb-8"><span className="bg-red-600 text-white w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold shadow-lg shadow-red-500/50">{step}</span><h2 className="text-2xl font-bold text-white">Match Setup</h2></div>
           {step === 1 && <div className="space-y-4"><input className="w-full p-4 bg-[#1F2937] rounded-xl text-white border border-gray-700 focus:border-red-500 outline-none" placeholder="Series Name (e.g. IPL 2025)" value={seriesName} onChange={e => setSeriesName(e.target.value)} /><input className="w-full p-4 bg-[#1F2937] rounded-xl text-white border border-gray-700 focus:border-red-500 outline-none" placeholder="Team A Name" value={teamAName} onChange={e => setTeamAName(e.target.value)} /><input className="w-full p-4 bg-[#1F2937] rounded-xl text-white border border-gray-700 focus:border-red-500 outline-none" placeholder="Team B Name" value={teamBName} onChange={e => setTeamBName(e.target.value)} /><input type="number" className="w-full p-4 bg-[#1F2937] rounded-xl text-white border border-gray-700 focus:border-red-500 outline-none" placeholder="Total Overs" value={totalOvers} onChange={e => setTotalOvers(e.target.value)} /><button className="w-full p-4 bg-red-600 hover:bg-red-700 rounded-xl font-bold mt-4 shadow-lg shadow-red-900/20" onClick={nextStep}>Next Step</button></div>}
           {(step === 2 || step === 3) && <div><h3 className="mb-2 text-gray-400 font-bold uppercase text-xs">Players: {step === 2 ? teamAName : teamBName}</h3><div className="bg-[#1F2937] p-4 rounded-xl mb-4 border border-gray-700"><input className="w-full p-3 bg-[#111827] rounded-lg text-white mb-4 border border-gray-600" value={tempPlayerName} onChange={e => setTempPlayerName(e.target.value)} placeholder="Enter Name" /><div className="flex gap-2 mb-4">{["Batsman", "Bowler", "All Rounder"].map(r => (<button key={r} onClick={() => setPlayerRole(r)} className={`flex-1 py-2 text-[10px] font-bold uppercase rounded-lg border transition ${playerRole === r ? 'bg-white text-black border-white' : 'bg-gray-800 text-gray-500 border-gray-700'}`}>{r}</button>))}</div><div className="flex justify-between mb-4 px-1 text-xs text-gray-300 font-bold"><label className="flex items-center gap-2"><input type="checkbox" checked={isCaptain} onChange={e => setIsCaptain(e.target.checked)} className="accent-red-500"/> CAP</label><label className="flex items-center gap-2"><input type="checkbox" checked={isVC} onChange={e => setIsVC(e.target.checked)} className="accent-red-500"/> VC</label><label className="flex items-center gap-2"><input type="checkbox" checked={isWK} onChange={e => setIsWK(e.target.checked)} className="accent-red-500"/> WK</label></div><button onClick={() => addPlayer(step === 2 ? 'A' : 'B')} className="bg-red-600 w-full p-3 rounded-lg font-bold shadow-lg">Add Player</button></div><div className="h-56 overflow-y-auto bg-[#1F2937] p-2 rounded-xl mb-4 border border-gray-700">{(step === 2 ? teamASquad : teamBSquad).map((p,i) => (<div key={i} className="border-b border-gray-700 p-3 flex justify-between items-center"><span className="font-medium">{p.name}</span><span className="text-[10px] bg-gray-800 px-2 py-1 rounded text-gray-400 font-bold">{p.role.substring(0,3)} {p.isCaptain?'(C)':''}</span></div>))}</div><button className="w-full p-4 bg-white text-black rounded-xl font-bold shadow-lg" onClick={nextStep}>Confirm Squad</button></div>}
           {step === 4 && <div className="space-y-4"><h3 className="text-white font-bold">Toss Time</h3><div className="bg-[#1F2937] p-6 rounded-2xl mb-4 border border-gray-700"><p className="text-gray-400 text-sm mb-3 font-bold uppercase">Who won the toss?</p><div className="flex gap-3 mb-6"><button onClick={() => setTossWinner(teamAName)} className={`flex-1 p-4 rounded-xl border font-bold transition ${tossWinner === teamAName ? 'bg-white text-black border-white' : 'bg-gray-800 text-gray-500 border-gray-700'}`}>{teamAName}</button><button onClick={() => setTossWinner(teamBName)} className={`flex-1 p-4 rounded-xl border font-bold transition ${tossWinner === teamBName ? 'bg-white text-black border-white' : 'bg-gray-800 text-gray-500 border-gray-700'}`}>{teamBName}</button></div><p className="text-gray-400 text-sm mb-3 font-bold uppercase">Decision?</p><div className="flex gap-3"><button onClick={() => setTossDecision("Bat")} className={`flex-1 p-4 rounded-xl border font-bold transition ${tossDecision === "Bat" ? 'bg-green-600 text-white border-green-500' : 'bg-gray-800 text-gray-500 border-gray-700'}`}>Bat 🏏</button><button onClick={() => setTossDecision("Bowl")} className={`flex-1 p-4 rounded-xl border font-bold transition ${tossDecision === "Bowl" ? 'bg-blue-600 text-white border-blue-500' : 'bg-gray-800 text-gray-500 border-gray-700'}`}>Bowl 🎾</button></div></div><button className="w-full p-4 bg-red-600 rounded-xl font-bold mt-4 shadow-lg" onClick={() => setStep(5)}>Next Step</button></div>}
           {step === 5 && <div className="space-y-4"><h3 className="text-white font-bold text-xl">Select Openers</h3>{(() => { const team1Batting = (tossWinner === teamAName && tossDecision === "Bat") || (tossWinner === teamBName && tossDecision === "Bowl"); const battingSquad = team1Batting ? teamASquad : teamBSquad; const bowlingSquad = team1Batting ? teamBSquad : teamASquad; return (<><label className="text-xs text-gray-400 font-bold uppercase">Striker</label><select className="w-full p-4 bg-[#1F2937] rounded-xl text-white border border-gray-700 outline-none" onChange={e => setSelectedStriker(e.target.value)}><option>Select Striker</option>{battingSquad.map(p => <option key={p.name}>{p.name}</option>)}</select><label className="text-xs text-gray-400 font-bold uppercase">Non-Striker</label><select className="w-full p-4 bg-[#1F2937] rounded-xl text-white border border-gray-700 outline-none" onChange={e => setSelectedNonStriker(e.target.value)}><option>Select Non-Striker</option>{battingSquad.map(p => <option key={p.name}>{p.name}</option>)}</select><label className="text-xs text-gray-400 font-bold uppercase">Opening Bowler</label><select className="w-full p-4 bg-[#1F2937] rounded-xl text-white border border-gray-700 outline-none" onChange={e => setSelectedBowler(e.target.value)}><option>Select Bowler</option>{bowlingSquad.map(p => <option key={p.name}>{p.name}</option>)}</select></>); })()}<button className="w-full p-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold mt-6 shadow-lg shadow-green-900/20" onClick={startMatch}>Start Match 🚀</button></div>}
        </div>
      )}

      {/* LIVE MATCH SCORING (Keep Dark Mode for focus) */}
      {activeTab === 'live' && match ? (
        <div className="pt-20 px-4 bg-[#111827] min-h-screen text-white fixed inset-0 overflow-y-auto z-50">
           <button onClick={() => { setMatch(null); setActiveTab("home"); fetchAllMatches(); }} className="flex items-center gap-2 text-gray-400 mb-4 hover:text-white font-bold"><ArrowLeft size={16} /> Exit Match</button>
           <div className="bg-[#1F2937] p-6 rounded-3xl text-center mb-4 border border-gray-700 shadow-xl relative overflow-hidden"><div className="relative z-10"><p className="text-xs text-gray-400 uppercase font-bold mb-2 tracking-widest">{match.teamA?.name} vs {match.teamB?.name}</p><h1 className="text-6xl font-black text-white mb-2 tracking-tighter">{match.score?.runs}/{match.score?.wickets}</h1><p className="text-gray-400 font-mono text-sm">Overs: {match.score?.overs}.{match.score?.balls}</p>{match.innings === 2 && <p className="text-green-400 text-sm font-bold mt-2 uppercase">Target: {match.target}</p>}</div></div>
           {match.currentInnings ? <div className="bg-[#1F2937] p-4 rounded-2xl mb-4 border border-gray-700"><div className="flex justify-between items-center mb-3 p-3 bg-gray-800 rounded-xl border-l-4 border-red-500"><div><p className="font-bold text-white text-xl">{match.currentInnings.striker?.name}</p><p className="text-[10px] text-gray-400 uppercase">Striker</p></div><div className="text-right"><span className="font-bold text-2xl text-white">{match.currentInnings.striker?.runs}</span></div></div><div className="flex justify-between items-center mb-3 p-3 opacity-60"><div><p className="font-bold text-gray-200 text-xl">{match.currentInnings.nonStriker?.name}</p><p className="text-[10px] text-gray-400 uppercase">Non-Striker</p></div><div className="text-right"><span className="font-bold text-2xl text-gray-200">{match.currentInnings.nonStriker?.runs}</span></div></div><div className="border-t border-gray-700 pt-3 flex justify-between items-center px-2"><div><p className="font-bold text-blue-400 text-lg">{match.currentInnings.bowler?.name} {canScore && <button onClick={() => setShowBowlerChange(true)}><RefreshCw size={14} className="ml-2 text-yellow-500"/></button>}</p><p className="text-[10px] text-gray-500 uppercase">Bowler</p></div><div className="text-right"><span className="font-mono text-yellow-500 font-bold text-xl">{match.currentInnings.bowler?.wickets}-{match.currentInnings.bowler?.runs}</span></div></div></div> : <div className="text-center text-white py-10">Loading Data...</div>}
           {/* MODALS */}
           {canScore && showWicketType && (<div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50"><div className="bg-[#1F2937] w-full max-w-sm p-6 rounded-2xl border border-red-500 text-center"><h3 className="text-xl font-bold text-white mb-4">How Wicket Fell?</h3><div className="grid grid-cols-2 gap-3">{["Bowled", "Catch", "LBW", "Run Out", "Stumped", "Hit Wicket"].map(type => (<button key={type} onClick={() => initiateScoreUpdate(0, true, false, type)} className="bg-gray-800 hover:bg-red-600 p-3 rounded-xl font-bold text-white transition border border-gray-600">{type}</button>))}</div><button onClick={() => setShowWicketType(false)} className="mt-4 text-gray-400 underline text-sm">Cancel</button></div></div>)}
           {canScore && showBowlerChange && (<div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50"><div className="bg-[#1F2937] w-full max-w-sm p-6 rounded-2xl border border-blue-500"><h3 className="font-bold text-xl text-blue-400 mb-4 text-center">Change Bowler</h3><div className="grid grid-cols-2 gap-2">{match.teamB?.squad.filter(p => p.name !== match.currentInnings.bowler?.name).map(p => <button key={p.name} onClick={() => changeBowler(p.name)} className="bg-blue-600 p-3 rounded-xl font-bold text-white">{p.name}</button>)}</div><button onClick={() => setShowBowlerChange(false)} className="mt-4 text-gray-400 text-sm block mx-auto">Cancel</button></div></div>)}
           {canScore && showCommModal && (<div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50"><div className="bg-[#1F2937] w-full max-w-sm p-6 rounded-2xl border border-gray-600"><h3 className="text-xl font-bold text-white mb-4">Details</h3><select className="w-full p-3 bg-black rounded text-white mb-3 border border-gray-700" value={shotType} onChange={e => setShotType(e.target.value)}><option value="">Select Shot (Optional)</option> {["Drive", "Pull", "Cut", "Flick", "Sweep", "Lofted", "Edge"].map(s => <option key={s} value={s}>{s}</option>)}</select><input className="w-full p-3 bg-black rounded text-white mb-4 border border-gray-700" placeholder="Add Commentary (Optional)" value={commText} onChange={e => setCommText(e.target.value)} /><button onClick={confirmScoreUpdate} className="w-full bg-green-600 p-3 rounded font-bold">Confirm</button></div></div>)}

           {canScore && match.status !== "completed" && !showWicketType && !showBowlerChange && !showCommModal ? (<>{match.status === "innings_break" ? (<div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50"><div className="bg-[#1F2937] w-full max-w-sm p-8 rounded-3xl border border-yellow-500 text-center"><h2 className="text-3xl font-black text-white uppercase italic mb-4">Innings Break</h2><div className="bg-gray-800 p-4 rounded-xl mb-4"><p className="text-xs font-bold uppercase text-gray-400">Target for {match.teamB?.name}</p><h1 className="text-5xl font-black text-white">{match.score?.runs + 1}</h1></div><button onClick={startSecondInnings} className="w-full bg-green-600 text-white font-bold py-3 px-6 rounded-xl">Start 2nd Innings</button></div></div>) : match.status === "bowler_change" ? (<div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50"><div className="bg-[#1F2937] w-full max-w-sm p-6 rounded-2xl border border-blue-500 animate-pulse"><h3 className="font-bold text-xl text-blue-400 mb-4 text-center">Over Complete!</h3><div className="grid grid-cols-2 gap-2">{match.teamB?.squad.filter(p => p.name !== match.lastBowler).map(p => <button key={p.name} onClick={() => changeBowler(p.name)} className="bg-blue-600 p-3 rounded-xl font-bold text-white">{p.name}</button>)}</div></div></div>) : match.currentInnings.striker?.name === "New Batter" || match.currentInnings.striker?.name === "ALL OUT" ? (<div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50"><div className="bg-[#1F2937] w-full max-w-sm p-6 rounded-2xl border border-red-500"><h3 className="font-bold text-xl text-red-500 mb-2 text-center">WICKET! ☝️</h3><div className="flex flex-col gap-2 max-h-60 overflow-y-auto">{match.teamA?.squad.filter(p => !p.isOut && p.name !== match.currentInnings.nonStriker.name && p.name !== "New Batter").map(p => (<button key={p.name} onClick={() => changeBatter(p.name)} className="bg-gray-800 hover:bg-red-600 p-4 rounded-xl font-bold text-white transition border border-gray-700 flex justify-between"><span>{p.name}</span><span className="text-[10px] text-gray-500">{p.role}</span></button>))}</div></div></div>) : (<div className="grid grid-cols-4 gap-3 mt-4"><button onClick={undoLastBall} className="col-span-4 bg-gray-700 text-gray-300 py-2 rounded-lg font-bold flex items-center justify-center gap-2 mb-2 hover:bg-gray-600"><Undo2 size={16}/> Undo Last Ball</button>{[0,1,2,3].map(r => <button key={r} onClick={() => initiateScoreUpdate(r)} className="bg-gray-800 text-white h-16 rounded-2xl text-xl font-bold border border-gray-700 shadow-lg active:scale-95 transition">{r}</button>)}<button onClick={() => initiateScoreUpdate(4)} className="bg-green-600 text-white h-16 rounded-2xl font-bold text-xl shadow-lg active:scale-95 transition">4</button><button onClick={() => initiateScoreUpdate(6)} className="bg-green-600 text-white h-16 rounded-2xl font-bold text-xl shadow-lg active:scale-95 transition">6</button><button onClick={() => initiateScoreUpdate(1, false, true)} className="bg-orange-500 text-white h-16 rounded-2xl font-bold text-lg shadow-lg active:scale-95 transition">WD</button><button onClick={() => setShowWicketType(true)} className="bg-red-600 text-white h-16 rounded-2xl font-bold text-lg shadow-lg active:scale-95 transition">OUT</button></div>)}</>) : !canScore && match.status !== "completed" ? (<div className="text-center p-4 bg-gray-900 rounded-xl mt-4 border border-gray-700 flex items-center justify-center gap-2"><div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div> <span className="text-gray-400 text-sm">Read Only Mode</span></div>) : null}
           {match.status === "completed" && (<div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50"><div className="bg-[#1F2937] p-8 rounded-3xl border border-yellow-500 text-center w-full max-w-sm"><Trophy size={80} className="mx-auto text-yellow-500 mb-4" /><h2 className="text-3xl font-black text-white uppercase italic mb-2">{match.winner} WON!</h2><p className="text-gray-400 mb-4">{match.resultMsg}</p><button onClick={() => { setActiveTab("home"); fetchAllMatches(); }} className="mt-2 bg-yellow-500 text-black font-bold py-3 px-6 rounded-xl">Back to Home</button></div></div>)}
        </div>
      ) : activeTab === 'live' && <div className="pt-24 text-center text-gray-500">Select a match from Home.</div>}

      <BottomNav />
      {showMenu && <div className="fixed inset-0 bg-black/80 z-50" onClick={() => setShowMenu(false)}><div className="fixed top-0 right-0 h-full w-3/4 bg-white p-6 shadow-2xl" onClick={e => e.stopPropagation()}><div className="flex justify-between items-center mb-8 border-b border-gray-100 pb-4"><h2 className="text-xl font-bold text-gray-900 flex gap-2"><Flame className="text-red-500"/> CricMad Pro</h2><button onClick={() => setShowMenu(false)}><X className="text-gray-400" /></button></div><div className="space-y-6 text-gray-600 font-medium"><div className="flex gap-4 items-center cursor-pointer hover:text-purple-600 transition" onClick={() => { setShowMenu(false); setActiveTab('insights'); }}><BarChart2 /> Insights</div><div className="flex gap-4 items-center cursor-pointer hover:text-orange-500 transition" onClick={() => { setShowMenu(false); setActiveTab('store'); }}><ShoppingBag /> Store</div><div className="flex gap-4 items-center cursor-pointer hover:text-red-600 transition" onClick={() => { setShowMenu(false); setActiveTab('contact'); }}><Phone /> Contact Support</div></div></div></div>}
    </div>
  );
}