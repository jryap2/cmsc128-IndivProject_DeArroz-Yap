require('dotenv').config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const bcrypt = require("bcryptjs");

const app = express();
app.use(cors());
app.use(express.json());

// --- 1. DATABASE CONNECTION ---
mongoose.connect(process.env.MONGODB_URI);

// --- 2. USER SCHEMA ---
const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
});
const User = mongoose.model("User", UserSchema);

// --- 3. UNIFIED TASK SCHEMA ---
// Optimized: One collection for all states using a 'status' field.
const TaskSchema = new mongoose.Schema({
  title: String,
  description: String,
  date: String,
  priority: String,
  userId: { type: String, required: true, index: true }, // Added index for speed
  status: { 
    type: String, 
    enum: ['inbox', 'completed', 'deleted'], 
    default: 'inbox' 
  },
  createdAt: { type: Date, default: Date.now }
});

const Task = mongoose.model("Task", TaskSchema);

// --- 4. USER API ENDPOINTS ---

// SIGNUP
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

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    const newUser = new User({ name, email, password: hashedPassword });
    await newUser.save();
    res.json({ status: "ok", user: newUser });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// LOGIN
app.post("/api/users/login", async (req, res) => {
  const { email, password } = req.body;
  
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(400).json({ error: "Invalid email or password" });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(400).json({ error: "Invalid email or password" });
  }

  res.json({ status: "ok", user: user });
});

// UPDATE PROFILE
app.put("/api/users/:id", async (req, res) => {
  const { id } = req.params;
  const { name, email, password } = req.body;
  
  try {
    const user = await User.findById(id);
    if (!user) return res.status(400).json({ error: "User not found" });
    
    if (name) user.name = name;
    if (email) user.email = email;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    await user.save();
    res.json({ status: "ok", user });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// CHECK EMAIL
app.post("/api/users/check-email", async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ error: "Email not found" });
  res.json({ status: "ok" });
});

// RESET PASSWORD
app.post("/api/users/reset-password", async (req, res) => {
  const { email, password } = req.body;
  
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    await user.save();
    
    res.json({ status: "ok", message: "Password updated successfully" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// --- 5. TASK API ENDPOINTS (RESTful) ---

// GET ALL TASKS (Optimized)
app.get("/api/tasks/:userId", async (req, res) => {
  try {
    // Fetch all tasks for user, sorted by creation (newest first)
    const allTasks = await Task.find({ userId: req.params.userId }).sort({ createdAt: -1 });
    
    // The frontend will filter them into arrays, or we can send them grouped.
    // Sending flat list is faster for DB.
    res.json({ tasks: allTasks }); 
  } catch (err) {
    res.status(500).json({ error: "Failed to load tasks" });
  }
});

// CREATE ONE TASK
app.post("/api/tasks", async (req, res) => {
  try {
    const newTask = new Task(req.body);
    await newTask.save();
    res.json(newTask);
  } catch (err) {
    res.status(500).json({ error: "Failed to add task" });
  }
});

// UPDATE ONE TASK (Updates content OR status)
app.put("/api/tasks/:id", async (req, res) => {
  try {
    // This handles editing text AND moving between Inbox/Completed/Deleted
    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id, 
      { $set: req.body }, 
      { new: true } // Return the updated document
    );
    res.json(updatedTask);
  } catch (err) {
    res.status(500).json({ error: "Failed to update task" });
  }
});

// DELETE ONE TASK (Permanent delete)
app.delete("/api/tasks/:id", async (req, res) => {
  try {
    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: "Task deleted permanently" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete task" });
  }
});

// --- 6. SERVE FRONTEND & START SERVER ---
app.use(express.static(path.join(__dirname, "public")));

app.use((req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));