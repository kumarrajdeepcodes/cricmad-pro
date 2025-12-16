require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

const JWT_SECRET = "cricmad_secure_hash_key_2025"; 
const otpStore = new Map(); 

// --- EMAIL CONFIGURATION (SSL MODE - REQUIRED FOR RENDER) ---
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,       // CHANGED: 465 is required to fix the Timeout error
  secure: true,    // CHANGED: Must be true for Port 465
  auth: {
    user: process.env.EMAIL_USER, 
    pass: process.env.EMAIL_PASS, 
  },
  tls: {
    rejectUnauthorized: false
  }
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected Successfully"))
  .catch(err => console.error("❌ MongoDB Connection Error:", err));

const io = new Server(server, { cors: { origin: "*" } });

// --- MIDDLEWARE ---
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// --- SCHEMAS ---
const PlayerSchema = new mongoose.Schema({
  name: String, role: String,
  isCaptain: Boolean, isVC: Boolean, isWK: Boolean,
  isOut: { type: Boolean, default: false },
  howOut: String,
  oversBowled: { type: Number, default: 0 },
  runsScored: { type: Number, default: 0 },
  ballsFaced: { type: Number, default: 0 },
  wicketsTaken: { type: Number, default: 0 },
  runsConceded: { type: Number, default: 0 }
});

const MatchSchema = new mongoose.Schema({
  createdBy: { type: String, required: true },
  seriesName: { type: String, default: "Friendly" },
  teamA: { name: String, squad: [PlayerSchema] }, 
  teamB: { name: String, squad: [PlayerSchema] }, 
  matchSettings: { totalOvers: Number },
  toss: { winner: String, decision: String },
  score: { runs: Number, wickets: Number, overs: Number, balls: Number },
  innings: { type: Number, default: 1 },
  target: { type: Number, default: 0 },
  innings1Score: { runs: Number, wickets: Number, overs: Number, balls: Number },
  currentInnings: {
    striker: { name: String, runs: Number, balls: Number },
    nonStriker: { name: String, runs: Number, balls: Number },
    bowler: { name: String, runs: Number, wickets: Number, overs: Number }
  },
  lastBowler: String,
  status: { type: String, default: "live" }, 
  winner: String,
  resultMsg: String,
  commentary: [{ over: String, msg: String }],
  timeline: [{ 
    runs: Number, isWicket: Boolean, wicketType: String, isWide: Boolean, isNoBall: Boolean,
    strikerName: String, bowlerName: String,
    prevScore: Object, prevStrikerStats: Object, prevBowlerStats: Object
  }],
  createdAt: { type: Date, default: Date.now }
});

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true }, 
  password: { type: String }, 
  role: { type: String, default: "scorer" } 
});

const Match = mongoose.models.Match || mongoose.model("Match", MatchSchema);
const User = mongoose.models.User || mongoose.model("User", UserSchema);

// --- HELPER ---
const checkOwnership = (match, user) => {
    if (user.role === "superadmin") return true;
    return String(match.createdBy) === String(user.id);
};

// --- AUTH ROUTES ---

// 1. SEND OTP
app.post("/api/auth/send-otp", async (req, res) => {
    const { contact } = req.body;
    if (!contact) return res.status(400).json({ error: "Contact required" });

    const isEmail = contact.includes("@");
    let otp;

    if (isEmail) {
        // REAL EMAIL LOGIC
        otp = Math.floor(100000 + Math.random() * 900000).toString();
        const mailOptions = {
            from: '"CricMad App" <' + process.env.EMAIL_USER + '>',
            to: contact,
            subject: "Your CricMad Login OTP",
            text: `Welcome to CricMad! Your OTP is: ${otp}. It expires in 5 minutes.`
        };
        try {
            await transporter.sendMail(mailOptions);
            console.log(`✅ Email sent to ${contact}`);
        } catch (error) {
            console.error("❌ Email Error:", error);
            // Return error so frontend knows it failed
            return res.status(500).json({ error: "Failed to send email." });
        }
    } else {
        // MOBILE DEMO
        otp = "123456"; 
        console.log(`📱 Mobile Login for ${contact}. Demo OTP: ${otp}`);
    }

    otpStore.set(contact, { otp, expires: Date.now() + 300000 });

    if (isEmail) res.json({ success: true, message: "OTP Sent to Email!", type: "email" });
    else res.json({ success: true, message: "Demo Mode", type: "mobile" });
});

