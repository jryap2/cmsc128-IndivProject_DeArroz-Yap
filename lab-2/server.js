const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(
  "mongodb+srv://dbUser:bumblebee23@cluster0.t6kb4u4.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
);

//User Schema
const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
});

const User = mongoose.model("User", UserSchema);

// Signup Endpoint
app.post("/api/users/signup", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: "All fields are required" });
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) return res.status(400).json({ error: "Email already exists" });

  const newUser = new User({ name, email, password });
  await newUser.save();

  res.json({ status: "ok", user: newUser });
});

// Login Endpoint 
app.post("/api/users/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email, password });
  if (!user) return res.status(400).json({ error: "Invalid email or password" });

  res.json({ status: "ok", user });
});

//  Get All Users 
app.get("/api/users", async (req, res) => {
  const users = await User.find();
  res.json(users);
});


//// Update user
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

// Check email existence
app.post("/api/users/check-email", async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ error: "Email not found" });
  res.json({ status: "ok" });
});


// Serve frontend
app.use(express.static("public"));
app.use((req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
