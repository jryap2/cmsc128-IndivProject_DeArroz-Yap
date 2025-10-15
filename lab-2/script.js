// ===== Load users and currentUser from localStorage =====
let users = JSON.parse(localStorage.getItem('users')) || [];
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;

// ===== Notification Function =====
function showNotification(message, type = 'success', inputElement = null) {
  const notification = document.getElementById('notification');
  notification.textContent = message;
  notification.className = type + ' show';

  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

  if (inputElement) {
    // === Case 1: Inline input error ===
    const rect = inputElement.getBoundingClientRect();
    notification.style.position = 'absolute';
    notification.style.top = rect.bottom + scrollTop + 5 + 'px';
    notification.style.left = rect.left + scrollLeft + 'px';
    notification.style.transform = 'translateX(0) translateY(0)';
  } else {
    // === Case 2: Global success/error above container ===
    const container = document.querySelector('.container');
    const containerRect = container.getBoundingClientRect();
    notification.style.position = 'absolute';
    notification.style.top = (containerRect.top + scrollTop - 60) + 'px'; // 60px above container
    notification.style.left = (containerRect.left + scrollLeft + containerRect.width / 2) + 'px';
    notification.style.transform = 'translateX(-50%) translateY(0)';
  }

  // Animate in
  notification.style.opacity = 1;

  // Animate out
  setTimeout(() => {
    notification.style.opacity = 0;
    notification.style.transform += ' translateY(10px)';
  }, 3000);
}
// ===== Toggle Password Visibility =====
function togglePassword(inputId) {
  const passwordInput = document.getElementById(inputId);
  const toggleBtn = event.currentTarget;
  const icon = toggleBtn.querySelector('i');

  if (passwordInput.type === "password") {
    passwordInput.type = "text";
    icon.classList.remove("fa-eye");
    icon.classList.add("fa-eye-slash");
  } else {
    passwordInput.type = "password";
    icon.classList.remove("fa-eye-slash");
    icon.classList.add("fa-eye");
  }
}

// ===== Signup Logic =====
function signup() {
  const nameInput = document.getElementById('signup-name');
  const emailInput = document.getElementById('signup-email');
  const passwordInput = document.getElementById('signup-password');

  const name = nameInput.value.trim();
  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!name) { showNotification("Please enter your name.", "error", nameInput); return; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showNotification("Please enter a valid email address.", "error", emailInput); return; }
  if (password.length < 8 || password.length > 64) { showNotification("Password must be 8-64 characters.", "error", passwordInput); return; }

  if (users.find(u => u.email === email)) {
    showNotification("Email already registered.", "error", emailInput);
    return;
  }

  const user = { name, email, password };
  users.push(user);
  localStorage.setItem('users', JSON.stringify(users)); // save users
  showNotification("Signup successful! Redirecting to login...", "success");
  console.log("Users:", users);

  setTimeout(() => {
    window.location.href = "index.html";
  }, 1500);
}

// ===== Login Logic =====
function login() {
  const emailInput = document.getElementById('login-email');
  const passwordInput = document.getElementById('login-password');

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!email || !password) { showNotification("Please fill in all fields.", "error"); return; }

  const user = users.find(u => u.email === email && u.password === password);
  if (!user) { showNotification("Invalid email or password.", "error"); return; }

  currentUser = user;
  localStorage.setItem('currentUser', JSON.stringify(currentUser)); // save logged-in user
  showNotification("Login successful!", "success");

  setTimeout(() => {
    window.location.href = "profile.html";
  }, 500);
}

function loadProfile() {
  currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
  users = JSON.parse(localStorage.getItem('users')) || [];

  if (!currentUser) return;

  const nameInput = document.getElementById('profile-name');
  const emailInput = document.getElementById('profile-email');

  if (nameInput) nameInput.value = currentUser.name;
  if (emailInput) emailInput.value = currentUser.email;
}