// 2. VERIFY OTP
app.post("/api/auth/verify-otp", async (req, res) => {
    const { contact, otp, username } = req.body;
    
    const record = otpStore.get(contact);
    if (!record || record.otp !== otp || record.expires < Date.now()) {
        return res.status(400).json({ error: "Invalid or Expired OTP" });
    }
    otpStore.delete(contact); 

    try {
        let user = await User.findOne({ email: contact });
        
        // AUTO-PROMOTE
        if (user && contact === "rajdeepkumar789@gmail.com" && user.role !== "superadmin") {
            user.role = "superadmin";
            await user.save();
        }

        if (!user) {
            if (!username) return res.status(200).json({ newUser: true });
            user = new User({ 
                username, email: contact, 
                role: (contact === "rajdeepkumar789@gmail.com") ? "superadmin" : "scorer"
            });
            await user.save();
        }
        const token = jwt.sign({ id: user._id.toString(), role: user.role, name: user.username }, JWT_SECRET);
        res.json({ token, user: { id: user._id.toString(), name: user.username, role: user.role } });
    } catch (e) { res.status(500).json({ error: "Login failed" }); }
});

// 3. MASTER LOGIN
app.post("/api/auth/login-master", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !user.password) return res.status(400).json({ error: "Invalid credentials" });
    const validPass = await bcrypt.compare(password, user.password);
    if (!validPass) return res.status(400).json({ error: "Invalid credentials" });
    const token = jwt.sign({ id: user._id.toString(), role: user.role, name: user.username }, JWT_SECRET);
    res.json({ token, user: { id: user._id.toString(), name: user.username, role: user.role } });
  } catch (e) { res.status(500).json({ error: "Login failed" }); }
});

