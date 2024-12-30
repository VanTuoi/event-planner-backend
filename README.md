# Event Planner Backend

## Backend for Event Planner Mobile Application

This is the backend part of the **Event Planner** mobile application. It is built using **Express.js** and integrates with MongoDB. This backend provides functionality for managing events, user authentication, and more.

---

## **Project Overview**

- A backend API for the Event Planner mobile application.
- It provides endpoints to manage users, events, and handle authentication.
- Features MongoDB integration, including **ChangeStreams** for real-time data updates.

### **Key Features**

- User authentication (login, register).
- Event management (create, update, delete, fetch events).
- Real-time updates via **ChangeStreams** (for MongoDB).

---

## **Project Details**

### **Environment**

- **Development Environment:** Node.js v20.14.0
- **Framework:** Express.js
- **Database:** MongoDB

### **Frontend**

- This is a simple component to supplement a more complete frontend.  
  [Frontend details at here](https://github.com/VanTuoi/event-planner.git)

---

## **Installation Guide**

Follow these steps to set up the backend project in development mode:

### **1. Clone the Repository**

Clone the repository to your local machine:

```bash
git clone https://github.com/VanTuoi/event-planner-backend.git
```

### **2. Clone the Repository**
Navigate to the backend directory and install the required dependencies:

```bash
cd event-planner-backend
npm install
```

### **3. Configure Environment Variables**
Create a .env file in the backend directory with the necessary environment variables

```bash
MONGO_URI=mongodb://localhost:27017/event-planner
PORT=8080
JWT_SECRET=your_jwt_secret
```

### **4. Set Up MongoDB ChangeStreams**
MongoDB ChangeStreams are used for real-time updates in the application. To enable them

  [Step by Step replica setup of MongoDB on Windows](https://www.youtube.com/watch?v=91PCBRJxkh0&ab_channel=E-MultiSkillsDatabaseservices)

### **5. Start the Backend Application**

```bash
npm run dev
```

---

## **License**

This project is open-source and built for educational purposes. Contributions and improvements are welcome.

---

If you encounter any issues or have suggestions for improvement, feel free to reach out to the author.
