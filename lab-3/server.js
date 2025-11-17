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

// --- 3. TASK SCHEMAS ---
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
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
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

// --- 5. TASK API ENDPOINTS ---

// GET TASKS
app.get("/api/tasks/:userId", async (req, res) => {
  const { userId } = req.params;
  
  try {
    const tasks = await Task.find({ userId });
    const completed_tasks = await CompletedTask.find({ userId });
    const deleted_tasks = await DeletedTask.find({ userId });
    
    res.json({ tasks, completed_tasks, deleted_tasks });
  } catch (err) {
    res.status(500).json({ error: "Failed to load tasks" });
  }
});

// SAVE TASKS (Corrected)
app.post("/api/tasks/:userId", async (req, res) => {
  const { userId } = req.params;
  const { tasks, completed_tasks, deleted_tasks } = req.body;
  
  try {
    // 1. Prepare arrays for insert (attaching userId to each object)
    const tasksToInsert = tasks ? tasks.map(t => ({ ...t, userId })) : [];
    const completedToInsert = completed_tasks ? completed_tasks.map(t => ({ ...t, userId })) : [];
    const deletedToInsert = deleted_tasks ? deleted_tasks.map(t => ({ ...t, userId })) : [];

    // 2. Delete all existing tasks for this user (Crucial for atomic save)
    await Task.deleteMany({ userId }); 
    await CompletedTask.deleteMany({ userId });
    await DeletedTask.deleteMany({ userId });
    
    // 3. Insert new tasks
    if (tasksToInsert.length > 0) {
      await Task.insertMany(tasksToInsert);
    }
    if (completedToInsert.length > 0) {
      await CompletedTask.insertMany(completedToInsert);
    }
    if (deletedToInsert.length > 0) {
      await DeletedTask.insertMany(deletedToInsert);
    }
    
    res.json({ status: "ok", message: "Tasks saved successfully" });
  } catch (err) {
    // Log the error to the console for debugging
    console.error("Task Save Failed:", err);
    res.status(500).json({ error: "Failed to save tasks" });
  }
});

// --- 6. SERVE FRONTEND & START SERVER ---
app.use(express.static(path.join(__dirname, "public")));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));