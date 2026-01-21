import React, { useState } from 'react';

const PruefberichtFeuerung = ({ pruefbericht, onUpdate }) => {
  const [formData, setFormData] = useState(pruefbericht || {
    pruefnummer: '',
    pruefdatum: '',
    befund_nr: '',
    zeichen: '',
    dvr: '',
    feuerungsanlage: {
      adresse_anlage: '',
      art: '',
      fabrikat_type: '',
      leistung_kw: '',
      aufstellungsort: '',
      brennstoff: ''
    },
    messgeraet: {
      fabrikat: '',
      typenbezeichnung: '',
      kalibrierstelle: '',
      letztkalibrierung: ''
    },
    anlass: {
      erstmalige_einfache: false,
      wiederkehrende_pruefung: false,
      maengelbehebung: false,
      ausserordentliche_pruefung: false
    },
    messwerte: {
      abgastemperatur: '',
      verbrennungslufttemperatur: '',
      co2_o2_gehalt: '',
      co_gehalt: '',
      kesseltemperatur: '',
      foerderdruck: '',
      russzahl: '',
      abgasverlust_wert: '',
      abgasverlust_grenzwert: '',
      nox_gehalt_wert: '',
      nox_gehalt_grenzwert: '',
      co_gehalt_3o2_wert: '',
      co_gehalt_3o2_grenzwert: ''
    },
    maengel: {
      maengel_vorhanden: false,
      behebung_bis: '',
      art_maengel_bemerkung: ''
    }
  });

  const handleChange = (section, field, value) => {
    const newFormData = { ...formData };
    if (section) {
      newFormData[section] = { ...newFormData[section], [field]: value };
    } else {
      newFormData[field] = value;
    }
    setFormData(newFormData);
    onUpdate(newFormData);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-blue-800 mb-2">
          PRÜFBERICHT FÜR FEUERUNGSANLAGEN
        </h2>
        <p className="text-sm text-gray-600">
          Gasförmige und flüssige Brennstoffe gemäß § 23 Wiener Heizungs- und Klimaanlagengesetz, LGBl. f. Wien Nr. 14/2016
        </p>
      </div>

      {/* Kopfdaten */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Prüfnummer</label>
          <input
            type="text"
            value={formData.pruefnummer}
            onChange={(e) => handleChange(null, 'pruefnummer', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Prüfdatum</label>
          <input
            type="date"
            value={formData.pruefdatum}
            onChange={(e) => handleChange(null, 'pruefdatum', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Befund-Nr.</label>
          <input
            type="text"
            value={formData.befund_nr}
            onChange={(e) => handleChange(null, 'befund_nr', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Zeichen</label>
          <input
            type="text"
            value={formData.zeichen}
            onChange={(e) => handleChange(null, 'zeichen', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">DVR</label>
          <input
            type="text"
            value={formData.dvr}
            onChange={(e) => handleChange(null, 'dvr', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Feuerungsanlage */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-200 pb-2">Feuerungsanlage</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Adresse der Anlage</label>
            <input
              type="text"
              value={formData.feuerungsanlage.adresse_anlage}
              onChange={(e) => handleChange('feuerungsanlage', 'adresse_anlage', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Art</label>
            <input
              type="text"
              value={formData.feuerungsanlage.art}
              onChange={(e) => handleChange('feuerungsanlage', 'art', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fabrikat/Type</label>
            <input
              type="text"
              value={formData.feuerungsanlage.fabrikat_type}
              onChange={(e) => handleChange('feuerungsanlage', 'fabrikat_type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Leistung (kW)</label>
            <input
              type="text"
              value={formData.feuerungsanlage.leistung_kw}
              onChange={(e) => handleChange('feuerungsanlage', 'leistung_kw', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="kW"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Aufstellungsort</label>
            <input
              type="text"
              value={formData.feuerungsanlage.aufstellungsort}
              onChange={(e) => handleChange('feuerungsanlage', 'aufstellungsort', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Brennstoff</label>
            <input
              type="text"
              value={formData.feuerungsanlage.brennstoff}
              onChange={(e) => handleChange('feuerungsanlage', 'brennstoff', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Messgerät */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-200 pb-2">Messgerät</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fabrikat</label>
            <input
              type="text"
              value={formData.messgeraet.fabrikat}
              onChange={(e) => handleChange('messgeraet', 'fabrikat', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kalibrierstelle</label>
            <input
              type="text"
              value={formData.messgeraet.kalibrierstelle}
              onChange={(e) => handleChange('messgeraet', 'kalibrierstelle', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Typenbezeichnung</label>
            <input
              type="text"
              value={formData.messgeraet.typenbezeichnung}
              onChange={(e) => handleChange('messgeraet', 'typenbezeichnung', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Letztkalibrierung am</label>
            <input
              type="date"
              value={formData.messgeraet.letztkalibrierung}
              onChange={(e) => handleChange('messgeraet', 'letztkalibrierung', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Anlass der Überprüfung */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-200 pb-2">Anlass der Überprüfung</h3>
        <div className="grid grid-cols-2 gap-4">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.anlass.erstmalige_einfache}
              onChange={(e) => handleChange('anlass', 'erstmalige_einfache', e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">erstmalige einfache Überprüfung</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.anlass.wiederkehrende_pruefung}
              onChange={(e) => handleChange('anlass', 'wiederkehrende_pruefung', e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">wiederkehrende einfache Prüfung</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.anlass.maengelbehebung}
              onChange={(e) => handleChange('anlass', 'maengelbehebung', e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Mängelbehebung</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.anlass.ausserordentliche_pruefung}
              onChange={(e) => handleChange('anlass', 'ausserordentliche_pruefung', e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">außerordentliche Prüfung</span>
          </label>
        </div>
      </div>

      {/* Messwerte */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-200 pb-2">Messwerte & Beurteilungswerte</h3>
        
        {/* Messwerte Tabelle */}
        <div className="overflow-x-auto">
          <table className="w-full border border-gray-300 mb-4">
            <thead className="bg-blue-50">
              <tr>
                <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium text-gray-700">Messwerte</th>
                <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium text-gray-700">Wert</th>
                <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium text-gray-700">Beurteilungswerte</th>
                <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium text-gray-700">Wert</th>
                <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium text-gray-700">Grenzwert</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-300 px-3 py-2 text-sm">Abgastemperatur</td>
                <td className="border border-gray-300 px-2 py-1">
                  <input
                    type="text"
                    value={formData.messwerte.abgastemperatur}
                    onChange={(e) => handleChange('messwerte', 'abgastemperatur', e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-200 rounded"
                    placeholder="°C"
                  />
                </td>
                <td className="border border-gray-300 px-3 py-2 text-sm">Abgasverlust</td>
                <td className="border border-gray-300 px-2 py-1">
                  <input
                    type="text"
                    value={formData.messwerte.abgasverlust_wert}
                    onChange={(e) => handleChange('messwerte', 'abgasverlust_wert', e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-200 rounded"
                    placeholder="%"
                  />
                </td>
                <td className="border border-gray-300 px-2 py-1">
                  <input
                    type="text"
                    value={formData.messwerte.abgasverlust_grenzwert}
                    onChange={(e) => handleChange('messwerte', 'abgasverlust_grenzwert', e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-200 rounded"
                    placeholder="%"
                  />
                </td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-3 py-2 text-sm">Verbrennungslufttemperatur</td>
                <td className="border border-gray-300 px-2 py-1">
                  <input
                    type="text"
                    value={formData.messwerte.verbrennungslufttemperatur}
                    onChange={(e) => handleChange('messwerte', 'verbrennungslufttemperatur', e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-200 rounded"
                    placeholder="°C"
                  />
                </td>
                <td className="border border-gray-300 px-3 py-2 text-sm"></td>
                <td className="border border-gray-300 px-2 py-1"></td>
                <td className="border border-gray-300 px-2 py-1"></td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-3 py-2 text-sm">CO₂-O₂-Gehalt</td>
                <td className="border border-gray-300 px-2 py-1">
                  <input
                    type="text"
                    value={formData.messwerte.co2_o2_gehalt}
                    onChange={(e) => handleChange('messwerte', 'co2_o2_gehalt', e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-200 rounded"
                    placeholder="%"
                  />
                </td>
                <td className="border border-gray-300 px-3 py-2 text-sm">NOₓ-Gehalt bei 3% O₂</td>
                <td className="border border-gray-300 px-2 py-1">
                  <input
                    type="text"
                    value={formData.messwerte.nox_gehalt_wert}
                    onChange={(e) => handleChange('messwerte', 'nox_gehalt_wert', e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-200 rounded"
                    placeholder="mg/m³"
                  />
                </td>
                <td className="border border-gray-300 px-2 py-1">
                  <input
                    type="text"
                    value={formData.messwerte.nox_gehalt_grenzwert}
                    onChange={(e) => handleChange('messwerte', 'nox_gehalt_grenzwert', e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-200 rounded"
                    placeholder="mg/m³"
                  />
                </td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-3 py-2 text-sm">CO-Gehalt</td>
                <td className="border border-gray-300 px-2 py-1">
                  <input
                    type="text"
                    value={formData.messwerte.co_gehalt}
                    onChange={(e) => handleChange('messwerte', 'co_gehalt', e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-200 rounded"
                    placeholder="ppm"
                  />
                </td>
                <td className="border border-gray-300 px-3 py-2 text-sm"></td>
                <td className="border border-gray-300 px-2 py-1"></td>
                <td className="border border-gray-300 px-2 py-1"></td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-3 py-2 text-sm">Kesseltemperatur</td>
                <td className="border border-gray-300 px-2 py-1">
                  <input
                    type="text"
                    value={formData.messwerte.kesseltemperatur}
                    onChange={(e) => handleChange('messwerte', 'kesseltemperatur', e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-200 rounded"
                    placeholder="°C"
                  />
                </td>
                <td className="border border-gray-300 px-3 py-2 text-sm">CO-Gehalt bei 3% O₂</td>
                <td className="border border-gray-300 px-2 py-1">
                  <input
                    type="text"
                    value={formData.messwerte.co_gehalt_3o2_wert}
                    onChange={(e) => handleChange('messwerte', 'co_gehalt_3o2_wert', e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-200 rounded"
                    placeholder="mg/m³"
                  />
                </td>
                <td className="border border-gray-300 px-2 py-1">
                  <input
                    type="text"
                    value={formData.messwerte.co_gehalt_3o2_grenzwert}
                    onChange={(e) => handleChange('messwerte', 'co_gehalt_3o2_grenzwert', e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-200 rounded"
                    placeholder="mg/m³"
                  />
                </td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-3 py-2 text-sm">Förderdruck Abgasanlage</td>
                <td className="border border-gray-300 px-2 py-1">
                  <input
                    type="text"
                    value={formData.messwerte.foerderdruck}
                    onChange={(e) => handleChange('messwerte', 'foerderdruck', e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-200 rounded"
                    placeholder="Pa"
                  />
                </td>
                <td className="border border-gray-300 px-3 py-2 text-sm"></td>
                <td className="border border-gray-300 px-2 py-1"></td>
                <td className="border border-gray-300 px-2 py-1"></td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-3 py-2 text-sm">Rußzahl (Mittelwert)</td>
                <td className="border border-gray-300 px-2 py-1">
                  <input
                    type="text"
                    value={formData.messwerte.russzahl}
                    onChange={(e) => handleChange('messwerte', 'russzahl', e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-200 rounded"
                  />
                </td>
                <td className="border border-gray-300 px-3 py-2 text-sm"></td>
                <td className="border border-gray-300 px-2 py-1"></td>
                <td className="border border-gray-300 px-2 py-1"></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Mängel */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-200 pb-2">Mängel</h3>
        <div className="space-y-4">
          <div className="flex items-center space-x-6">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.maengel.maengel_vorhanden}
                onChange={(e) => handleChange('maengel', 'maengel_vorhanden', e.target.checked)}
                className="w-4 h-4 text-red-600 bg-gray-100 border-gray-300 rounded focus:ring-red-500"
              />
              <span className="text-sm text-gray-700">Ja</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={!formData.maengel.maengel_vorhanden}
                onChange={(e) => handleChange('maengel', 'maengel_vorhanden', !e.target.checked)}
                className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500"
              />
              <span className="text-sm text-gray-700">Nein</span>
            </label>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Behebung bis</label>
              <input
                type="date"
                value={formData.maengel.behebung_bis}
                onChange={(e) => handleChange('maengel', 'behebung_bis', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Art der Mängel / Bemerkung</label>
            <textarea
              value={formData.maengel.art_maengel_bemerkung}
              onChange={(e) => handleChange('maengel', 'art_maengel_bemerkung', e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Beschreibung der Mängel oder Bemerkungen..."
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PruefberichtFeuerung;