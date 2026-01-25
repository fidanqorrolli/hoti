import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import ReportDetailPage from './ReportDetail';
import CalendarView from './CalendarView';
import SettingsPage from './SettingsPage';
import './App.css';

// Ndryshimi: Shtojmë një vlerë rezervë nëse mungon variabla e mjedisit
// Kjo është mënyra e sigurt:
const API = 'https://hoti-backend.onrender.com/api';

// Auth Context
const AuthContext = React.createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      loadUser();
    } else {
      setLoading(false);
    }
  }, []);

  const loadUser = async () => {
    try {
      const response = await axios.get(`${API}/auth/profil`);
      setUser(response.data);
    } catch (error) {
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
    }
    setLoading(false);
  };

  const login = async (benutzername, passwort) => {
  try {
    // Këtu bëjmë përkthimin për serverin:
    const response = await axios.post(`${API}/auth/anmelden`, {
      username: benutzername,  // Dërgojmë 'username', fusim vlerën e 'benutzername'
      password: passwort       // Dërgojmë 'password', fusim vlerën e 'passwort'
    });
      
      const { access_token, benutzer } = response.data;
      localStorage.setItem('token', access_token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      setUser(benutzer);
      return true;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Anmeldung fehlgeschlagen');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const value = {
    user,
    login,
    logout,
    loading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

const useAuth = () => {
  return React.useContext(AuthContext);
};

export { useAuth };

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Laden...</p>
      </div>
    );
  }
  
  return user ? children : <Navigate to="/login" />;
};

// Header Component
const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="app-header">
      <div className="header-content">
        <div className="header-left">
          <img 
            src="https://www.hotienergietec.at/images/Logo_229125.webp" 
            alt="HotiEnergieTec" 
            className="logo"
          />
          <h1>Arbeitsberichte</h1>
        </div>
        <div className="header-right">
          <Link to="/einstellungen" className="settings-link">
            <i className="fas fa-cog"></i>
          </Link>
          <span className="user-name">{user?.vollname}</span>
          <button onClick={handleLogout} className="logout-btn">
            <i className="fas fa-sign-out-alt"></i>
          </button>
        </div>
      </div>
    </header>
  );
};

// Navigation Component
const Navigation = () => {
  const location = useLocation();

  const navItems = [
    { path: '/dashboard', icon: 'fas fa-tachometer-alt', label: 'Dashboard' },
    { path: '/berichte', icon: 'fas fa-file-alt', label: 'Berichte' },
    { path: '/kalender', icon: 'fas fa-calendar-alt', label: 'Kalender' },
    { path: '/kunden', icon: 'fas fa-users', label: 'Kunden' },
    { path: '/neuer-bericht', icon: 'fas fa-plus', label: 'Neu' }
  ];

  return (
    <nav className="bottom-nav">
      {navItems.map(item => (
        <Link
          key={item.path}
          to={item.path}
          className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
        >
          <i className={item.icon}></i>
          <span>{item.label}</span>
        </Link>
      ))}
    </nav>
  );
};

// Login Page
const LoginPage = () => {
  const [benutzername, setBenutzername] = useState('');
  const [passwort, setPasswort] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(benutzername, passwort);
      navigate('/dashboard');
    } catch (error) {
      setError(error.message);
    }
    setLoading(false);
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <img 
            src="https://www.hotienergietec.at/images/Logo_229125.webp" 
            alt="HotiEnergieTec" 
            className="login-logo"
          />
          <h1>HotiEnergieTec</h1>
          <p>Arbeitsberichts-App</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-group">
            <label>Benutzername</label>
            <input
              type="text"
              value={benutzername}
              onChange={(e) => setBenutzername(e.target.value)}
              required
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Passwort</label>
            <input
              type="password"
              value={passwort}
              onChange={(e) => setPasswort(e.target.value)}
              required
              className="form-input"
            />
          </div>

          <button type="submit" disabled={loading} className="login-btn">
            {loading ? 'Anmelden...' : 'Anmelden'}
          </button>
        </form>

        <div className="login-footer">
          <p>© 2025 HotiEnergieTec</p>
          <p>Ihr Profi für Heizung, Sanitär & Klima in Wien</p>
        </div>
      </div>
    </div>
  );
};

