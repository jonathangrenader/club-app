import React, { useState, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';
import TalonarioPreview from './TalonarioPreview';
import TextAreaField from '../../components/TextAreaField';
import { Save, Download } from 'lucide-react';

const TalonarioEditor = ({ talonarioKey, initialConfig, clubConfig, onSave }) => {
    const [config, setConfig] = useState(initialConfig);
    const previewRef = useRef(null);

    useEffect(() => {
        setConfig(initialConfig);
    }, [initialConfig]);

    const fieldLabels = {
        showLogo: "Logo del Club",
        showNombreClub: "Nombre del Club",
        showNombreSocio: "Nombre del Socio",
        showDni: "DNI del Socio",
        showPlan: "Plan Contratado",
        showImporte: "Importe",
        showVencimiento: "Fecha de Vencimiento",
        showFechaPago: "Fecha de Pago",
    };

    const handleFieldChange = (field) => {
        setConfig(prev => ({
            ...prev,
            fields: { ...prev.fields, [field]: !prev.fields[field] }
        }));
    };

    const handleObservacionesChange = (e) => {
        setConfig(prev => ({ ...prev, observaciones: e.target.value }));
    };

    const handleDownload = () => {
        if (previewRef.current) {
            html2canvas(previewRef.current, { backgroundColor: '#111827' }).then(canvas => {
                const link = document.createElement('a');
                link.download = `${talonarioKey}-muestra.png`;
                link.href = canvas.toDataURL('image/png');
                link.click();
            });
        }
    };
    
    return (
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-4">{config.title}</h3>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                    <h4 className="font-semibold text-gray-300">Campos a Mostrar:</h4>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                        {Object.keys(fieldLabels).map(field => (
                             <div key={field} className="flex items-center">
                                <input id={`${talonarioKey}-${field}`} type="checkbox" checked={!!config.fields[field]} onChange={() => handleFieldChange(field)} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 bg-gray-700"/>
                                <label htmlFor={`${talonarioKey}-${field}`} className="ml-2 block text-sm text-gray-300">{fieldLabels[field]}</label>
                            </div>
                        ))}
                    </div>
                    <TextAreaField id={`${talonarioKey}-obs`} label="Observaciones" value={config.observaciones} onChange={handleObservacionesChange} placeholder="Escriba aquí las observaciones..." />
                    <div className="flex gap-4 pt-4">
                       <button onClick={() => onSave(talonarioKey, config)} className="flex items-center px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700">
                            <Save size={16} className="mr-2" /> Guardar Diseño
                        </button>
                        <button onClick={handleDownload} className="flex items-center px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700">
                            <Download size={16} className="mr-2" /> Descargar Muestra
                        </button>
                    </div>
                </div>
                <div className="lg:col-span-1">
                    <p className="text-center text-gray-400 mb-2">Vista Previa</p>
                    <TalonarioPreview ref={previewRef} talonarioConfig={config} clubConfig={clubConfig} />
                </div>
            </div>
        </div>
    )
};

export default TalonarioEditor;
