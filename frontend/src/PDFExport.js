import React from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const PDFExportButton = ({ reportId, reportNumber, className = "btn btn-secondary" }) => {
  const [loading, setLoading] = React.useState(false);

  const handleExport = async () => {
    if (!reportId) return;

    setLoading(true);
    
    try {
      // Use simple direct download approach with axios
      const response = await axios.get(`${API}/arbeitsberichte/${reportId}/pdf`, {
        responseType: 'blob'
      });

      // Create blob URL and download - keep it simple
      const blob = response.data;
      const url = window.URL.createObjectURL(blob);
      
      // Create download link
      const link = document.createElement('a');
      link.href = url;
      link.download = `Arbeitsbericht_${reportNumber || reportId}.pdf`;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('PDF export failed:', error);
      alert('PDF-Export fehlgeschlagen. Bitte versuchen Sie es erneut.');
    }
    
    setLoading(false);
  };

  return (
    <button
      onClick={handleExport}
      disabled={loading || !reportId}
      className={className}
      title="Als PDF exportieren"
    >
      {loading ? (
        <>
          <div className="loading-spinner small"></div>
          <span>Exportiere...</span>
        </>
      ) : (
        <>
          <i className="fas fa-file-pdf"></i>
          <span>PDF</span>
        </>
      )}
    </button>
  );
};

// Enhanced PDF Export with template selection
export const AdvancedPDFExport = ({ reportId, reportNumber, onExport }) => {
  const [loading, setLoading] = React.useState(false);
  const [templates, setTemplates] = React.useState([]);
  const [selectedTemplate, setSelectedTemplate] = React.useState('standard');

  React.useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const response = await axios.get(`${API}/vorlagen`);
      setTemplates(response.data);
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const handleExport = async () => {
    if (!reportId) return;

    setLoading(true);
    
    try {
      const params = selectedTemplate !== 'standard' ? { template: selectedTemplate } : {};
      
      const response = await axios.get(`${API}/arbeitsberichte/${reportId}/pdf`, {
        params,
        responseType: 'blob'
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `Arbeitsbericht_${reportNumber || reportId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      window.URL.revokeObjectURL(url);
      
      if (onExport) onExport();
      
      console.log('PDF exported successfully');
    } catch (error) {
      console.error('PDF export failed:', error);
      alert('PDF-Export fehlgeschlagen. Bitte versuchen Sie es erneut.');
    }
    
    setLoading(false);
  };

  return (
    <div className="pdf-export-advanced">
      <div className="export-options">
        <div className="form-group">
          <label>Vorlage auswählen:</label>
          <select
            value={selectedTemplate}
            onChange={(e) => setSelectedTemplate(e.target.value)}
            className="form-select"
            disabled={loading}
          >
            <option value="standard">Standard Arbeitsbericht</option>
            {templates.map(template => (
              <option key={template.id} value={template.id}>
                {template.name} ({template.kategorie})
              </option>
            ))}
          </select>
        </div>
      </div>
      
      <button
        onClick={handleExport}
        disabled={loading || !reportId}
        className="btn btn-primary"
      >
        {loading ? (
          <>
            <div className="loading-spinner small"></div>
            <span>PDF wird erstellt...</span>
          </>
        ) : (
          <>
            <i className="fas fa-file-pdf"></i>
            <span>Als PDF exportieren</span>
          </>
        )}
      </button>
    </div>
  );
};

// Bulk PDF Export for multiple reports
export const BulkPDFExport = ({ reportIds, onProgress }) => {
  const [loading, setLoading] = React.useState(false);
  const [progress, setProgress] = React.useState(0);

  const handleBulkExport = async () => {
    if (!reportIds || reportIds.length === 0) return;

    setLoading(true);
    setProgress(0);

    try {
      for (let i = 0; i < reportIds.length; i++) {
        const reportId = reportIds[i];
        
        try {
          const response = await axios.get(`${API}/arbeitsberichte/${reportId}/pdf`, {
            responseType: 'blob'
          });

          const blob = new Blob([response.data], { type: 'application/pdf' });
          const url = window.URL.createObjectURL(blob);
          
          const link = document.createElement('a');
          link.href = url;
          link.download = `Arbeitsbericht_${reportId}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          window.URL.revokeObjectURL(url);
          
          const newProgress = ((i + 1) / reportIds.length) * 100;
          setProgress(newProgress);
          
          if (onProgress) onProgress(newProgress);
          
          // Small delay to prevent overwhelming the server
          await new Promise(resolve => setTimeout(resolve, 500));
          
        } catch (error) {
          console.error(`Failed to export report ${reportId}:`, error);
        }
      }
      
      alert(`${reportIds.length} PDFs wurden erfolgreich exportiert`);
      
    } catch (error) {
      console.error('Bulk export failed:', error);
      alert('Massenexport fehlgeschlagen. Bitte versuchen Sie es erneut.');
    }
    
    setLoading(false);
    setProgress(0);
  };

  return (
    <div className="bulk-pdf-export">
      <button
        onClick={handleBulkExport}
        disabled={loading || !reportIds || reportIds.length === 0}
        className="btn btn-primary"
      >
        {loading ? (
          <>
            <div className="loading-spinner small"></div>
            <span>Exportiere {progress.toFixed(0)}%...</span>
          </>
        ) : (
          <>
            <i className="fas fa-file-pdf"></i>
            <span>Alle als PDF exportieren ({reportIds?.length || 0})</span>
          </>
        )}
      </button>
      
      {loading && (
        <div className="export-progress">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <span className="progress-text">{progress.toFixed(0)}% abgeschlossen</span>
        </div>
      )}
    </div>
  );
};

export default PDFExportButton;