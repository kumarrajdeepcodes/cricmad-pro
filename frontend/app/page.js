"use client";
import { useState, useEffect } from "react";
import io from "socket.io-client";
import axios from "axios";
import { Home, Trophy, User, Menu, Plus, X, ShoppingBag, BarChart2, Flame, Bell, Activity, Settings, Lock, Unlock, ArrowLeft, Clock, MessageSquare, Undo2, Search, Phone, Mail, MessageCircle, RefreshCw, ChevronRight, Trash2, Key, Eye } from 'lucide-react';

// --- CONFIGURATION ---
// REPLACE THIS WITH YOUR LAPTOP IP
const BACKEND_URL = "http://192.168.29.252:5000"; 
const socket = io(BACKEND_URL);

export default function App() {
  const [activeTab, setActiveTab] = useState("home");
  const [showMenu, setShowMenu] = useState(false);
  
  // Data State
  const [liveMatches, setLiveMatches] = useState([]); 
  const [pastMatches, setPastMatches] = useState([]); 
  const [myMatches, setMyMatches] = useState([]);
  const [match, setMatch] = useState(null); 
  
  // Auth State
  const [user, setUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");

  // Setup State
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
  
  // Toss State
  const [tossWinner, setTossWinner] = useState("");
  const [tossDecision, setTossDecision] = useState("Bat");

  // Selection State
  const [selectedStriker, setSelectedStriker] = useState("");
  const [selectedNonStriker, setSelectedNonStriker] = useState("");
  const [selectedBowler, setSelectedBowler] = useState("");
  const [striker2, setStriker2] = useState("");
  const [nonStriker2, setNonStriker2] = useState("");
  const [bowler2, setBowler2] = useState("");
  
  // UI State
  const [detailMatch, setDetailMatch] = useState(null);
  const [detailViewMode, setDetailViewMode] = useState("summary");
  const [searchQuery, setSearchQuery] = useState("");
  const [playerStats, setPlayerStats] = useState(null);
  const [showWicketType, setShowWicketType] = useState(false);
  const [showBowlerChange, setShowBowlerChange] = useState(false);

  // --- PERMISSION CHECK ---
  const canScore = user && match && (user.role === 'superadmin' || match.createdBy === user.id);

  useEffect(() => {
    // Restore Session
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
    } catch (e) { console.error("Error fetching matches"); }
  };

  const fetchMyMatches = async () => {
      if(!user) return;
      try {
          const token = localStorage.getItem("token");
          const res = await axios.get(`${BACKEND_URL}/api/matches/my`, { headers: { Authorization: `Bearer ${token}` } });
          setMyMatches(res.data);
      } catch(e) { console.error("Fetch failed"); }
  };

  const handleAuth = async () => {
      const url = authMode === "login" ? `${BACKEND_URL}/api/auth/login` : `${BACKEND_URL}/api/auth/signup`;
      const payload = authMode === "login" ? { email, password } : { username, email, password };
      try {
          const res = await axios.post(url, payload);
          localStorage.setItem("token", res.data.token);
          localStorage.setItem("user", JSON.stringify(res.data.user));
          setUser(res.data.user); setShowAuthModal(false); alert(`Welcome ${res.data.user.name}!`);
      } catch(e) { alert(e.response?.data?.error || "Auth failed"); }
  };

  const setMasterCredentials = () => {
      setAuthMode("signup"); 
      setEmail("master@cricmad.com");
      setPassword("master123");
      setUsername("Master Admin");
  };

  const logout = () => { localStorage.removeItem("token"); localStorage.removeItem("user"); setUser(null); setActiveTab("home"); };

  const joinMatch = (matchData) => { setMatch(matchData); socket.emit("join_match", matchData._id); setActiveTab("live"); };
  
  const openDetailView = (m) => { 
      setDetailMatch(m); 
      setDetailViewMode("summary");
      setActiveTab("detail"); 
  };

  const addPlayer = (team) => {
    if (!tempPlayerName) return;
    const newPlayer = { name: tempPlayerName, role: playerRole, isCaptain, isVC, isWK, isOut: false, oversBowled: 0, runsScored: 0, ballsFaced: 0, wicketsTaken: 0 };
    if (team === 'A') setTeamASquad([...teamASquad, newPlayer]); else setTeamBSquad([...teamBSquad, newPlayer]);
    setTempPlayerName(""); setIsCaptain(false); setIsVC(false); setIsWK(false); setPlayerRole("Batsman");
  };

  const nextStep = () => {
      if (step === 1 && (!teamAName || !teamBName)) return alert("Enter Team Names");
      if (step === 2 && teamASquad.length < 2) return alert(`Add at least 2 players for ${teamAName}`);
      if (step === 3 && teamBSquad.length < 2) return alert(`Add at least 2 players for ${teamBName}`);
      setStep(step + 1);
  };

  // Safe API Wrapper
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

  const updateScore = async (runs, isWicket, isWide, wicketType = "") => { if (!match) return; await securePost(`${BACKEND_URL}/api/match/update`, { matchId: match._id, runs, isWicket, isWide, wicketType }); setShowWicketType(false); };
  const undoLastBall = async () => { if (!match) return; await securePost(`${BACKEND_URL}/api/match/undo`, { matchId: match._id }); };
  const changeBowler = async (name) => { await securePost(`${BACKEND_URL}/api/match/new-bowler`, { matchId: match._id, bowlerName: name }); setShowBowlerChange(false); };
  const changeBatter = async (name) => { await securePost(`${BACKEND_URL}/api/match/new-batter`, { matchId: match._id, batterName: name }); };

  const fetchStats = async () => {
      if(!searchQuery) return;
      try { const res = await axios.get(`${BACKEND_URL}/api/stats/full/${searchQuery}`); setPlayerStats(res.data); } catch(e) { alert("Player not found"); }
  };

  const liveGroups = liveMatches.reduce((groups, m) => { const series = m.seriesName || "Friendly"; if(!groups[series]) groups[series] = []; groups[series].push(m); return groups; }, {});
  const pastGroups = pastMatches.reduce((groups, m) => { const series = m.seriesName || "Friendly"; if(!groups[series]) groups[series] = []; groups[series].push(m); return groups; }, {});

  // --- SCORECARD COMPONENT ---
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
    <div className="fixed bottom-0 w-full bg-[#111827] border-t border-gray-800 p-2 flex justify-around items-center z-50 safe-area-bottom">
      <button onClick={() => { setActiveTab("home"); fetchAllMatches(); }} className={`flex flex-col items-center ${activeTab === 'home' ? 'text-red-500' : 'text-gray-500'}`}><Home size={22} /><span className="text-[10px] mt-1">Home</span></button>
      <button onClick={() => { setActiveTab("live"); setMatch(null); }} className={`flex flex-col items-center ${activeTab === 'live' ? 'text-red-500' : 'text-gray-500'}`}><Activity size={22} /><span className="text-[10px] mt-1">Live</span></button>
      {user ? <button onClick={() => { setStep(1); setTeamASquad([]); setTeamBSquad([]); setActiveTab("setup"); }} className="bg-red-600 -mt-8 p-4 rounded-full border-4 border-[#111827] shadow-lg"><Plus size={28} color="white" /></button> : <div className="w-12"></div>}
      <button onClick={() => { setActiveTab("my_matches"); fetchMyMatches(); }} className={`flex flex-col items-center ${activeTab === 'my_matches' ? 'text-red-500' : 'text-gray-500'}`}><Trophy size={22} /><span className="text-[10px] mt-1">My Games</span></button>
      <button onClick={() => setShowMenu(true)} className="flex flex-col items-center text-gray-500"><Menu size={22} /><span className="text-[10px] mt-1">More</span></button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#111827] text-white font-sans pb-24 selection:bg-red-500 selection:text-white">
      <div className="fixed top-0 w-full bg-[#1F2937]/95 backdrop-blur p-4 z-40 flex justify-between items-center border-b border-gray-800">
         <div className="flex items-center gap-2"><div className="bg-red-600 w-8 h-8 rounded flex items-center justify-center shadow-lg"><Flame size={20} color="white"/></div><h1 className="font-bold text-lg">CricMad <span className="text-[10px] bg-white text-black px-1 rounded">PRO</span></h1></div>
         {user ? <div className="flex items-center gap-2"><span className="text-xs text-green-400 font-bold">{user.name} {user.role==='superadmin' && '(Master)'}</span><button onClick={logout} className="text-gray-400 hover:text-white"><Lock size={18} /></button></div> : <button onClick={() => setShowAuthModal(true)} className="bg-red-600 px-3 py-1 rounded text-xs font-bold flex items-center gap-1">Login</button>}
      </div>

      {showAuthModal && <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"><div className="bg-[#1F2937] p-6 rounded-2xl w-full max-w-xs text-center border border-gray-700 relative"><button onClick={() => setShowAuthModal(false)} className="absolute top-4 right-4 text-gray-500"><X size={20}/></button><h3 className="text-white font-bold text-xl mb-4">{authMode === 'login' ? 'Login' : 'Signup'}</h3>{authMode === 'signup' && <input className="w-full p-3 bg-black rounded text-white mb-2 border border-gray-600" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} />}<input className="w-full p-3 bg-black rounded text-white mb-2 border border-gray-600" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} /><input type="password" className="w-full p-3 bg-black rounded text-white mb-4 border border-gray-600" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} /><button onClick={handleAuth} className="w-full bg-red-600 p-3 rounded font-bold mb-2">{authMode === 'login' ? 'Login' : 'Create Account'}</button><button onClick={setMasterCredentials} className="text-xs text-yellow-500 font-bold mb-2 flex items-center justify-center gap-1 w-full"><Key size={12}/> Click for Master Login</button><button onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')} className="text-xs text-blue-400 underline">{authMode === 'login' ? "New? Create Account" : "Already have account? Login"}</button></div></div>}

      {/* --- MY MATCHES TAB --- */}
      {activeTab === 'my_matches' && (
          <div className="pt-24 px-4 pb-20">
              <h2 className="text-2xl font-bold mb-4">My Matches</h2>
              {!user ? <div className="text-center text-gray-500 p-10">Please login to manage your matches.</div> :
               myMatches.length === 0 ? <div className="text-center text-gray-500 p-10">You haven't created any matches yet.</div> :
               myMatches.map(m => (
                   <div key={m._id} onClick={() => joinMatch(m)} className="bg-[#1F2937] p-4 rounded-xl border border-gray-700 mb-3 flex justify-between items-center cursor-pointer hover:border-blue-500 group">
                       <div><p className="text-xs text-gray-400 uppercase font-bold">{m.seriesName}</p><p className="font-bold">{m.teamA?.name} vs {m.teamB?.name}</p><p className="text-xs text-green-400">{m.status.toUpperCase()}</p></div><button onClick={(e) => deleteMatch(m._id, e)} className="p-2 bg-red-900/50 rounded-full text-red-500 hover:bg-red-600 hover:text-white transition"><Trash2 size={18} /></button>
                   </div>
               ))
              }
          </div>
      )}

      {/* HOME TAB */}
      {activeTab === 'home' && (
        <div className="pt-24 px-4 pb-20">
           <div className="bg-gradient-to-br from-red-600 to-red-900 p-6 rounded-2xl mb-6 shadow-lg"><h2 className="text-2xl font-bold">Welcome {user ? user.name : "Fan"}</h2></div>
           <h3 className="text-gray-400 font-bold mb-3 flex items-center gap-2"><Activity size={16} className="text-red-500"/> Live Matches</h3>
           {Object.keys(liveGroups).length > 0 ? Object.keys(liveGroups).map(series => (<div key={series} className="mb-6"><h4 className="text-xs font-bold text-gray-500 uppercase mb-2 ml-1">{series}</h4>{liveGroups[series].slice(0, 2).map((m) => (<div key={m._id} onClick={() => joinMatch(m)} className="bg-[#1F2937] p-5 rounded-xl border border-gray-700 mb-2 cursor-pointer hover:border-red-500 transition"><div className="flex justify-between items-start mb-2"><span className="bg-red-600 text-white text-[10px] px-2 py-0.5 rounded font-bold animate-pulse">LIVE</span></div><div className="flex justify-between items-center"><div><span className="font-bold text-lg block">{m.teamA?.name}</span><span className="text-xs text-gray-400">Batting</span></div><div className="text-right"><span className="font-bold text-2xl block">{m.score?.runs}/{m.score?.wickets}</span><span className="text-xs text-gray-400">({m.score?.overs}.{m.score?.balls})</span></div></div></div>))}</div>)) : <div className="text-gray-500 text-sm mb-8">No live matches.</div>}
           <h3 className="text-gray-400 font-bold mb-3 flex items-center gap-2"><Clock size={16} className="text-blue-500"/> Recent Results</h3>
           {Object.keys(pastGroups).length > 0 ? Object.keys(pastGroups).map(series => (<div key={series} className="mb-6"><h4 className="text-xs font-bold text-gray-500 uppercase mb-2 ml-1">{series}</h4>{pastGroups[series].slice(0, 2).map((m) => (<div key={m._id} onClick={() => openDetailView(m)} className="bg-[#1F2937]/50 p-4 rounded-xl border border-gray-800 cursor-pointer hover:bg-[#1F2937] mb-2"><div className="flex justify-between mb-3 border-b border-gray-700 pb-2"><div><p className="text-sm font-bold text-white">{m.teamB?.name}</p><p className="text-xs text-gray-400">{m.innings1Score?.runs || 0}/{m.innings1Score?.wickets || 0}</p></div><div className="text-right"><p className="text-sm font-bold text-white">{m.teamA?.name}</p><p className="text-xs text-gray-400">{m.score?.runs}/{m.score?.wickets}</p></div></div><div className="text-sm text-green-400 font-bold">{m.resultMsg || "Match Completed"}</div></div>))}</div>)) : <div className="text-gray-500 text-sm">No completed matches.</div>}
        </div>
      )}

      {/* DETAIL VIEW */}
      {activeTab === 'detail' && detailMatch && (
        <div className="pt-24 px-4 pb-20">
           <button onClick={() => setActiveTab("home")} className="flex items-center gap-2 text-gray-400 mb-4 hover:text-white"><ArrowLeft size={16} /> Back</button>
           <div className="bg-[#1F2937] p-6 rounded-3xl text-center mb-6 border border-gray-700 shadow-xl"><h1 className="text-3xl font-black text-white">{detailMatch.winner} Won</h1><p className="text-green-400 font-bold mb-4">{detailMatch.resultMsg}</p><div className="grid grid-cols-2 gap-4 text-left bg-gray-800 p-4 rounded-xl"><div><p className="text-xs text-gray-400">1st Innings</p><p className="font-bold text-white">{detailMatch.teamB?.name}</p><p className="text-xl">{detailMatch.innings1Score?.runs}/{detailMatch.innings1Score?.wickets}</p></div><div className="text-right"><p className="text-xs text-gray-400">2nd Innings</p><p className="font-bold text-white">{detailMatch.teamA?.name}</p><p className="text-xl">{detailMatch.score?.runs}/{detailMatch.score?.wickets}</p></div></div></div>
           <div className="flex gap-2 mb-4 overflow-x-auto pb-2 mt-4"><button onClick={() => setDetailViewMode("summary")} className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap ${detailViewMode==='summary'?'bg-red-600 text-white':'bg-gray-800 text-gray-400'}`}>Summary</button><button onClick={() => setDetailViewMode("scorecardA")} className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap ${detailViewMode==='scorecardA'?'bg-red-600 text-white':'bg-gray-800 text-gray-400'}`}>{detailMatch.teamA?.name}</button><button onClick={() => setDetailViewMode("scorecardB")} className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap ${detailViewMode==='scorecardB'?'bg-red-600 text-white':'bg-gray-800 text-gray-400'}`}>{detailMatch.teamB?.name}</button><button onClick={() => setDetailViewMode("comm")} className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap ${detailViewMode==='comm'?'bg-red-600 text-white':'bg-gray-800 text-gray-400'}`}>Commentary</button></div>
           {detailViewMode === 'summary' && <div className="text-center text-gray-500 text-sm">Select a scorecard above to view details.</div>}
           {detailViewMode === 'scorecardA' && <Scorecard teamName={detailMatch.teamA?.name} squad={detailMatch.teamA?.squad} />}
           {detailViewMode === 'scorecardB' && <Scorecard teamName={detailMatch.teamB?.name} squad={detailMatch.teamB?.squad} />}
           {detailViewMode === 'comm' && <div className="space-y-2">{detailMatch.commentary && detailMatch.commentary.map((c, i) => (<div key={i} className="flex gap-3 bg-[#1F2937] p-3 rounded-lg border-b border-gray-700"><span className="font-bold text-white w-10 text-right">{c.over}</span><span className="text-gray-300 text-sm">{c.msg}</span></div>))}</div>}
        </div>
      )}

      {/* MY CRICKET (STATS) */}
      {activeTab === 'mycricket' && (
          <div className="pt-24 px-4 text-center">
              <h2 className="text-2xl font-bold mb-6">Player Stats</h2>
              <div className="flex gap-2 mb-6"><input className="w-full p-3 bg-[#1F2937] rounded-xl text-white outline-none" placeholder="Search Player" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} /><button onClick={fetchStats} className="bg-red-600 p-3 rounded-xl"><Search color="white"/></button></div>
              {playerStats ? (<div className="bg-[#1F2937] p-6 rounded-2xl border border-gray-700 shadow-xl"><div className="w-20 h-20 bg-gray-700 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl">👤</div><h3 className="text-xl font-bold">{playerStats.name}</h3><div className="grid grid-cols-3 gap-4 mt-4"><div><p className="text-xs text-gray-400">Matches</p><p className="text-xl font-bold">{playerStats.matches}</p></div><div><p className="text-xs text-gray-400">Runs</p><p className="text-xl font-bold text-yellow-500">{playerStats.runs}</p></div><div><p className="text-xs text-gray-400">Wickets</p><p className="text-xl font-bold text-green-500">{playerStats.wickets}</p></div></div><div className="mt-6 flex gap-3 justify-center"><a href={`tel:${playerStats.contact?.phone}`} className="bg-blue-600 p-3 rounded-full"><Phone size={20} color="white"/></a><a href={`mailto:${playerStats.contact?.email}`} className="bg-red-600 p-3 rounded-full"><Mail size={20} color="white"/></a><a href={`https://wa.me/${playerStats.contact?.phone}`} className="bg-green-600 p-3 rounded-full"><MessageCircle size={20} color="white"/></a></div></div>) : <p className="text-gray-500">Search for a player to see stats.</p>}
          </div>
      )}

      {/* SETUP TAB */}
      {activeTab === 'setup' && user && (
        <div className="pt-24 px-6">
           <div className="flex items-center gap-2 mb-6"><span className="bg-red-600 text-white w-6 h-6 flex items-center justify-center rounded-full text-sm font-bold">{step}</span><h2 className="text-xl font-bold text-white">Match Setup</h2></div>
           {step === 1 && <div className="space-y-4"><input className="w-full p-4 bg-[#1F2937] rounded text-white" placeholder="Series Name (e.g. IPL 2025)" value={seriesName} onChange={e => setSeriesName(e.target.value)} /><input className="w-full p-4 bg-[#1F2937] rounded text-white" placeholder="Team A" value={teamAName} onChange={e => setTeamAName(e.target.value)} /><input className="w-full p-4 bg-[#1F2937] rounded text-white" placeholder="Team B" value={teamBName} onChange={e => setTeamBName(e.target.value)} /><input type="number" className="w-full p-4 bg-[#1F2937] rounded text-white" placeholder="Total Overs" value={totalOvers} onChange={e => setTotalOvers(e.target.value)} /><button className="w-full p-4 bg-red-600 rounded-xl font-bold mt-4" onClick={nextStep}>Next Step</button></div>}
           {(step === 2 || step === 3) && <div><h3 className="mb-2 text-gray-400">Players: {step === 2 ? teamAName : teamBName}</h3><div className="bg-[#1F2937] p-4 rounded-xl mb-4 border border-gray-700"><input className="w-full p-3 bg-[#111827] rounded-lg text-white mb-4" value={tempPlayerName} onChange={e => setTempPlayerName(e.target.value)} placeholder="Enter Name" /><div className="flex gap-2 mb-4">{["Batsman", "Bowler", "All Rounder"].map(r => (<button key={r} onClick={() => setPlayerRole(r)} className={`flex-1 py-2 text-[10px] font-bold uppercase rounded-lg border ${playerRole === r ? 'bg-white text-black' : 'bg-gray-800 text-gray-500'}`}>{r}</button>))}</div><div className="flex justify-between mb-4 px-1 text-xs"><label><input type="checkbox" checked={isCaptain} onChange={e => setIsCaptain(e.target.checked)}/> CAP</label><label><input type="checkbox" checked={isVC} onChange={e => setIsVC(e.target.checked)}/> VC</label><label><input type="checkbox" checked={isWK} onChange={e => setIsWK(e.target.checked)}/> WK</label></div><button onClick={() => addPlayer(step === 2 ? 'A' : 'B')} className="bg-red-600 w-full p-3 rounded-lg font-bold">Add Player</button></div><div className="h-56 overflow-y-auto bg-[#1F2937] p-2 rounded-xl mb-4 border border-gray-700">{(step === 2 ? teamASquad : teamBSquad).map((p,i) => (<div key={i} className="border-b border-gray-700 p-3 flex justify-between">{p.name}<span className="text-[10px] bg-gray-800 px-1 rounded text-gray-400">{p.role.substring(0,3)} {p.isCaptain?'(C)':''}</span></div>))}</div><button className="w-full p-4 bg-white text-black rounded-xl font-bold" onClick={nextStep}>Confirm Squad</button></div>}
           {step === 4 && <div className="space-y-4"><h3 className="text-white font-bold">Toss Time</h3><div className="bg-[#1F2937] p-4 rounded-xl mb-4 border border-gray-700"><p className="text-gray-400 text-sm mb-2">Who won?</p><div className="flex gap-2 mb-4"><button onClick={() => setTossWinner(teamAName)} className={`flex-1 p-3 rounded-lg border font-bold ${tossWinner === teamAName ? 'bg-white text-black' : 'bg-gray-800 text-gray-500'}`}>{teamAName}</button><button onClick={() => setTossWinner(teamBName)} className={`flex-1 p-3 rounded-lg border font-bold ${tossWinner === teamBName ? 'bg-white text-black' : 'bg-gray-800 text-gray-500'}`}>{teamBName}</button></div><p className="text-gray-400 text-sm mb-2">Decision?</p><div className="flex gap-2"><button onClick={() => setTossDecision("Bat")} className={`flex-1 p-3 rounded-lg border font-bold ${tossDecision === "Bat" ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-500'}`}>Bat</button><button onClick={() => setTossDecision("Bowl")} className={`flex-1 p-3 rounded-lg border font-bold ${tossDecision === "Bowl" ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-500'}`}>Bowl</button></div></div><button className="w-full p-4 bg-red-600 rounded-xl font-bold mt-4" onClick={() => setStep(5)}>Next Step</button></div>}
           {step === 5 && <div className="space-y-4"><h3 className="text-white font-bold">Select Openers</h3>{(() => { const team1Batting = (tossWinner === teamAName && tossDecision === "Bat") || (tossWinner === teamBName && tossDecision === "Bowl"); const battingSquad = team1Batting ? teamASquad : teamBSquad; const bowlingSquad = team1Batting ? teamBSquad : teamASquad; return (<><label className="text-xs text-gray-400 font-bold uppercase">Striker</label><select className="w-full p-4 bg-[#1F2937] rounded text-white" onChange={e => setSelectedStriker(e.target.value)}><option>Select Striker</option>{battingSquad.map(p => <option key={p.name}>{p.name}</option>)}</select><label className="text-xs text-gray-400 font-bold uppercase">Non-Striker</label><select className="w-full p-4 bg-[#1F2937] rounded text-white" onChange={e => setSelectedNonStriker(e.target.value)}><option>Select Non-Striker</option>{battingSquad.map(p => <option key={p.name}>{p.name}</option>)}</select><label className="text-xs text-gray-400 font-bold uppercase">Bowler</label><select className="w-full p-4 bg-[#1F2937] rounded text-white" onChange={e => setSelectedBowler(e.target.value)}><option>Select Bowler</option>{bowlingSquad.map(p => <option key={p.name}>{p.name}</option>)}</select></>); })()}<button className="w-full p-4 bg-green-600 rounded-xl font-bold mt-4" onClick={startMatch}>Start Match 🏏</button></div>}
        </div>
      )}

      {/* LIVE MATCH TAB */}
      {activeTab === 'live' && match ? (
        <div className="pt-24 px-4">
           <button onClick={() => { setMatch(null); setActiveTab("home"); fetchAllMatches(); }} className="flex items-center gap-2 text-gray-400 mb-4 hover:text-white"><ArrowLeft size={16} /> Back to Matches</button>
           <div className="bg-[#1F2937] p-6 rounded-3xl text-center mb-4 border border-gray-700 shadow-xl relative overflow-hidden"><div className="relative z-10"><p className="text-xs text-gray-400 uppercase font-bold mb-2">{match.teamA?.name} vs {match.teamB?.name}</p><h1 className="text-6xl font-black text-white mb-2">{match.score?.runs}/{match.score?.wickets}</h1><p className="text-gray-400 font-mono text-sm">Overs: {match.score?.overs}.{match.score?.balls}</p>{match.innings === 2 && <p className="text-green-400 text-sm font-bold mt-2 uppercase">Target: {match.target}</p>}</div></div>
           {match.currentInnings ? <div className="bg-[#1F2937] p-4 rounded-2xl mb-4 border border-gray-700"><div className="flex justify-between items-center mb-3 p-3 bg-gray-800 rounded-xl border-l-4 border-red-500"><div><p className="font-bold text-white text-xl">{match.currentInnings.striker?.name}</p><p className="text-[10px] text-gray-400 uppercase">Striker</p></div><div className="text-right"><span className="font-bold text-2xl text-white">{match.currentInnings.striker?.runs}</span></div></div><div className="flex justify-between items-center mb-3 p-3 opacity-60"><div><p className="font-bold text-gray-200 text-xl">{match.currentInnings.nonStriker?.name}</p><p className="text-[10px] text-gray-400 uppercase">Non-Striker</p></div><div className="text-right"><span className="font-bold text-2xl text-gray-200">{match.currentInnings.nonStriker?.runs}</span></div></div><div className="border-t border-gray-700 pt-3 flex justify-between items-center px-2"><div><p className="font-bold text-blue-400 text-lg">{match.currentInnings.bowler?.name} {canScore && <button onClick={() => setShowBowlerChange(true)}><RefreshCw size={14} className="ml-2 text-yellow-500"/></button>}</p><p className="text-[10px] text-gray-500 uppercase">Bowler</p></div><div className="text-right"><span className="font-mono text-yellow-500 font-bold text-xl">{match.currentInnings.bowler?.wickets}-{match.currentInnings.bowler?.runs}</span></div></div></div> : <div className="text-center text-white py-10">Loading Data...</div>}
           {canScore && match.status !== "completed" && !showWicketType && !showBowlerChange ? (<>{match.status === "innings_break" ? (<div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50"><div className="bg-[#1F2937] w-full max-w-sm p-8 rounded-3xl border border-yellow-500 text-center"><h2 className="text-3xl font-black text-white uppercase italic mb-4">Innings Break</h2><div className="bg-gray-800 p-4 rounded-xl mb-4"><p className="text-xs font-bold uppercase text-gray-400">Target for {match.teamB?.name}</p><h1 className="text-5xl font-black text-white">{match.score?.runs + 1}</h1></div><h3 className="text-left text-white font-bold mb-2 text-sm">Select 2nd Innings Openers</h3><div className="space-y-2 mb-4 text-left"><select className="w-full p-3 bg-black rounded text-white border border-gray-700" onChange={e => setStriker2(e.target.value)}><option>Striker</option>{match.teamB?.squad.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}</select><select className="w-full p-3 bg-black rounded text-white border border-gray-700" onChange={e => setNonStriker2(e.target.value)}><option>Non-Striker</option>{match.teamB?.squad.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}</select><select className="w-full p-3 bg-black rounded text-white border border-gray-700" onChange={e => setBowler2(e.target.value)}><option>Opening Bowler</option>{match.teamA?.squad.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}</select></div><button onClick={startSecondInnings} className="w-full bg-green-600 text-white font-bold py-3 px-6 rounded-xl">Start 2nd Innings</button></div></div>) : match.status === "bowler_change" ? (<div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50"><div className="bg-[#1F2937] w-full max-w-sm p-6 rounded-2xl border border-blue-500 animate-pulse"><h3 className="font-bold text-xl text-blue-400 mb-4 text-center">Over Complete!</h3><div className="grid grid-cols-2 gap-2">{match.teamB?.squad.filter(p => p.name !== match.lastBowler).map(p => <button key={p.name} onClick={() => changeBowler(p.name)} className="bg-blue-600 p-3 rounded-xl font-bold text-white">{p.name} <span className="text-[10px] opacity-70">({p.oversBowled})</span></button>)}</div></div></div>) : match.currentInnings.striker?.name === "New Batter" || match.currentInnings.striker?.name === "ALL OUT" ? (<div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50"><div className="bg-[#1F2937] w-full max-w-sm p-6 rounded-2xl border border-red-500"><h3 className="font-bold text-xl text-red-500 mb-2 text-center">WICKET! ☝️</h3><div className="flex flex-col gap-2 max-h-60 overflow-y-auto">{match.teamA?.squad.filter(p => !p.isOut && p.name !== match.currentInnings.nonStriker.name && p.name !== "New Batter").map(p => (<button key={p.name} onClick={() => changeBatter(p.name)} className="bg-gray-800 hover:bg-red-600 p-4 rounded-xl font-bold text-white transition border border-gray-700 flex justify-between"><span>{p.name}</span><span className="text-[10px] text-gray-500">{p.role}</span></button>))}</div></div></div>) : (<div className="grid grid-cols-4 gap-3 mt-4"><button onClick={undoLastBall} className="col-span-4 bg-gray-700 text-gray-300 py-2 rounded-lg font-bold flex items-center justify-center gap-2 mb-2 hover:bg-gray-600"><Undo2 size={16}/> Undo Last Ball</button>{[0,1,2,3].map(r => <button key={r} onClick={() => updateScore(r)} className="bg-gray-800 text-white h-16 rounded-2xl text-xl font-bold border border-gray-700">{r}</button>)}<button onClick={() => updateScore(4)} className="bg-green-600 text-white h-16 rounded-2xl font-bold text-xl">4</button><button onClick={() => updateScore(6)} className="bg-green-600 text-white h-16 rounded-2xl font-bold text-xl">6</button><button onClick={() => updateScore(1, false, true)} className="bg-orange-500 text-white h-16 rounded-2xl font-bold text-lg">WD</button><button onClick={() => setShowWicketType(true)} className="bg-red-600 text-white h-16 rounded-2xl font-bold text-lg">OUT</button></div>)}</>) : !canScore && match.status !== "completed" ? (<div className="text-center p-4 bg-gray-900 rounded-xl mt-4 border border-gray-700 flex items-center justify-center gap-2"><div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div> <span className="text-gray-400 text-sm">Read Only Mode</span></div>) : null}
           {match.status === "completed" && (<div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50"><div className="bg-[#1F2937] p-8 rounded-3xl border border-yellow-500 text-center w-full max-w-sm"><Trophy size={80} className="mx-auto text-yellow-500 mb-4" /><h2 className="text-3xl font-black text-white uppercase italic mb-2">{match.winner} WON!</h2><p className="text-gray-400 mb-4">{match.resultMsg}</p><button onClick={() => { setActiveTab("home"); fetchAllMatches(); }} className="mt-2 bg-yellow-500 text-black font-bold py-3 px-6 rounded-xl">Back to Home</button></div></div>)}
        </div>
      ) : activeTab === 'live' && <div className="pt-24 text-center text-gray-500">Select a match from Home.</div>}

      <BottomNav />
      {showMenu && <div className="fixed inset-0 bg-black/80 z-50" onClick={() => setShowMenu(false)}><div className="fixed top-0 right-0 h-full w-3/4 bg-[#1F2937] p-6 shadow-2xl border-l border-gray-700" onClick={e => e.stopPropagation()}><div className="flex justify-between items-center mb-8 border-b border-gray-700 pb-4"><h2 className="text-xl font-bold text-white flex gap-2"><Flame className="text-red-500"/> CricMad Pro</h2><button onClick={() => setShowMenu(false)}><X className="text-gray-400" /></button></div><div className="space-y-6 text-gray-300"><div className="flex gap-4"><BarChart2 /> Insights</div><div className="flex gap-4"><ShoppingBag /> Store</div><div className="flex gap-4"><Phone /> Contact Support</div></div></div></div>}
    </div>
  );
}