// Offline Manager für HotiEnergieTech App

class OfflineManager {
  constructor() {
    this.isOnline = navigator.onLine;
    this.pendingActions = JSON.parse(localStorage.getItem('pendingActions') || '[]');
    this.offlineData = JSON.parse(localStorage.getItem('offlineData') || '{}');
    
    // Listen for online/offline events
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));
  }

  // Check if currently online
  isOnline() {
    return navigator.onLine;
  }

  // Handle going online
  async handleOnline() {
    console.log('📶 Online - Synchronizing pending actions...');
    this.isOnline = true;
    
    // Show online notification
    this.showNotification('Verbindung wiederhergestellt', 'Synchronisiere Daten...', 'success');
    
    // Sync pending actions
    await this.syncPendingActions();
    
    // Trigger background sync if available
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register('background-sync');
    }
  }

  // Handle going offline
  handleOffline() {
    console.log('📱 Offline - Switching to offline mode...');
    this.isOnline = false;
    
    // Show offline notification
    this.showNotification('Offline-Modus', 'Arbeiten Sie weiter - Daten werden synchronisiert, sobald Sie online sind', 'warning');
  }

  // Store action for later sync
  addPendingAction(action) {
    const actionWithTimestamp = {
      ...action,
      timestamp: Date.now(),
      id: this.generateId()
    };
    
    this.pendingActions.push(actionWithTimestamp);
    this.savePendingActions();
    
    console.log('💾 Action queued for sync:', action.type);
    this.showNotification('Offline gespeichert', `${action.description} wird synchronisiert, sobald Sie online sind`, 'info');
  }

  // Sync all pending actions
  async syncPendingActions() {
    if (this.pendingActions.length === 0) return;
    
    console.log(`🔄 Syncing ${this.pendingActions.length} pending actions...`);
    
    const successfulActions = [];
    
    for (const action of this.pendingActions) {
      try {
        await this.executePendingAction(action);
        successfulActions.push(action);
        console.log('✅ Synced action:', action.type);
      } catch (error) {
        console.error('❌ Failed to sync action:', action.type, error);
        // Keep failed actions for retry
      }
    }
    
    // Remove successful actions
    this.pendingActions = this.pendingActions.filter(
      action => !successfulActions.find(sa => sa.id === action.id)
    );
    
    this.savePendingActions();
    
    if (successfulActions.length > 0) {
      this.showNotification('Synchronisierung abgeschlossen', `${successfulActions.length} Änderungen wurden synchronisiert`, 'success');
      
      // Refresh page data
      window.dispatchEvent(new CustomEvent('dataSync'));
    }
  }

  // Execute a pending action
  async executePendingAction(action) {
    const { type, data, endpoint, method = 'POST' } = action;
    
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No auth token');
    
    const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: method !== 'GET' ? JSON.stringify(data) : undefined
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    return response.json();
  }

  // Cache data for offline use
  cacheData(key, data) {
    this.offlineData[key] = {
      data,
      timestamp: Date.now()
    };
    this.saveOfflineData();
  }

  // Get cached data
  getCachedData(key, maxAge = 1000 * 60 * 60) { // 1 hour default
    const cached = this.offlineData[key];
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > maxAge) {
      // Data too old, remove it
      delete this.offlineData[key];
      this.saveOfflineData();
      return null;
    }
    
    return cached.data;
  }

  // Save offline data to localStorage
  saveOfflineData() {
    localStorage.setItem('offlineData', JSON.stringify(this.offlineData));
  }

  // Save pending actions to localStorage
  savePendingActions() {
    localStorage.setItem('pendingActions', JSON.stringify(this.pendingActions));
  }

  // Generate unique ID
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Show notification to user
  showNotification(title, message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `offline-notification ${type}`;
    notification.innerHTML = `
      <div class="notification-content">
        <strong>${title}</strong>
        <p>${message}</p>
      </div>
      <button class="notification-close">&times;</button>
    `;
    
    // Add styles
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      max-width: 300px;
      padding: 15px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      transition: all 0.3s ease;
      transform: translateX(320px);
    `;
    
    // Type-specific styling
    const colors = {
      success: { bg: '#d4edda', border: '#c3e6cb', text: '#155724' },
      warning: { bg: '#fff3cd', border: '#ffeaa7', text: '#856404' },
      info: { bg: '#d1ecf1', border: '#bee5eb', text: '#0c5460' },
      error: { bg: '#f8d7da', border: '#f5c6cb', text: '#721c24' }
    };
    
    const color = colors[type] || colors.info;
    notification.style.backgroundColor = color.bg;
    notification.style.borderLeft = `4px solid ${color.border}`;
    notification.style.color = color.text;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
    }, 10);
    
    // Auto remove after 5 seconds
    const timeout = setTimeout(() => {
      this.removeNotification(notification);
    }, 5000);
    
    // Manual close
    notification.querySelector('.notification-close').onclick = () => {
      clearTimeout(timeout);
      this.removeNotification(notification);
    };
  }

  // Remove notification
  removeNotification(notification) {
    notification.style.transform = 'translateX(320px)';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }

  // Get pending actions count
  getPendingCount() {
    return this.pendingActions.length;
  }

  // Clear all offline data
  clearOfflineData() {
    this.offlineData = {};
    this.pendingActions = [];
    localStorage.removeItem('offlineData');
    localStorage.removeItem('pendingActions');
    
    this.showNotification('Offline-Daten gelöscht', 'Alle zwischengespeicherten Daten wurden entfernt', 'info');
  }
}

// Export singleton instance
const offlineManager = new OfflineManager();
export default offlineManager;