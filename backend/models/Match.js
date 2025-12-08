const mongoose = require("mongoose");

const PlayerSchema = new mongoose.Schema({
  name: String,
  role: String, // Batsman, Bowler, All-Rounder, WicketKeeper
  isCaptain: { type: Boolean, default: false },
  isViceCaptain: { type: Boolean, default: false }
});

const MatchSchema = new mongoose.Schema({
  teamA: { name: String, squad: [PlayerSchema] },
  teamB: { name: String, squad: [PlayerSchema] },
  matchSettings: {
    totalOvers: { type: Number, default: 20 }
  },
  score: {
    runs: { type: Number, default: 0 },
    wickets: { type: Number, default: 0 },
    overs: { type: Number, default: 0 },
    balls: { type: Number, default: 0 }
  },
  currentInnings: {
    striker: { name: String, runs: { type: Number, default: 0 }, balls: { type: Number, default: 0 } },
    nonStriker: { name: String, runs: { type: Number, default: 0 }, balls: { type: Number, default: 0 } },
    bowler: { name: String, runs: { type: Number, default: 0 }, wickets: { type: Number, default: 0 }, overs: { type: Number, default: 0 } }
  },
  status: { type: String, default: "live" }, // live, innings_break, completed
  lastBallEvents: [String] // To show "Over Ended, Select Bowler"
});

module.exports = mongoose.model("Match", MatchSchema);