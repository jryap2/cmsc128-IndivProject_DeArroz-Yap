const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect("mongodb+srv://dbUser:bumblebee23@cluster0.t6kb4u4.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0");

const TaskSchema = new mongoose.Schema({
  title: String,
  dueDate: String,
  done: Boolean,
  priority: String,
});

const Task = mongoose.model("Task", TaskSchema);

app.get("/tasks", async (req, res) => {
  res.json(await Task.find());
});

app.post("/tasks", async (req, res) => {
  const task = new Task(req.body);
  await task.save();
  res.json(task);
});

// Update task (mark as done/undone)
app.patch("/tasks/:id", async (req, res) => {
    try {
        const task = await Task.findByIdAndUpdate(
            req.params.id,
            { done: req.body.done },
            { new: true } // returns the updated document
        );
        if (!task) return res.status(404).json({ message: "Task not found" });
        res.json(task);
    } catch (err) {
        res.status(500).json({ message: "Error updating task", error: err });
    }
});

// Delete task
app.delete("/tasks/:id", async (req, res) => {
    try {
        const task = await Task.findByIdAndDelete(req.params.id);
        if (!task) return res.status(404).json({ message: "Task not found" });
        res.json({ message: "Task deleted" });
    } catch (err) {
        res.status(500).json({ message: "Error deleting task", error: err });
    }
});


const PORT = process.env.PORT || 5000;  
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
