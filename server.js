const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect("your-mongodb-atlas-connection-string");

const TaskSchema = new mongoose.Schema({
  title: String,
  dueDate: String,
  done: Boolean,
  priority: String,
});

const Task = mongoose.model("Task", TaskSchema);

// Routes
app.get("/tasks", async (req, res) => {
  res.json(await Task.find());
});

app.post("/tasks", async (req, res) => {
  const task = new Task(req.body);
  await task.save();
  res.json(task);
});

app.listen(5000, () => console.log("Server running on port 5000"));