// Dashboard Page
const DashboardPage = () => {
  const [stats, setStats] = useState({});
  const [recentReports, setRecentReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [statsResponse, reportsResponse] = await Promise.all([
        axios.get(`${API}/dashboard/statistiken`),
        axios.get(`${API}/arbeitsberichte?limit=5`)
      ]);
      
      setStats(statsResponse.data);
      setRecentReports(reportsResponse.data);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-file-alt"></i>
          </div>
          <div className="stat-content">
            <h3>{stats.total_berichte || 0}</h3>
            <p>Gesamt Berichte</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-edit"></i>
          </div>
          <div className="stat-content">
            <h3>{stats.entwurf_berichte || 0}</h3>
            <p>Entwürfe</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-check-circle"></i>
          </div>
          <div className="stat-content">
            <h3>{stats.abgeschlossen_berichte || 0}</h3>
            <p>Abgeschlossen</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-users"></i>
          </div>
          <div className="stat-content">
            <h3>{stats.kunden_anzahl || '-'}</h3>
            <p>Kunden</p>
          </div>
        </div>
      </div>

      <div className="recent-reports">
        <h2>Neueste Berichte</h2>
        {recentReports.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-file-alt"></i>
            <p>Keine Berichte vorhanden</p>
            <Link to="/neuer-bericht" className="btn btn-primary">
              Ersten Bericht erstellen
            </Link>
          </div>
        ) : (
          <div className="reports-list">
            {recentReports.map(report => (
              <Link key={report.id} to={`/berichte/${report.id}`} className="report-card">
                <div className="report-header">
                  <span className="report-number">{report.nummer}</span>
                  <span className={`status-badge ${report.status}`}>
                    {report.status === 'entwurf' ? 'Entwurf' : 
                     report.status === 'abgeschlossen' ? 'Abgeschlossen' : 'Archiviert'}
                  </span>
                </div>
                <div className="report-content">
                  <h4>{report.kunde_firmenname}</h4>
                  <p>{report.durchgefuehrte_arbeiten.substring(0, 100)}...</p>
                  <div className="report-meta">
                    <span>{new Date(report.erstellt_am).toLocaleDateString('de-DE')}</span>
                    <span>{report.techniker_name}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Reports List Page
const ReportsPage = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('alle');

  useEffect(() => {
    loadReports();
  }, [filter]);

  const loadReports = async () => {
    try {
      let url = `${API}/arbeitsberichte`;
      if (filter !== 'alle') {
        url += `?status=${filter}`;
      }
      
      const response = await axios.get(url);
      setReports(response.data);
    } catch (error) {
      console.error('Error loading reports:', error);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="reports-page">
      <div className="page-header">
        <h1>Arbeitsberichte</h1>
        <Link to="/neuer-bericht" className="btn btn-primary">
          <i className="fas fa-plus"></i> Neuer Bericht
        </Link>
      </div>

      <div className="filter-tabs">
        <button
          className={`filter-tab ${filter === 'alle' ? 'active' : ''}`}
          onClick={() => setFilter('alle')}
        >
          Alle
        </button>
        <button
          className={`filter-tab ${filter === 'entwurf' ? 'active' : ''}`}
          onClick={() => setFilter('entwurf')}
        >
          Entwürfe
        </button>
        <button
          className={`filter-tab ${filter === 'abgeschlossen' ? 'active' : ''}`}
          onClick={() => setFilter('abgeschlossen')}
        >
          Abgeschlossen
        </button>
      </div>

      {reports.length === 0 ? (
        <div className="empty-state">
          <i className="fas fa-file-alt"></i>
          <p>Keine Berichte gefunden</p>
          <Link to="/neuer-bericht" className="btn btn-primary">
            Neuen Bericht erstellen
          </Link>
        </div>
      ) : (
        <div className="reports-list">
          {reports.map(report => (
            <Link key={report.id} to={`/berichte/${report.id}`} className="report-card">
              <div className="report-header">
                <span className="report-number">{report.nummer}</span>
                <span className={`status-badge ${report.status}`}>
                  {report.status === 'entwurf' ? 'Entwurf' : 
                   report.status === 'abgeschlossen' ? 'Abgeschlossen' : 'Archiviert'}
                </span>
              </div>
              <div className="report-content">
                <h4>{report.kunde_firmenname}</h4>
                <p>{report.durchgefuehrte_arbeiten.substring(0, 150)}...</p>
                <div className="report-meta">
                  <span><i className="fas fa-calendar"></i> {new Date(report.erstellt_am).toLocaleDateString('de-DE')}</span>
                  <span><i className="fas fa-user"></i> {report.techniker_name}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

// Customers Page
const CustomersPage = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    firmenname: '',
    strasse: '',
    plz: '',
    ort: '',
    ansprechpartner: '',
    email: '',
    telefon: ''
  });

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const response = await axios.get(`${API}/kunden`);
      setCustomers(response.data);
    } catch (error) {
      console.error('Error loading customers:', error);
    }
    setLoading(false);
  };

  const handleAddCustomer = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/kunden`, newCustomer);
      setShowAddForm(false);
      setNewCustomer({
        firmenname: '',
        strasse: '',
        plz: '',
        ort: '',
        ansprechpartner: '',
        email: '',
        telefon: ''
      });
      loadCustomers();
    } catch (error) {
      console.error('Error adding customer:', error);
    }
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="customers-page">
      <div className="page-header">
        <h1>Kunden</h1>
        <button 
          onClick={() => setShowAddForm(!showAddForm)} 
          className="btn btn-primary"
        >
          <i className="fas fa-plus"></i> Neuer Kunde
        </button>
      </div>

      {showAddForm && (
        <div className="add-customer-form">
          <h3>Neuen Kunden hinzufügen</h3>
          <form onSubmit={handleAddCustomer}>
            <div className="form-row">
              <div className="form-group">
                <label>Firmenname *</label>
                <input
                  type="text"
                  value={newCustomer.firmenname}
                  onChange={(e) => setNewCustomer({...newCustomer, firmenname: e.target.value})}
                  required
                  className="form-input"
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Straße</label>
                <input
                  type="text"
                  value={newCustomer.strasse}
                  onChange={(e) => setNewCustomer({...newCustomer, strasse: e.target.value})}
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group half">
                <label>PLZ</label>
                <input
                  type="text"
                  value={newCustomer.plz}
                  onChange={(e) => setNewCustomer({...newCustomer, plz: e.target.value})}
                  className="form-input"
                />
              </div>
              <div className="form-group half">
                <label>Ort</label>
                <input
                  type="text"
                  value={newCustomer.ort}
                  onChange={(e) => setNewCustomer({...newCustomer, ort: e.target.value})}
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Ansprechpartner</label>
                <input
                  type="text"
                  value={newCustomer.ansprechpartner}
                  onChange={(e) => setNewCustomer({...newCustomer, ansprechpartner: e.target.value})}
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group half">
                <label>E-Mail</label>
                <input
                  type="email"
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})}
                  className="form-input"
                />
              </div>
              <div className="form-group half">
                <label>Telefon</label>
                <input
                  type="tel"
                  value={newCustomer.telefon}
                  onChange={(e) => setNewCustomer({...newCustomer, telefon: e.target.value})}
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="button" onClick={() => setShowAddForm(false)} className="btn btn-secondary">
                Abbrechen
              </button>
              <button type="submit" className="btn btn-primary">
                Kunde hinzufügen
              </button>
            </div>
          </form>
        </div>
      )}

      {customers.length === 0 ? (
        <div className="empty-state">
          <i className="fas fa-users"></i>
          <p>Keine Kunden vorhanden</p>
        </div>
      ) : (
        <div className="customers-list">
          {customers.map(customer => (
            <div key={customer.id} className="customer-card">
              <div className="customer-header">
                <h4>{customer.firmenname}</h4>
              </div>
              <div className="customer-content">
                <div className="customer-info">
                  <p><i className="fas fa-map-marker-alt"></i> {customer.strasse}, {customer.plz} {customer.ort}</p>
                  {customer.ansprechpartner && (
                    <p><i className="fas fa-user"></i> {customer.ansprechpartner}</p>
                  )}
                  {customer.email && (
                    <p><i className="fas fa-envelope"></i> {customer.email}</p>
                  )}
                  {customer.telefon && (
                    <p><i className="fas fa-phone"></i> {customer.telefon}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// New Report Page (Basic version for now)
const NewReportPage = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [workDescription, setWorkDescription] = useState('');
  const [kommNr, setKommNr] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const response = await axios.get(`${API}/kunden`);
      setCustomers(response.data);
    } catch (error) {
      console.error('Error loading customers:', error);
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCustomer || !workDescription) {
      return;
    }

    try {
      const response = await axios.post(`${API}/arbeitsberichte`, {
        kunde_id: selectedCustomer,
        durchgefuehrte_arbeiten: workDescription,
        komm_nr: kommNr,
        arbeitszeiten: [],
        materialien: [],
        arbeit_abgeschlossen: false,
        offene_arbeiten: '',
        verrechnung: 'Regie'
      });

      navigate(`/berichte/${response.data.id}`);
    } catch (error) {
      console.error('Error creating report:', error);
    }
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="new-report-page">
      <div className="page-header">
        <h1>Neuer Arbeitsbericht</h1>
      </div>

      <form onSubmit={handleSubmit} className="report-form">
        <div className="form-group">
          <label>Kunde auswählen *</label>
          <select
            value={selectedCustomer}
            onChange={(e) => setSelectedCustomer(e.target.value)}
            required
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
          <label>Komm. Nr.</label>
          <input
            type="text"
            value={kommNr}
            onChange={(e) => setKommNr(e.target.value)}
            className="form-input"
            placeholder="Kommissions-Nummer eingeben..."
          />
        </div>

        <div className="form-group">
          <label>Durchgeführte Arbeiten *</label>
          <textarea
            value={workDescription}
            onChange={(e) => setWorkDescription(e.target.value)}
            required
            className="form-textarea"
            rows="6"
            placeholder="Beschreibung der durchgeführten Arbeiten..."
          />
        </div>

        <div className="form-actions">
          <button type="button" onClick={() => navigate('/berichte')} className="btn btn-secondary">
            Abbrechen
          </button>
          <button type="submit" className="btn btn-primary">
            Bericht erstellen
          </button>
        </div>
      </form>
    </div>
  );
};

// Main App Component
const App = () => {
  return (
    <AuthProvider>
      {/* Ndryshimi kryesor: Shtojmë basename="/hoti" */}
      <BrowserRouter basename="/hoti">
        <div className="App">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <div className="app-layout">
                    <Header />
                    <main className="main-content">
                      <Routes>
                        <Route path="/" element={<Navigate to="/dashboard" />} />
                        <Route path="/dashboard" element={<DashboardPage />} />
                        <Route path="/berichte" element={<ReportsPage />} />
                        <Route path="/berichte/:id" element={<ReportDetailPage />} />
                        <Route path="/kalender" element={<CalendarView />} />
                        <Route path="/kunden" element={<CustomersPage />} />
                        <Route path="/neuer-bericht" element={<NewReportPage />} />
                        <Route path="/einstellungen" element={<SettingsPage />} />
                      </Routes>
                    </main>
                    <Navigation />
                  </div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
