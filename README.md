# To-Do List Application 

## Summary

This is a full-stack To-Do List application built with a **Node.js (Express)** backend and **MongoDB Atlas** for data storage. It features full user authentication and complete CRUD (Create, Read, Update, Delete) functionality for task management. The entire application, including the HTML/CSS/JS frontend, is deployed as a single service on **Render**.

## Example API endpoints
|**POST** | `/api/users/signup` | Register a new user. | , **GET** | `/api/tasks` | Retrieve all tasks for the logged-in user. | ,  **DELETE** | `/api/tasks/:id` | Delete a specific task. |



##  Local Setup

1.  **Clone** the repository.
2.  Run **`npm install`** to install dependencies.
3.  Create a **`.env`** file with your **`MONGODB_URI`**.
4.  Start the server using: **`node server.js`**.

