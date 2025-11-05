// Load users and currentUser from localStorage
let users = JSON.parse(localStorage.getItem('users')) || [];
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;

// Notification function
function showNotification(msg, type = 'success', el = null) {
  const notif = document.getElementById('notification');
  notif.textContent = msg;
  notif.className = type + ' show';

  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

  if (el) {
    const rect = el.getBoundingClientRect();
    notif.style.position = 'absolute';
    notif.style.top = rect.bottom + scrollTop + 5 + 'px';
    notif.style.left = rect.left + scrollLeft + 'px';
    notif.style.transform = 'translateX(0) translateY(0)';
  } else {
    const container = document.querySelector('.container');
    const rect = container.getBoundingClientRect();
    notif.style.position = 'absolute';
    notif.style.top = rect.top + scrollTop - 60 + 'px';
    notif.style.left = rect.left + scrollLeft + rect.width / 2 + 'px';
    notif.style.transform = 'translateX(-50%)';
  }

  notif.style.opacity = 1;
  setTimeout(() => {
    notif.style.opacity = 0;
    notif.style.transform += ' translateY(10px)';
  }, 3000);
}

// Toggle password visibility
function togglePassword(id) {
  const input = document.getElementById(id);
  const icon = event.currentTarget.querySelector('i');

  if (input.type === "password") {
    input.type = "text";
    icon.classList.replace("fa-eye", "fa-eye-slash");
  } else {
    input.type = "password";
    icon.classList.replace("fa-eye-slash", "fa-eye");
  }
}

// Signup
async function signup() {
  const name = document.getElementById('signup-name').value.trim();
  const email = document.getElementById('signup-email').value.trim();
  const password = document.getElementById('signup-password').value;

  if (!name) return showNotification("Enter your name.", "error");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return showNotification("Enter valid email.", "error");
  if (password.length < 8 || password.length > 64) return showNotification("Password 8-64 chars.", "error");

  try {
    const res = await fetch("http://localhost:5000/api/users/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password })
    });
    const data = await res.json();
    if (data.error) return showNotification(data.error, "error");

    showNotification("Signup successful! Redirecting...", "success");
    setTimeout(() => window.location.href = "index.html", 1500);
  } catch {
    showNotification("Server error.", "error");
  }
}

// Login
async function login() {
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  if (!email || !password) return showNotification("Fill all fields.", "error");

  try {
    const res = await fetch("http://localhost:5000/api/users/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (data.error) return showNotification(data.error, "error");

    currentUser = data.user;
    localStorage.setItem('currentUser', JSON.stringify(currentUser));

    showNotification("Login successful!", "success");
    setTimeout(() => window.location.href = "profile.html", 500);
  } catch {
    showNotification("Server error.", "error");
  }
}

// Load profile info
function loadProfile() {
  if (!currentUser) return;
  document.getElementById('profile-name').value = currentUser.name;
  document.getElementById('profile-email').value = currentUser.email;
}

// Update profile
async function updateProfile() {
  if (!currentUser) return;
  const nameEl = document.getElementById('profile-name');
  const emailEl = document.getElementById('profile-email');
  const passEl = document.getElementById('profile-password');

  const name = nameEl.value.trim();
  const email = emailEl.value.trim();
  const password = passEl.value;

  if (!name) return showNotification("Name cannot be empty.", "error", nameEl);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return showNotification("Invalid email.", "error", emailEl);
  if (password && (password.length < 8 || password.length > 64)) return showNotification("Password 8-64 chars.", "error", passEl);

  try {
    const res = await fetch(`http://localhost:5000/api/users/${currentUser._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password: password || undefined })
    });
    const data = await res.json();
    if (data.error) return showNotification(data.error, "error");

    currentUser = data.user;
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    passEl.value = "";
    showNotification("Profile updated!", "success");
  } catch {
    showNotification("Server error.", "error");
  }
}

// Logout
function logout() {
  currentUser = null;
  localStorage.removeItem('currentUser');
  showNotification("Logged out!", "success");
  setTimeout(() => window.location.href = "index.html", 500);
}

// Forgot password
async function forgot() {
  const emailEl = document.getElementById('forgot-email');
  const email = emailEl.value.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return showNotification("Invalid email.", "error", emailEl);

  try {
    const res = await fetch("http://localhost:5000/api/users/check-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });
    const data = await res.json();
    if (data.error) return showNotification(data.error, "error", emailEl);

    const code = Math.floor(100000 + Math.random() * 900000);
    localStorage.setItem("resetEmail", email);
    localStorage.setItem("verificationCode", code);

    console.log(`Verification code for ${email}: ${code}`);
    showNotification("Verification code sent (check console).", "success");
    setTimeout(() => window.location.href = "verification-code.html", 1500);
  } catch {
    showNotification("Server error.", "error");
  }
}

// Verify code
function verifyCode() {
  const input = document.getElementById('verification-code').value.trim();
  const code = localStorage.getItem('verificationCode');
  if (!input) return showNotification("Enter verification code.", "error");
  if (input !== code) return showNotification("Invalid code.", "error");

  showNotification("Code verified!", "success");
  setTimeout(() => window.location.href = "confirm-password.html", 1000);
}

// Confirm new password
async function confirmNewPassword() {
  const newPass = document.getElementById('new-password').value;
  const confirmPass = document.getElementById('confirm-password').value;
  const email = localStorage.getItem('resetEmail');

  if (!newPass || !confirmPass) return showNotification("Fill all fields.", "error");
  if (newPass.length < 8 || newPass.length > 64) return showNotification("Password 8-64 chars.", "error");
  if (newPass !== confirmPass) return showNotification("Passwords do not match.", "error");

  try {
    const resCheck = await fetch("http://localhost:5000/api/users/check-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });
    const checkData = await resCheck.json();
    if (checkData.error) return showNotification(checkData.error, "error");

    const usersRes = await fetch("http://localhost:5000/api/users");
    const allUsers = await usersRes.json();
    const user = allUsers.find(u => u.email === email);
    if (!user) return showNotification("User not found.", "error");

    await fetch(`http://localhost:5000/api/users/${user._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: newPass })
    });

    localStorage.removeItem('resetEmail');
    localStorage.removeItem('verificationCode');

    showNotification("Password updated!", "success");
    setTimeout(() => window.location.href = "index.html", 1500);
  } catch {
    showNotification("Server error.", "error");
  }
}
