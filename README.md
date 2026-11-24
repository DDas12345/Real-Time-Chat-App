# 💬 Real-Time Chat App

A real-time messaging application built using **Node.js, Express.js, and Socket.IO**. This project allows users to exchange messages instantly with a clean, responsive chat interface.

## ✨ Features

- 💬 Real-time messaging using Socket.IO
- ✓ Message delivery indicators
- ⌨️ Live typing indicator
- 😀 Emoji picker
- 🌙 Dark and light mode
- 💾 LocalStorage-based chat history
- 🔄 Restore messages after refreshing the page
- 📱 Responsive user interface

## 🛠️ Tech Stack

- **Frontend:** HTML, CSS, JavaScript
- **Backend:** Node.js, Express.js
- **Real-time Communication:** Socket.IO
- **Storage:** Browser LocalStorage

## 📁 Project Structure

```text
Real-Time-Chat-App/
│
├── public/
│   ├── index.html
│   ├── style.css
│   └── script.js
│
├── socket.js
├── package.json
├── package-lock.json
└── README.md
```

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/YOUR-USERNAME/Real-Time-Chat-App.git
```

### 2. Navigate to the project directory

```bash
cd Real-Time-Chat-App
```

### 3. Install dependencies

```bash
npm install
```

### 4. Start the server

```bash
node socket.js
```

### 5. Open the application

Visit:

```text
http://localhost:3000
```

Open the application in two browser tabs to test real-time messaging.

## 💾 Data Storage

The application uses browser LocalStorage to save chat messages and theme preferences.

**Note:** LocalStorage is browser-specific and does not provide permanent, centralized storage across different devices.

## 🔮 Future Improvements

- User authentication and registration
- Individual chat rooms
- Database integration
- Message timestamps and read receipts
- Online/offline user status
- Image and file sharing

## 👩‍💻 Author

**Debanshika Das**

---

⭐ If you like this project, consider giving the repository a star!