// MATCH ROUTES
app.get("/api/matches/live", async (req, res) => { try { const matches = await Match.find({ status: { $ne: "completed" } }).sort({ createdAt: -1 }); res.json(matches); } catch(e){} });
app.get("/api/matches/completed", async (req, res) => { try { const matches = await Match.find({ status: "completed" }).sort({ createdAt: -1 }); res.json(matches); } catch(e){} });
app.get("/api/matches/my", authenticateToken, async (req, res) => { try { const query = req.user.role === "superadmin" ? {} : { createdBy: req.user.id }; const matches = await Match.find(query).sort({ createdAt: -1 }); res.json(matches); } catch(e){} });
app.post("/api/match/start", authenticateToken, async (req, res) => { try { const { teamAName, teamBName, teamASquad, teamBSquad, totalOvers, seriesName, tossWinner, tossDecision, openingBowler, striker, nonStriker } = req.body; let battingTeam, bowlingTeam; if ((tossWinner === teamAName && tossDecision === "Bat") || (tossWinner === teamBName && tossDecision === "Bowl")) { battingTeam = { name: teamAName, squad: teamASquad }; bowlingTeam = { name: teamBName, squad: teamBSquad }; } else { battingTeam = { name: teamBName, squad: teamBSquad }; bowlingTeam = { name: teamAName, squad: teamASquad }; } const newMatch = new Match({ createdBy: req.user.id, seriesName: seriesName || "Friendly Series", teamA: battingTeam, teamB: bowlingTeam, matchSettings: { totalOvers: parseInt(totalOvers) }, toss: { winner: tossWinner, decision: tossDecision }, score: { runs: 0, wickets: 0, overs: 0, balls: 0 }, currentInnings: { striker: { name: striker, runs: 0, balls: 0 }, nonStriker: { name: nonStriker, runs: 0, balls: 0 }, bowler: { name: openingBowler, runs: 0, wickets: 0, overs: 0 } }, lastBowler: openingBowler, status: "live", timeline: [], commentary: [{ over: "0.0", msg: `Match Started` }] }); await newMatch.save(); res.json(newMatch); } catch (e) { res.status(500).json({ error: "Start failed" }); } });
app.post("/api/match/update", authenticateToken, async (req, res) => { try { const { matchId, runs, isWicket, wicketType, isWide, isNoBall, shotType, commText } = req.body; const match = await Match.findById(matchId); if (!checkOwnership(match, req.user)) return res.status(403).json({ error: "Unauthorized" }); let battingSquad = match.innings === 1 ? match.teamA.squad : match.teamB.squad; let bowlingSquad = match.innings === 1 ? match.teamB.squad : match.teamA.squad; if (!match.timeline) match.timeline = []; match.timeline.push({ runs, isWicket, wicketType: wicketType || "", isWide, isNoBall, strikerName: match.currentInnings.striker.name, bowlerName: match.currentInnings.bowler.name, prevScore: { ...match.score }, prevStrikerStats: { ...match.currentInnings.striker }, prevBowlerStats: { ...match.currentInnings.bowler } }); const extra = (isWide || isNoBall) ? 1 : 0; match.score.runs += runs + extra; if (!isWide) { match.currentInnings.striker.runs += runs; match.currentInnings.striker.balls += 1; const sIdx = battingSquad.findIndex(p => p.name === match.currentInnings.striker.name); if(sIdx !== -1) { battingSquad[sIdx].runsScored = (battingSquad[sIdx].runsScored||0) + runs; battingSquad[sIdx].ballsFaced = (battingSquad[sIdx].ballsFaced||0) + 1; } } match.currentInnings.bowler.runs += runs + extra; if (!isWide && !isNoBall) { match.currentInnings.bowler.balls += 1; const bIdx = bowlingSquad.findIndex(p => p.name === match.currentInnings.bowler.name); if(bIdx !== -1) { bowlingSquad[bIdx].runsConceded = (bowlingSquad[bIdx].runsConceded||0) + runs + extra; } } if (isWicket) { match.score.wickets += 1; if(wicketType !== "Run Out") { match.currentInnings.bowler.wickets += 1; const bIdx = bowlingSquad.findIndex(p => p.name === match.currentInnings.bowler.name); if(bIdx !== -1) bowlingSquad[bIdx].wicketsTaken = (bowlingSquad[bIdx].wicketsTaken||0) + 1; } const sIdx = battingSquad.findIndex(p => p.name === match.currentInnings.striker.name); if (sIdx !== -1) { battingSquad[sIdx].isOut = true; battingSquad[sIdx].howOut = wicketType; } if (match.score.wickets >= (battingSquad.length - 1)) { match.status = match.innings === 1 ? "innings_break" : "completed"; if (match.status === "completed") { match.winner = match.innings===1?match.teamB.name:match.teamA.name; match.resultMsg = `${match.winner} won`; } match.currentInnings.striker.name = "ALL OUT"; } else { match.currentInnings.striker.name = "New Batter"; match.currentInnings.striker.runs = 0; match.currentInnings.striker.balls = 0; } } let desc = `${runs} runs`; if (isWicket) desc = `WICKET (${wicketType})`; else if (isWide) desc = `Wide + ${runs}`; else if (isNoBall) desc = `No Ball + ${runs}`; let fullMsg = `${match.currentInnings.bowler.name} to ${match.currentInnings.striker.name}: ${desc}.`; if (shotType) fullMsg += ` [${shotType}]`; if (commText) fullMsg += ` ${commText}`; match.commentary.unshift({ over: `${match.score.overs}.${match.score.balls}`, msg: fullMsg }); const swapEnds = () => { const pS = { ...match.currentInnings.striker }; const pNS = { ...match.currentInnings.nonStriker }; match.currentInnings.striker = { ...pNS }; match.currentInnings.nonStriker = { ...pS }; }; if (runs % 2 !== 0 && !isWicket) swapEnds(); if (!isWide && !isNoBall) { match.score.balls += 1; if (match.score.balls === 6) { match.score.overs += 1; match.score.balls = 0; match.currentInnings.bowler.overs += 1; match.lastBowler = match.currentInnings.bowler.name; const bIdx = bowlingSquad.findIndex(p => p.name === match.currentInnings.bowler.name); if(bIdx !== -1) bowlingSquad[bIdx].oversBowled = (bowlingSquad[bIdx].oversBowled||0) + 1; swapEnds(); if (match.score.overs >= match.matchSettings.totalOvers) match.status = match.innings === 1 ? "innings_break" : "completed"; else if (match.status !== "innings_break" && match.status !== "completed") match.status = "bowler_change"; } } if (match.innings === 2 && match.score.runs >= match.target) { match.status = "completed"; match.winner = match.teamB.name; match.resultMsg = `${match.teamB.name} won`; } match.markModified('teamA.squad'); match.markModified('teamB.squad'); match.markModified('currentInnings'); await match.save(); io.to(matchId).emit("score_update", match); res.json(match); } catch (e) { console.error(e); res.status(500).json({ error: "Error" }); } });
app.post("/api/match/start-second-innings", authenticateToken, async (req, res) => { try { const { matchId, striker, nonStriker, openingBowler } = req.body; const match = await Match.findById(matchId); if (!checkOwnership(match, req.user)) return res.status(403).json({ error: "Unauthorized" }); match.innings1Score = { ...match.score }; match.target = match.score.runs + 1; match.score = { runs: 0, wickets: 0, overs: 0, balls: 0 }; match.innings = 2; match.currentInnings = { striker: { name: striker, runs: 0, balls: 0 }, nonStriker: { name: nonStriker, runs: 0, balls: 0 }, bowler: { name: openingBowler, runs: 0, wickets: 0, overs: 0 } }; match.status = "live"; match.timeline = []; match.lastBowler = openingBowler; match.markModified('currentInnings'); await match.save(); io.to(matchId).emit("score_update", match); res.json(match); } catch(e) { res.status(500).json({ error: "Error" }); } });
app.post("/api/match/undo", authenticateToken, async (req, res) => { const { matchId } = req.body; const match = await Match.findById(matchId); if (!checkOwnership(match, req.user)) return res.status(403).json({ error: "Unauthorized" }); if (!match.timeline || match.timeline.length === 0) return res.status(400).json({error: "Nothing to undo"}); const last = match.timeline.pop(); match.score = last.prevScore; match.currentInnings.striker = last.prevStrikerStats; match.currentInnings.bowler = last.prevBowlerStats; if(match.commentary.length > 0) match.commentary.shift(); let battingSquad = match.innings === 1 ? match.teamA.squad : match.teamB.squad; let bowlingSquad = match.innings === 1 ? match.teamB.squad : match.teamA.squad; if (!last.isWide) { const sIdx = battingSquad.findIndex(p => p.name === last.strikerName); if(sIdx !== -1) { battingSquad[sIdx].runsScored -= last.runs; battingSquad[sIdx].ballsFaced -= 1; } } if (!last.isWide && !last.isNoBall) { const bIdx = bowlingSquad.findIndex(p => p.name === last.bowlerName); if(bIdx !== -1) { bowlingSquad[bIdx].runsConceded -= (last.runs + (last.isNoBall?1:0)); } } if (last.isWicket) { const sIdx = battingSquad.findIndex(p => p.name === last.strikerName); if(sIdx !== -1) { battingSquad[sIdx].isOut = false; battingSquad[sIdx].howOut = ""; } if (last.wicketType !== "Run Out") { const bIdx = bowlingSquad.findIndex(p => p.name === last.bowlerName); if(bIdx !== -1) bowlingSquad[bIdx].wicketsTaken -= 1; } } match.status = "live"; match.markModified('teamA.squad'); match.markModified('teamB.squad'); match.markModified('currentInnings'); await match.save(); io.to(matchId).emit("score_update", match); res.json(match); });
app.post("/api/match/new-bowler", authenticateToken, async (req, res) => { const { matchId, bowlerName } = req.body; const match = await Match.findById(matchId); if (!checkOwnership(match, req.user)) return res.status(403).json({ error: "Unauthorized" }); match.currentInnings.bowler = { name: bowlerName, runs: 0, wickets: 0, overs: 0 }; match.status = "live"; match.markModified('currentInnings'); await match.save(); io.to(matchId).emit("score_update", match); res.json(match); });
app.post("/api/match/new-batter", authenticateToken, async (req, res) => { const { matchId, batterName } = req.body; const match = await Match.findById(matchId); if (!checkOwnership(match, req.user)) return res.status(403).json({ error: "Unauthorized" }); match.currentInnings.striker.name = batterName; match.currentInnings.striker.runs = 0; match.currentInnings.striker.balls = 0; match.markModified('currentInnings'); await match.save(); io.to(matchId).emit("score_update", match); res.json(match); });
app.delete("/api/match/:id", authenticateToken, async (req, res) => { const match = await Match.findById(req.params.id); if (!checkOwnership(match, req.user)) return res.status(403).json({ error: "Unauthorized" }); await Match.findByIdAndDelete(req.params.id); res.json({ success: true }); });
app.get("/api/stats/full/:player", async (req, res) => { const pName = req.params.player; const matches = await Match.find({ status: "completed" }); let stats = { matches: 0, runs: 0, wickets: 0, highest: 0, recentScores: [], availability: "Available", contact: { phone: "+919876543210", email: "player@cricmad.com" } }; matches.forEach(m => { let pData = null; const pA = m.teamA.squad.find(p => p.name.toLowerCase() === pName.toLowerCase()); if(pA) pData = pA; const pB = m.teamB.squad.find(p => p.name.toLowerCase() === pName.toLowerCase()); if(pB) pData = pB; if (pData) { stats.matches++; stats.runs += (pData.runsScored||0); stats.wickets += (pData.wicketsTaken||0); stats.recentScores.push(pData.runsScored||0); } }); stats.recentScores = stats.recentScores.slice(-5).reverse(); res.json(stats); });

io.on("connection", (socket) => { socket.on("join_match", (id) => { socket.join(id); }); });
const PORT = 5000;
server.listen(PORT, () => console.log(`Running on ${PORT}`));