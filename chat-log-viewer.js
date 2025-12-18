/* chat-log-viewer.js — Chat Log Viewer UI Controller */

let allMessages = [];
let filteredMessages = [];
let currentPage = 1;
const messagesPerPage = 50;

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
  loadMessages();
  setupEventListeners();
});

function setupEventListeners() {
  document.getElementById('refreshBtn').addEventListener('click', loadMessages);
  document.getElementById('searchBtn').addEventListener('click', applyFilters);
  document.getElementById('clearFiltersBtn').addEventListener('click', clearFilters);
  document.getElementById('exportBtn').addEventListener('click', exportLogs);
  document.getElementById('clearBtn').addEventListener('click', clearLogs);
  document.getElementById('prevBtn').addEventListener('click', () => changePage(-1));
  document.getElementById('nextBtn').addEventListener('click', () => changePage(1));

  // Search on Enter key
  document.getElementById('searchInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      applyFilters();
    }
  });

  // Auto-apply filters on change
  document.getElementById('directionFilter').addEventListener('change', applyFilters);
  document.getElementById('platformFilter').addEventListener('change', applyFilters);
  document.getElementById('startDate').addEventListener('change', applyFilters);
  document.getElementById('endDate').addEventListener('change', applyFilters);
}

async function loadMessages() {
  showLoading();

  try {
    const data = await chrome.storage.local.get(['chatLogs']);
    allMessages = data.chatLogs || [];

    // Update stats
    updateStats();

    // Update platform filter
    updatePlatformFilter();

    // Apply filters and display
    applyFilters();
  } catch (error) {
    console.error('Failed to load messages:', error);
    showError('Failed to load messages');
  }
}

function updateStats() {
  const total = allMessages.length;
  const incoming = allMessages.filter(m => m.direction === 'incoming').length;
  const outgoing = allMessages.filter(m => m.direction === 'outgoing').length;
  
  const platforms = new Set(allMessages.map(m => m.platform));

  document.getElementById('totalCount').textContent = total;
  document.getElementById('incomingCount').textContent = incoming;
  document.getElementById('outgoingCount').textContent = outgoing;
  document.getElementById('platformsCount').textContent = platforms.size;
}

function updatePlatformFilter() {
  const platforms = new Set(allMessages.map(m => m.platform));
  const select = document.getElementById('platformFilter');
  
  // Clear existing options except "All Platforms"
  select.innerHTML = '<option value="">All Platforms</option>';
  
  // Add platform options
  platforms.forEach(platform => {
    const option = document.createElement('option');
    option.value = platform;
    option.textContent = platform;
    select.appendChild(option);
  });
}

function applyFilters() {
  const searchText = document.getElementById('searchInput').value.toLowerCase();
  const direction = document.getElementById('directionFilter').value;
  const platform = document.getElementById('platformFilter').value;
  const startDate = document.getElementById('startDate').value;
  const endDate = document.getElementById('endDate').value;

  filteredMessages = allMessages.filter(message => {
    // Search filter
    if (searchText) {
      const matchesText = message.text.toLowerCase().includes(searchText);
      const matchesSender = message.sender.toLowerCase().includes(searchText);
      if (!matchesText && !matchesSender) return false;
    }

    // Direction filter
    if (direction && message.direction !== direction) return false;

    // Platform filter
    if (platform && message.platform !== platform) return false;

    // Date filters
    if (startDate) {
      const msgDate = new Date(message.timestamp);
      const filterDate = new Date(startDate);
      if (msgDate < filterDate) return false;
    }

    if (endDate) {
      const msgDate = new Date(message.timestamp);
      const filterDate = new Date(endDate);
      filterDate.setHours(23, 59, 59, 999); // End of day
      if (msgDate > filterDate) return false;
    }

    return true;
  });

  // Reset to page 1
  currentPage = 1;

  // Display messages
  displayMessages();
}

