// js/utils.js
// Contains all general-purpose helper functions.

export function showNotification(msg, type = 'success') {
  const notif = document.getElementById('notification');
  if (!notif) return;
  notif.textContent = msg;
  notif.className = `${type} show`;
  setTimeout(() => notif.classList.remove('show'), 3000);
}

export function togglePassword(id) {
  const input = document.getElementById(id);
  if (!input) return;

  const type = input.type === 'password' ? 'text' : 'password';
  input.type = type;

  // Find the icon *next* to the input
  const icon = input.nextElementSibling?.querySelector('i');
  if (icon) {
    icon.classList.toggle('fa-eye', type === 'password');
    icon.classList.toggle('fa-eye-slash', type === 'text');
  }
}

export const isValidEmail = email =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export const isValidPasswordLength = pwd =>
  pwd && pwd.length >= 8 && pwd.length <= 64;

export function escapeHtml(text) {
  if (!text) return '';
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.toString().replace(/[&<>"']/g, m => map[m]);
}

export function getPriorityColor(priority) {
  switch (priority) {
    case 'High': return '#F75A5A';
    case 'Mid': return '#F8E067';
    case 'Low': return '#93E1FF';
    default: return '#93E1FF';
  }
}

export function formatDate(dateString) {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return date.toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return dateString;
  }
}