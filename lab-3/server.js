const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

// --- 1. DATABASE CONNECTION ---
mongoose.connect(
  "mongodb+srv://dbUser:123@cmsc128-todolist.gkxtcut.mongodb.net/"
  // ^^^ REPLACE THIS with your connection string
);

// --- 2. USER SCHEMA ---
const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
});
const User = mongoose.model("User", UserSchema);

// --- 3. TASK SCHEMAS (Simplified) ---
// No 'listId' field. These tasks only belong to a user.
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
    const newUser = new User({ name, email, password });
    await newUser.save();
    res.json({ status: "ok", user: newUser });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/users/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email, password });
  if (!user) {
    return res.status(400).json({ error: "Invalid email or password" });
  }
  res.json({ status: "ok", user: user });
});

app.put("/api/users/:id", async (req, res) => {
  const { id } = req.params;
  const { name, email, password } = req.body;
  try {
    const user = await User.findById(id);
    if (!user) return res.status(400).json({ error: "User not found" });
    if (name) user.name = name;
    if (email) user.email = email;
    if (password) user.password = password;
    await user.save();
    res.json({ status: "ok", user });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/users/check-email", async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ error: "Email not found" });
  res.json({ status: "ok" });
});

app.post("/api/users/reset-password", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }
    user.password = password; 
    await user.save();
    res.json({ status: "ok", message: "Password updated successfully" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});


// --- 5. TASK API ENDPOINTS (Simplified) ---
app.get("/api/tasks/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const query = { userId: userId }; // Only get tasks for this user

    const tasks = await Task.find(query);
    const completed_tasks = await CompletedTask.find(query);
    const deleted_tasks = await DeletedTask.find(query);
    
    res.json({ tasks, completed_tasks, deleted_tasks });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/tasks/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { tasks, completed_tasks, deleted_tasks } = req.body;
    const query = { userId: userId };

    // Clear previous tasks
    await Task.deleteMany(query);
    await CompletedTask.deleteMany(query);
    await DeletedTask.deleteMany(query);
    
    // Add userId to all new tasks
    const addIds = (task) => ({ ...task, userId: userId });

    if (Array.isArray(tasks) && tasks.length > 0) {
      await Task.insertMany(tasks.map(addIds));
    }
    if (Array.isArray(completed_tasks) && completed_tasks.length > 0) {
      await CompletedTask.insertMany(completed_tasks.map(addIds));
    }
    if (Array.isArray(deleted_tasks) && deleted_tasks.length > 0) {
      await DeletedTask.insertMany(deleted_tasks.map(addIds));
    }
    res.json({ status: "ok" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});


// --- 6. SERVE FRONTEND & START SERVER ---
app.use(express.static(path.join(__dirname, "public")));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));