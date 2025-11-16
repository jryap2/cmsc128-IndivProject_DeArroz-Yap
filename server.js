const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect("mongodb+srv://dbUser:bumblebee23@cluster0.t6kb4u4.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0");

const TaskSchema = new mongoose.Schema({
  title: String,
  description: String,
  date: String,
  priority: String,
});

const CompletedTaskSchema = new mongoose.Schema({
  title: String,
  description: String,
  date: String,
  priority: String,
});

const DeletedTaskSchema = new mongoose.Schema({
  title: String,
  description: String,
  date: String,
  priority: String,
});

const Task = mongoose.model("Task", TaskSchema);
const CompletedTask = mongoose.model("CompletedTask", CompletedTaskSchema);
const DeletedTask = mongoose.model("DeletedTask", DeletedTaskSchema);

// GET all tasks (inbox, completed, deleted)
app.get("/api/tasks", async (req, res) => {
  const tasks = await Task.find();
  const completed_tasks = await CompletedTask.find();
  const deleted_tasks = await DeletedTask.find();
  res.json({ tasks, completed_tasks, deleted_tasks });
});

// POST all tasks (bulk overwrite)
app.post("/api/tasks", async (req, res) => {
  const { tasks, completed_tasks, deleted_tasks } = req.body;

  // Clear collections
  await Task.deleteMany({});
  await CompletedTask.deleteMany({});
  await DeletedTask.deleteMany({});

  // Insert new data
  if (Array.isArray(tasks)) await Task.insertMany(tasks);
  if (Array.isArray(completed_tasks)) await CompletedTask.insertMany(completed_tasks);
  if (Array.isArray(deleted_tasks)) await DeletedTask.insertMany(deleted_tasks);

  res.json({ status: "ok" });
});

app.use(express.static('public'));

app.use((req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));