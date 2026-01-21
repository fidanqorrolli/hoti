import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import SignatureCanvas from 'react-signature-canvas';
import { PDFExportButton } from './PDFExport';
import PruefberichtFeuerung from './PruefberichtFeuerung';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ReportDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const signaturePadRef = useRef();
  
  const [report, setReport] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [showSignature, setShowSignature] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [activeTab, setActiveTab] = useState('grunddaten');
  
  // Edit form state
  const [editData, setEditData] = useState({
    durchgefuehrte_arbeiten: '',
    komm_nr: '',
    arbeitszeiten: [],
    materialien: [],
    arbeit_abgeschlossen: false,
    offene_arbeiten: '',
    verrechnung: 'Regie'
  });
  
  const [newWorkTime, setNewWorkTime] = useState({
    name: '',
    datum: new Date().toISOString().split('T')[0],
    beginn: '',
    ende: '',
    pause: '',
    arbeitszeit: '',
    wegzeit: '',
    normal: '',
    ue50: '',
    ue100: ''
  });
  
  const [newMaterial, setNewMaterial] = useState({
    menge: '',
    einheit: '',
    bezeichnung: ''
  });

  useEffect(() => {
    loadReport();
  }, [id]);

  const loadReport = async () => {
    try {
      const response = await axios.get(`${API}/arbeitsberichte/${id}`);
      setReport(response.data);
      setEditData({
        durchgefuehrte_arbeiten: response.data.durchgefuehrte_arbeiten,
        komm_nr: response.data.komm_nr || '',
        arbeitszeiten: response.data.arbeitszeiten || [],
        materialien: response.data.materialien || [],
        arbeit_abgeschlossen: response.data.arbeit_abgeschlossen,
        offene_arbeiten: response.data.offene_arbeiten || '',
        verrechnung: response.data.verrechnung || 'Regie'
      });
      
      // Load customer details
      if (response.data.kunde_id) {
        const customerResponse = await axios.get(`${API}/kunden/${response.data.kunde_id}`);
        setCustomer(customerResponse.data);
      }
    } catch (error) {
      console.error('Error loading report:', error);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    try {
      await axios.put(`${API}/arbeitsberichte/${id}`, editData);
      setEditing(false);
      loadReport();
    } catch (error) {
      console.error('Error saving report:', error);
    }
  };

  const handleAddWorkTime = () => {
    if (newWorkTime.name && newWorkTime.beginn && newWorkTime.ende) {
      setEditData({
        ...editData,
        arbeitszeiten: [...editData.arbeitszeiten, { ...newWorkTime }]
      });
      setNewWorkTime({
        name: '',
        datum: new Date().toISOString().split('T')[0],
        beginn: '',
        ende: '',
        pause: '',
        arbeitszeit: '',
        wegzeit: '',
        normal: '',
        ue50: '',
        ue100: ''
      });
    }
  };

  const handleRemoveWorkTime = (index) => {
    const updatedWorkTimes = editData.arbeitszeiten.filter((_, i) => i !== index);
    setEditData({ ...editData, arbeitszeiten: updatedWorkTimes });
  };

  const handleAddMaterial = () => {
    if (newMaterial.bezeichnung && newMaterial.menge) {
      setEditData({
        ...editData,
        materialien: [...editData.materialien, { ...newMaterial }]
      });
      setNewMaterial({ menge: '', einheit: '', bezeichnung: '' });
    }
  };

  const handleRemoveMaterial = (index) => {
    const updatedMaterials = editData.materialien.filter((_, i) => i !== index);
    setEditData({ ...editData, materialien: updatedMaterials });
  };

  const handlePruefberichtUpdate = (pruefberichtData) => {
    setReport(prev => ({
      ...prev,
      pruefbericht_feuerung: pruefberichtData
    }));
  };

  const handlePhotoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploadingPhoto(true);
    const formData = new FormData();
    formData.append('foto', file);
    formData.append('beschreibung', `Foto ${(report?.fotos?.length || 0) + 1}`);

    try {
      await axios.post(`${API}/arbeitsberichte/${id}/fotos`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      loadReport();
    } catch (error) {
      console.error('Error uploading photo:', error);
    }
    setUploadingPhoto(false);
  };

  const handleSignatureSave = async () => {
    if (signaturePadRef.current.isEmpty()) {
      alert('Bitte eine Unterschrift erstellen');
      return;
    }

    const signatureData = signaturePadRef.current.toDataURL();
    
    try {
      const formData = new FormData();
      formData.append('unterschrift_data', signatureData);
      
      await axios.post(`${API}/arbeitsberichte/${id}/unterschrift`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setShowSignature(false);
      loadReport();
    } catch (error) {
      console.error('Error saving signature:', error);
    }
  };

  const handleCompleteReport = async () => {
    try {
      await axios.put(`${API}/arbeitsberichte/${id}`, {
        ...editData,
        status: 'abgeschlossen'
      });
      loadReport();
    } catch (error) {
      console.error('Error completing report:', error);
    }
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="error-page">
        <h1>Bericht nicht gefunden</h1>
        <Link to="/berichte" className="btn btn-primary">Zurück zu Berichten</Link>
      </div>
    );
  }

  return (
    <div className="report-detail-page">
      <div className="report-header">
        <div className="header-left">
          <button onClick={() => navigate('/berichte')} className="back-btn">
            <i className="fas fa-arrow-left"></i>
          </button>
          <div>
            <h1>{report.nummer}</h1>
            <p className="report-customer">{report.kunde_firmenname}</p>
          </div>
        </div>
        <div className="header-actions">
          <PDFExportButton 
            reportId={report.id} 
            reportNumber={report.nummer}
            className="btn btn-secondary"
          />
          <span className={`status-badge ${report.status}`}>
            {report.status === 'entwurf' ? 'Entwurf' : 
             report.status === 'abgeschlossen' ? 'Abgeschlossen' : 'Archiviert'}
          </span>
          <button 
            onClick={() => setEditing(!editing)} 
            className={`btn ${editing ? 'btn-secondary' : 'btn-primary'}`}
          >
            {editing ? 'Abbrechen' : 'Bearbeiten'}
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <div className="tab-container">
          <button 
            className={`tab-button ${activeTab === 'grunddaten' ? 'active' : ''}`}
            onClick={() => setActiveTab('grunddaten')}
          >
            📋 Grunddaten
          </button>
          <button 
            className={`tab-button ${activeTab === 'arbeitszeiten' ? 'active' : ''}`}
            onClick={() => setActiveTab('arbeitszeiten')}
          >
            ⏰ Arbeitszeiten
          </button>
          <button 
            className={`tab-button ${activeTab === 'materialien' ? 'active' : ''}`}
            onClick={() => setActiveTab('materialien')}
          >
            🔧 Materialien
          </button>
          <button 
            className={`tab-button ${activeTab === 'fotos' ? 'active' : ''}`}
            onClick={() => setActiveTab('fotos')}
          >
            📸 Fotos
          </button>
          <button 
            className={`tab-button ${activeTab === 'pruefbericht' ? 'active' : ''}`}
            onClick={() => setActiveTab('pruefbericht')}
          >
            🔥 Prüfbericht Feuerung
          </button>
          <button 
            className={`tab-button ${activeTab === 'unterschrift' ? 'active' : ''}`}
            onClick={() => setActiveTab('unterschrift')}
          >
            ✍️ Unterschrift
          </button>
        </div>
      </div>

      <div className="report-content">
        {/* Grunddaten Tab */}
        {activeTab === 'grunddaten' && (
          <div className="tab-content">
            <div className="report-section">
              <h3>Kundeninformationen</h3>
              <div className="customer-details">
                <div className="detail-row">
                  <label>Firmenname:</label>
                  <span>{customer?.firmenname}</span>
                </div>
                <div className="detail-row">
                  <label>Adresse:</label>
                  <span>{customer?.strasse}, {customer?.plz} {customer?.ort}</span>
                </div>
                  <div className="detail-row">
                    <label>Ansprechpartner:</label>
                    <span>{customer?.ansprechpartner}</span>
                  </div>
                  <div className="detail-row">
                    <label>Kontakt:</label>
                    <span>{customer?.telefon} | {customer?.email}</span>
                  </div>
              </div>
            </div>

            <div className="report-section">
              <h3>Arbeitsdetails</h3>
              {editing ? (
                <div className="edit-form">
                  <div className="form-group">
                    <label>Kommissionsnummer:</label>
                    <input 
                      type="text" 
                      value={editData.komm_nr || ''} 
                      onChange={(e) => setEditData({...editData, komm_nr: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Durchgeführte Arbeiten:</label>
                    <textarea 
                      value={editData.durchgefuehrte_arbeiten} 
                      onChange={(e) => setEditData({...editData, durchgefuehrte_arbeiten: e.target.value})}
                      rows="6"
                    />
                  </div>
                  <div className="form-group">
                    <label>Offene Arbeiten:</label>
                    <textarea 
                      value={editData.offene_arbeiten || ''} 
                      onChange={(e) => setEditData({...editData, offene_arbeiten: e.target.value})}
                      rows="3"
                    />
                  </div>
                  <div className="form-group">
                    <label>Verrechnung:</label>
                    <select 
                      value={editData.verrechnung} 
                      onChange={(e) => setEditData({...editData, verrechnung: e.target.value})}
                    >
                      <option value="Regie">Regie</option>
                      <option value="Pauschal">Pauschal</option>
                      <option value="Garantie">Garantie</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>
                      <input 
                        type="checkbox" 
                        checked={editData.arbeit_abgeschlossen} 
                        onChange={(e) => setEditData({...editData, arbeit_abgeschlossen: e.target.checked})}
                      />
                      Arbeit abgeschlossen
                    </label>
                  </div>
                </div>
              ) : (
                <div className="work-details">
                  <div className="detail-row">
                    <label>Kommissionsnummer:</label>
                    <span>{report.komm_nr || 'Nicht angegeben'}</span>
                  </div>
                  <div className="detail-row">
                    <label>Durchgeführte Arbeiten:</label>
                    <span className="work-description">{report.durchgefuehrte_arbeiten}</span>
                  </div>
                  <div className="detail-row">
                    <label>Offene Arbeiten:</label>
                    <span>{report.offene_arbeiten || 'Keine'}</span>
                  </div>
                  <div className="detail-row">
                    <label>Verrechnung:</label>
                    <span>{report.verrechnung}</span>
                  </div>
                  <div className="detail-row">
                    <label>Status:</label>
                    <span className={`status ${report.arbeit_abgeschlossen ? 'completed' : 'pending'}`}>
                      {report.arbeit_abgeschlossen ? 'Abgeschlossen' : 'In Bearbeitung'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Arbeitszeiten Tab */}
        {activeTab === 'arbeitszeiten' && (
          <div className="tab-content">
            <div className="report-section">
              <div className="section-header">
                <h3>Arbeitszeiten</h3>
                {editing && (
                  <button onClick={addArbeitszeit} className="add-btn">
                    <i className="fas fa-plus"></i> Zeit hinzufügen
                  </button>
                )}
              </div>
              
              <div className="work-times-table">
                <div className="table-header">
                  <div>Name</div>
                  <div>Datum</div>
                  <div>Von</div>
                  <div>Bis</div>
                  <div>Pause</div>
                  <div>Arbeitszeit</div>
                  {editing && <div>Aktionen</div>}
                </div>
                {(editing ? editData.arbeitszeiten : report.arbeitszeiten)?.map((zeit, index) => (
                  <div key={index} className="table-row">
                    <div>{editing ? (
                      <input 
                        type="text" 
                        value={zeit.name} 
                        onChange={(e) => updateArbeitszeit(index, 'name', e.target.value)}
                      />
                    ) : zeit.name}</div>
                    <div>{editing ? (
                      <input 
                        type="date" 
                        value={zeit.datum} 
                        onChange={(e) => updateArbeitszeit(index, 'datum', e.target.value)}
                      />
                    ) : zeit.datum}</div>
                    <div>{editing ? (
                      <input 
                        type="time" 
                        value={zeit.beginn} 
                        onChange={(e) => updateArbeitszeit(index, 'beginn', e.target.value)}
                      />
                    ) : zeit.beginn}</div>
                    <div>{editing ? (
                      <input 
                        type="time" 
                        value={zeit.ende} 
                        onChange={(e) => updateArbeitszeit(index, 'ende', e.target.value)}
                      />
                    ) : zeit.ende}</div>
                    <div>{editing ? (
                      <input 
                        type="number" 
                        value={zeit.pause || 0} 
                        onChange={(e) => updateArbeitszeit(index, 'pause', parseInt(e.target.value))}
                        min="0"
                      />
                    ) : (zeit.pause || 0)} Min</div>
                    <div>{calculateWorkTime(zeit.beginn, zeit.ende, zeit.pause || 0)}</div>
                    {editing && (
                      <div>
                        <button onClick={() => removeArbeitszeit(index)} className="delete-btn">
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Materialien Tab */}
        {activeTab === 'materialien' && (
          <div className="tab-content">
            <div className="report-section">
              <div className="section-header">
                <h3>Materialien</h3>
                {editing && (
                  <button onClick={addMaterial} className="add-btn">
                    <i className="fas fa-plus"></i> Material hinzufügen
                  </button>
                )}
              </div>
              
              <div className="materials-table">
                <div className="table-header">
                  <div>Menge</div>
                  <div>Einheit</div>
                  <div>Bezeichnung</div>
                  {editing && <div>Aktionen</div>}
                </div>
                {(editing ? editData.materialien : report.materialien)?.map((material, index) => (
                  <div key={index} className="table-row">
                    <div>{editing ? (
                      <input 
                        type="number" 
                        value={material.menge} 
                        onChange={(e) => updateMaterial(index, 'menge', parseFloat(e.target.value))}
                        step="0.1"
                        min="0"
                      />
                    ) : material.menge}</div>
                    <div>{editing ? (
                      <select 
                        value={material.einheit} 
                        onChange={(e) => updateMaterial(index, 'einheit', e.target.value)}
                      >
                        <option value="Stk">Stk</option>
                        <option value="m">m</option>
                        <option value="m²">m²</option>
                        <option value="m³">m³</option>
                        <option value="kg">kg</option>
                        <option value="l">l</option>
                        <option value="Std">Std</option>
                      </select>
                    ) : material.einheit}</div>
                    <div>{editing ? (
                      <input 
                        type="text" 
                        value={material.bezeichnung} 
                        onChange={(e) => updateMaterial(index, 'bezeichnung', e.target.value)}
                      />
                    ) : material.bezeichnung}</div>
                    {editing && (
                      <div>
                        <button onClick={() => removeMaterial(index)} className="delete-btn">
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Fotos Tab */}
        {activeTab === 'fotos' && (
          <div className="tab-content">
            <div className="report-section">
              <div className="section-header">
                <h3>Fotos</h3>
                <div className="photo-upload">
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handlePhotoUpload}
                    disabled={uploadingPhoto}
                    id="photo-upload"
                    style={{display: 'none'}}
                  />
                  <label htmlFor="photo-upload" className="upload-btn">
                    <i className="fas fa-camera"></i>
                    {uploadingPhoto ? 'Wird hochgeladen...' : 'Foto hinzufügen'}
                  </label>
                </div>
              </div>
              
              <div className="photos-grid">
                {report.fotos?.map((foto, index) => (
                  <div key={index} className="photo-item">
                    <img 
                      src={`data:image/jpeg;base64,${foto.data}`} 
                      alt={foto.beschreibung}
                      onClick={() => {/* Foto vergrößern */}}
                    />
                    <div className="photo-caption">{foto.beschreibung}</div>
                  </div>
                ))}
                {report.fotos?.length === 0 && (
                  <div className="no-photos">
                    <i className="fas fa-camera"></i>
                    <p>Noch keine Fotos hinzugefügt</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Prüfbericht Tab */}
        {activeTab === 'pruefbericht' && (
          <div className="tab-content">
            <PruefberichtFeuerung
              pruefbericht={report.pruefbericht_feuerung}
              onUpdate={handlePruefberichtUpdate}
            />
          </div>
        )}

        {/* Unterschrift Tab */}
        {activeTab === 'unterschrift' && (
          <div className="tab-content">
            <div className="report-section">
              <h3>Unterschrift</h3>
              
              {report.unterschrift_kunde ? (
                <div className="signature-display">
                  <h4>Kundenunterschrift:</h4>
                  <img 
                    src={report.unterschrift_kunde} 
                    alt="Unterschrift" 
                    className="signature-image"
                  />
                  <button onClick={() => setShowSignature(true)} className="edit-signature-btn">
                    Unterschrift ändern
                  </button>
                </div>
              ) : (
                <div className="no-signature">
                  <p>Keine Unterschrift vorhanden</p>
                  <button onClick={() => setShowSignature(true)} className="add-signature-btn">
                    Unterschrift hinzufügen
                  </button>
                </div>
              )}

              {showSignature && (
                <div className="signature-modal">
                  <div className="signature-content">
                    <h4>Unterschrift erfassen</h4>
                    <SignatureCanvas 
                      ref={signaturePadRef}
                      canvasProps={{
                        width: 400,
                        height: 200,
                        className: 'signature-canvas'
                      }}
                    />
                    <div className="signature-actions">
                      <button onClick={clearSignature} className="clear-btn">Löschen</button>
                      <button onClick={handleSignatureSave} className="save-btn">Speichern</button>
                      <button onClick={() => setShowSignature(false)} className="cancel-btn">Abbrechen</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
    </div>
  );
};

export default ReportDetailPage;