function displayMessages() {
  const container = document.getElementById('messagesContainer');
  
  if (filteredMessages.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📭</div>
        <h3>No messages found</h3>
        <p>Try adjusting your filters or check back later.</p>
      </div>
    `;
    document.getElementById('pagination').style.display = 'none';
    return;
  }

  // Calculate pagination
  const totalPages = Math.ceil(filteredMessages.length / messagesPerPage);
  const startIdx = (currentPage - 1) * messagesPerPage;
  const endIdx = startIdx + messagesPerPage;
  const pageMessages = filteredMessages.slice(startIdx, endIdx);

  // Render messages
  container.innerHTML = pageMessages.map(message => {
    const timestamp = new Date(message.timestamp);
    const timeStr = timestamp.toLocaleString();
    const dateStr = timestamp.toLocaleDateString();

    return `
      <div class="message-item ${message.direction}">
        <div class="message-header">
          <span class="message-sender">${escapeHtml(message.sender)}</span>
          <div class="message-meta">
            <span class="badge badge-${message.direction === 'incoming' ? 'success' : message.direction === 'outgoing' ? 'info' : 'secondary'}">
              ${message.direction}
            </span>
            <span>${message.platform}</span>
            <span>${timeStr}</span>
          </div>
        </div>
        <div class="message-text">${escapeHtml(message.text)}</div>
      </div>
    `;
  }).join('');

  // Update pagination
  updatePagination(totalPages);
}

function updatePagination(totalPages) {
  const pagination = document.getElementById('pagination');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const pageInfo = document.getElementById('pageInfo');

  if (totalPages <= 1) {
    pagination.style.display = 'none';
    return;
  }

  pagination.style.display = 'flex';
  pageInfo.textContent = `Page ${currentPage} of ${totalPages} (${filteredMessages.length} messages)`;
  
  prevBtn.disabled = currentPage === 1;
  nextBtn.disabled = currentPage === totalPages;
}

function changePage(delta) {
  currentPage += delta;
  displayMessages();
  
  // Scroll to top
  document.getElementById('messagesContainer').scrollTop = 0;
}

function clearFilters() {
  document.getElementById('searchInput').value = '';
  document.getElementById('directionFilter').value = '';
  document.getElementById('platformFilter').value = '';
  document.getElementById('startDate').value = '';
  document.getElementById('endDate').value = '';
  
  applyFilters();
}

async function exportLogs() {
  try {
    // Create export menu
    const format = await showExportMenu();
    
    if (!format) return;

    let content, filename, mimeType;

    if (format === 'json') {
      const exportData = {
        exportDate: new Date().toISOString(),
        messageCount: filteredMessages.length,
        messages: filteredMessages
      };
      content = JSON.stringify(exportData, null, 2);
      filename = `chat-logs-${Date.now()}.json`;
      mimeType = 'application/json';
    } else if (format === 'csv') {
      content = convertToCSV(filteredMessages);
      filename = `chat-logs-${Date.now()}.csv`;
      mimeType = 'text/csv';
    } else if (format === 'txt') {
      content = convertToText(filteredMessages);
      filename = `chat-logs-${Date.now()}.txt`;
      mimeType = 'text/plain';
    }

    // Download file
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showNotification(`Exported ${filteredMessages.length} messages as ${format.toUpperCase()}`, 'success');
  } catch (error) {
    console.error('Export failed:', error);
    showNotification('Export failed', 'error');
  }
}

function showExportMenu() {
  return new Promise((resolve) => {
    const menu = document.createElement('div');
    menu.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      padding: 24px;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.3);
      z-index: 10000;
      min-width: 300px;
    `;

    menu.innerHTML = `
      <h3 style="margin-bottom: 20px; font-size: 18px;">Export Format</h3>
      <div style="display: flex; flex-direction: column; gap: 10px;">
        <button class="btn btn-primary" data-format="json">JSON</button>
        <button class="btn btn-primary" data-format="csv">CSV</button>
        <button class="btn btn-primary" data-format="txt">Text</button>
        <button class="btn btn-secondary" data-format="cancel">Cancel</button>
      </div>
    `;

    document.body.appendChild(menu);

    menu.addEventListener('click', (e) => {
      if (e.target.dataset.format) {
        const format = e.target.dataset.format;
        document.body.removeChild(menu);
        resolve(format === 'cancel' ? null : format);
      }
    });
  });
}

function convertToCSV(messages) {
  const headers = ['Timestamp', 'Sender', 'Direction', 'Platform', 'Message'];
  const rows = [headers];

  messages.forEach(m => {
    rows.push([
      m.timestamp,
      m.sender,
      m.direction,
      m.platform,
      `"${m.text.replace(/"/g, '""')}"` // Escape quotes
    ]);
  });

  return rows.map(row => row.join(',')).join('\n');
}

function convertToText(messages) {
  return messages.map(m => {
    const timestamp = new Date(m.timestamp).toLocaleString();
    return `[${timestamp}] ${m.sender} (${m.direction}): ${m.text}`;
  }).join('\n\n');
}

async function clearLogs() {
  if (!confirm('Are you sure you want to clear all chat logs? This action cannot be undone.')) {
    return;
  }

  try {
    await chrome.storage.local.set({ chatLogs: [] });
    allMessages = [];
    filteredMessages = [];
    
    updateStats();
    displayMessages();
    
    showNotification('All logs cleared', 'success');
  } catch (error) {
    console.error('Failed to clear logs:', error);
    showNotification('Failed to clear logs', 'error');
  }
}

function showLoading() {
  const container = document.getElementById('messagesContainer');
  container.innerHTML = `
    <div class="loading">
      <div class="spinner"></div>
      <p>Loading messages...</p>
    </div>
  `;
}

function showError(message) {
  const container = document.getElementById('messagesContainer');
  container.innerHTML = `
    <div class="empty-state">
      <div class="empty-state-icon">⚠️</div>
      <h3>Error</h3>
      <p>${escapeHtml(message)}</p>
    </div>
  `;
}

function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 16px 24px;
    background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#007bff'};
    color: white;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    z-index: 10000;
    animation: slideIn 0.3s;
  `;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s';
    setTimeout(() => document.body.removeChild(notification), 300);
  }, 3000);
}

function escapeHtml(text) {
  const escapeMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  };
  return text.replace(/[&<>"']/g, char => escapeMap[char]);
}

// Add animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(400px);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);
