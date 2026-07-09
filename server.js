const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const bodyParser = require("body-parser");
const App = require("../models/App");
require("dotenv").config();

const app = express();

mongoose.connect(process.env.MONGO_URI);

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
secret: process.env.SESSION_SECRET,
resave: false,
saveUninitialized: false
}));

// =====================
// SIMPLE AUTH (replace later with real system)
// =====================
const STAFF_USER = "staff2026";
const STAFF_PASS = "lg21";

// LOGIN PAGE
app.get("/login", (req, res) => {
res.render("login");
});

app.post("/login", (req, res) => {
const { username, password } = req.body;

if (username === STAFF_USER && password === STAFF_PASS) {
req.session.auth = true;
return res.redirect("/dashboard");
}

res.send("Invalid login");
});

// DASHBOARD
app.get("/dashboard", async (req, res) => {
if (!req.session.auth) return res.redirect("/login");

const apps = await App.find();

res.render("dashboard", { apps });
});

// ACCEPT
app.post("/accept/:id", async (req, res) => {
if (!req.session.auth) return res.redirect("/login");

await App.findOneAndUpdate(
{ userId: req.params.id },
{ status: "accepted" }
);

res.redirect("/dashboard");
});

// DENY
app.post("/deny/:id", async (req, res) => {
if (!req.session.auth) return res.redirect("/login");

await App.findOneAndUpdate(
{ userId: req.params.id },
{ status: "denied" }
);

res.redirect("/dashboard");
});

app.listen(process.env.PORT, () => {
console.log("Web dashboard running");
});