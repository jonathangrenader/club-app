import React, { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import InputField from '../components/InputField';
import SelectField from '../components/SelectField';
import FileUploader from '../components/FileUploader';
import StorageUsageIndicator from './config/StorageUsageIndicator';
import TalonarioEditor from './config/TalonarioEditor';
import { Plus, X, Upload, Loader2, Save } from 'lucide-react';

const appId = 'the-club-cloud';
const STORAGE_LIMIT_BYTES = 5 * 1024 * 1024 * 1024; // 5 GB

const defaultTalonariosConfig = {
    cuponDePago: {
        title: "CUPÓN DE PAGO",
        observaciones: "Válido hasta el 10 del mes en curso.",
        fields: {
            showLogo: true, showNombreClub: true, showNombreSocio: true, showDni: true,
            showPlan: true, showImporte: true, showVencimiento: true, showFechaPago: false,
        }
    },
    recibo: {
        title: "RECIBO DE PAGO",
        observaciones: "Gracias por su pago.",
        fields: {
            showLogo: true, showNombreClub: true, showNombreSocio: true, showDni: true,
            showPlan: false, showImporte: true, showVencimiento: false, showFechaPago: true,
        }
    }
};

const defaultDashboardConfig = {
    showStatCards: true,
    showMonthlyIncome: true,
    showActivityPopularity: true,
};

const spaceColors = [
    { name: 'Rojo', class: 'bg-red-500' },
    { name: 'Azul', class: 'bg-blue-500' },
    { name: 'Verde', class: 'bg-green-500' },
    { name: 'Amarillo', class: 'bg-yellow-500' },
    { name: 'Púrpura', class: 'bg-purple-500' },
    { name: 'Rosa', class: 'bg-pink-500' },
    { name: 'Índigo', class: 'bg-indigo-500' },
    { name: 'Cian', class: 'bg-teal-500' },
];

const ConfigModule = ({ db, currentClub, config, setConfig, handleFileUpload }) => {
    const [activeTab, setActiveTab] = useState('general');
    const [newSpace, setNewSpace] = useState({ name: '', color: spaceColors[0].class });
    const [newFeeName, setNewFeeName] = useState("");
    const [newFeeValue, setNewFeeValue] = useState("");
    const [isUploadingLogo, setIsUploadingLogo] = useState(false);
    const [selectedLogoFile, setSelectedLogoFile] = useState(null);
    
    const handleSaveConfig = async () => {
        if (!db || !currentClub?.id) return;
        const clubRef = doc(db, `artifacts/${appId}/public/data/clubs`, currentClub.id);
        try {
            await updateDoc(clubRef, { config });
            alert('Configuración guardada exitosamente');
        } catch(e) {
            console.error("Error al guardar la configuración: ", e);
            alert('Error al guardar la configuración.');
        }
    };
    
    const handleSaveTalonario = (talonarioKey, talonarioData) => {
        setConfig(prev => ({
            ...prev,
            talonarios: {
                ...prev.talonarios,
                [talonarioKey]: talonarioData,
            }
        }))
    };
    
    const handleUploadLogo = async () => {
        if (!selectedLogoFile) return;
        setIsUploadingLogo(true);
        const url = await handleFileUpload(selectedLogoFile, 'logos');
        if (url) {
            setConfig(prev => ({...prev, logoURL: url}));
            alert("Logo subido con éxito. No olvides guardar la configuración general para que el cambio sea permanente.");
        }
        setIsUploadingLogo(false);
        setSelectedLogoFile(null);
    };
    
    const handleAddSpace = () => {
        if (newSpace.name && !config.spaces?.find(s => s.name === newSpace.name)) {
            const updatedSpaces = [...(config.spaces || []), newSpace];
            setConfig(prev => ({...prev, spaces: updatedSpaces}));
            setNewSpace({ name: '', color: spaceColors[0].class });
        }
    };

    const handleDeleteSpace = (spaceNameToDelete) => {
        const updatedSpaces = config.spaces?.filter(s => s.name !== spaceNameToDelete);
        setConfig(prev => ({...prev, spaces: updatedSpaces}));
    };
    
    const handleAddFee = () => {
        if (newFeeName && newFeeValue) {
            const updatedFees = { ...config.fees, [newFeeName]: parseFloat(newFeeValue) };
            setConfig(prev => ({...prev, fees: updatedFees}));
            setNewFeeName("");
            setNewFeeValue("");
        }
    };
    
    const handleDeleteFee = (feeName) => {
        const updatedFees = { ...config.fees };
        delete updatedFees[feeName];
        setConfig(prev => ({...prev, fees: updatedFees}));
    };
    
    const handleWidgetToggle = (widget) => {
        setConfig(prev => ({
            ...prev,
            dashboardWidgets: {
                ...(prev.dashboardWidgets || defaultDashboardConfig),
                [widget]: !prev.dashboardWidgets?.[widget]
            }
        }));
    };

    const tabs = [
        { id: 'general', label: 'General' },
        { id: 'dashboard', label: 'Dashboard' },
        { id: 'talonarios', label: 'Talonarios' },
        { id: 'pagos', label: 'Pasarelas de Pago' },
        { id: 'notificaciones', label: 'Notificaciones' },
    ];
    
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="flex space-x-1 rounded-lg bg-gray-800 p-1">
                    {tabs.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-3 py-1 text-sm font-medium rounded-md ${activeTab === tab.id ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>{tab.label}</button>
                    ))}
                </div>
                <button onClick={handleSaveConfig} className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700">Guardar Toda la Configuración</button>
            </div>

            {activeTab === 'general' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <StorageUsageIndicator usageInBytes={config.totalStorageUsedInBytes} limitInBytes={STORAGE_LIMIT_BYTES} />
                    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                        <h3 className="text-xl font-bold text-white mb-4">Logo del Club</h3>
                        <FileUploader onFileSelect={setSelectedLogoFile} currentFileUrl={config?.logoURL} identifier="club-logo" />
                         {selectedLogoFile && (
                            <button type="button" onClick={handleUploadLogo} disabled={isUploadingLogo} className="mt-2 w-full px-4 py-2 bg-blue-600 text-white rounded-md flex items-center justify-center disabled:bg-gray-500">
                                 {isUploadingLogo ? <Loader2 className="animate-spin" /> : <Upload size={16} className="mr-2" />}
                                 {isUploadingLogo ? 'Subiendo...' : "Confirmar Logo"}
                            </button>
                         )}
                        {config.logoURL && !selectedLogoFile && <div className="mt-2 text-sm text-gray-400">Logo actual cargado. ¡No olvides guardar!</div>}
                    </div>
                    
                    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                        <h3 className="text-xl font-bold text-white mb-4">Tipos de Membresía y Cuotas</h3>
                        <div className="flex gap-2 mb-4">
                            <InputField id="newFeeName" placeholder="Nombre (Ej: Socio Pleno)" value={newFeeName} onChange={(e) => setNewFeeName(e.target.value)} />
                            <InputField id="newFeeValue" type="number" placeholder="Precio ($)" value={newFeeValue} onChange={(e) => setNewFeeValue(e.target.value)} />
                            <button onClick={handleAddFee} className="p-2 bg-blue-600 rounded-md text-white"><Plus/></button>
                        </div>
                        <ul className="space-y-2">
                            {Object.entries(config.fees || {}).map(([name, value]) => (
                                <li key={name} className="flex justify-between items-center bg-gray-700 p-2 rounded-md">
                                    <span>{name}: <span className="font-bold">${value}</span></span>
                                    <button onClick={() => handleDeleteFee(name)} className="text-red-400 hover:text-white"><X size={16}/></button>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                        <h3 className="text-xl font-bold text-white mb-4">Gestionar Espacios</h3>
                        <div className="flex gap-2 mb-4">
                            <InputField id="newSpaceName" placeholder="Nombre del nuevo espacio" value={newSpace.name} onChange={(e) => setNewSpace(s => ({ ...s, name: e.target.value }))} />
                            <SelectField id="newSpaceColor" value={newSpace.color} onChange={(e) => setNewSpace(s => ({ ...s, color: e.target.value }))}>
                                {spaceColors.map(color => <option key={color.class} value={color.class}>{color.name}</option>)}
                            </SelectField>
                            <button onClick={handleAddSpace} className="p-2 bg-blue-600 rounded-md text-white"><Plus/></button>
                        </div>
                        <ul className="space-y-2">
                            {(config.spaces || []).map(space => (
                                <li key={space.name} className="flex justify-between items-center bg-gray-700 p-2 rounded-md">
                                    <div className="flex items-center gap-2">
                                        <span className={`w-4 h-4 rounded-full ${space.color}`}></span>
                                        <span>{space.name}</span>
                                    </div>
                                    <button onClick={() => handleDeleteSpace(space.name)} className="text-red-400 hover:text-white"><X size={16}/></button>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
            
            {activeTab === 'dashboard' && (
                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                     <h3 className="text-xl font-bold text-white mb-4">Widgets del Dashboard</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="flex items-center">
                            <input id="showStatCards" type="checkbox" checked={!!config.dashboardWidgets?.showStatCards} onChange={() => handleWidgetToggle('showStatCards')} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 bg-gray-700"/>
                            <label htmlFor="showStatCards" className="ml-3 block text-sm text-gray-300">Tarjetas de Estadísticas</label>
                        </div>
                         <div className="flex items-center">
                            <input id="showMonthlyIncome" type="checkbox" checked={!!config.dashboardWidgets?.showMonthlyIncome} onChange={() => handleWidgetToggle('showMonthlyIncome')} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 bg-gray-700"/>
                            <label htmlFor="showMonthlyIncome" className="ml-3 block text-sm text-gray-300">Gráfico de Ingresos Mensuales</label>
                        </div>
                         <div className="flex items-center">
                            <input id="showActivityPopularity" type="checkbox" checked={!!config.dashboardWidgets?.showActivityPopularity} onChange={() => handleWidgetToggle('showActivityPopularity')} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 bg-gray-700"/>
                            <label htmlFor="showActivityPopularity" className="ml-3 block text-sm text-gray-300">Gráfico de Inscripciones por Actividad</label>
                        </div>
                     </div>
                </div>
            )}
            
            {activeTab === 'talonarios' && (
                <div className="space-y-8">
                    {Object.keys(config.talonarios || defaultTalonariosConfig).map(key => (
                        <TalonarioEditor 
                            key={key}
                            talonarioKey={key}
                            initialConfig={(config.talonarios || defaultTalonariosConfig)[key]}
                            clubConfig={{name: currentClub.name, logoURL: config.logoURL}}
                            onSave={handleSaveTalonario}
                        />
                    ))}
                </div>
            )}

            {(activeTab === 'pagos' || activeTab === 'notificaciones') && (
                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                     <h3 className="text-xl font-bold text-white mb-4">Módulo en Desarrollo</h3>
                     <p className="text-gray-400">Esta funcionalidad se encuentra en desarrollo y estará disponible en futuras versiones.</p>
                </div>
            )}
        </div>
    );
};

export default ConfigModule;