
// =====================================================
// Real-Time Chat - Client Logic
// =====================================================


// ---------- Page Elements ----------

const root = document.documentElement;
const statusEl = document.getElementById("status");
const list = document.getElementById("messages");
const input = document.getElementById("message");
const typingEl = document.getElementById("typing");
const panel = document.getElementById("emoji-panel");


// ---------- Local Storage ----------

const STORAGE_KEY = "realtime-chat-messages";

function getSavedMessages() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch (error) {
    console.error("Could not load saved messages:", error);
    return [];
  }
}

function saveMessage(message, mine, id) {
  try {
    const messages = getSavedMessages();

    // Prevent duplicate messages
    if (messages.some(item => item.id === id)) {
      return;
    }

    messages.push({
      id,
      text: message,
      mine,
      timestamp: new Date().toISOString()
    });

    // Keep only the latest 100 messages
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(messages.slice(-100))
    );
  } catch (error) {
    console.error("Could not save message:", error);
  }
}

function loadSavedMessages() {
  const messages = getSavedMessages();

  messages.forEach(message => {
    addBubble(message.text, message.mine, message.timestamp);
  });
}


// ---------- Theme Switch ----------

function applyTheme(theme) {
  root.setAttribute("data-theme", theme);

  document.getElementById("theme-icon").textContent =
    theme === "dark" ? "☀️" : "🌙";

  document.getElementById("theme-label").textContent =
    theme === "dark" ? "Light" : "Dark";

  try {
    localStorage.setItem("chat-theme", theme);
  } catch (error) {
    console.error("Could not save theme:", error);
  }
}

let savedTheme = null;

try {
  savedTheme = localStorage.getItem("chat-theme");
} catch (error) {
  console.error("Could not load theme:", error);
}

applyTheme(
  savedTheme ||
  (matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light")
);

document.getElementById("theme-toggle").addEventListener("click", () => {
  const currentTheme = root.getAttribute("data-theme");

  applyTheme(currentTheme === "dark" ? "light" : "dark");
});


// ---------- Socket Connection ----------

let socket = null;

function setStatus(text, offline = false) {
  statusEl.textContent = text;
  statusEl.classList.toggle("offline", offline);
}

function connect() {
  if (typeof io === "undefined") {
    setStatus("offline · Socket.IO unavailable", true);
    return;
  }

  // Connect to the same server that served the webpage
  socket = io();

  socket.on("connect", () => {
    setStatus("online");
    console.log("Connected:", socket.id);
  });

  socket.on("disconnect", () => {
    setStatus("reconnecting…", true);
  });

  socket.on("connect_error", (error) => {
    setStatus("Connection failed, retrying…", true);
    console.error(error);
  });

  socket.on("chat-message", receiveMessage);

  socket.on("typing", showTyping);
}


// Load Socket.IO if it is not already available
if (typeof io !== "undefined") {
  connect();
} else {
  const cdn = document.createElement("script");

  cdn.src = "https://cdn.socket.io/4.7.5/socket.io.min.js";

  cdn.onload = connect;

  cdn.onerror = () => {
    setStatus("offline · Could not load Socket.IO", true);
  };

  document.head.appendChild(cdn);
}


// ---------- Showing Messages ----------

let lastSide = null;

const pending = [];

function timeNow(timestamp) {
  const date = timestamp ? new Date(timestamp) : new Date();

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  });
}

function addBubble(text, mine, timestamp = null) {
  const empty = document.getElementById("empty");

  if (empty) {
    empty.remove();
  }

  const side = mine ? "out" : "in";

  const li = document.createElement("li");

  li.className =
    "msg " + side + (lastSide !== side ? " first" : "");

  lastSide = side;

  const body = document.createElement("span");

  body.textContent = text;

  const meta = document.createElement("span");

  meta.className = "meta";
  meta.textContent = timeNow(timestamp);

  if (mine) {
    const ticks = document.createElement("span");

    ticks.className = "ticks";
    ticks.textContent = "✓";

    meta.appendChild(ticks);
  }

  li.appendChild(body);
  li.appendChild(meta);

  list.appendChild(li);

  list.scrollTop = list.scrollHeight;

  return li;
}