function updateProfile() {
  if (!currentUser) return;

  const nameInput = document.getElementById('profile-name');
  const emailInput = document.getElementById('profile-email');
  const passwordInput = document.getElementById('profile-password');

  const newName = nameInput.value.trim();
  const newEmail = emailInput.value.trim();
  const newPassword = passwordInput.value;

  // Validate name
  if (!newName) {
    showNotification("Name cannot be empty.", "error", nameInput);
    return;
  }

  // Validate email format
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
    showNotification("Please enter a valid email address.", "error", emailInput);
    return;
  }

  // Load all users
  users = JSON.parse(localStorage.getItem('users')) || [];

  // Check if new email already exists for another user
  const existingUser = users.find(u => u.email === newEmail && u.email !== currentUser.email);
  if (existingUser) {
    showNotification("That email is already in use by another account.", "error", emailInput);
    return;
  }

  // Validate password if provided
  if (newPassword && (newPassword.length < 8 || newPassword.length > 64)) {
    showNotification("Password must be between 8 and 64 characters.", "error", passwordInput);
    return;
  }

  // Find the user in the array (by old email)
  const index = users.findIndex(u => u.email === currentUser.email);
  if (index === -1) {
    showNotification("User not found.", "error");
    return;
  }

  // Update user info
  users[index].name = newName;
  users[index].email = newEmail;
  if (newPassword) users[index].password = newPassword;

  // Update currentUser and localStorage
  currentUser = { ...users[index] };
  localStorage.setItem('users', JSON.stringify(users));
  localStorage.setItem('currentUser', JSON.stringify(currentUser));

  // Clear password field for safety
  passwordInput.value = "";

  showNotification("Profile updated successfully!", "success");
}

// ===== Logout =====
function logout() {
  currentUser = null;
  localStorage.removeItem('currentUser');
  showNotification("Logged out successfully!", "success");
  setTimeout(() => {
    window.location.href = "index.html";
  }, 500);
}

// ===== Forgot Password Logic =====
function forgot() {
  const emailInput = document.getElementById('forgot-email');
  const email = emailInput.value.trim();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showNotification("Please enter a valid email address.", "error", emailInput);
    return;
  }

  const user = users.find(u => u.email === email);
  if (!user) {
    showNotification("Email not found.", "error", emailInput);
    return;
  }

  // Generate 6-digit mock verification code
  const verificationCode = Math.floor(100000 + Math.random() * 900000);

  // Save to localStorage for next page
  localStorage.setItem("resetEmail", email);
  localStorage.setItem("verificationCode", verificationCode);

  showNotification("A code has been sent to your email (check console).", "success");

  // Log it to the console (mock "sent email")
  console.log(`Verification code for ${email}: ${verificationCode}`);

  // Redirect to verification page after short delay
  setTimeout(() => {
    window.location.href = "verification-code.html";
  }, 1500);
}

// ===== Verify Code Logic =====
function verifyCode() {
  const inputCode = document.getElementById('verification-code').value.trim();
  const storedCode = localStorage.getItem('verificationCode');

  if (!inputCode) {
    showNotification("Please enter the verification code.", "error");
    return;
  }

  if (inputCode !== storedCode) {
    showNotification("Invalid code. Please try again.", "error");
    return;
  }

  showNotification("Code verified successfully!", "success");

  setTimeout(() => {
    window.location.href = "confirm-password.html";
  }, 1000);
}

// ===== Confirm New Password Logic =====
function confirmNewPassword() {
  const newPass = document.getElementById('new-password').value;
  const confirmPass = document.getElementById('confirm-password').value;

  const email = localStorage.getItem('resetEmail');
  users = JSON.parse(localStorage.getItem('users')) || [];

  if (!newPass || !confirmPass) {
    showNotification("Please fill in all fields.", "error");
    return;
  }

  if (newPass.length < 8 || newPass.length > 64) {
    showNotification("Password must be between 8 and 64 characters.", "error");
    return;
  }

  if (newPass !== confirmPass) {
    showNotification("Passwords do not match.", "error");
    return;
  }

  // Find user and update password
  const userIndex = users.findIndex(u => u.email === email);
  if (userIndex === -1) {
    showNotification("User not found.", "error");
    return;
  }

  users[userIndex].password = newPass;
  localStorage.setItem('users', JSON.stringify(users));

  // Clear temporary data
  localStorage.removeItem('resetEmail');
  localStorage.removeItem('verificationCode');

  showNotification("Password updated successfully!", "success");

  setTimeout(() => {
    window.location.href = "index.html"; // redirect to login
  }, 1500);
}
