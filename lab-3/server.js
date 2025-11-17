require('dotenv').config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const bcrypt = require("bcryptjs"); // <-- 1. IMPORT BCRYPT

const app = express();
app.use(cors());
app.use(express.json());

// --- 1. DATABASE CONNECTION ---
  mongoose.connect(process.env.MONGODB_URI);


// --- 2. USER SCHEMA ---
const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true }, // This will now store the HASH
});
const User = mongoose.model("User", UserSchema);

// --- 3. TASK SCHEMAS ---
// (Your Task, CompletedTask, and DeletedTask schemas go here)
// ...
const TaskSchema = new mongoose.Schema({
  title: String,
  description: String,
  date: String,
  priority: String,
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
});
const Task = mongoose.model("Task", TaskSchema);

const CompletedTaskSchema = new mongoose.Schema({
  title: String,
  description: String,
  date: String,
  priority: String,
  userId: { type:mongoose.Schema.Types.ObjectId, ref: "User", required: true },
});
const CompletedTask = mongoose.model("CompletedTask", CompletedTaskSchema);

const DeletedTaskSchema = new mongoose.Schema({
  title: String,
  description: String,
  date: String,
  priority: String,
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
});
const DeletedTask = mongoose.model("DeletedTask", DeletedTaskSchema);


// --- 4. USER API ENDPOINTS ---

// SIGNUP (Modified)
app.post("/api/users/signup", async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: "All fields are required" });
  }
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email already exists" });
    }

    // --- 2. HASH THE PASSWORD ---
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    // ---

    const newUser = new User({ name, email, password: hashedPassword }); // Save hash
    await newUser.save();
    res.json({ status: "ok", user: newUser });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// LOGIN (Modified)
app.post("/api/users/login", async (req, res) => {
  const { email, password } = req.body;
  
  // --- 3. COMPARE THE HASH ---
  // Find user by email first
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(400).json({ error: "Invalid email or password" });
  }

  // Now compare the plain-text password with the stored hash
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(400).json({ error: "Invalid email or password" });
  }
  // ---

  // Passwords match!
  res.json({ status: "ok", user: user });
});

// UPDATE PROFILE (Modified)
app.put("/api/users/:id", async (req, res) => {
  const { id } = req.params;
  const { name, email, password } = req.body;
  try {
    const user = await User.findById(id);
    if (!user) return res.status(400).json({ error: "User not found" });

    if (name) user.name = name;
    if (email) user.email = email;
    
    // --- 4. HASH IF PASSWORD IS BEING UPDATED ---
    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }
    // ---
    
    await user.save();
    res.json({ status: "ok", user });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// CHECK EMAIL (No change)
app.post("/api/users/check-email", async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ error: "Email not found" });
  res.json({ status: "ok" });
});

// RESET PASSWORD (Modified)
app.post("/api/users/reset-password", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    // --- 5. HASH THE NEW PASSWORD ---
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    // ---
    
    await user.save();
    res.json({ status: "ok", message: "Password updated successfully" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});


// --- 5. TASK API ENDPOINTS ---
// (Your existing task endpoints go here - no changes needed)
app.get("/api/tasks/:userId", async (req, res) => { /* ... */ });
app.post("/api/tasks/:userId", async (req, res) => { /* ... */ });


// --- 6. SERVE FRONTEND & START SERVER ---
app.use(express.static(path.join(__dirname, "public")));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));