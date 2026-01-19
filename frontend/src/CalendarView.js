import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CalendarView = () => {
  const [termine, setTermine] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  const [newTermin, setNewTermin] = useState({
    titel: '',
    beschreibung: '',
    startzeit: '',
    endzeit: '',
    kunde_id: '',
    status: 'geplant'
  });

  useEffect(() => {
    loadTermine();
    loadCustomers();
    
    // Listen for online/offline changes
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [selectedDate]);

  const loadTermine = async () => {
    try {
      // Try to load from cache first when offline
      if (!isOnline) {
        const cachedTermine = JSON.parse(localStorage.getItem('cachedTermine') || '[]');
        if (cachedTermine.length > 0) {
          setTermine(cachedTermine);
          setLoading(false);
          return;
        }
      }

      const startDate = selectedDate + 'T00:00:00';
      const endDate = selectedDate + 'T23:59:59';
      
      const response = await axios.get(`${API}/kalender`, {
        params: {
          start_datum: startDate,
          end_datum: endDate
        }
      });
      
      setTermine(response.data);
      
      // Cache for offline use
      localStorage.setItem('cachedTermine', JSON.stringify(response.data));
    } catch (error) {
      console.error('Error loading appointments:', error);
      
      // Try to load from cache on error
      const cachedTermine = JSON.parse(localStorage.getItem('cachedTermine') || '[]');
      if (cachedTermine.length > 0) {
        setTermine(cachedTermine);
      }
    }
    setLoading(false);
  };

  const loadCustomers = async () => {
    try {
      if (!isOnline) {
        const cachedCustomers = JSON.parse(localStorage.getItem('cachedCustomers') || '[]');
        if (cachedCustomers.length > 0) {
          setCustomers(cachedCustomers);
          return;
        }
      }

      const response = await axios.get(`${API}/kunden`);
      setCustomers(response.data);
      localStorage.setItem('cachedCustomers', JSON.stringify(response.data));
    } catch (error) {
      console.error('Error loading customers:', error);
      const cachedCustomers = JSON.parse(localStorage.getItem('cachedCustomers') || '[]');
      if (cachedCustomers.length > 0) {
        setCustomers(cachedCustomers);
      }
    }
  };

  const handleAddTermin = async (e) => {
    e.preventDefault();
    
    const terminData = {
      ...newTermin,
      startzeit: new Date(`${selectedDate}T${newTermin.startzeit}`).toISOString(),
      endzeit: new Date(`${selectedDate}T${newTermin.endzeit}`).toISOString()
    };

    if (isOnline) {
      try {
        await axios.post(`${API}/kalender`, terminData);
        setShowAddForm(false);
        setNewTermin({
          titel: '',
          beschreibung: '',
          startzeit: '',
          endzeit: '',
          kunde_id: '',
          status: 'geplant'
        });
        loadTermine();
      } catch (error) {
        console.error('Error creating appointment:', error);
        alert('Fehler beim Erstellen des Termins. Bitte versuchen Sie es erneut.');
      }
    } else {
      // Store locally for sync when online
      const offlineTermine = JSON.parse(localStorage.getItem('offlineTermine') || '[]');
      const localTermin = {
        id: `offline_${Date.now()}`,
        ...terminData,
        techniker_name: 'Aktueller Benutzer',
        erstellt_am: new Date().toISOString()
      };
      
      offlineTermine.push(localTermin);
      localStorage.setItem('offlineTermine', JSON.stringify(offlineTermine));
      
      // Add to current state
      setTermine(prev => [...prev, localTermin]);
      setShowAddForm(false);
      setNewTermin({
        titel: '',
        beschreibung: '',
        startzeit: '',
        endzeit: '',
        kunde_id: '',
        status: 'geplant'
      });
      
      alert('Termin offline gespeichert. Wird synchronisiert, sobald Sie online sind.');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'geplant': '#ffc107',
      'in_bearbeitung': '#17a2b8',
      'abgeschlossen': '#28a745',
      'abgesagt': '#dc3545'
    };
    return colors[status] || '#6c757d';
  };

  const getStatusText = (status) => {
    const texts = {
      'geplant': 'Geplant',
      'in_bearbeitung': 'In Bearbeitung',
      'abgeschlossen': 'Abgeschlossen',
      'abgesagt': 'Abgesagt'
    };
    return texts[status] || status;
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="calendar-page">
      <div className="page-header">
        <h1>Kalender</h1>
        <button 
          onClick={() => setShowAddForm(true)} 
          className="btn btn-primary"
        >
          <i className="fas fa-plus"></i> Neuer Termin
        </button>
      </div>

      {/* Offline indicator */}
      {!isOnline && (
        <div className="offline-banner">
          <i className="fas fa-wifi-slash"></i>
          <span>Offline-Modus - Änderungen werden synchronisiert, sobald Sie online sind</span>
        </div>
      )}

      {/* Date selector */}
      <div className="date-selector">
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="form-input"
        />
      </div>

      {/* Add appointment form */}
      {showAddForm && (
        <div className="add-appointment-form">
          <h3>Neuen Termin hinzufügen</h3>
          <form onSubmit={handleAddTermin}>
            <div className="form-group">
              <label>Titel *</label>
              <input
                type="text"
                value={newTermin.titel}
                onChange={(e) => setNewTermin({...newTermin, titel: e.target.value})}
                required
                className="form-input"
              />
            </div>

            <div className="form-row">
              <div className="form-group half">
                <label>Startzeit *</label>
                <input
                  type="time"
                  value={newTermin.startzeit}
                  onChange={(e) => setNewTermin({...newTermin, startzeit: e.target.value})}
                  required
                  className="form-input"
                />
              </div>
              <div className="form-group half">
                <label>Endzeit *</label>
                <input
                  type="time"
                  value={newTermin.endzeit}
                  onChange={(e) => setNewTermin({...newTermin, endzeit: e.target.value})}
                  required
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Kunde</label>
              <select
                value={newTermin.kunde_id}
                onChange={(e) => setNewTermin({...newTermin, kunde_id: e.target.value})}
                className="form-select"
              >
                <option value="">Kunde auswählen...</option>
                {customers.map(customer => (
                  <option key={customer.id} value={customer.id}>
                    {customer.firmenname} - {customer.ort}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Beschreibung</label>
              <textarea
                value={newTermin.beschreibung}
                onChange={(e) => setNewTermin({...newTermin, beschreibung: e.target.value})}
                className="form-textarea"
                rows="3"
              />
            </div>

            <div className="form-actions">
              <button type="button" onClick={() => setShowAddForm(false)} className="btn btn-secondary">
                Abbrechen
              </button>
              <button type="submit" className="btn btn-primary">
                Termin hinzufügen
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Appointments list */}
      <div className="appointments-list">
        {termine.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-calendar-alt"></i>
            <p>Keine Termine für {new Date(selectedDate).toLocaleDateString('de-DE')} geplant</p>
          </div>
        ) : (
          termine.map(termin => {
            const kunde = customers.find(c => c.id === termin.kunde_id);
            return (
              <div key={termin.id} className="appointment-card">
                <div className="appointment-header">
                  <div className="appointment-time">
                    <i className="fas fa-clock"></i>
                    {new Date(termin.startzeit).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} - 
                    {new Date(termin.endzeit).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div 
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(termin.status) }}
                  >
                    {getStatusText(termin.status)}
                  </div>
                </div>
                
                <div className="appointment-content">
                  <h4>{termin.titel}</h4>
                  {termin.beschreibung && (
                    <p className="appointment-description">{termin.beschreibung}</p>
                  )}
                  
                  {kunde && (
                    <div className="appointment-customer">
                      <i className="fas fa-building"></i>
                      <span>{kunde.firmenname} - {kunde.ort}</span>
                    </div>
                  )}
                  
                  {termin.id.startsWith('offline_') && (
                    <div className="offline-indicator">
                      <i className="fas fa-clock"></i>
                      <span>Wartet auf Synchronisierung</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default CalendarView;