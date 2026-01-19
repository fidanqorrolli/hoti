// Push Notification Manager für HotiEnergieTech App
import React, { useState, useRef } from 'react';

class PushNotificationManager {
  constructor() {
    this.isSupported = 'serviceWorker' in navigator && 'PushManager' in window;
    this.subscription = null;
    this.publicKey = 'BDqzGl8o6GjT7sGT8G8ASDASDASDASDASDASDASDASDASDASDASD'; // Replace with your VAPID public key
  }

  // Check if push notifications are supported
  isSupported() {
    return this.isSupported;
  }

  // Request permission and subscribe
  async subscribe() {
    if (!this.isSupported) {
      throw new Error('Push notifications not supported');
    }

    // Request permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      throw new Error('Push notification permission denied');
    }

    // Get service worker registration
    const registration = await navigator.serviceWorker.ready;

    // Subscribe to push notifications
    try {
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.publicKey)
      });

      this.subscription = subscription;

      // Send subscription to server
      await this.sendSubscriptionToServer(subscription);

      console.log('Push notifications enabled');
      return subscription;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      throw error;
    }
  }

  // Send subscription details to server
  async sendSubscriptionToServer(subscription) {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No auth token');

    const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/push/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(subscription.toJSON())
    });

    if (!response.ok) {
      throw new Error('Failed to save push subscription');
    }
  }

  // Unsubscribe from push notifications
  async unsubscribe() {
    if (!this.subscription) {
      const registration = await navigator.serviceWorker.ready;
      this.subscription = await registration.pushManager.getSubscription();
    }

    if (this.subscription) {
      await this.subscription.unsubscribe();
      this.subscription = null;
      console.log('Unsubscribed from push notifications');
    }
  }

  // Get current subscription status
  async getSubscription() {
    if (!this.isSupported) return null;

    const registration = await navigator.serviceWorker.ready;
    return await registration.pushManager.getSubscription();
  }

  // Check if user is currently subscribed
  async isSubscribed() {
    const subscription = await this.getSubscription();
    return !!subscription;
  }

  // Convert VAPID key to Uint8Array
  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Show local notification
  showLocalNotification(title, options = {}) {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return;
    }

    if (Notification.permission === 'granted') {
      const notification = new Notification(title, {
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        vibrate: [200, 100, 200],
        tag: 'hotienergietec-notification',
        ...options
      });

      // Auto close after 5 seconds
      setTimeout(() => {
        notification.close();
      }, 5000);

      return notification;
    }
  }

  // Request permission (simpler method)
  async requestPermission() {
    if (!('Notification' in window)) {
      throw new Error('This browser does not support notifications');
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
}

// Notification UI Component
export const NotificationSettings = ({ user, onUpdate }) => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const pushManager = useRef(new PushNotificationManager());

  React.useEffect(() => {
    checkSubscriptionStatus();
  }, []);

  const checkSubscriptionStatus = async () => {
    try {
      const subscribed = await pushManager.current.isSubscribed();
      setIsEnabled(subscribed);
    } catch (error) {
      console.error('Error checking subscription status:', error);
    }
  };

  const handleToggle = async () => {
    setLoading(true);
    
    try {
      if (isEnabled) {
        await pushManager.current.unsubscribe();
        setIsEnabled(false);
        pushManager.current.showLocalNotification(
          'Benachrichtigungen deaktiviert',
          { body: 'Sie erhalten keine Push-Benachrichtigungen mehr' }
        );
      } else {
        await pushManager.current.subscribe();
        setIsEnabled(true);
        pushManager.current.showLocalNotification(
          'Benachrichtigungen aktiviert',
          { body: 'Sie erhalten jetzt Push-Benachrichtigungen für wichtige Updates' }
        );
      }
      
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error toggling notifications:', error);
      
      let message = 'Fehler beim Aktivieren der Benachrichtigungen';
      if (error.message.includes('denied')) {
        message = 'Benachrichtigungen wurden in den Browser-Einstellungen deaktiviert';
      }
      
      alert(message);
    }
    
    setLoading(false);
  };

  if (!pushManager.current.isSupported) {
    return (
      <div className="notification-settings">
        <div className="setting-item">
          <div className="setting-info">
            <h4>Push-Benachrichtigungen</h4>
            <p>Ihr Browser unterstützt keine Push-Benachrichtigungen</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="notification-settings">
      <div className="setting-item">
        <div className="setting-info">
          <h4>Push-Benachrichtigungen</h4>
          <p>Erhalten Sie wichtige Updates und Erinnerungen</p>
        </div>
        <div className="setting-control">
          <button
            onClick={handleToggle}
            disabled={loading}
            className={`toggle-btn ${isEnabled ? 'enabled' : 'disabled'}`}
          >
            {loading ? (
              <div className="loading-spinner small"></div>
            ) : (
              <i className={`fas ${isEnabled ? 'fa-bell' : 'fa-bell-slash'}`}></i>
            )}
            {isEnabled ? 'Aktiviert' : 'Deaktiviert'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PushNotificationManager;