// Convert incoming messages into text
function toText(message) {
  if (typeof message === "string") {
    return message;
  }

  if (message && typeof message === "object") {
    const text =
      message.text ??
      message.message ??
      JSON.stringify(message);

    return message.user
      ? message.user + ": " + text
      : text;
  }

  return String(message);
}


// ---------- Sending Messages ----------

function sendMessage() {
  const message = input.value.trim();

  if (!message) {
    return;
  }

  // Generate a unique ID for this message
  const messageId = crypto.randomUUID();

  const messageData = {
    id: messageId,
    text: message
  };

  // Send message to the server
  if (socket && socket.connected) {
    socket.emit("chat-message", messageData);
  }

  // Display my message immediately
  const li = addBubble(message, true);

  // Save message locally
  saveMessage(message, true, messageId);

  // Track the message until server echo arrives
  const entry = {
    id: messageId,
    text: message,
    li
  };

  pending.push(entry);

  // Stop waiting after 3 seconds
  setTimeout(() => {
    const index = pending.indexOf(entry);

    if (index !== -1) {
      pending.splice(index, 1);
    }
  }, 3000);

  input.value = "";

  input.focus();

  closeEmoji();
}

input.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    sendMessage();
  }
});


// ---------- Receiving Messages ----------

function receiveMessage(message) {
  const text = toText(message);

  const messageId =
    typeof message === "object" && message !== null
      ? message.id
      : null;

  // Check if this is my own message
  const index = pending.findIndex(entry =>
    messageId
      ? entry.id === messageId
      : entry.text === text
  );

  if (index !== -1) {
    const ticks = pending[index].li.querySelector(".ticks");

    if (ticks) {
      ticks.textContent = "✓✓";
      ticks.classList.add("delivered");
    }

    pending.splice(index, 1);

    return;
  }

  // Display received message
  addBubble(text, false);

  // Save received message
  if (messageId) {
    saveMessage(text, false, messageId);
  } else {
    saveMessage(text, false, crypto.randomUUID());
  }

  typingEl.textContent = "";
}


// ---------- Typing Indicator ----------

let typingTimer;

let lastTypingEmit = 0;

input.addEventListener("input", () => {
  if (!socket || !socket.connected) {
    return;
  }

  const now = Date.now();

  if (now - lastTypingEmit > 1500) {
    socket.emit("typing");

    lastTypingEmit = now;
  }
});

function showTyping() {
  typingEl.textContent = "someone is typing…";

  clearTimeout(typingTimer);

  typingTimer = setTimeout(() => {
    typingEl.textContent = "";
  }, 2500);
}


// ---------- Emoji Picker ----------

const emojis = [
  "😀", "😂", "🥹", "😍", "😎", "🤔",
  "😴", "😭", "👍", "👏", "🙏", "🔥",
  "🎉", "❤️", "💯", "✅", "👋", "🤝",
  "😅", "🙌", "☕", "🍕", "🚀", "⚡"
];

emojis.forEach((emoji) => {
  const button = document.createElement("button");

  button.type = "button";
  button.textContent = emoji;

  button.addEventListener("click", () => {
    input.value += emoji;
    input.focus();
  });

  panel.appendChild(button);
});

function closeEmoji() {
  panel.classList.remove("open");
}

document.getElementById("emoji-btn").addEventListener("click", (event) => {
  event.stopPropagation();

  panel.classList.toggle("open");
});

document.addEventListener("click", (event) => {
  if (!panel.contains(event.target)) {
    closeEmoji();
  }
});


// ---------- Restore Messages on Page Load ----------

loadSavedMessages();

input.focus();
