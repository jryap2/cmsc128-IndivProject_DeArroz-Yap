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
    await api.signup(name, email, password);
    showNotification('Signup successful! Redirecting...', 'success');
    setTimeout(() => (window.location.href = 'index.html'), 1500);
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
    setCurrentUser(data.user); // Save the logged-in user
    showNotification('Login successful!', 'success');
    setTimeout(() => (window.location.href = 'tdl.html'), 500);
  } catch (error) {
    showNotification(error.message, 'error');
  }
}

export function logout() {
  localStorage.removeItem('currentUser');
  showNotification('Logged out!', 'success');
  setTimeout(() => (window.location.href = 'index.html'), 500);
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
  const password = document.getElementById('profile-password').value;

  if (!name) return showNotification('Name cannot be empty.', 'error');
  if (password && !isValidPasswordLength(password)) {
    return showNotification('Password 8-64 chars.', 'error');
  }

  try {
    const data = await api.updateProfile(currentUser._id, name, password || null);
    setCurrentUser(data.user); // Update the saved user
    document.getElementById('profile-password').value = '';
    showNotification('Profile updated!', 'success');
  } catch (error) {
    showNotification(error.message, 'error');
  }
}

// --- PASSWORD RESET FUNCTIONS ---

// REPLACE your old 'forgot' function with this new one

async function forgot() {
  const email = document.getElementById('forgot-email')?.value.trim();
  if (!isValidEmail(email)) {
    return showNotification('Please enter a valid email.', 'error');
  }

  try {
    // 1. Check if the email exists in the database
    await api.checkEmail(email); // <-- THIS IS THE FIX

    // 2. If it exists, generate a fake code and log it
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`Password reset code for ${email}: ${verificationCode}`);
    
    // Store email and code so the next page can see them
    localStorage.setItem("resetEmail", email);
    localStorage.setItem("verificationCode", verificationCode);

    showNotification('A verification code has been sent to your console (F12).', 'success');
    setTimeout(() => (window.location.href = 'verification-code.html'), 1500);

  } catch (error) {
    // 3. If email does not exist, show an error
    showNotification('Email not found in our system.', 'error');
  }
}

// REPLACE your old verifyCode function with this
async function verifyCode() {
  const codeInput = document.getElementById('verification-code')?.value.trim();
  const storedCode = localStorage.getItem("verificationCode");

  if (codeInput === storedCode) {
    showNotification('Code verified!', 'success');
    localStorage.removeItem("verificationCode"); // Code is used, remove it
    setTimeout(() => (window.location.href = 'confirm-password.html'), 1000);
  } else {
    showNotification('Invalid verification code.', 'error');
  }
}

// REPLACE your old confirmNewPassword function with this
async function confirmNewPassword() {
  const newPassword = document.getElementById('new-password')?.value;
  const confirmPassword = document.getElementById('confirm-password')?.value;
  const email = localStorage.getItem("resetEmail"); // Get email from storage

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
    // Call the new API endpoint
    await api.resetPassword(email, newPassword);
    
    showNotification('Password has been reset successfully!', 'success');
    localStorage.removeItem("resetEmail"); // All done, clear storage
    setTimeout(() => (window.location.href = 'index.html'), 1500);
  } catch (error) {
    showNotification('An error occurred. Please try again.', 'error');
  }
}

// --- PAGE SETUP ---
// This assigns the functions to the global window object
// so your HTML `onclick="..."` attributes can find them.
window.signup = signup;
window.login = login;
window.logout = logout;
window.togglePassword = togglePassword;
window.updateProfile = updateProfile;
window.forgot = forgot;
window.verifyCode = verifyCode;
window.confirmNewPassword = confirmNewPassword;


// This part runs page-specific logic for profile.html
const path = window.location.pathname;
if (path.endsWith('profile.html')) {
  document.addEventListener('DOMContentLoaded', () => {
    if (!getCurrentUser()) {
      window.location.href = 'index.html';
      return;
    }
    loadProfile();
  });
}