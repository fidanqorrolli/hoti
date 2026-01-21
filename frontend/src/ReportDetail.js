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
        {/* Customer Information */}
        {customer && (
          <div className="report-section">
            <h3><i className="fas fa-building"></i> Kundeninformation</h3>
            <div className="customer-details">
              <div className="detail-row">
                <strong>Firma:</strong> {customer.firmenname}
              </div>
              <div className="detail-row">
                <strong>Adresse:</strong> {customer.strasse}, {customer.plz} {customer.ort}
              </div>
              {customer.ansprechpartner && (
                <div className="detail-row">
                  <strong>Ansprechpartner:</strong> {customer.ansprechpartner}
                </div>
              )}
              {customer.email && (
                <div className="detail-row">
                  <strong>E-Mail:</strong> {customer.email}
                </div>
              )}
              {customer.telefon && (
                <div className="detail-row">
                  <strong>Telefon:</strong> {customer.telefon}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Project Information */}
        <div className="report-section">
          <h3><i className="fas fa-info-circle"></i> Projektinformation</h3>
          <div className="detail-row">
            <strong>Projektleiter:</strong> {report.projektleiter}
          </div>
          {editing ? (
            <div className="form-group">
              <label>Komm. Nr.</label>
              <input
                type="text"
                value={editData.komm_nr}
                onChange={(e) => setEditData({...editData, komm_nr: e.target.value})}
                className="form-input"
              />
            </div>
          ) : (
            report.komm_nr && (
              <div className="detail-row">
                <strong>Komm. Nr.:</strong> {report.komm_nr}
              </div>
            )
          )}
        </div>

        {/* Work Description */}
        <div className="report-section">
          <h3><i className="fas fa-wrench"></i> Durchgeführte Arbeiten</h3>
          {editing ? (
            <div className="form-group">
              <textarea
                value={editData.durchgefuehrte_arbeiten}
                onChange={(e) => setEditData({...editData, durchgefuehrte_arbeiten: e.target.value})}
                className="form-textarea"
                rows="6"
              />
            </div>
          ) : (
            <div className="work-description">
              {report.durchgefuehrte_arbeiten}
            </div>
          )}
        </div>

        {/* Work Times */}
        <div className="report-section">
          <h3><i className="fas fa-clock"></i> Arbeitszeiten</h3>
          {(editing ? editData.arbeitszeiten : report.arbeitszeiten || []).length > 0 ? (
            <div className="work-times-table">
              <div className="table-header">
                <div>Name</div>
                <div>Datum</div>
                <div>Beginn</div>
                <div>Ende</div>
                <div>Pause</div>
                <div>Arbeitszeit</div>
                {editing && <div>Aktion</div>}
              </div>
              {(editing ? editData.arbeitszeiten : report.arbeitszeiten || []).map((time, index) => (
                <div key={index} className="table-row">
                  <div>{time.name}</div>
                  <div>{time.datum}</div>
                  <div>{time.beginn}</div>
                  <div>{time.ende}</div>
                  <div>{time.pause}</div>
                  <div>{time.arbeitszeit}</div>
                  {editing && (
                    <div>
                      <button 
                        onClick={() => handleRemoveWorkTime(index)}
                        className="btn btn-danger btn-small"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-text">Keine Arbeitszeiten erfasst</p>
          )}

          {editing && (
            <div className="add-worktime-form">
              <h4>Arbeitszeit hinzufügen</h4>
              <div className="form-row">
                <div className="form-group">
                  <label>Name</label>
                  <input
                    type="text"
                    value={newWorkTime.name}
                    onChange={(e) => setNewWorkTime({...newWorkTime, name: e.target.value})}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label>Datum</label>
                  <input
                    type="date"
                    value={newWorkTime.datum}
                    onChange={(e) => setNewWorkTime({...newWorkTime, datum: e.target.value})}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label>Beginn</label>
                  <input
                    type="time"
                    value={newWorkTime.beginn}
                    onChange={(e) => setNewWorkTime({...newWorkTime, beginn: e.target.value})}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label>Ende</label>
                  <input
                    type="time"
                    value={newWorkTime.ende}
                    onChange={(e) => setNewWorkTime({...newWorkTime, ende: e.target.value})}
                    className="form-input"
                  />
                </div>
              </div>
              <button onClick={handleAddWorkTime} className="btn btn-primary">
                Arbeitszeit hinzufügen
              </button>
            </div>
          )}
        </div>

        {/* Materials */}
        <div className="report-section">
          <h3><i className="fas fa-boxes"></i> Material</h3>
          {(editing ? editData.materialien : report.materialien || []).length > 0 ? (
            <div className="materials-table">
              <div className="table-header">
                <div>Menge</div>
                <div>EH</div>
                <div>Bezeichnung</div>
                {editing && <div>Aktion</div>}
              </div>
              {(editing ? editData.materialien : report.materialien || []).map((material, index) => (
                <div key={index} className="table-row">
                  <div>{material.menge}</div>
                  <div>{material.einheit}</div>
                  <div>{material.bezeichnung}</div>
                  {editing && (
                    <div>
                      <button 
                        onClick={() => handleRemoveMaterial(index)}
                        className="btn btn-danger btn-small"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-text">Keine Materialien erfasst</p>
          )}

          {editing && (
            <div className="add-material-form">
              <h4>Material hinzufügen</h4>
              <div className="form-row">
                <div className="form-group">
                  <label>Menge</label>
                  <input
                    type="text"
                    value={newMaterial.menge}
                    onChange={(e) => setNewMaterial({...newMaterial, menge: e.target.value})}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label>Einheit</label>
                  <input
                    type="text"
                    value={newMaterial.einheit}
                    onChange={(e) => setNewMaterial({...newMaterial, einheit: e.target.value})}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label>Bezeichnung</label>
                  <input
                    type="text"
                    value={newMaterial.bezeichnung}
                    onChange={(e) => setNewMaterial({...newMaterial, bezeichnung: e.target.value})}
                    className="form-input"
                  />
                </div>
              </div>
              <button onClick={handleAddMaterial} className="btn btn-primary">
                Material hinzufügen
              </button>
            </div>
          )}
        </div>

        {/* Photos */}
        <div className="report-section">
          <h3><i className="fas fa-camera"></i> Fotos</h3>
          <div className="photos-grid">
            {report.fotos && report.fotos.length > 0 ? (
              report.fotos.map((photo, index) => (
                <div key={photo.id} className="photo-item">
                  <img 
                    src={`data:image/jpeg;base64,${photo.data}`} 
                    alt={photo.beschreibung || `Foto ${index + 1}`}
                    className="photo-thumbnail"
                  />
                  <p className="photo-caption">
                    {photo.beschreibung || `Foto ${index + 1}`}
                  </p>
                </div>
              ))
            ) : (
              <p className="empty-text">Keine Fotos vorhanden</p>
            )}
            
            {editing && report.fotos && report.fotos.length < 4 && (
              <div className="photo-upload">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  style={{ display: 'none' }}
                  id="photo-upload"
                />
                <label htmlFor="photo-upload" className="upload-btn">
                  {uploadingPhoto ? (
                    <div className="loading-spinner small"></div>
                  ) : (
                    <>
                      <i className="fas fa-plus"></i>
                      <span>Foto hinzufügen</span>
                    </>
                  )}
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Additional Information */}
        <div className="report-section">
          <h3><i className="fas fa-clipboard-check"></i> Zusätzliche Informationen</h3>
          
          {editing ? (
            <>
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={editData.arbeit_abgeschlossen}
                    onChange={(e) => setEditData({...editData, arbeit_abgeschlossen: e.target.checked})}
                    style={{ marginRight: '0.5rem' }}
                  />
                  Arbeit abgeschlossen
                </label>
              </div>
              
              <div className="form-group">
                <label>Offene Arbeiten</label>
                <textarea
                  value={editData.offene_arbeiten}
                  onChange={(e) => setEditData({...editData, offene_arbeiten: e.target.value})}
                  className="form-textarea"
                  rows="3"
                />
              </div>
              
              <div className="form-group">
                <label>Verrechnung</label>
                <select
                  value={editData.verrechnung}
                  onChange={(e) => setEditData({...editData, verrechnung: e.target.value})}
                  className="form-select"
                >
                  <option value="Regie">Regie</option>
                  <option value="Pauschale">Pauschale</option>
                  <option value="Garantie">Garantie</option>
                </select>
              </div>
            </>
          ) : (
            <>
              <div className="detail-row">
                <strong>Arbeit abgeschlossen:</strong> {report.arbeit_abgeschlossen ? 'Ja' : 'Nein'}
              </div>
              {report.offene_arbeiten && (
                <div className="detail-row">
                  <strong>Offene Arbeiten:</strong> {report.offene_arbeiten}
                </div>
              )}
              <div className="detail-row">
                <strong>Verrechnung:</strong> {report.verrechnung}
              </div>
            </>
          )}
        </div>

        {/* Signature */}
        <div className="report-section">
          <h3><i className="fas fa-signature"></i> Kundenunterschrift</h3>
          {report.unterschrift_kunde ? (
            <div className="signature-display">
              <img 
                src={report.unterschrift_kunde} 
                alt="Kundenunterschrift" 
                className="signature-image"
              />
              <p>Unterschrift vorhanden</p>
            </div>
          ) : (
            <div className="signature-empty">
              <p>Keine Unterschrift vorhanden</p>
              {editing && (
                <button 
                  onClick={() => setShowSignature(true)}
                  className="btn btn-primary"
                >
                  Unterschrift erfassen
                </button>
              )}
            </div>
          )}
        </div>

        {/* Report Meta */}
        <div className="report-section">
          <h3><i className="fas fa-info"></i> Berichtinformationen</h3>
          <div className="detail-row">
            <strong>Techniker:</strong> {report.techniker_name}
          </div>
          <div className="detail-row">
            <strong>Erstellt am:</strong> {new Date(report.erstellt_am).toLocaleDateString('de-DE')}
          </div>
          <div className="detail-row">
            <strong>Aktualisiert am:</strong> {new Date(report.aktualisiert_am).toLocaleDateString('de-DE')}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      {editing && (
        <div className="fixed-bottom-actions">
          <button onClick={() => setEditing(false)} className="btn btn-secondary">
            Abbrechen
          </button>
          <button onClick={handleSave} className="btn btn-primary">
            Änderungen speichern
          </button>
          {report.status === 'entwurf' && (
            <button onClick={handleCompleteReport} className="btn btn-success">
              Bericht abschließen
            </button>
          )}
        </div>
      )}

      {/* Signature Modal */}
      {showSignature && (
        <div className="modal-overlay">
          <div className="signature-modal">
            <h3>Kundenunterschrift erfassen</h3>
            <div className="signature-pad-container">
              <SignatureCanvas
                ref={signaturePadRef}
                canvasProps={{
                  width: 400,
                  height: 200,
                  className: 'signature-canvas'
                }}
              />
            </div>
            <div className="signature-actions">
              <button 
                onClick={() => signaturePadRef.current.clear()}
                className="btn btn-secondary"
              >
                Löschen
              </button>
              <button 
                onClick={() => setShowSignature(false)}
                className="btn btn-secondary"
              >
                Abbrechen
              </button>
              <button 
                onClick={handleSignatureSave}
                className="btn btn-primary"
              >
                Speichern
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportDetailPage;