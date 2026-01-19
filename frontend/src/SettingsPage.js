import React, { useState, useEffect } from 'react';
import { NotificationSettings } from './PushNotifications';
import offlineManager from './OfflineManager';
import { useAuth } from './App';

const SettingsPage = () => {
  const { user } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    // Update pending count
    setPendingCount(offlineManager.getPendingCount());
    
    // Listen for online/offline changes
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Listen for data sync events
    const handleDataSync = () => {
      setPendingCount(offlineManager.getPendingCount());
    };
    
    window.addEventListener('dataSync', handleDataSync);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('dataSync', handleDataSync);
    };
  }, []);

  const handleClearOfflineData = () => {
    if (window.confirm('Alle offline gespeicherten Daten löschen? Diese Aktion kann nicht rückgängig gemacht werden.')) {
      offlineManager.clearOfflineData();
      setPendingCount(0);
    }
  };

  const handleManualSync = async () => {
    if (isOnline) {
      await offlineManager.syncPendingActions();
      setPendingCount(offlineManager.getPendingCount());
    }
  };

  return (
    <div className="settings-page">
      <div className="page-header">
        <h1>Einstellungen</h1>
      </div>

      {/* User Information */}
      <div className="settings-section">
        <h3><i className="fas fa-user"></i> Benutzerinformationen</h3>
        <div className="user-info-card">
          <div className="info-row">
            <span className="label">Name:</span>
            <span className="value">{user?.vollname}</span>
          </div>
          <div className="info-row">
            <span className="label">Rolle:</span>
            <span className="value">{user?.rolle === 'admin' ? 'Administrator' : 'Techniker'}</span>
          </div>
          <div className="info-row">
            <span className="label">Benutzer-ID:</span>
            <span className="value">{user?.id}</span>
          </div>
        </div>
      </div>

      {/* Connection Status */}
      <div className="settings-section">
        <h3><i className="fas fa-wifi"></i> Verbindungsstatus</h3>
        <div className="connection-status">
          <div className={`status-indicator ${isOnline ? 'online' : 'offline'}`}>
            <div className="status-icon">
              <i className={`fas ${isOnline ? 'fa-wifi' : 'fa-wifi-slash'}`}></i>
            </div>
            <div className="status-text">
              <h4>{isOnline ? 'Online' : 'Offline'}</h4>
              <p>{isOnline ? 'Verbunden mit dem Server' : 'Keine Internetverbindung'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Offline Data Management */}
      <div className="settings-section">
        <h3><i className="fas fa-database"></i> Offline-Daten</h3>
        
        <div className="offline-stats">
          <div className="stat-item">
            <div className="stat-icon">
              <i className="fas fa-clock"></i>
            </div>
            <div className="stat-content">
              <h4>{pendingCount}</h4>
              <p>Ausstehende Synchronisierung</p>
            </div>
          </div>
        </div>

        <div className="offline-actions">
          <button
            onClick={handleManualSync}
            disabled={!isOnline || pendingCount === 0}
            className="btn btn-primary"
          >
            <i className="fas fa-sync"></i>
            {pendingCount > 0 ? `${pendingCount} Änderungen synchronisieren` : 'Synchronisiert'}
          </button>
          
          <button
            onClick={handleClearOfflineData}
            className="btn btn-danger"
          >
            <i className="fas fa-trash"></i>
            Offline-Daten löschen
          </button>
        </div>
      </div>

      {/* Push Notifications */}
      <div className="settings-section">
        <h3><i className="fas fa-bell"></i> Benachrichtigungen</h3>
        <NotificationSettings user={user} />
      </div>

      {/* App Information */}
      <div className="settings-section">
        <h3><i className="fas fa-info-circle"></i> App-Information</h3>
        <div className="app-info-card">
          <div className="info-row">
            <span className="label">Version:</span>
            <span className="value">1.0.0</span>
          </div>
          <div className="info-row">
            <span className="label">Letztes Update:</span>
            <span className="value">{new Date().toLocaleDateString('de-DE')}</span>
          </div>
          <div className="info-row">
            <span className="label">Entwickelt für:</span>
            <span className="value">HotiEnergieTec</span>
          </div>
        </div>
      </div>

      {/* Company Information */}
      <div className="settings-section">
        <h3><i className="fas fa-building"></i> Unternehmen</h3>
        <div className="company-info-card">
          <div className="company-header">
            <img 
              src="https://www.hotienergietec.at/images/Logo_229125.webp" 
              alt="HotiEnergieTech Logo" 
              className="company-logo"
            />
            <div className="company-details">
              <h4>HotiEnergieTec</h4>
              <p>Ihr Profi für Heizung, Sanitär & Klima in Wien</p>
            </div>
          </div>
          
          <div className="contact-info">
            <div className="contact-item">
              <i className="fas fa-map-marker-alt"></i>
              <span>Promenadegasse 29/3/7, 1170 Wien</span>
            </div>
            <div className="contact-item">
              <i className="fas fa-phone"></i>
              <span>+43 664 4240335</span>
            </div>
            <div className="contact-item">
              <i className="fas fa-envelope"></i>
              <span>info@hotienergietec.at</span>
            </div>
            <div className="contact-item">
              <i className="fas fa-globe"></i>
              <span>www.hotienergietec.at</span>
            </div>
          </div>
        </div>
      </div>

      {/* Install App Section */}
      <div className="settings-section">
        <h3><i className="fas fa-mobile-alt"></i> Samsung S24 Ultra Installation</h3>
        <div className="install-info">
          <p>
            Diese App kann auf Ihrem Samsung S24 Ultra als native PWA-App installiert werden. 
            Tippen Sie auf das Menü Ihres Browsers und wählen Sie "Zum Startbildschirm hinzufügen".
          </p>
          <div className="install-steps">
            <div className="step">
              <div className="step-number">1</div>
              <p>Browser-Menü öffnen (⋮)</p>
            </div>
            <div className="step">
              <div className="step-number">2</div>
              <p>"Zum Startbildschirm hinzufügen" wählen</p>
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <p>App-Name bestätigen und "Hinzufügen" tippen</p>
            </div>
            <div className="step">
              <div className="step-number">4</div>
              <p>HotiEnergieTech-Icon auf Homescreen verwenden</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;