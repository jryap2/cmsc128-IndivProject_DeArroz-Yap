// js/auth.js

import * as api from './api.js';
import { showNotification, isValidEmail, isValidPasswordLength, togglePassword } from './utils.js';

// --- SESSION MANAGEMENT ---

function setCurrentUser(user) {
  localStorage.setItem('currentUser', JSON.stringify(user));
}

export function getCurrentUser() {
  const user = localStorage.getItem('currentUser');
  return user ? JSON.parse(user) : null;
}

// --- AUTH FUNCTIONS ---

export async function signup() {
  const name = document.getElementById('signup-name')?.value.trim();
  const email = document.getElementById('signup-email')?.value.trim();
  const password = document.getElementById('signup-password')?.value;

  if (!name) return showNotification('Enter your name.', 'error');
  if (!isValidEmail(email)) return showNotification('Enter valid email.', 'error');
  if (!isValidPasswordLength(password)) {
    return showNotification('Password 8-64 chars.', 'error');
  }

  try {
    const data = await api.signup(name, email, password);
    setCurrentUser(data.user); // Save user to localStorage
    showNotification('Signup successful! Redirecting...', 'success');
    setTimeout(() => window.location.replace('tdl.html'), 1500); // Changed: use replace & go to tdl.html
  } catch (error) {
    showNotification(error.message, 'error');
  }
}

export async function login() {
  const email = document.getElementById('login-email')?.value.trim();
  const password = document.getElementById('login-password')?.value;

  if (!email || !password) {
    return showNotification('Fill all fields.', 'error');
  }

  try {
    const data = await api.login(email, password);
    setCurrentUser(data.user);
    showNotification('Login successful!', 'success');
    setTimeout(() => window.location.replace('tdl.html'), 500); // Changed: use replace
  } catch (error) {
    showNotification(error.message, 'error');
  }
}

export function logout() {
  localStorage.removeItem('currentUser');
  showNotification('Logged out!', 'success');
  setTimeout(() => window.location.replace('index.html'), 500); // Changed: use replace
}

// --- PROFILE FUNCTIONS ---

async function loadProfile() {
  const currentUser = getCurrentUser();
  if (!currentUser) return;
  document.getElementById('profile-name').value = currentUser.name || '';
  document.getElementById('profile-email').value = currentUser.email || '';
}

async function updateProfile() {
  const currentUser = getCurrentUser();
  if (!currentUser) return;

  const name = document.getElementById('profile-name').value.trim();
  const email = document.getElementById('profile-email').value.trim();
  const password = document.getElementById('profile-password').value;

  if (!name) return showNotification('Name cannot be empty.', 'error');
  if (!isValidEmail(email)) return showNotification('Enter valid email.', 'error');
  if (password && !isValidPasswordLength(password)) {
    return showNotification('Password 8-64 chars.', 'error');
  }

  try {
    const data = await api.updateProfile(currentUser._id, name, email, password || null);
    setCurrentUser(data.user);
    document.getElementById('profile-password').value = '';
    showNotification('Profile updated!', 'success');
  } catch (error) {
    showNotification(error.message, 'error');
  }
}

// --- PASSWORD RESET FUNCTIONS ---

async function forgot() {
  const email = document.getElementById('forgot-email')?.value.trim();

  if (!isValidEmail(email)) {
    return showNotification('Please enter a valid email.', 'error');
  }

  try {
    await api.checkEmail(email);
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`Password reset code for ${email}: ${verificationCode}`);
    localStorage.setItem("resetEmail", email);
    localStorage.setItem("verificationCode", verificationCode);
    showNotification('A verification code has been sent to your console (F12).', 'success');
    setTimeout(() => (window.location.href = 'verification-code.html'), 1500);
  } catch (error) {
    showNotification('Email not found in our system.', 'error');
  }
}

async function verifyCode() {
  const codeInput = document.getElementById('verification-code')?.value.trim();
  const storedCode = localStorage.getItem("verificationCode");

  if (codeInput === storedCode) {
    showNotification('Code verified!', 'success');
    localStorage.removeItem("verificationCode");
    setTimeout(() => (window.location.href = 'confirm-password.html'), 1000);
  } else {
    showNotification('Invalid verification code.', 'error');
  }
}

async function confirmNewPassword() {
  const newPassword = document.getElementById('new-password')?.value;
  const confirmPassword = document.getElementById('confirm-password')?.value;
  const email = localStorage.getItem("resetEmail");

  if (!email) {
    showNotification('Session expired. Please try again.', 'error');
    setTimeout(() => (window.location.href = 'forgot.html'), 1500);
    return;
  }

  if (!isValidPasswordLength(newPassword)) {
    return showNotification('Password 8-64 chars.', 'error');
  }

  if (newPassword !== confirmPassword) {
    return showNotification('Passwords do not match.', 'error');
  }

  try {
    await api.resetPassword(email, newPassword);
    showNotification('Password has been reset successfully!', 'success');
    localStorage.removeItem("resetEmail");
    setTimeout(() => window.location.replace('index.html'), 1500); // Changed: use replace
  } catch (error) {
    showNotification('An error occurred. Please try again.', 'error');
  }
}

// --- PAGE SETUP ---

window.signup = signup;
window.login = login;
window.logout = logout;
window.togglePassword = togglePassword;
window.updateProfile = updateProfile;
window.forgot = forgot;
window.verifyCode = verifyCode;
window.confirmNewPassword = confirmNewPassword;

// --- NEW: CHECK AUTH ON PAGE LOAD ---
const path = window.location.pathname;

// If on login or signup page and already logged in, redirect to TDL
if (path.endsWith('index.html') || path.endsWith('signup.html') || path === '/') {
  const user = getCurrentUser();
  if (user) {
    window.location.replace('tdl.html');
  }
}

// Profile page protection
if (path.endsWith('profile.html')) {
  document.addEventListener('DOMContentLoaded', () => {
    if (!getCurrentUser()) {
      window.location.replace('index.html');
      return;
    }
    loadProfile();
  });
}
