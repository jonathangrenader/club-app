// Importaciones necesarias de React, Firebase y otras librerías
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, addDoc, getDocs, updateDoc, deleteDoc, onSnapshot, query, where, getDoc, writeBatch, serverTimestamp, increment, orderBy } from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import QRCode from "qrcode.react";
import html2canvas from 'html2canvas';

// Importación de componentes de UI
import InputField from './components/InputField.js';
import Modal from './components/Modal.js';
import ConfirmationModal from './components/ConfirmationModal.js';
import StatCard from './components/StatCard.js';
import FileUploader from './components/FileUploader.js';
import TextAreaField from './components/TextAreaField.js';
import SelectField from './components/SelectField.js';
import SearchableSelect from './components/SearchableSelect.js';
import RejectionModal from './components/modals/RejectionModal.js';
import EnrolledListModal from './components/modals/EnrolledListModal.js';
import QRScannerModal from './components/modals/QRScannerModal.js';
import QRDisplayModal from './components/modals/QRDisplayModal.js';

// Importación de Páginas/Vistas
import PortalSelector from './pages/login/PortalSelector.js';
import ClubLoginScreen from './pages/login/ClubLoginScreen.js';
import UserLoginScreen from './pages/login/UserLoginScreen.js';
import MemberLoginScreen from './pages/login/MemberLoginScreen.js';

// Importación de iconos de Lucide React
import { Plus, Edit, Trash2, LogIn, ArrowLeft, Building, UserPlus, X, Shield, Users, DollarSign, Settings, FileText, BarChart2, AlertCircle, QrCode, Newspaper, ScanLine, UserCheck, UserX, Loader2, Image as ImageIcon, Upload, Dumbbell, RefreshCw, LogOut, Download, MessageCircle, Mail as MailIcon, Paperclip, ExternalLink, Save, HardDrive, Search, Clock, CheckCircle, XCircle, Pencil, FileDown, MessageSquare, ThumbsUp, ThumbsDown, Calendar, ChevronLeft, ChevronRight, HeartPulse, Music, BookOpen, SwatchBook, Palmtree, Send, Inbox, Reply } from 'lucide-react';

// --- Configuración de Firebase y Constantes ---
const firebaseConfig = {
  apiKey: process.env.REACT_APP_API_KEY,
  authDomain: process.env.REACT_APP_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_PROJECT_ID,
  storageBucket: process.env.REACT_APP_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_APP_ID,
  measurementId: process.env.REACT_APP_MEASUREMENT_ID
};

const appId = 'the-club-cloud'; // ID fijo para la aplicación
const STORAGE_LIMIT_BYTES = 5 * 1024 * 1024 * 1024; // 5 GB
const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

const defaultDashboardConfig = {
    showStatCards: true,
    showMonthlyIncome: true,
    showActivityPopularity: true,
};

const defaultTalonariosConfig = {
    cuponDePago: {
        title: "CUPÓN DE PAGO",
        observaciones: "Válido hasta el 10 del mes en curso.",
        fields: {
            showLogo: true,
            showNombreClub: true,
            showNombreSocio: true,
            showDni: true,
            showPlan: true,
            showImporte: true,
            showVencimiento: true,
            showFechaPago: false,
        }
    },
    recibo: {
        title: "RECIBO DE PAGO",
        observaciones: "Gracias por su pago.",
        fields: {
            showLogo: true,
            showNombreClub: true,
            showNombreSocio: true,
            showDni: true,
            showPlan: false,
            showImporte: true,
            showVencimiento: false,
            showFechaPago: true,
        }
    }
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

const activityIcons = {
    Dumbbell: Dumbbell,
    HeartPulse: HeartPulse,
    Music: Music,
    BookOpen: BookOpen,
    SwatchBook: SwatchBook,
    Palmtree: Palmtree
};
const ActivityIcon = ({ name, ...props }) => {
    const IconComponent = activityIcons[name];
    return IconComponent ? <IconComponent {...props} /> : <Dumbbell {...props} />;
};


// --- Formulario Modal para Socios ---
const MemberFormModal = ({ isOpen, onClose, onSave, memberData, setMemberData, config, activities, handleFileUpload }) => {
    const [isUploading, setIsUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);

    const handleChange = (e) => {
        let { name, value, type, checked } = e.target;
        if (name === 'celular') {
            value = value.replace(/[^0-9+]/g, '');
        }
        setMemberData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handlePhotoUpload = async () => {
        if (!selectedFile) return;
        setIsUploading(true);
        const url = await handleFileUpload(selectedFile, 'member_photos');
        if (url) {
            setMemberData(prev => ({ ...prev, photoURL: url }));
        }
        setIsUploading(false);
        setSelectedFile(null);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (memberData.password && memberData.password !== memberData.confirmPassword) {
            alert("Las contraseñas no coinciden.");
            return;
        }
        onSave(memberData);
    };

    const memberTypes = useMemo(() => Object.keys(config?.fees || {}), [config]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={memberData?.id ? "Editar Socio" : "Añadir Nuevo Socio"} size="xl">
            <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <InputField id="name" name="name" label="Nombre Completo" placeholder="John Doe" value={memberData?.name} onChange={handleChange} />
                        <InputField id="dni" name="dni" label="DNI" placeholder="12345678" value={memberData?.dni} onChange={handleChange} />
                        <InputField id="email" name="email" label="Email" type="email" placeholder="john.doe@example.com" value={memberData?.email} onChange={handleChange} />
                        <InputField id="birthDate" name="birthDate" label="Fecha de Nacimiento" type="date" value={memberData?.birthDate} onChange={handleChange} />
                        <InputField id="celular" name="celular" label="Nº de Celular (con +)" placeholder="+5491112345678" value={memberData?.celular} onChange={handleChange} />
                        <InputField id="otroContacto" name="otroContacto" label="Otro Contacto" placeholder="Teléfono de familiar" value={memberData?.otroContacto} onChange={handleChange} />
                    </div>
                    <div className="space-y-2">
                         <label className="block text-sm font-medium text-gray-300 mb-1">Foto de Perfil</label>
                         <FileUploader onFileSelect={setSelectedFile} currentFileUrl={memberData?.photoURL} identifier="member-photo" />
                         {selectedFile && (
                            <button type="button" onClick={handlePhotoUpload} disabled={isUploading} className="w-full mt-2 px-4 py-2 bg-blue-600 text-white rounded-md flex items-center justify-center disabled:bg-gray-500">
                                 {isUploading ? <Loader2 className="animate-spin" /> : <Upload size={16} className="mr-2" />}
                                 {isUploading ? 'Subiendo...' : "Confirmar Foto"}
                            </button>
                         )}
                    </div>
                 </div>
                
                 <div className="border-t border-gray-700 pt-4">
                     <h3 className="text-lg font-semibold text-gray-200 mb-2">Membresía y Actividad</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <SelectField id="memberType" name="memberType" label="Tipo de Socio" value={memberData?.memberType} onChange={handleChange}>
                            <option value="">Seleccione un tipo</option>
                            {memberTypes.map(type => <option key={type} value={type}>{type}</option>)}
                        </SelectField>
                        <SelectField id="activityId" name="activityId" label="Actividad Principal" value={memberData?.activityId} onChange={handleChange}>
                           <option value="">Ninguna</option>
                           {activities.map(act => <option key={act.id} value={act.id}>{act.name}</option>)}
                       </SelectField>
                    </div>
                </div>

                 <div className="border-t border-gray-700 pt-4">
                     <h3 className="text-lg font-semibold text-gray-200 mb-2">Grupo Familiar y Estado</h3>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                          <InputField id="grupoFamiliar" name="grupoFamiliar" label="ID Grupo Familiar" placeholder="Ej: FAM-GARCIA-01" value={memberData?.grupoFamiliar} onChange={handleChange} />
                          <div className="flex items-center pt-6">
                              <input id="tieneFamiliares" name="tieneFamiliares" type="checkbox" checked={!!memberData?.tieneFamiliares} onChange={handleChange} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                              <label htmlFor="tieneFamiliares" className="ml-2 block text-sm text-gray-300">Tiene familiares</label>
                          </div>
                          <SelectField id="status" name="status" label="Estado" value={memberData?.status} onChange={handleChange}>
                            <option value="Activo">Activo</option>
                            <option value="Inactivo">Inactivo</option>
                            <option value="Suspendido">Suspendido</option>
                        </SelectField>
                     </div>
                 </div>

                 <div className="border-t border-gray-700 pt-4">
                     <h3 className="text-lg font-semibold text-gray-200 mb-2">Dirección</h3>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <InputField id="direccion" name="direccion" label="Dirección" placeholder="Av. Siempre Viva 742" value={memberData?.direccion} onChange={handleChange} />
                        <InputField id="localidad" name="localidad" label="Localidad" placeholder="Springfield" value={memberData?.localidad} onChange={handleChange} />
                         <InputField id="codigoPostal" name="codigoPostal" label="Código Postal" placeholder="B1686" value={memberData?.codigoPostal} onChange={handleChange} />
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                         <InputField id="provincia" name="provincia" label="Provincia" placeholder="Buenos Aires" value={memberData?.provincia} onChange={handleChange} />
                        <SelectField id="pais" name="pais" label="País" value={memberData?.pais || 'Argentina'} onChange={handleChange}>
                            <option value="Argentina">Argentina</option>
                             <option value="Uruguay">Uruguay</option>
                             <option value="Paraguay">Paraguay</option>
                             <option value="Bolivia">Bolivia</option>
                             <option value="Chile">Chile</option>
                             <option value="Otro">Otro</option>
                         </SelectField>
                    </div>
                 </div>

                 <div className="border-t border-gray-700 pt-4">
                     <h3 className="text-lg font-semibold text-gray-200 mb-2">Credenciales de Acceso</h3>
                      <p className="text-sm text-gray-400 mb-2">Establece la clave para que el socio acceda a su portal. Si dejas los campos en blanco, se mantendrá la clave actual (o se generará una si es un socio nuevo).</p>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <InputField id="password" name="password" label="Nueva Clave de Acceso" type="password" placeholder="••••••••" value={memberData?.password} onChange={handleChange} />
                         <InputField id="confirmPassword" name="confirmPassword" label="Confirmar Nueva Clave" type="password" placeholder="••••••••" value={memberData?.confirmPassword} onChange={handleChange} />
                     </div>
                 </div>

                 <TextAreaField id="comentarios" name="comentarios" label="Comentarios" placeholder="Notas internas sobre el socio..." value={memberData?.comentarios} onChange={handleChange} />
                
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-600">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700">Cancelar</button>
                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Guardar Socio</button>
                </div>
            </form>
        </Modal>
    );
};

// --- Formulario Modal para Usuarios ---
const UserFormModal = ({ isOpen, onClose, onSave, userData, setUserData }) => {
    const handleChange = (e) => {
        const { name, value } = e.target;
        setUserData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(userData);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={userData?.id ? "Editar Usuario" : "Añadir Nuevo Usuario"}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <InputField id="email" name="email" label="Email" type="email" placeholder="usuario@ejemplo.com" value={userData?.email} onChange={handleChange} />
                <InputField id="password" name="password" label="Contraseña" type="password" placeholder="••••••••" value={userData?.password} onChange={handleChange} />
                <SelectField id="role" name="role" label="Rol" value={userData?.role} onChange={handleChange}>
                    <option value="Staff">Staff</option>
                    <option value="Admin">Admin</option>
                    <option value="Instructor">Instructor</option>
                </SelectField>
                <div className="flex justify-end gap-3 pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700">Cancelar</button>
                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Guardar Usuario</button>
                </div>
            </form>
        </Modal>
    );
};

// --- Formulario Modal para Instructores ---
const InstructorFormModal = ({ isOpen, onClose, onSave, instructorData, setInstructorData, activities, handleFileUpload }) => {
    const [isUploading, setIsUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);

    const handleDisciplinesChange = (activityId) => {
        const currentDisciplines = instructorData?.disciplines || [];
        const newDisciplines = currentDisciplines.includes(activityId) 
            ? currentDisciplines.filter(id => id !== activityId) 
            : [...currentDisciplines, activityId];
        setInstructorData(prev => ({ ...prev, disciplines: newDisciplines }));
    };
    
    const handlePhotoUpload = async () => {
        if (!selectedFile) return;
        setIsUploading(true);
        const url = await handleFileUpload(selectedFile, 'instructor_photos');
        if (url) {
            setInstructorData(prev => ({ ...prev, photoURL: url }));
        }
        setIsUploading(false);
        setSelectedFile(null);
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setInstructorData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(instructorData);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={instructorData?.id ? "Editar Instructor" : "Añadir Nuevo Instructor"} size="xl">
            <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <InputField id="firstName" name="firstName" label="Nombre" placeholder="Jane" value={instructorData?.firstName} onChange={handleChange} />
                            <InputField id="lastName" name="lastName" label="Apellido" placeholder="Smith" value={instructorData?.lastName} onChange={handleChange} />
                        </div>
                        <InputField id="email" name="email" label="Email de Acceso" type="email" placeholder="instructor@ejemplo.com" value={instructorData?.email} onChange={handleChange} />
                        <InputField id="phone" name="phone" label="Teléfono" placeholder="+549..." value={instructorData?.phone} onChange={handleChange} />
                        <InputField id="address" name="address" label="Dirección" placeholder="Av. Siempre Viva 742" value={instructorData?.address} onChange={handleChange} />
                        <InputField id="password" name="password" label="Contraseña" type="password" placeholder="Dejar en blanco para no cambiar" value={instructorData?.password} onChange={handleChange} />
                        <div className="flex items-center">
                           <input id="canScanQR" name="canScanQR" type="checkbox" checked={!!instructorData?.canScanQR} onChange={handleChange} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                           <label htmlFor="canScanQR" className="ml-2 block text-sm text-gray-300">Permitir escanear QR para asistencia</label>
                       </div>
                    </div>
                    <div className="space-y-4">
                        <label className="block text-sm font-medium text-gray-300 mb-1">Foto de Perfil</label>
                        <FileUploader onFileSelect={setSelectedFile} currentFileUrl={instructorData?.photoURL} identifier="instructor-photo" />
                        {selectedFile && (
                           <button type="button" onClick={handlePhotoUpload} disabled={isUploading} className="w-full mt-2 px-4 py-2 bg-blue-600 text-white rounded-md flex items-center justify-center disabled:bg-gray-500">
                                {isUploading ? <Loader2 className="animate-spin" /> : <Upload size={16} className="mr-2" />}
                                {isUploading ? 'Subiendo...' : "Confirmar Foto"}
                           </button>
                        )}
                    </div>
                </div>

                <div className="border-t border-gray-700 pt-4">
                    <h3 className="text-lg font-semibold text-gray-200 mb-2">Disciplinas que enseña</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                        {activities.map(activity => (
                            <div key={activity.id} className="flex items-center">
                                <input 
                                    id={`discipline-${activity.id}`} 
                                    type="checkbox" 
                                    checked={instructorData?.disciplines?.includes(activity.id) || false}
                                    onChange={() => handleDisciplinesChange(activity.id)}
                                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 bg-gray-700"
                                />
                                <label htmlFor={`discipline-${activity.id}`} className="ml-2 block text-sm text-gray-300">{activity.name}</label>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-600">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700">Cancelar</button>
                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Guardar Instructor</button>
                </div>
            </form>
        </Modal>
    );
};

// --- Formulario Modal para Actividades ---
const ActivityFormModal = ({ isOpen, onClose, onSave, activityData, setActivityData, spaces }) => {
    const handleChange = (e) => {
        const { name, value } = e.target;
        setActivityData(prev => ({ ...prev, [name]: value }));
    };

    const handleSpaceChange = (spaceName) => {
        const currentSpaces = activityData?.allowedSpaces || [];
        const newSpaces = currentSpaces.includes(spaceName) 
            ? currentSpaces.filter(s => s !== spaceName) 
            : [...currentSpaces, spaceName];
        setActivityData(prev => ({ ...prev, allowedSpaces: newSpaces }));
    };
    
    const handleIconChange = (iconName) => {
        setActivityData(prev => ({ ...prev, icon: iconName }))
    }

    const handleSubmit = (e) => { e.preventDefault(); onSave(activityData); };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={activityData?.id ? "Editar Actividad" : "Añadir Nueva Actividad"}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <InputField id="name" name="name" label="Nombre de la Actividad" placeholder="Yoga" value={activityData?.name} onChange={handleChange} />
                <TextAreaField id="description" name="description" label="Descripción" placeholder="Clase de Yoga para todos los niveles." value={activityData?.description} onChange={handleChange} />
                
                <SelectField id="icon" name="icon" label="Ícono" value={activityData?.icon} onChange={(e) => handleIconChange(e.target.value)}>
                    <option value="">Seleccione un ícono</option>
                    {Object.keys(activityIcons).map(iconName => (
                        <option key={iconName} value={iconName}>{iconName}</option>
                    ))}
                </SelectField>

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Espacios Permitidos</label>
                    <div className="grid grid-cols-2 gap-2">
                        {spaces.map(space => (
                            <div key={space.name} className="flex items-center">
                                <input 
                                    id={`space-${space.name}`} 
                                    type="checkbox" 
                                    checked={activityData?.allowedSpaces?.includes(space.name) || false}
                                    onChange={() => handleSpaceChange(space.name)}
                                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 bg-gray-700"
                                />
                                <label htmlFor={`space-${space.name}`} className="ml-2 block text-sm text-gray-300">{space.name}</label>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700">Cancelar</button>
                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Guardar Actividad</button>
                </div>
            </form>
        </Modal>
    );
};

// --- Formulario Modal para Noticias ---
const NewsFormModal = ({ isOpen, onClose, onSave, newsData, setNewsData, handleFileUpload }) => {
    const [isUploading, setIsUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);

    useEffect(() => {
        if (isOpen) {
            setSelectedFile(null);
        }
    }, [isOpen]);
    
    if (!isOpen) {
        return null;
    }

    const handleUpload = async () => {
        if (!selectedFile) return;
        setIsUploading(true);
        const url = await handleFileUpload(selectedFile, 'news_images');
        if (url) {
            setNewsData(prev => ({ ...prev, imageUrl: url }));
        }
        setIsUploading(false);
        setSelectedFile(null);
    };

    const handleSave = (status) => {
        onSave({ ...newsData, status });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={newsData?.id ? "Editar Noticia" : "Crear Nueva Noticia"}>
            <div className="space-y-4">
                <InputField id="title" name="title" label="Título" placeholder="¡Nuevo Anuncio!" value={newsData?.title || ''} onChange={(e) => setNewsData(prev => ({...prev, title: e.target.value}))} />
                <TextAreaField id="content" name="content" label="Contenido" placeholder="Detalles de la noticia..." value={newsData?.content || ''} onChange={(e) => setNewsData(prev => ({...prev, content: e.target.value}))} />
                <FileUploader
                    onFileSelect={setSelectedFile}
                    currentFileUrl={newsData?.imageUrl}
                    identifier="news-image"
                />
                 {selectedFile && (
                    <button type="button" onClick={handleUpload} disabled={isUploading} className="w-full px-4 py-2 bg-blue-600 text-white rounded-md flex items-center justify-center disabled:bg-gray-500">
                         {isUploading ? <Loader2 className="animate-spin" /> : <Upload size={16} className="mr-2" />}
                         {isUploading ? 'Subiendo...' : "Confirmar Imagen"}
                    </button>
                 )}
                 {newsData?.imageUrl && !selectedFile && <div className="text-sm text-gray-400">Imagen actual: <a href={newsData.imageUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Ver Imagen</a></div>}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-600">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700">Cancelar</button>
                    <button type="button" onClick={() => handleSave('Borrador')} className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 flex items-center gap-2"><Save size={16} /> Guardar Borrador</button>
                    <button type="button" onClick={() => handleSave('Publicado')} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Publicar Noticia</button>
                </div>
            </div>
        </Modal>
    );
};

// --- Formulario Modal para Horarios ---
const ScheduleFormModal = ({ isOpen, onClose, onSave, scheduleData, setScheduleData, activities, instructors, spaces }) => {
    
    const handleChange = (e) => {
        const { name, value } = e.target;
        const newState = { ...scheduleData, [name]: value };

        if (name === 'activityId') {
            const selectedActivity = activities.find(a => a.id === value);
            const allowedSpaces = selectedActivity?.allowedSpaces || [];
            if (!allowedSpaces.includes(newState.space)) {
                newState.space = ''; 
            }
        }
        
        setScheduleData(newState);
    };
    
    const availableSpaces = useMemo(() => {
        if (!scheduleData?.activityId) {
            return [];
        }
        const selectedActivity = activities.find(a => a.id === scheduleData.activityId);
        if (!selectedActivity || !selectedActivity.allowedSpaces) {
            return [];
        }
        return spaces.filter(s => selectedActivity.allowedSpaces.includes(s.name));
    }, [scheduleData?.activityId, activities, spaces]);


    const handleSubmit = (e) => { e.preventDefault(); onSave(scheduleData); };

    const daysOfWeek = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={scheduleData?.id ? "Editar Clase" : "Programar Nueva Clase"}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <SelectField id="activityId" name="activityId" label="Actividad" value={scheduleData?.activityId} onChange={handleChange}>
                    <option value="">Seleccione una actividad</option>
                    {activities.map(act => <option key={act.id} value={act.id}>{act.name}</option>)}
                </SelectField>
                 <SelectField id="instructorId" name="instructorId" label="Instructor" value={scheduleData?.instructorId} onChange={handleChange}>
                    <option value="">Seleccione un instructor</option>
                    {instructors.map(inst => <option key={inst.id} value={inst.id}>{inst.firstName} {inst.lastName}</option>)}
                </SelectField>
                 <SelectField id="space" name="space" label="Espacio/Lugar" value={scheduleData?.space} onChange={handleChange} disabled={!scheduleData?.activityId || availableSpaces.length === 0}>
                    <option value="">{scheduleData?.activityId ? "Seleccione un espacio" : "Primero elija una actividad"}</option>
                    {availableSpaces.map(sp => <option key={sp.name} value={sp.name}>{sp.name}</option>)}
                </SelectField>
                 <InputField id="maxCapacity" name="maxCapacity" label="Cupo Máximo" type="number" value={scheduleData?.maxCapacity} onChange={handleChange} />
                <SelectField id="dayOfWeek" name="dayOfWeek" label="Día de la Semana" value={scheduleData?.dayOfWeek} onChange={handleChange}>
                    <option value="">Seleccione un día</option>
                    {daysOfWeek.map(day => <option key={day} value={day}>{day}</option>)}
                </SelectField>
                <InputField id="startTime" name="startTime" label="Hora de Inicio" type="time" value={scheduleData?.startTime} onChange={handleChange} />
                <InputField id="endTime" name="endTime" label="Hora de Fin" type="time" value={scheduleData?.endTime} onChange={handleChange} />
                <div className="flex justify-end gap-3 pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700">Cancelar</button>
                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Guardar Clase</button>
                </div>
            </form>
        </Modal>
    );
};

// --- Formulario Modal para Registrar Pago ---
const PaymentFormModal = ({ isOpen, onClose, onSave, due, handleFileUpload }) => {
    const [details, setDetails] = useState("");
    const [file, setFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setDetails('');
            setFile(null);
        }
    }, [isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsUploading(true);
        let fileUrl = '';
        if (file) {
            fileUrl = await handleFileUpload(file, 'payment_proofs');
        }
        await onSave(due, details, fileUrl);
        setIsUploading(false);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Registrar Pago de ${due?.period}`}>
            <form onSubmit={handleSubmit} className="space-y-4">
                 <p>Socio: <span className="font-bold">{due?.memberName}</span></p>
                 <p>Monto: <span className="font-bold">${due?.amount}</span></p>
                <TextAreaField id="details" name="details" label="Detalle del pago (opcional)" placeholder="Ej: Pago en efectivo, transferencia..." value={details} onChange={(e) => setDetails(e.target.value)} />
                <FileUploader 
                    onFileSelect={setFile}
                    identifier="payment-proof" 
                    acceptedFileTypes="*" 
                />
                <div className="flex justify-end gap-3 pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700">Cancelar</button>
                    <button type="submit" disabled={isUploading} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-500">
                         {isUploading ? <Loader2 className="animate-spin" /> : "Confirmar Pago"}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

// --- Formulario Modal para Editar Pago ---
const EditPaymentModal = ({ isOpen, onClose, onSave, payment, setPayment }) => {
    if (!isOpen) return null;
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Editar Detalle del Pago">
            <div className="space-y-4">
                <p>Editando el pago del socio <span className="font-bold">{payment.memberName}</span> para el período <span className="font-bold">{payment.period}</span>.</p>
                <TextAreaField
                    id="editDetails"
                    label="Detalle / Observaciones del Recibo"
                    value={payment.details}
                    onChange={(e) => setPayment(prev => ({ ...prev, details: e.target.value }))}
                />
                <div className="flex justify-end gap-3">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700">Cancelar</button>
                    <button type="button" onClick={onSave} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Guardar Cambios</button>
                </div>
            </div>
        </Modal>
    );
};

const ReceiptPreviewModal = ({ isOpen, onClose, payment, clubConfig }) => {
    const receiptRef = useRef(null);

    const handleDownload = () => {
        if (receiptRef.current) {
            html2canvas(receiptRef.current, { backgroundColor: '#111827' }).then(canvas => {
                const link = document.createElement('a');
                link.download = `recibo-${payment.memberName}-${payment.period}.png`;
                link.href = canvas.toDataURL('image/png');
                link.click();
            });
        }
    };
    if (!isOpen) return null;
    
    const talonarioConfig = payment.receiptConfig || defaultTalonariosConfig.recibo;
    
    const receiptData = {
        socioName: payment.memberName,
        dni: payment.memberDni,
        plan: payment.memberType,
        paymentDate: payment.date?.toDate().toLocaleDateString(),
        amount: payment.amount,
        observaciones: payment.details
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Recibo de ${payment.memberName}`}>
            <div className="flex flex-col items-center gap-4">
                <TalonarioPreview ref={receiptRef} talonarioConfig={talonarioConfig} clubConfig={clubConfig} receiptData={receiptData} />
                <button onClick={handleDownload} className="flex items-center px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700">
                    <Download size={16} className="mr-2" /> Descargar Recibo
                </button>
            </div>
        </Modal>
    );
};


// --- MÓDULOS DE ADMINISTRACIÓN ---
const DashboardModule = ({ members, payments, dues, activities, config }) => {
    const { showStatCards, showMonthlyIncome, showActivityPopularity } = config?.dashboardWidgets || {};

    const monthlyIncome = useMemo(() => {
        const data = {};
        const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
        for(let i=5; i>=0; i--) { 
            const d = new Date(); 
            d.setMonth(d.getMonth() - i); 
            const month = monthNames[d.getMonth()];
            data[month] = { Ingresos: 0 };
        }
        payments.forEach(p => { 
            const date = p.date?.toDate ? p.date.toDate() : new Date();
            const month = monthNames[date.getMonth()];
            if (data[month]) data[month].Ingresos += p.amount; 
        });
        return Object.keys(data).map(month => ({ month, Ingresos: data[month].Ingresos }));
    }, [payments]);

    const totalDebt = useMemo(() => {
        return dues.filter(d => d.status === 'Pendiente').reduce((sum, d) => sum + d.amount, 0);
    }, [dues]);
    
    const currentMonthIncome = monthlyIncome.length > 0 ? monthlyIncome[monthlyIncome.length - 1].Ingresos : 0;
    
    const activityData = useMemo(() => {
        if (!members || !activities) return [];
        const counts = members.reduce((acc, member) => {
            if (member.activityId) {
                acc[member.activityId] = (acc[member.activityId] || 0) + 1;
            }
            return acc;
        }, {});
        
        const activityMap = new Map(activities.map(a => [a.id, a.name]));

        const data = Object.entries(counts).map(([activityId, count]) => ({
            name: activityMap.get(activityId) || 'Desconocida',
            value: count
        }));

        return data.filter(item => item.value > 0);

    }, [members, activities]);

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF'];


    return (
        <div className="space-y-6">
            {showStatCards && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard title="Total de Socios" value={members.length} icon={Users} />
                    <StatCard title="Ingresos del Mes Actual" value={`$${currentMonthIncome.toFixed(2)}`} icon={DollarSign} />
                    <StatCard title="Deuda Total Pendiente" value={`$${totalDebt.toFixed(2)}`} icon={AlertCircle} />
                    <StatCard title="Socios Activos" value={members.filter(m => m.status === 'Activo').length} icon={UserCheck} />
                </div>
            )}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 {showMonthlyIncome && (
                    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700"><h3 className="text-xl font-bold text-white mb-4">Ingresos de los últimos 6 meses</h3>
                        <ResponsiveContainer width="100%" height={300}><BarChart data={monthlyIncome}><CartesianGrid strokeDasharray="3 3" stroke="#4a5568" /><XAxis dataKey="month" stroke="#a0aec0" /><YAxis stroke="#a0aec0" /><Tooltip contentStyle={{ backgroundColor: '#2d3748', border: 'none' }} /><Legend /><Bar dataKey="Ingresos" fill="#4299e1" /></BarChart></ResponsiveContainer>
                    </div>
                 )}
                 {showActivityPopularity && (
                    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700"><h3 className="text-xl font-bold text-white mb-4">Inscripciones por Actividad</h3>
                        <ResponsiveContainer width="100%" height={300}>
                             <PieChart>
                                <Pie data={activityData} cx="50%" cy="50%" labelLine={false} outerRadius={100} fill="#8884d8" dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                                    {activityData.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                                </Pie>
                                 <Tooltip contentStyle={{ backgroundColor: '#2d3748', border: 'none' }}/>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                 )}
            </div>
        </div>
    );
};

const MembersModule = ({ db, currentClub, members, config, activities, handleFileUpload }) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [isQRModalOpen, setIsQRModalOpen] = useState(false);
    const [currentMemberData, setCurrentMemberData] = useState(null);
    const [memberToDelete, setMemberToDelete] = useState(null);

    const filteredMembers = useMemo(() => {
        if (!searchTerm) return members;
        return members.filter(member => 
            member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            member.email.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [members, searchTerm]);
    
    const handleOpenFormModal = (member = null) => {
        if (member) {
            setCurrentMemberData({...member, password: '', confirmPassword: ''});
        } else {
            setCurrentMemberData({ name: '', email: '', memberType: '', status: 'Activo', pais: 'Argentina' });
        }
        setIsFormModalOpen(true);
    };

    const handleCloseFormModal = () => setIsFormModalOpen(false);

    const handleOpenConfirmModal = (memberId) => {
        setMemberToDelete(memberId);
        setIsConfirmModalOpen(true);
    };
    const handleCloseConfirmModal = () => setIsConfirmModalOpen(false);
    
    const handleOpenQRModal = (member) => {
        const qrValue = JSON.stringify({
            type: 'member',
            id: member.id,
            clubId: currentClub.id,
            name: member.name,
            dni: member.dni,
            memberType: member.memberType,
        });
        setCurrentMemberData({ ...member, qrValue });
        setIsQRModalOpen(true);
    };
    const handleCloseQRModal = () => setIsQRModalOpen(false);

    const handleSaveMember = async (memberData) => {
        if (!db || !currentClub?.id) return;
        
        const membersPath = `artifacts/${appId}/public/data/members`;
        const { id, confirmPassword, ...dataToSave } = memberData;
        dataToSave.clubId = currentClub.id;

        if (!dataToSave.password) {
            delete dataToSave.password;
        }

        try {
            if (id) {
                const memberRef = doc(db, membersPath, id);
                await updateDoc(memberRef, dataToSave);
            } else {
                if (!dataToSave.password) {
                    dataToSave.password = Math.random().toString(36).slice(-8);
                }
                await addDoc(collection(db, membersPath), dataToSave);
            }
            handleCloseFormModal();
        } catch (error) {
            console.error("Error al guardar el socio: ", error);
            alert("Error al guardar el socio. Revise la consola para más detalles.");
        }
    };

    const handleConfirmDelete = async () => {
        if (!db || !memberToDelete) return;
        
        const memberRef = doc(db, `artifacts/${appId}/public/data/members`, memberToDelete);
        try {
            await deleteDoc(memberRef);
            handleCloseConfirmModal();
        } catch (error) {
            console.error("Error al eliminar el socio: ", error);
            handleCloseConfirmModal();
        }
    };

    return (
        <>
            <MemberFormModal 
                isOpen={isFormModalOpen}
                onClose={handleCloseFormModal}
                onSave={handleSaveMember}
                memberData={currentMemberData}
                setMemberData={setCurrentMemberData}
                config={config}
                activities={activities}
                handleFileUpload={handleFileUpload}
            />
            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={handleCloseConfirmModal}
                onConfirm={handleConfirmDelete}
                title="Confirmar Eliminación"
                message="¿Estás seguro de que quieres eliminar a este socio? Esta acción no se puede deshacer."
            />
            {currentMemberData && (
                <QRDisplayModal
                    isOpen={isQRModalOpen}
                    onClose={handleCloseQRModal}
                    qrValue={currentMemberData.qrValue}
                    memberName={currentMemberData.name}
                />
            )}
            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <h2 className="text-2xl font-bold text-white">Gestión de Socios ({members.length})</h2>
                    <div className="flex gap-2 w-full sm:w-auto">
                        <InputField id="search" placeholder="Buscar socio..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                        <button onClick={() => handleOpenFormModal()} className="flex-shrink-0 flex items-center px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700">
                            <UserPlus size={18} className="mr-2" />
                            Añadir
                        </button>
                    </div>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-700">
                            <tr>
                                <th className="p-3 text-sm font-semibold text-gray-300">Nombre</th>
                                <th className="p-3 text-sm font-semibold text-gray-300">Email</th>
                                <th className="p-3 text-sm font-semibold text-gray-300">Tipo de Socio</th>
                                <th className="p-3 text-sm font-semibold text-gray-300">Estado</th>
                                <th className="p-3 text-sm font-semibold text-gray-300">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredMembers.length > 0 ? (
                                filteredMembers.map(member => (
                                    <tr key={member.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                                        <td className="p-3 flex items-center gap-3">
                                            <img src={member.photoURL || `https://ui-avatars.com/api/?name=${member.name}&background=0D8ABC&color=fff`} alt={member.name} className="w-10 h-10 rounded-full object-cover" />
                                            {member.name}
                                        </td>
                                        <td className="p-3">{member.email}</td>
                                        <td className="p-3">{member.memberType}</td>
                                        <td className="p-3">
                                            <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                                                member.status === 'Activo' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
                                            }`}>
                                                {member.status}
                                            </span>
                                        </td>
                                        <td className="p-3 flex space-x-2">
                                            <button onClick={() => handleOpenQRModal(member)} className="p-1 text-gray-400 hover:text-white"><QrCode size={16} /></button>
                                            <button onClick={() => handleOpenFormModal(member)} className="p-1 text-gray-400 hover:text-white"><Edit size={16} /></button>
                                            <button onClick={() => handleOpenConfirmModal(member.id)} className="p-1 text-gray-400 hover:text-red-400"><Trash2 size={16} /></button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="text-center p-6 text-gray-400">
                                        No se encontraron socios.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
};

const PaymentsModule = ({ db, currentClub, members, config, dues, payments, handleFileUpload }) => {
    const [activeTab, setActiveTab] = useState('dues');
    const [isLoading, setIsLoading] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
    const [isEditPaymentModalOpen, setIsEditPaymentModalOpen] = useState(false);
    const [currentDue, setCurrentDue] = useState(null);
    const [currentPayment, setCurrentPayment] = useState(null);

    const membersMap = useMemo(() => new Map(members.map(m => [m.id, m])), [members]);

    const handleOpenPaymentModal = (due) => {
        setCurrentDue({...due, memberName: membersMap.get(due.memberId)?.name});
        setIsPaymentModalOpen(true);
    };

    const handleOpenReceiptModal = (payment) => {
        const member = membersMap.get(payment.memberId);
        setCurrentPayment({ ...payment, memberName: member?.name, memberDni: member?.dni, memberType: member?.memberType });
        setIsReceiptModalOpen(true);
    };

    const handleOpenEditPaymentModal = (payment) => {
        const member = membersMap.get(payment.memberId);
        setCurrentPayment({ ...payment, memberName: member?.name });
        setIsEditPaymentModalOpen(true);
    };

    const handleSavePaymentEdit = async () => {
        if (!currentPayment) return;
        const paymentRef = doc(db, `artifacts/${appId}/public/data/payments`, currentPayment.id);
        await updateDoc(paymentRef, { details: currentPayment.details });
        setIsEditPaymentModalOpen(false);
    };
    
    const handleShareReceipt = (type, payment) => {
        const member = membersMap.get(payment.memberId);
        if (!member) {
            alert("Socio no encontrado.");
            return;
        }
        const message = `Hola ${member.name}, te enviamos tu recibo por el pago de $${payment.amount} correspondiente al período ${payment.period}. ¡Muchas gracias!`;

        if (type === 'whatsapp') {
            if (!member.celular) { alert("El socio no tiene un número de celular registrado."); return; }
            window.open(`https://wa.me/${member.celular}?text=${encodeURIComponent(message)}`, '_blank');
        } else if (type === 'email') {
             if (!member.email) { alert("El socio no tiene un email registrado."); return; }
            window.open(`mailto:${member.email}?subject=${encodeURIComponent(`Recibo de Pago - ${currentClub.name}`)}&body=${encodeURIComponent(message)}`, '_blank');
        }
    };
    
    const handleSendCommunication = (type, due) => {
        const member = membersMap.get(due.memberId);
        if (!member) {
            alert("Socio no encontrado.");
            return;
        }

        const message = `Hola ${member.name}, te recordamos que tu cuota del período ${due.period} por un monto de $${due.amount} se encuentra pendiente.`;

        if (type === 'whatsapp') {
            if (!member.celular) {
                alert("El socio no tiene un número de celular registrado.");
                return;
            }
            window.open(`https://wa.me/${member.celular}?text=${encodeURIComponent(message)}`, '_blank');
        } else if (type === 'email') {
             if (!member.email) {
                alert("El socio no tiene un email registrado.");
                return;
            }
            window.open(`mailto:${member.email}?subject=${encodeURIComponent(`Recordatorio de Cuota Pendiente - ${currentClub.name}`)}&body=${encodeURIComponent(message)}`, '_blank');
        }
    };

    const handleGenerateDues = async () => {
        setIsLoading(true);
        const batch = writeBatch(db);
        const activeMembers = members.filter(m => m.status === 'Activo');
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        const period = `${year}-${String(month + 1).padStart(2, '0')}`;

        const duesPath = `artifacts/${appId}/public/data/dues`;
        const q = query(collection(db, duesPath), where('clubId', '==', currentClub.id), where('period', '==', period));
        const existingDuesSnap = await getDocs(q);
        const existingDuesForPeriod = new Set(existingDuesSnap.docs.map(d => d.data().memberId));

        let generatedCount = 0;
        activeMembers.forEach(member => {
            if (!existingDuesForPeriod.has(member.id)) {
                const amount = config.fees[member.memberType] || 0;
                if (amount > 0) {
                    const dueRef = doc(collection(db, duesPath));
                    batch.set(dueRef, {
                        clubId: currentClub.id,
                        memberId: member.id,
                        period: period,
                        amount: amount,
                        status: 'Pendiente',
                        createdAt: serverTimestamp()
                    });
                    generatedCount++;
                }
            }
        });

        if (generatedCount > 0) {
            await batch.commit();
            alert(`${generatedCount} cuotas nuevas generadas.`);
        } else {
            alert("No se generaron cuotas nuevas. Ya existen para este período o no hay socios activos con planes pagos.");
        }
        setIsLoading(false);
    };
    
    const handleRegisterPayment = async (due, details, fileUrl) => {
        setIsLoading(true);
        const batch = writeBatch(db);
        
        const dueRef = doc(db, `artifacts/${appId}/public/data/dues`, due.id);
        batch.update(dueRef, { status: 'Pagada' });

        const paymentRef = doc(collection(db, `artifacts/${appId}/public/data/payments`));
        batch.set(paymentRef, {
            clubId: currentClub.id,
            memberId: due.memberId,
            amount: due.amount,
            period: due.period,
            date: serverTimestamp(),
            method: 'Manual',
            details: details || "",
            proofUrl: fileUrl || "",
            receiptConfig: config.talonarios?.recibo || defaultTalonariosConfig.recibo
        });

        await batch.commit();
        setIsLoading(false);
        setIsPaymentModalOpen(false);
    };

    return (
        <>
            {currentDue && <PaymentFormModal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} onSave={handleRegisterPayment} due={currentDue} handleFileUpload={handleFileUpload} />}
            {currentPayment && <ReceiptPreviewModal isOpen={isReceiptModalOpen} onClose={() => setIsReceiptModalOpen(false)} payment={currentPayment} clubConfig={{name: currentClub.name, logoURL: config.logoURL}} />}
            {currentPayment && <EditPaymentModal isOpen={isEditPaymentModalOpen} onClose={() => setIsEditPaymentModalOpen(false)} onSave={handleSavePaymentEdit} payment={currentPayment} setPayment={setCurrentPayment} />}
            
            <div className="flex justify-end mb-4">
                <button onClick={handleGenerateDues} disabled={isLoading} className="flex items-center px-4 py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 disabled:bg-gray-500">
                    {isLoading ? <Loader2 className="animate-spin mr-2"/> : <Plus className="mr-2"/>}
                    Generar Cuotas del Mes
                </button>
            </div>
            <div>
                <div className="flex space-x-1 rounded-lg bg-gray-800 p-1 mb-6 max-w-sm">
                    <button onClick={() => setActiveTab('dues')} className={`w-full p-2 text-sm font-medium rounded-md ${activeTab === 'dues' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>Cuotas Pendientes ({dues.filter(d => d.status === 'Pendiente').length})</button>
                    <button onClick={() => setActiveTab('payments')} className={`w-full p-2 text-sm font-medium rounded-md ${activeTab === 'payments' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>Historial de Pagos ({payments.length})</button>
                </div>
            
                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                     {activeTab === 'dues' && (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-700"><tr><th className="p-3">Socio</th><th className="p-3">Período</th><th className="p-3">Monto</th><th className="p-3">Estado</th><th className="p-3">Acciones</th></tr></thead>
                                <tbody>
                                    {dues.filter(d => d.status === 'Pendiente').map(due => (
                                        <tr key={due.id} className="border-b border-gray-700">
                                            <td className="p-3">{membersMap.get(due.memberId)?.name || 'Socio no encontrado'}</td>
                                            <td className="p-3">{due.period}</td>
                                            <td className="p-3">${due.amount}</td>
                                            <td className="p-3"><span className="px-2 py-1 text-xs font-bold rounded-full bg-yellow-500/20 text-yellow-300">{due.status}</span></td>
                                            <td className="p-3 flex items-center gap-2">
                                                <button disabled={isLoading} onClick={() => handleOpenPaymentModal(due)} className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 disabled:bg-gray-500">Registrar Pago</button>
                                                 <button onClick={() => alert("Función de descarga no implementada. Configurar en 'Talonarios'.")} className="p-1 text-gray-400 hover:text-white" title="Descargar Cupón"><Download size={16}/></button>
                                                <button onClick={() => handleSendCommunication('whatsapp', due)} className="p-1 text-gray-400 hover:text-white" title="Enviar por WhatsApp"><MessageCircle size={16}/></button>
                                                <button onClick={() => handleSendCommunication('email', due)} className="p-1 text-gray-400 hover:text-white" title="Enviar por Email"><MailIcon size={16}/></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                     )}
                     {activeTab === 'payments' && (
                        <div className="overflow-x-auto">
                             <table className="w-full text-left">
                                <thead className="bg-gray-700"><tr><th className="p-3">Socio</th><th className="p-3">Período</th><th className="p-3">Monto</th><th className="p-3">Fecha de Pago</th><th className="p-3">Acciones</th></tr></thead>
                                <tbody>
                                    {payments.map(p => (
                                        <tr key={p.id} className="border-b border-gray-700">
                                            <td className="p-3">{membersMap.get(p.memberId)?.name || 'Socio no encontrado'}</td>
                                            <td className="p-3">{p.period}</td>
                                            <td className="p-3">${p.amount}</td>
                                            <td className="p-3">{p.date?.toDate().toLocaleDateString()}</td>
                                            <td className="p-3 flex items-center gap-2">
                                                 <button onClick={() => handleOpenReceiptModal(p)} className="p-1 text-gray-400 hover:text-white" title="Ver/Descargar Recibo"><FileDown size={16}/></button>
                                                 <button onClick={() => handleShareReceipt('whatsapp', p)} className="p-1 text-gray-400 hover:text-white" title="Enviar por WhatsApp"><MessageCircle size={16}/></button>
                                                 <button onClick={() => handleShareReceipt('email', p)} className="p-1 text-gray-400 hover:text-white" title="Enviar por Email"><MailIcon size={16}/></button>
                                                 <button onClick={() => handleOpenEditPaymentModal(p)} className="p-1 text-gray-400 hover:text-white" title="Editar Detalle"><Pencil size={16}/></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                     )}
                </div>
            </div>
        </>
    );
};

const NewsModule = ({ db, currentClub, handleFileUpload }) => {
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [currentNewsData, setCurrentNewsData] = useState(null);
    const [newsToDelete, setNewsToDelete] = useState(null);

    useEffect(() => {
        if (!db || !currentClub?.id) { setLoading(false); return; }
        setLoading(true);
        const newsPath = `artifacts/${appId}/public/data/news`;
        const q = query(collection(db, newsPath), where("clubId", "==", currentClub.id));
        const unsub = onSnapshot(q, snap => {
            const newsData = snap.docs.map(d => ({id: d.id, ...d.data()}));
            newsData.sort((a, b) => (b.createdAt?.toDate() || 0) - (a.createdAt?.toDate() || 0));
            setNews(newsData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching news: ", error);
            setLoading(false);
        });
        return () => unsub();
    }, [db, currentClub]);

    const handleOpenFormModal = (newsItem = null) => {
        setCurrentNewsData(newsItem || { title: '', content: '', imageUrl: '', status: 'Borrador' });
        setIsFormModalOpen(true);
    };
    const handleCloseFormModal = () => {
        setIsFormModalOpen(false);
        setTimeout(() => setCurrentNewsData(null), 300); 
    };

    const handleOpenConfirmModal = (newsId) => {
        setNewsToDelete(newsId);
        setIsConfirmModalOpen(true);
    };
    const handleCloseConfirmModal = () => setIsConfirmModalOpen(false);

    const handleSaveNews = async (newsData) => {
        if (!db || !currentClub?.id) return;
        const newsPath = `artifacts/${appId}/public/data/news`;
        const { id, ...dataToSave } = newsData;
        dataToSave.clubId = currentClub.id;

        try {
            if (id) {
                const newsRef = doc(db, newsPath, id);
                await updateDoc(newsRef, dataToSave);
            } else {
                await addDoc(collection(db, newsPath), { ...dataToSave, createdAt: serverTimestamp() });
            }
            handleCloseFormModal();
        } catch (error) {
            console.error("Error al guardar la noticia:", error);
        }
    };

    const handleConfirmDelete = async () => {
        if (!db || !newsToDelete) return;
        // TODO: Also delete the image from storage if it exists. This needs a reference to the file path.
        const newsRef = doc(db, `artifacts/${appId}/public/data/news`, newsToDelete);
        try {
            await deleteDoc(newsRef);
            handleCloseConfirmModal();
        } catch (error) {
            console.error("Error al eliminar la noticia:", error);
            handleCloseConfirmModal();
        }
    };

    const handleShare = (type, item) => {
        const message = `${item.title}\n\n${item.content}`;
        if (type === 'whatsapp') {
            window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
        } else if (type === 'email') {
            window.open(`mailto:?subject=${encodeURIComponent(item.title)}&body=${encodeURIComponent(message)}`, '_blank');
        }
    };


    if (loading) return <div className="text-white flex items-center justify-center"><Loader2 className="animate-spin mr-2" /> Cargando noticias...</div>

    return (
        <>
            <NewsFormModal 
                isOpen={isFormModalOpen} 
                onClose={handleCloseFormModal} 
                onSave={handleSaveNews} 
                newsData={currentNewsData} 
                setNewsData={setCurrentNewsData}
                handleFileUpload={handleFileUpload}
            />
            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={handleCloseConfirmModal}
                onConfirm={handleConfirmDelete}
                title="Confirmar Eliminación"
                message="¿Estás seguro de que quieres eliminar esta noticia?"
            />
            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                 <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-white">Noticias y Anuncios</h2>
                     <button onClick={() => handleOpenFormModal()} className="flex items-center px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700">
                        <Plus size={18} className="mr-2" />
                        Crear Noticia
                    </button>
                </div>
                <div className="space-y-4">
                    {news.length > 0 ? news.map(item => (
                        <div key={item.id} className="bg-gray-700 rounded-lg overflow-hidden">
                             {item.imageUrl && <img src={item.imageUrl} alt={item.title} className="w-full h-40 object-cover"/>}
                            <div className="p-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-bold text-lg text-white">{item.title}</h3>
                                            <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                                                item.status === 'Publicado' ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300'
                                            }`}>{item.status}</span>
                                        </div>
                                        <p className="text-gray-300 mt-1">{item.content}</p>
                                        <p className="text-xs text-gray-500 mt-2">{item.createdAt?.toDate().toLocaleDateString()}</p>
                                    </div>
                                    <div className="flex-shrink-0 flex flex-col gap-2 ml-4">
                                        <button onClick={() => handleOpenFormModal(item)} className="p-1 text-gray-400 hover:text-white"><Edit size={16} /></button>
                                        <button onClick={() => handleOpenConfirmModal(item.id)} className="p-1 text-gray-400 hover:text-red-400"><Trash2 size={16} /></button>
                                        <button onClick={() => handleShare('whatsapp', item)} className="p-1 text-gray-400 hover:text-white"><MessageCircle size={16} /></button>
                                        <button onClick={() => handleShare('email', item)} className="p-1 text-gray-400 hover:text-white"><MailIcon size={16} /></button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )) : <p className="text-gray-400">No hay noticias publicadas.</p>}
                </div>
            </div>
        </>
    );
};

const MessagingModule = ({ db, currentClub, currentUser, allUsers, handleFileUpload }) => {
    // Lógica del módulo de mensajería aquí
    return (
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
            <h2 className="text-2xl font-bold text-white mb-4">Mensajería Interna</h2>
            <p className="text-gray-400">Este módulo se encuentra en desarrollo.</p>
            <p className="text-sm text-yellow-400 mt-2">Nota: La funcionalidad de borrado automático de mensajes y adjuntos a los 5 días requiere configuración del lado del servidor (Cloud Functions) que no se puede implementar desde aquí.</p>
        </div>
    );
};

const ReportsModule = ({ members, payments, dues }) => {
    const [reportType, setReportType] = useState('ingresos');
    const [filters, setFilters] = useState({ startDate: '', endDate: '', memberId: '' });
    const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'asc' });

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };
    
    const handleMemberSelect = (member) => {
        setFilters(prev => ({ ...prev, memberId: member ? member.id : '' }));
    };

    const requestSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedData = useMemo(() => {
        let data = [];
        if (reportType === 'ingresos') {
            data = payments.map(p => ({ ...p, date: p.date?.toDate(), memberName: members.find(m => m.id === p.memberId)?.name || 'N/A' }));
        } else if (reportType === 'socios') {
            data = [...members];
        } else if (reportType === 'cuentaCorriente' && filters.memberId) {
            const memberDues = dues.filter(d => d.memberId === filters.memberId).map(d => ({
                id: d.id,
                date: d.createdAt?.toDate(),
                concept: `Cuota ${d.period}`,
                debit: d.amount,
                credit: 0
            }));
            const memberPayments = payments.filter(p => p.memberId === filters.memberId).map(p => ({
                id: p.id,
                date: p.date?.toDate(),
                concept: `Pago ${p.period}`,
                debit: 0,
                credit: p.amount
            }));
            data = [...memberDues, ...memberPayments];
        }
        
        const sorted = data.sort((a, b) => {
            const valA = a[sortConfig.key];
            const valB = b[sortConfig.key];
            if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
            if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
        
        return sorted;

    }, [reportType, payments, members, dues, filters.memberId, sortConfig]);


    const filteredAndBalancedData = useMemo(() => {
        let data = sortedData;
        let runningBalance = 0;

        const startDate = filters.startDate ? new Date(filters.startDate).getTime() : 0;
        const endDate = filters.endDate ? new Date(filters.endDate).setHours(23, 59, 59, 999) : Infinity;
        
        if (reportType === 'cuentaCorriente') {
            const statement = data
                .filter(item => item.date && item.date.getTime() >= startDate && item.date.getTime() <= endDate)
                .map(item => {
                    runningBalance = runningBalance - item.debit + item.credit;
                    return { ...item, balance: runningBalance };
                });
            return statement;
        }

        return data.filter(item => {
            const itemDate = (item.date || new Date(item.birthDate))?.getTime();
            if(!itemDate) return true;
            return itemDate >= startDate && itemDate <= endDate;
        });

    }, [sortedData, filters.startDate, filters.endDate, reportType]);


    const renderIncomeReport = () => (
        <table className="w-full text-left">
            <thead className="bg-gray-700">
                <tr>
                    <th className="p-3 cursor-pointer" onClick={() => requestSort('date')}>Fecha</th>
                    <th className="p-3 cursor-pointer" onClick={() => requestSort('memberName')}>Socio</th>
                    <th className="p-3 cursor-pointer" onClick={() => requestSort('period')}>Período</th>
                    <th className="p-3 cursor-pointer" onClick={() => requestSort('amount')}>Monto</th>
                </tr>
            </thead>
            <tbody>
                {filteredAndBalancedData.map(p => (
                    <tr key={p.id} className="border-b border-gray-700">
                        <td className="p-3">{p.date.toLocaleDateString()}</td>
                        <td className="p-3">{p.memberName}</td>
                        <td className="p-3">{p.period}</td>
                        <td className="p-3">${p.amount}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );

    const renderMembersReport = () => (
         <table className="w-full text-left">
            <thead className="bg-gray-700">
                <tr>
                    <th className="p-3 cursor-pointer" onClick={() => requestSort('name')}>Nombre</th>
                    <th className="p-3 cursor-pointer" onClick={() => requestSort('email')}>Email</th>
                    <th className="p-3 cursor-pointer" onClick={() => requestSort('memberType')}>Tipo</th>
                    <th className="p-3 cursor-pointer" onClick={() => requestSort('status')}>Estado</th>
                </tr>
            </thead>
            <tbody>
                {filteredAndBalancedData.map(m => (
                    <tr key={m.id} className="border-b border-gray-700">
                        <td className="p-3">{m.name}</td>
                        <td className="p-3">{m.email}</td>
                        <td className="p-3">{m.memberType}</td>
                        <td className="p-3">{m.status}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );

    const renderAccountStatementReport = () => (
        <table className="w-full text-left">
            <thead className="bg-gray-700">
                <tr>
                    <th className="p-3 cursor-pointer" onClick={() => requestSort('date')}>Fecha</th>
                    <th className="p-3 cursor-pointer" onClick={() => requestSort('concept')}>Concepto</th>
                    <th className="p-3 cursor-pointer" onClick={() => requestSort('debit')}>Cargo (-)</th>
                    <th className="p-3 cursor-pointer" onClick={() => requestSort('credit')}>Abono (+)</th>
                    <th className="p-3">Saldo</th>
                </tr>
            </thead>
            <tbody>
                {filteredAndBalancedData.map(item => (
                    <tr key={item.id} className="border-b border-gray-700">
                        <td className="p-3">{item.date?.toLocaleDateString()}</td>
                        <td className="p-3">{item.concept}</td>
                        <td className="p-3 text-red-400">{item.debit > 0 ? `$${item.debit.toFixed(2)}` : '-'}</td>
                        <td className="p-3 text-green-400">{item.credit > 0 ? `$${item.credit.toFixed(2)}` : '-'}</td>
                        <td className={`p-3 font-bold ${item.balance < 0 ? 'text-red-400' : 'text-green-400'}`}>${item.balance.toFixed(2)}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );

    return (
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
             <h2 className="text-2xl font-bold text-white mb-6">Informes</h2>
             <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4 p-4 bg-gray-700/50 rounded-lg">
                <SelectField id="reportType" label="Tipo de Informe" value={reportType} onChange={e => setReportType(e.target.value)}>
                    <option value="ingresos">Ingresos</option>
                    <option value="socios">Socios</option>
                    <option value="cuentaCorriente">Cuenta Corriente de Socio</option>
                </SelectField>

                {reportType === 'cuentaCorriente' && (
                    <SearchableSelect
                        label="Seleccionar Socio"
                        options={members}
                        selectedOption={filters.memberId}
                        onSelect={handleMemberSelect}
                        placeholder="Buscar socio por nombre..."
                    />
                )}

                <div className="flex gap-2 items-end">
                    <InputField type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} label="Desde"/>
                    <InputField type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} label="Hasta"/>
                </div>
             </div>
             <div className="overflow-x-auto">
                {reportType === 'ingresos' && renderIncomeReport()}
                {reportType === 'socios' && renderMembersReport()}
                {reportType === 'cuentaCorriente' && filters.memberId && renderAccountStatementReport()}
             </div>
        </div>
    );
};

const AttendanceModule = ({ db, currentClub, members }) => {
    const [attendanceLog, setAttendanceLog] = useState([]);
    const [loadingLogs, setLoadingLogs] = useState(true);
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [scanResult, setScanResult] = useState("");

    useEffect(() => {
        if (!db || !currentClub) return;
        const attendancePath = `artifacts/${appId}/public/data/attendance`;
        const q = query(collection(db, attendancePath), where("clubId", "==", currentClub.id));
        
        const unsub = onSnapshot(q, (snap) => {
            const logData = snap.docs.map(d => ({id: d.id, ...d.data()}));
            logData.sort((a,b) => (b.timestamp?.toDate() || 0) - (a.timestamp?.toDate() || 0));
            setAttendanceLog(logData.slice(0, 20)); // Limit to last 20
            setLoadingLogs(false);
        }, (error) => {
            console.error("Error en listener de Asistencia:", error);
            setLoadingLogs(false);
        });
        
        return () => unsub();
    }, [db, currentClub]);

    const handleRegisterEntry = async (member) => {
        if(!db || !currentClub) return;
        const attendancePath = `artifacts/${appId}/public/data/attendance`;
        await addDoc(collection(db, attendancePath), {
            clubId: currentClub.id,
            memberId: member.id,
            memberName: member.name,
            timestamp: serverTimestamp()
        });
    }

    const handleScanSuccess = async (text) => {
        setIsScannerOpen(false);
        try {
            const data = JSON.parse(text);
            if(data.clubId === currentClub.id && data.type === 'member') {
                const memberRef = doc(db, `artifacts/${appId}/public/data/members`, data.id);
                const memberSnap = await getDoc(memberRef);
                if (memberSnap.exists()) {
                    const member = memberSnap.data();
                    await handleRegisterEntry({id: memberSnap.id, ...member});
                    setScanResult(`¡Acceso Correcto! Ingreso de ${member.name} registrado.`);
                } else {
                    setScanResult("Error: Socio no encontrado.");
                }
            } else {
                setScanResult("Error: QR no válido para este club.");
            }
        } catch (e) {
            setScanResult("Error: Código QR no válido.");
        }
    };
    
    useEffect(() => {
        if(scanResult) {
            const timer = setTimeout(() => setScanResult(""), 5000);
            return () => clearTimeout(timer);
        }
    }, [scanResult])

    return (
        <>
            <QRScannerModal isOpen={isScannerOpen} onClose={() => setIsScannerOpen(false)} onScanSuccess={handleScanSuccess} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-bold text-white">Registrar Ingreso de Socio</h2>
                         <button onClick={() => setIsScannerOpen(true)} className="flex items-center px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700">
                            <QrCode size={18} className="mr-2" />
                            Escanear QR
                        </button>
                    </div>
                     {scanResult && <div className={`p-3 rounded-md mb-4 ${scanResult.startsWith('Error') ? 'bg-red-500/20 text-red-300' : 'bg-green-500/20 text-green-300'}`}>{scanResult}</div>}
                    <div className="overflow-y-auto max-h-96">
                        <table className="w-full text-left">
                            <tbody>
                                {members.map(member => (
                                    <tr key={member.id} className="border-b border-gray-700">
                                        <td className="p-3">{member.name}</td>
                                        <td className="p-3 text-right"><button onClick={() => handleRegisterEntry(member)} className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700">Registrar Ingreso</button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                 <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                    <h2 className="text-2xl font-bold text-white mb-4">Últimos Ingresos</h2>
                     <div className="overflow-y-auto max-h-96">
                        {loadingLogs ? <Loader2 className="animate-spin" /> :
                            <table className="w-full text-left">
                                <tbody>
                                    {attendanceLog.map(log => (
                                         <tr key={log.id} className="border-b border-gray-700">
                                            <td className="p-2">{log.memberName}</td>
                                            <td className="p-2 text-right text-gray-400">{log.timestamp?.toDate().toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        }
                    </div>
                </div>
            </div>
        </>
    );
};

const SpaceAgendaModule = ({ schedule, spaces, activities, instructors }) => {
    const [viewMode, setViewMode] = useState('week'); // 'day', 'week', 'month'
    const [currentDate, setCurrentDate] = useState(new Date());

    const activityMap = useMemo(() => new Map(activities.map(a => [a.id, a.name])), [activities]);
    const instructorMap = useMemo(() => new Map(instructors.map(i => [i.id, i.name])), [instructors]);
    const spaceColorMap = useMemo(() => new Map(spaces.map(s => [s.name, s.color || 'bg-gray-600'])), [spaces]);

    const handlePrev = () => {
        setCurrentDate(prevDate => {
            const newDate = new Date(prevDate);
            if (viewMode === 'month') newDate.setMonth(newDate.getMonth() - 1);
            else if (viewMode === 'week') newDate.setDate(newDate.getDate() - 7);
            else newDate.setDate(newDate.getDate() - 1);
            return newDate;
        });
    };

    const handleNext = () => {
        setCurrentDate(prevDate => {
            const newDate = new Date(prevDate);
            if (viewMode === 'month') newDate.setMonth(newDate.getMonth() + 1);
            else if (viewMode === 'week') newDate.setDate(newDate.getDate() + 7);
            else newDate.setDate(newDate.getDate() + 1);
            return newDate;
        });
    };

    const handleToday = () => setCurrentDate(new Date());

    const renderHeader = () => {
        const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
        let title = '';
        if (viewMode === 'month') {
            title = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
        } else if (viewMode === 'week') {
            const startOfWeek = new Date(currentDate);
            startOfWeek.setDate(startOfWeek.getDate() - (startOfWeek.getDay() + 6) % 7);
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(endOfWeek.getDate() + 6);
            title = `${startOfWeek.toLocaleDateString()} - ${endOfWeek.toLocaleDateString()}`;
        } else {
            title = currentDate.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        }

        return (
            <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 mb-6">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center">
                            <button onClick={handlePrev} className="p-2 rounded-full hover:bg-gray-700"><ChevronLeft size={20} /></button>
                            <h2 className="text-xl font-bold text-white text-center w-64">{title}</h2>
                            <button onClick={handleNext} className="p-2 rounded-full hover:bg-gray-700"><ChevronRight size={20} /></button>
                        </div>
                        <button onClick={handleToday} className="px-3 py-1 border border-gray-600 rounded-md text-sm hover:bg-gray-700">Hoy</button>
                    </div>
                    <div className="flex space-x-1 rounded-lg bg-gray-900 p-1">
                        <button onClick={() => setViewMode('day')} className={`px-3 py-1 text-sm font-medium rounded-md ${viewMode === 'day' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>Día</button>
                        <button onClick={() => setViewMode('week')} className={`px-3 py-1 text-sm font-medium rounded-md ${viewMode === 'week' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>Semana</button>
                        <button onClick={() => setViewMode('month')} className={`px-3 py-1 text-sm font-medium rounded-md ${viewMode === 'month' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>Mes</button>
                    </div>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-2 mt-4 pt-4 border-t border-gray-700">
                    {spaces.map(space => (
                        <div key={space.name} className="flex items-center gap-2 text-xs">
                            <span className={`w-3 h-3 rounded-full ${space.color}`}></span>
                            <span>{space.name}</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const renderMonthView = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);
        const daysInMonth = lastDayOfMonth.getDate();
        const startDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7; // Lunes = 0

        const days = Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1));
        const scheduleByDay = schedule.reduce((acc, item) => {
            const dayOfWeek = item.dayOfWeek.toLowerCase();
            days.forEach(dayDate => {
                if (dayDate.toLocaleDateString('es-ES', { weekday: 'long' }).toLowerCase() === dayOfWeek) {
                    const key = dayDate.toDateString();
                    if (!acc[key]) acc[key] = [];
                    acc[key].push(item);
                }
            });
            return acc;
        }, {});
        
        const daySlots = [];
        for (let i = 0; i < startDayOfWeek; i++) { daySlots.push(null); }
        for (let i = 1; i <= daysInMonth; i++) { daySlots.push(new Date(year, month, i)); }

        return (
             <div className="grid grid-cols-7 gap-1">
                {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map(day => <div key={day} className="text-center font-bold text-gray-400 pb-2">{day}</div>)}
                {daySlots.map((day, index) => (
                    <div key={index} className={`bg-gray-800 rounded-lg min-h-[120px] p-2 border ${day?.getMonth() !== month ? 'bg-gray-800/50' : 'border-gray-700'}`}>
                        {day && <span className={`text-sm ${day.toDateString() === new Date().toDateString() ? 'bg-blue-600 rounded-full px-2 text-white' : ''}`}>{day.getDate()}</span>}
                        <div className="space-y-1 mt-1">
                            {day && scheduleByDay[day.toDateString()]?.map(item => (
                                <div key={item.id} className={`p-1 rounded text-white text-xs ${spaceColorMap.get(item.space)}`}>
                                    <p className="font-semibold truncate">{activityMap.get(item.activityId)}</p>
                                    <p>{item.startTime}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        )
    };
    
    const renderWeekView = () => {
        const startOfWeek = new Date(currentDate);
        startOfWeek.setDate(startOfWeek.getDate() - (startOfWeek.getDay() + 6) % 7); // Start on Monday
        const weekDays = Array.from({ length: 7 }, (_, i) => {
            const day = new Date(startOfWeek);
            day.setDate(day.getDate() + i);
            return day;
        });

        const dayNames = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
        const scheduleByDay = schedule.reduce((acc, item) => {
            const dayName = item.dayOfWeek;
            if(!acc[dayName]) acc[dayName] = [];
            acc[dayName].push(item);
            return acc;
        }, {});

        return (
            <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
                {weekDays.map((day, index) => (
                    <div key={day.toISOString()} className="bg-gray-800 rounded-lg p-3">
                        <div className="text-center pb-2">
                            <p className="font-bold">{dayNames[index]}</p>
                             <p className={`text-sm ${day.toDateString() === new Date().toDateString() ? 'bg-blue-600 rounded-full w-8 h-8 flex items-center justify-center mx-auto text-white' : 'text-gray-400'}`}>{day.getDate()}</p>
                        </div>
                        <div className="space-y-2">
                            {(scheduleByDay[dayNames[index]] || []).sort((a,b) => a.startTime.localeCompare(b.startTime)).map(item => (
                                <div key={item.id} className={`p-2 rounded text-white text-sm ${spaceColorMap.get(item.space)}`}>
                                    <p className="font-bold">{activityMap.get(item.activityId)}</p>
                                    <p>{item.startTime} - {item.endTime}</p>
                                    <p className="text-xs opacity-80">{item.space}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        )
    };

    const renderDayView = () => {
        const dayName = currentDate.toLocaleDateString('es-ES', { weekday: 'long' });
        const daySchedule = schedule
            .filter(item => item.dayOfWeek.toLowerCase() === dayName.toLowerCase())
            .sort((a,b) => a.startTime.localeCompare(b.startTime));

        return (
             <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                 <h3 className="text-xl font-bold text-white mb-4">Agenda para el {currentDate.toLocaleDateString()}</h3>
                 <div className="space-y-3">
                    {daySchedule.length > 0 ? daySchedule.map(item => (
                         <div key={item.id} className={`flex items-center gap-4 p-3 rounded-lg ${spaceColorMap.get(item.space)}`}>
                            <div className="font-mono text-lg w-24">{item.startTime}</div>
                            <div className="flex-grow">
                                <p className="font-bold">{activityMap.get(item.activityId)}</p>
                                <p className="text-sm opacity-90">{instructorMap.get(item.instructorId)}</p>
                            </div>
                            <div className="text-sm w-32 text-right">{item.space}</div>
                         </div>
                    )) : <p className="text-gray-400">No hay clases programadas para hoy.</p>}
                 </div>
             </div>
        )
    };
    
    return (
        <div className="w-full">
            {renderHeader()}
            {viewMode === 'month' && renderMonthView()}
            {viewMode === 'week' && renderWeekView()}
            {viewMode === 'day' && renderDayView()}
        </div>
    );
};


const ScheduleModule = ({ db, currentClub, schedule, setSchedule, activities, instructors, spaces }) => {
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [currentScheduleData, setCurrentScheduleData] = useState(null);
    const [scheduleToDelete, setScheduleToDelete] = useState(null);
    
    const activityMap = useMemo(() => new Map(activities.map(a => [a.id, a.name])), [activities]);
    const instructorMap = useMemo(() => new Map(instructors.map(i => [i.id, `${i.firstName} ${i.lastName}`])), [instructors]);

    const handleOpenFormModal = (item = null) => {
        setCurrentScheduleData(item || { activityId: '', instructorId: '', space: '', dayOfWeek: '', startTime: '', endTime: '', maxCapacity: 10 });
        setIsFormModalOpen(true);
    };
    const handleCloseFormModal = () => setIsFormModalOpen(false);

    const handleOpenConfirmModal = (id) => {
        setScheduleToDelete(id);
        setIsConfirmModalOpen(true);
    };
    const handleCloseConfirmModal = () => setIsConfirmModalOpen(false);

    const handleSaveSchedule = async (scheduleData) => {
        if (!db || !currentClub?.id) return;
        
        const allSchedulesForInstructor = schedule.filter(s => s.instructorId === scheduleData.instructorId && s.id !== scheduleData.id);
        
        const newStartTime = scheduleData.startTime;
        const newEndTime = scheduleData.endTime;
        const newDay = scheduleData.dayOfWeek;

        const hasConflict = allSchedulesForInstructor.some(s => {
            if (s.dayOfWeek !== newDay) return false;
            const existingStartTime = s.startTime;
            const existingEndTime = s.endTime;
            return newStartTime < existingEndTime && newEndTime > existingStartTime;
        });

        if (hasConflict) {
            alert("Conflicto de horario. El instructor ya tiene una clase programada en ese día y rango de tiempo.");
            return;
        }

        const schedulePath = `artifacts/${appId}/public/data/schedule`;
        const { id, ...dataToSave } = scheduleData;
        dataToSave.clubId = currentClub.id;

        try {
            if (id) {
                await updateDoc(doc(db, schedulePath, id), dataToSave);
            } else {
                dataToSave.status = 'Pendiente'; 
                dataToSave.enrolledMembers = [];
                await addDoc(collection(db, schedulePath), dataToSave);
            }
            handleCloseFormModal();
        } catch (error) { console.error("Error al guardar la clase:", error); }
    };

    const handleConfirmDelete = async () => {
        if (!db || !scheduleToDelete) return;
        await deleteDoc(doc(db, `artifacts/${appId}/public/data/schedule`, scheduleToDelete));
        handleCloseConfirmModal();
    };
    
    const StatusIcon = ({ status, comment }) => {
        const title = comment ? `${status} - Comentario: ${comment}` : status;
        switch (status) {
            case 'Aceptada': return <CheckCircle size={16} className="text-green-400" title={title}/>;
            case 'Rechazada': return <XCircle size={16} className="text-red-400" title={title}/>;
            case 'Sugerencia': return <MessageSquare size={16} className="text-blue-400" title={title}/>;
            case 'Pendiente':
            default: return <Clock size={16} className="text-yellow-400" title={title}/>;
        }
    };

    return (
        <>
            <ScheduleFormModal isOpen={isFormModalOpen} onClose={handleCloseFormModal} onSave={handleSaveSchedule} scheduleData={currentScheduleData} setScheduleData={setCurrentScheduleData} activities={activities} instructors={instructors} spaces={spaces} />
            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={handleCloseConfirmModal}
                onConfirm={handleConfirmDelete}
                title="Confirmar Eliminación"
                message="¿Estás seguro de que quieres eliminar esta clase del horario?"
            />
            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-white">Horario de Clases</h2>
                    <button onClick={() => handleOpenFormModal()} className="flex items-center px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700">
                        <Plus size={18} className="mr-2" />
                        Programar Clase
                    </button>
                </div>
                 <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-700"><tr><th className="p-3">Actividad</th><th className="p-3">Instructor</th><th className="p-3">Día y Hora</th><th className="p-3">Lugar</th><th className="p-3">Cupo</th><th className="p-3">Estado</th><th className="p-3">Acciones</th></tr></thead>
                        <tbody>
                            {schedule.map(item => (
                                <tr key={item.id} className="border-b border-gray-700">
                                    <td className="p-3 flex items-center gap-2">
                                        <ActivityIcon name={activities.find(a=>a.id===item.activityId)?.icon} />
                                        {activityMap.get(item.activityId) || 'N/A'}
                                    </td>
                                    <td className="p-3">{instructorMap.get(item.instructorId) || 'N/A'}</td>
                                    <td className="p-3">{item.dayOfWeek}, {item.startTime} - {item.endTime}</td>
                                    <td className="p-3">{item.space}</td>
                                    <td className="p-3">{item.enrolledMembers?.length || 0} / {item.maxCapacity}</td>
                                    <td className="p-3"><StatusIcon status={item.status} comment={item.rejectionComment} /></td>
                                    <td className="p-3 flex space-x-2">
                                        <button onClick={() => handleOpenFormModal(item)} className="p-1 text-gray-400 hover:text-white"><Edit size={16} /></button>
                                        <button onClick={() => handleOpenConfirmModal(item.id)} className="p-1 text-gray-400 hover:text-red-400"><Trash2 size={16} /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
};

const ActivitiesModuleFull = ({ db, currentClub, activities, spaces }) => {
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [currentActivityData, setCurrentActivityData] = useState(null);
    const [activityToDelete, setActivityToDelete] = useState(null);

    const handleOpenFormModal = (activity = null) => {
        setCurrentActivityData(activity || { name: '', description: '', allowedSpaces: [], icon: 'Dumbbell' });
        setIsFormModalOpen(true);
    };
    const handleCloseFormModal = () => setIsFormModalOpen(false);

    const handleOpenConfirmModal = (activityId) => {
        setActivityToDelete(activityId);
        setIsConfirmModalOpen(true);
    };
    const handleCloseConfirmModal = () => setIsConfirmModalOpen(false);

    const handleSaveActivity = async (activityData) => {
        if (!db || !currentClub?.id) return;
        const activitiesPath = `artifacts/${appId}/public/data/activities`;
        const { id, ...dataToSave } = activityData;
        dataToSave.clubId = currentClub.id;

        try {
            if (id) {
                await updateDoc(doc(db, activitiesPath, id), dataToSave);
            } else {
                await addDoc(collection(db, activitiesPath), dataToSave);
            }
            handleCloseFormModal();
        } catch (error) {
            console.error("Error al guardar la actividad:", error);
        }
    };

    const handleConfirmDelete = async () => {
        if (!db || !activityToDelete) return;
        const activityRef = doc(db, `artifacts/${appId}/public/data/activities`, activityToDelete);
        try {
            await deleteDoc(activityRef);
            handleCloseConfirmModal();
        } catch (error) {
            console.error("Error al eliminar la actividad:", error);
            handleCloseConfirmModal();
        }
    };

    return (
        <>
            <ActivityFormModal isOpen={isFormModalOpen} onClose={handleCloseFormModal} onSave={handleSaveActivity} activityData={currentActivityData} setActivityData={setCurrentActivityData} spaces={spaces}/>
            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={handleCloseConfirmModal}
                onConfirm={handleConfirmDelete}
                title="Confirmar Eliminación"
                message="¿Estás seguro de que quieres eliminar esta actividad?"
            />
            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-white">Actividades del Club</h2>
                    <button onClick={() => handleOpenFormModal()} className="flex items-center px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700">
                        <Plus size={18} className="mr-2" />
                        Añadir Actividad
                    </button>
                </div>
                <ul className="space-y-3">
                    {activities.length > 0 ? activities.map(act => (
                        <li key={act.id} className="bg-gray-700 p-4 rounded-lg flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <ActivityIcon name={act.icon} size={24} className="text-blue-400"/>
                                <div>
                                    <p className="font-bold">{act.name}</p>
                                    <p className="text-sm text-gray-400">{act.description}</p>
                                    <p className="text-xs text-gray-500 mt-1">Espacios: {act.allowedSpaces?.join(', ') || 'Todos'}</p>
                                </div>
                            </div>
                             <div className="flex space-x-2">
                                <button onClick={() => handleOpenFormModal(act)} className="p-1 text-gray-400 hover:text-white"><Edit size={16} /></button>
                                <button onClick={() => handleOpenConfirmModal(act.id)} className="p-1 text-gray-400 hover:text-red-400"><Trash2 size={16} /></button>
                            </div>
                        </li>
                    )) : <p className="text-gray-400">No hay actividades definidas.</p>}
                </ul>
            </div>
        </>
    );
};

const InstructorsModuleFull = ({ db, currentClub, instructors, activities, handleFileUpload }) => {
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [currentInstructorData, setCurrentInstructorData] = useState(null);
    const [instructorToDelete, setInstructorToDelete] = useState(null);

    const handleOpenFormModal = (instructor = null) => {
        if (instructor) {
            setCurrentInstructorData({...instructor, password: ''});
        } else {
            setCurrentInstructorData({ firstName: '', lastName: '', email: '', password: '', canScanQR: false, disciplines: [] });
        }
        setIsFormModalOpen(true);
    };

    const handleCloseFormModal = () => setIsFormModalOpen(false);

    const handleOpenConfirmModal = (instructor) => {
        setInstructorToDelete(instructor);
        setIsConfirmModalOpen(true);
    };

    const handleCloseConfirmModal = () => setInstructorToDelete(null);

    const handleSaveInstructor = async (instructorData) => {
        if (!db || !currentClub?.id) return;

        const batch = writeBatch(db);
        const { id, password, ...dataToSave } = instructorData;

        try {
            if (id) {
                // Editar instructor
                const instructorRef = doc(db, `artifacts/${appId}/public/data/instructors`, id);
                batch.update(instructorRef, dataToSave);

                // También buscamos y actualizamos su cuenta de usuario si cambia el email
                const originalInstructor = instructors.find(i => i.id === id);
                if (originalInstructor.email !== dataToSave.email) {
                    const usersQuery = query(collection(db, `artifacts/${appId}/public/data/club_users`), where("email", "==", originalInstructor.email), where("clubId", "==", currentClub.id));
                    const usersSnap = await getDocs(usersQuery);
                    if (!usersSnap.empty) {
                        const userRef = usersSnap.docs[0].ref;
                        const updateData = { email: dataToSave.email };
                        if (password) updateData.password = password;
                        batch.update(userRef, updateData);
                    }
                } else if(password) { // si no cambia email, pero si la pass
                    const usersQuery = query(collection(db, `artifacts/${appId}/public/data/club_users`), where("email", "==", dataToSave.email), where("clubId", "==", currentClub.id));
                    const usersSnap = await getDocs(usersQuery);
                    if (!usersSnap.empty) {
                         batch.update(usersSnap.docs[0].ref, { password });
                    }
                }

            } else {
                // Crear nuevo instructor
                const newInstructorRef = doc(collection(db, `artifacts/${appId}/public/data/instructors`));
                batch.set(newInstructorRef, dataToSave);

                const newUserRef = doc(collection(db, `artifacts/${appId}/public/data/club_users`));
                batch.set(newUserRef, { email: dataToSave.email, password, role: 'Instructor', clubId: currentClub.id, instructorId: newInstructorRef.id });
            }

            await batch.commit();
            handleCloseFormModal();
        } catch (error) {
            console.error("Error al guardar el instructor: ", error);
        }
    };

    const handleConfirmDelete = async () => {
        if (!db || !instructorToDelete) return;
        
        const batch = writeBatch(db);
        
        // Borrar de la colección de instructores
        const instructorRef = doc(db, `artifacts/${appId}/public/data/instructors`, instructorToDelete.id);
        batch.delete(instructorRef);

        // Borrar de la colección de usuarios
        const usersQuery = query(collection(db, `artifacts/${appId}/public/data/club_users`), where("email", "==", instructorToDelete.email), where("clubId", "==", currentClub.id));
        const usersSnap = await getDocs(usersQuery);
        if (!usersSnap.empty) {
            batch.delete(usersSnap.docs[0].ref);
        }

        try {
            await batch.commit();
            handleCloseConfirmModal();
        } catch(error) {
            console.error("Error al eliminar instructor: ", error);
            handleCloseConfirmModal();
        }
    };

    return (
        <>
            <InstructorFormModal
                isOpen={isFormModalOpen}
                onClose={handleCloseFormModal}
                onSave={handleSaveInstructor}
                instructorData={currentInstructorData}
                setInstructorData={setCurrentInstructorData}
                activities={activities}
                handleFileUpload={handleFileUpload}
            />
            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={handleCloseConfirmModal}
                onConfirm={handleConfirmDelete}
                title="Confirmar Eliminación"
                message={`¿Estás seguro de que quieres eliminar al instructor ${instructorToDelete?.firstName} ${instructorToDelete?.lastName}? Se borrará su perfil y su cuenta de acceso.`}
            />
            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-white">Instructores</h2>
                    <button onClick={() => handleOpenFormModal()} className="flex items-center px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700">
                        <UserPlus size={18} className="mr-2" />
                        Añadir Instructor
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-700">
                            <tr>
                                <th className="p-3 text-sm font-semibold text-gray-300">Nombre</th>
                                <th className="p-3 text-sm font-semibold text-gray-300">Email</th>
                                <th className="p-3 text-sm font-semibold text-gray-300">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {instructors.length > 0 ? instructors.map(inst => (
                                <tr key={inst.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                                    <td className="p-3 flex items-center gap-3">
                                        <img src={inst.photoURL || `https://ui-avatars.com/api/?name=${inst.firstName}+${inst.lastName}&background=A259FF&color=fff`} alt={`${inst.firstName} ${inst.lastName}`} className="w-10 h-10 rounded-full object-cover" />
                                        {inst.firstName} {inst.lastName}
                                    </td>
                                    <td className="p-3">{inst.email}</td>
                                    <td className="p-3 flex space-x-2">
                                        <button onClick={() => handleOpenFormModal(inst)} className="p-1 text-gray-400 hover:text-white"><Edit size={16} /></button>
                                        <button onClick={() => handleOpenConfirmModal(inst)} className="p-1 text-gray-400 hover:text-red-400"><Trash2 size={16} /></button>
                                    </td>
                                </tr>
                            )) : (
                                <tr><td colSpan="3" className="text-center p-6 text-gray-400">No hay instructores registrados.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
};

const UsersModule = ({ db, currentClub, onOpenInstructorModal }) => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [currentUserData, setCurrentUserData] = useState(null);
    const [userToDelete, setUserToDelete] = useState(null);

    useEffect(() => {
        if (!db || !currentClub?.id) { setLoading(false); return; }
        setLoading(true);
        const usersCollectionPath = `artifacts/${appId}/public/data/club_users`;
        const q = query(collection(db, usersCollectionPath), where("clubId", "==", currentClub.id)); // <-- CORREGIDO
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setUsers(usersData);
            setLoading(false);
        }, (err) => {
            console.error("Error al obtener usuarios: ", err);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [db, currentClub]);

    const handleOpenFormModal = (user = null) => {
        if (user) {
            setCurrentUserData(user);
        } else {
            setCurrentUserData({ email: '', password: '', role: 'Staff' });
        }
        setIsFormModalOpen(true);
    };

    const handleCloseFormModal = () => setIsFormModalOpen(false);

    const handleOpenConfirmModal = (userId) => {
        setUserToDelete(userId);
        setIsConfirmModalOpen(true);
    };

    const handleCloseConfirmModal = () => setIsConfirmModalOpen(false);

    const handleSaveUser = async (userData) => {
        if (!db || !currentClub?.id) return;
        
        if (userData.role === 'Instructor') {
            onOpenInstructorModal(userData); // Pasar datos al abrir
            handleCloseFormModal();
            return;
        }

        const { id, ...dataToSave } = userData;
        dataToSave.clubId = currentClub.id;

        try {
            if (id) {
                const userRef = doc(db, `artifacts/${appId}/public/data/club_users`, id);
                await updateDoc(userRef, dataToSave);
            } else {
                await addDoc(collection(db, `artifacts/${appId}/public/data/club_users`), dataToSave);
            }
            handleCloseFormModal();
        } catch (error) {
            console.error("Error al guardar el usuario: ", error);
        }
    };

    const handleConfirmDelete = async () => {
        if (!db || !userToDelete) return;
        
        const userRef = doc(db, `artifacts/${appId}/public/data/club_users`, userToDelete);
        try {
            await deleteDoc(userRef);
            handleCloseConfirmModal();
        } catch (error) {
            console.error("Error al eliminar el usuario: ", error);
            handleCloseConfirmModal();
        }
    };

    if (loading) return <div className="flex justify-center items-center p-8 text-white"><Loader2 className="animate-spin mr-2" /> Cargando usuarios...</div>;

    return (
        <>
            <UserFormModal 
                isOpen={isFormModalOpen}
                onClose={handleCloseFormModal}
                onSave={handleSaveUser}
                userData={currentUserData}
                setUserData={setCurrentUserData}
            />
            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={handleCloseConfirmModal}
                onConfirm={handleConfirmDelete}
                title="Confirmar Eliminación"
                message="¿Estás seguro de que quieres eliminar a este usuario? Esta acción no se puede deshacer."
            />
            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-white">Gestión de Usuarios</h2>
                    <button onClick={() => handleOpenFormModal()} className="flex items-center px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700">
                        <UserPlus size={18} className="mr-2" />
                        Añadir Usuario
                    </button>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-700">
                            <tr>
                                <th className="p-3 text-sm font-semibold text-gray-300">Email</th>
                                <th className="p-3 text-sm font-semibold text-gray-300">Rol</th>
                                <th className="p-3 text-sm font-semibold text-gray-300">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.length > 0 ? (
                                users.map(user => (
                                    <tr key={user.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                                        <td className="p-3">{user.email}</td>
                                        <td className="p-3">
                                            <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                                                user.role === 'Admin' ? 'bg-indigo-500/20 text-indigo-300' :
                                                user.role === 'Instructor' ? 'bg-purple-500/20 text-purple-300' :
                                                'bg-green-500/20 text-green-300'
                                            }`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="p-3 flex space-x-2">
                                            <button onClick={() => handleOpenFormModal(user)} className="p-1 text-gray-400 hover:text-white"><Edit size={16} /></button>
                                            <button onClick={() => handleOpenConfirmModal(user.id)} className="p-1 text-gray-400 hover:text-red-400"><Trash2 size={16} /></button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="3" className="text-center p-6 text-gray-400">
                                        No se encontraron usuarios para este club.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
};

const ClassesModule = ({ db, currentClub, config, handleFileUpload }) => {
    const [activeTab, setActiveTab] = useState('schedule');
    const [activities, setActivities] = useState([]);
    const [instructors, setInstructors] = useState([]);
    const [schedule, setSchedule] = useState([]);
    
    useEffect(() => {
        if (!db || !currentClub?.id) return;

        const activitiesPath = `artifacts/${appId}/public/data/activities`;
        const qAct = query(collection(db, activitiesPath), where("clubId", "==", currentClub.id));
        const unsubAct = onSnapshot(qAct, snap => setActivities(snap.docs.map(d => ({id:d.id, ...d.data()}))));
        
        const instructorsPath = `artifacts/${appId}/public/data/instructors`;
        const qInst = query(collection(db, instructorsPath), where("clubId", "==", currentClub.id));
        const unsubInst = onSnapshot(qInst, snap => setInstructors(snap.docs.map(d => ({id:d.id, ...d.data()}))));
        
        const schedulePath = `artifacts/${appId}/public/data/schedule`;
        const qSchedule = query(collection(db, schedulePath), where("clubId", "==", currentClub.id));
        const unsubSchedule = onSnapshot(qSchedule, snap => setSchedule(snap.docs.map(d => ({id: d.id, ...d.data()}))));


        return () => { unsubAct(); unsubInst(); unsubSchedule(); };
    }, [db, currentClub.id]);

    return (
        <div>
            <div className="flex space-x-1 rounded-lg bg-gray-800 p-1 mb-6">
                <button onClick={() => setActiveTab('schedule')} className={`w-full p-2 text-sm font-medium rounded-md ${activeTab === 'schedule' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>Horarios</button>
                <button onClick={() => setActiveTab('activities')} className={`w-full p-2 text-sm font-medium rounded-md ${activeTab === 'activities' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>Actividades</button>
                <button id="instructor-tab-button" onClick={() => setActiveTab('instructors')} className={`w-full p-2 text-sm font-medium rounded-md ${activeTab === 'instructors' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>Instructores</button>
            </div>
            {activeTab === 'schedule' && <ScheduleModule db={db} currentClub={currentClub} schedule={schedule} setSchedule={setSchedule} activities={activities} instructors={instructors} spaces={config.spaces || []} />}
            {activeTab === 'activities' && <ActivitiesModuleFull db={db} currentClub={currentClub} activities={activities} spaces={config.spaces || []} />}
            {activeTab === 'instructors' && <InstructorsModuleFull db={db} currentClub={currentClub} instructors={instructors} activities={activities} handleFileUpload={handleFileUpload} />}
        </div>
    )
};

const TalonarioPreview = React.forwardRef(({ talonarioConfig, clubConfig, receiptData }, ref) => {
    const { fields, title } = talonarioConfig;

    const renderField = (label, value) => (
        <div className="flex justify-between"><span className="text-gray-400">{label}:</span><span>{value}</span></div>
    );

    return (
        <div ref={ref} className="bg-gray-900 p-4 rounded-lg aspect-[9/16] w-full max-w-[280px] mx-auto flex flex-col text-white font-mono text-xs">
            {fields?.showLogo && (
                <div className="text-center mb-4">
                    {clubConfig.logoURL ? <img src={clubConfig.logoURL} alt="Logo" className="h-16 mx-auto mb-2" /> : <Building size={40} className="mx-auto" />}
                </div>
            )}
            {fields?.showNombreClub && <h4 className="font-bold text-lg text-center">{clubConfig.name}</h4>}
            <h5 className="font-bold text-md text-center text-blue-300 my-2">{title}</h5>

            <div className="border-y-2 border-dashed border-gray-500 py-4 my-2 space-y-2">
                {fields?.showNombreSocio && renderField("Socio", receiptData?.socioName || "JUAN PEREZ")}
                {fields?.showDni && renderField("DNI", receiptData?.dni || "12.345.678")}
                {fields?.showPlan && renderField("Plan", receiptData?.plan || "SOCIO PLENO")}
                {fields?.showFechaPago && renderField("Fecha Pago", receiptData?.paymentDate || new Date().toLocaleDateString())}
                {fields?.showVencimiento && renderField("Vencimiento", receiptData?.vencimiento || "10/" + (new Date().getMonth() + 2) + "/" + new Date().getFullYear())}
            </div>

            {fields?.showImporte && (
                <div className="flex-grow flex flex-col justify-center items-center my-4">
                    <p className="text-gray-400">IMPORTE</p>
                    <p className="text-4xl font-bold text-green-400">${(receiptData?.amount || 9999).toFixed(2)}</p>
                </div>
            )}

            <div className="border-t-2 border-dashed border-gray-500 pt-4 text-xs mt-auto">
                <p className="text-gray-400">Observaciones:</p>
                <p>{receiptData?.observaciones || talonarioConfig.observaciones}</p>
            </div>
        </div>
    );
});

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
            fields: {
                ...prev.fields,
                [field]: !prev.fields[field]
            }
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

const StorageUsageIndicator = ({ usageInBytes, limitInBytes }) => {
    const formatBytes = (bytes, decimals = 2) => {
        if (!bytes || bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    };

    const percentage = limitInBytes > 0 ? ((usageInBytes || 0) / limitInBytes) * 100 : 0;

    return (
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center"><HardDrive size={20} className="mr-2 text-blue-400" /> Almacenamiento</h3>
            <div className="space-y-2">
                <div className="w-full bg-gray-700 rounded-full h-2.5">
                    <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${Math.min(percentage, 100)}%` }}></div>
                </div>
                <div className="flex justify-between text-sm text-gray-400">
                    <span>{formatBytes(usageInBytes || 0)} de {formatBytes(limitInBytes)}</span>
                    <span>{percentage.toFixed(2)}%</span>
                </div>
            </div>
        </div>
    );
};


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
            const configToSave = { ...config, talonarios: config.talonarios || defaultTalonariosConfig, dashboardWidgets: config.dashboardWidgets || defaultDashboardConfig };
            await updateDoc(clubRef, { config: configToSave });
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
                ...prev.dashboardWidgets,
                [widget]: !prev.dashboardWidgets[widget]
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
                                 {isUploading ? <Loader2 className="animate-spin" /> : <Upload size={16} className="mr-2" />}
                                 {isUploading ? 'Subiendo...' : "Confirmar Logo"}
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

const MemberDashboard = ({ db, currentClub, currentMember, onLogout }) => {
    const [dues, setDues] = useState([]);
    const [payments, setPayments] = useState([]);
    const [schedule, setSchedule] = useState([]);
    const [activities, setActivities] = useState([]);
    const [instructors, setInstructors] = useState([]);

    const activityMap = useMemo(() => new Map(activities.map(a => [a.id, a.name])), [activities]);
    const instructorMap = useMemo(() => new Map(instructors.map(i => [i.id, i.name])), [instructors]);
    
    const daysOrder = useMemo(() => ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"], []);
    const groupedSchedule = useMemo(() => {
        const grouped = schedule.reduce((acc, item) => {
            const day = item.dayOfWeek;
            if (!acc[day]) {
                acc[day] = [];
            }
            acc[day].push(item);
            return acc;
        }, {});
        return Object.keys(grouped).sort((a, b) => daysOrder.indexOf(a) - daysOrder.indexOf(b)).reduce((obj, key) => { 
            obj[key] = grouped[key]; 
            return obj; 
        }, {});
    }, [schedule, daysOrder]);


    const qrValue = useMemo(() => {
        return JSON.stringify({
            type: 'member',
            id: currentMember.id,
            clubId: currentClub.id,
            name: currentMember.name,
            dni: currentMember.dni,
            memberType: currentMember.memberType,
            accessKey: currentMember.password
        });
    }, [currentMember, currentClub]);

    useEffect(() => {
        if(!db || !currentMember || !currentClub) return;
        
        const paths = {
            dues: `artifacts/${appId}/public/data/dues`,
            payments: `artifacts/${appId}/public/data/payments`,
            schedule: `artifacts/${appId}/public/data/schedule`,
            activities: `artifacts/${appId}/public/data/activities`,
            instructors: `artifacts/${appId}/public/data/instructors`,
        };
        
        const qDues = query(collection(db, paths.dues), where("memberId", "==", currentMember.id));
        const qPayments = query(collection(db, paths.payments), where("memberId", "==", currentMember.id));
        const qSchedule = query(collection(db, paths.schedule), where("clubId", "==", currentClub.id));
        const qActivities = query(collection(db, paths.activities), where("clubId", "==", currentClub.id));
        const qInstructors = query(collection(db, paths.instructors), where("clubId", "==", currentClub.id));

        const unsubs = [
            onSnapshot(qDues, snap => setDues(snap.docs.map(d => ({id: d.id, ...d.data()})))),
            onSnapshot(qPayments, snap => setPayments(snap.docs.map(d => ({id: d.id, ...d.data()})))),
            onSnapshot(qSchedule, snap => setSchedule(snap.docs.map(d => ({id: d.id, ...d.data()})))),
            onSnapshot(qActivities, snap => setActivities(snap.docs.map(d => ({id: d.id, ...d.data()})))),
            onSnapshot(qInstructors, snap => setInstructors(snap.docs.map(d => ({id: d.id, ...d.data()})))),
        ];
        
        return () => unsubs.forEach(unsub => unsub());
    }, [db, currentMember, currentClub]);

    return (
        <div className="w-full">
             <header className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-white">Hola, {currentMember.name}</h1>
                    <p className="text-gray-400">Bienvenido a tu portal de socio en {currentClub.name}</p>
                </div>
                <button onClick={onLogout} className="text-sm text-gray-400 hover:text-white flex items-center"><LogOut size={16} className="mr-1" />Salir</button>
            </header>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                         <h3 className="text-xl font-bold text-white mb-4">Tu Carnet Digital</h3>
                         <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-6 rounded-lg text-white shadow-lg">
                            <div className="flex justify-between items-center mb-4">
                               {currentClub.config?.logoURL ? <img src={currentClub.config.logoURL} alt="Logo" className="h-10"/> : <Building size={24}/>}
                               <p className="font-bold text-lg">{currentClub.name}</p>
                            </div>
                            <p className="text-sm">Socio</p>
                            <p className="text-2xl font-semibold">{currentMember.name}</p>
                            <p className="text-sm mt-2">{currentMember.memberType} (DNI: {currentMember.dni})</p>
                            <div className="mt-4 p-4 bg-white rounded-lg flex justify-center">
                                <QRCode value={qrValue} size={128} />
                            </div>
                         </div>
                    </div>
                    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                        <h3 className="text-xl font-bold text-white mb-4">Cuotas Pendientes</h3>
                        <table className="w-full text-left">
                            <tbody>
                                {dues.filter(d=> d.status === 'Pendiente').map(due => (
                                     <tr key={due.id} className="border-b border-gray-700 last:border-b-0">
                                        <td className="p-2">{due.period}</td>
                                        <td className="p-2">${due.amount}</td>
                                        <td className="p-2"><button onClick={() => alert("Pasarela de pago no implementada.")} className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700">Pagar Online</button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                         {dues.filter(d=> d.status === 'Pendiente').length === 0 && <p className="text-gray-400">¡Estás al día con tus cuotas!</p>}
                    </div>
                </div>
                 <div className="lg:col-span-2 space-y-6">
                     <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                        <h3 className="text-xl font-bold text-white mb-4">Horario de Clases</h3>
                        <div className="space-y-4 max-h-96 overflow-y-auto">
                            {Object.keys(groupedSchedule).map(day => (
                                <div key={day}>
                                    <h4 className="font-bold text-lg text-blue-300 mb-2">{day}</h4>
                                    <ul className="space-y-2">
                                    {groupedSchedule[day].map(item => (
                                        <li key={item.id} className="bg-gray-700/50 p-3 rounded-md">
                                            <p className="font-semibold">{activityMap.get(item.activityId)}</p>
                                            <p className="text-sm text-gray-400">{item.startTime} - {item.endTime} en {item.space}</p>
                                            <p className="text-sm text-gray-400">Prof: {instructorMap.get(item.instructorId)}</p>
                                        </li>
                                    ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </div>
                     <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                        <h3 className="text-xl font-bold text-white mb-4">Últimos Pagos</h3>
                         <table className="w-full text-left">
                             <thead className="bg-gray-700"><tr><th className="p-2">Período</th><th className="p-2">Monto</th><th className="p-2">Fecha</th><th className="p-2">Comprobante</th></tr></thead>
                            <tbody>
                                {payments.map(p => (
                                     <tr key={p.id} className="border-b border-gray-700 last:border-b-0">
                                        <td className="p-2">{p.period}</td>
                                        <td className="p-2">${p.amount}</td>
                                        <td className="p-2">{p.date?.toDate().toLocaleDateString()}</td>
                                         <td className="p-2">
                                            {p.proofUrl ? 
                                                <a href={p.proofUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline flex items-center gap-1">
                                                    Ver <ExternalLink size={14}/>
                                                </a> : '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}

const InstructorDashboard = ({ db, currentClub, currentInstructor, onLogout, members }) => {
    const [mySchedule, setMySchedule] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [scanResult, setScanResult] = useState("");
    const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
    const [isSuggestionModalOpen, setIsSuggestionModalOpen] = useState(false);
    const [isEnrolledListModalOpen, setIsEnrolledListModalOpen] = useState(false);
    const [classToUpdate, setClassToUpdate] = useState(null);

    const handleScanSuccess = async (text) => {
        setIsScannerOpen(false);
        setScanResult(`Datos escaneados: ${text}`);
    };

    const handleUpdateClassStatus = async (classId, newStatus, comment = "") => {
        const classRef = doc(db, `artifacts/${appId}/public/data/schedule`, classId);
        await updateDoc(classRef, {
            status: newStatus,
            rejectionComment: comment
        });
        if(isRejectionModalOpen) setIsRejectionModalOpen(false);
        if(isSuggestionModalOpen) setIsSuggestionModalOpen(false);
    };

    const openRejectionModal = (classItem) => {
        setClassToUpdate(classItem);
        setIsRejectionModalOpen(true);
    };

    const openSuggestionModal = (classItem) => {
        setClassToUpdate(classItem);
        setIsSuggestionModalOpen(true);
    };

    const openEnrolledListModal = (classItem) => {
        setClassToUpdate(classItem);
        setIsEnrolledListModalOpen(true);
    }
    
    const enrolledMembersForClass = useMemo(() => {
        if (!classToUpdate || !classToUpdate.enrolledMembers || !members) return [];
        return members.filter(member => classToUpdate.enrolledMembers.includes(member.id));
    }, [classToUpdate, members]);

    useEffect(() => {
        if(scanResult) {
            const timer = setTimeout(() => setScanResult(""), 5000);
            return () => clearTimeout(timer);
        }
    }, [scanResult])

    useEffect(() => {
        if (!db || !currentInstructor) return;
        const scheduleQuery = query(
            collection(db, `artifacts/${appId}/public/data/schedule`),
            where("clubId", "==", currentClub.id),
            where("instructorId", "==", currentInstructor.id)
        );

        const unsub = onSnapshot(scheduleQuery, async (snap) => {
            const scheduleItems = snap.docs.map(d => ({id: d.id, ...d.data()}));

            const activityIds = [...new Set(scheduleItems.map(item => item.activityId))];
            if (activityIds.length > 0) {
                const activitiesQuery = query(collection(db, `artifacts/${appId}/public/data/activities`), where("__name__", "in", activityIds));
                const activitiesSnap = await getDocs(activitiesQuery);
                const activitiesData = new Map(activitiesSnap.docs.map(d => [d.id, d.data().name]));

                const populatedSchedule = scheduleItems.map(item => ({
                    ...item,
                    activityName: activitiesData.get(item.activityId) || 'Actividad Desconocida'
                }));
                setMySchedule(populatedSchedule);
            } else {
                 setMySchedule([]);
            }
            setLoading(false);
        });

        return () => unsub();
    }, [db, currentInstructor, currentClub]);

    return (
        <>
            <QRScannerModal isOpen={isScannerOpen} onClose={() => setIsScannerOpen(false)} onScanSuccess={handleScanSuccess} />
            <RejectionModal 
                isOpen={isRejectionModalOpen}
                onClose={() => setIsRejectionModalOpen(false)}
                onConfirm={(comment) => handleUpdateClassStatus(classToUpdate.id, 'Rechazada', comment)}
            />
            <RejectionModal 
                isOpen={isSuggestionModalOpen}
                onClose={() => setIsSuggestionModalOpen(false)}
                onConfirm={(comment) => handleUpdateClassStatus(classToUpdate.id, 'Sugerencia', comment)}
                title="Sugerir Modificación"
                placeholder="Ej: Sugiero cambiar el horario a las 19:00."
            />
            <EnrolledListModal 
                isOpen={isEnrolledListModalOpen}
                onClose={() => setIsEnrolledListModalOpen(false)}
                members={enrolledMembersForClass}
                title={`Inscriptos en ${classToUpdate?.activityName}`}
            />

            <div className="w-full">
                <header className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Hola, {currentInstructor.firstName}</h1>
                        <p className="text-gray-400">Bienvenido a tu portal de instructor en {currentClub.name}</p>
                    </div>
                    <div className="flex items-center gap-4">
                        {currentInstructor.canScanQR && (
                             <button onClick={() => setIsScannerOpen(true)} className="flex items-center px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700">
                                <QrCode size={18} className="mr-2" />
                                Tomar Asistencia
                            </button>
                        )}
                        <button onClick={() => alert("Ajustes no implementados.")} className="p-2 text-gray-400 hover:text-white"><Settings size={20}/></button>
                        <button onClick={onLogout} className="text-sm text-gray-400 hover:text-white flex items-center"><LogOut size={16} className="mr-1" />Salir</button>
                    </div>
                </header>
                 {scanResult && <div className={`p-3 rounded-md mb-4 bg-blue-500/20 text-blue-300`}>{scanResult}</div>}
                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                    <h3 className="text-xl font-bold text-white mb-4">Mis Clases</h3>
                    {loading ? <Loader2 className="animate-spin" /> :
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-700"><tr><th className="p-3">Actividad</th><th className="p-3">Día y Hora</th><th className="p-3">Cupo</th><th className="p-3">Estado</th><th className="p-3">Acciones</th></tr></thead>
                            <tbody>
                                {mySchedule.map(item => (
                                    <tr key={item.id} className="border-b border-gray-700">
                                        <td className="p-3">{item.activityName}</td>
                                        <td className="p-3">{item.dayOfWeek}, {item.startTime} - {item.endTime}</td>
                                        <td className="p-3">
                                            <button onClick={() => openEnrolledListModal(item)} className="hover:underline">{item.enrolledMembers?.length || 0} / {item.maxCapacity || '∞'}</button>
                                        </td>
                                        <td className="p-3">
                                            <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                                                item.status === 'Aceptada' ? 'bg-green-500/20 text-green-300' :
                                                item.status === 'Rechazada' ? 'bg-red-500/20 text-red-300' :
                                                item.status === 'Sugerencia' ? 'bg-blue-500/20 text-blue-300' :
                                                'bg-yellow-500/20 text-yellow-300'
                                            }`}>{item.status}</span>
                                        </td>
                                        <td className="p-3">
                                            {item.status === 'Pendiente' && (
                                                <div className="flex gap-2">
                                                    <button onClick={() => handleUpdateClassStatus(item.id, 'Aceptada')} className="p-2 text-green-400 hover:text-white" title="Aceptar"><ThumbsUp size={16}/></button>
                                                    <button onClick={() => openRejectionModal(item)} className="p-2 text-red-400 hover:text-white" title="Rechazar"><ThumbsDown size={16}/></button>
                                                    <button onClick={() => openSuggestionModal(item)} className="p-2 text-blue-400 hover:text-white" title="Sugerir Modificación"><MessageSquare size={16}/></button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    }
                </div>
            </div>
        </>
    )
};


const ClubDashboard = ({ db, storage, currentClub, config, setConfig, currentUser, onLogout }) => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [members, setMembers] = useState([]);
    const [payments, setPayments] = useState([]);
    const [dues, setDues] = useState([]);
    const [schedule, setSchedule] = useState([]);
    const [activities, setActivities] = useState([]);
    const [instructors, setInstructors] = useState([]);
    const [isInstructorModalOpen, setIsInstructorModalOpen] = useState(false);
    const [currentInstructorData, setCurrentInstructorData] = useState(null);

    const handleOpenInstructorModal = (data = null) => {
        if (data && data.id) { // Editing existing instructor
            setCurrentInstructorData({...data, password: ''});
        } else { // Creating new one
            setCurrentInstructorData({ 
                firstName: '', lastName: '', 
                email: data?.email || '', 
                password: data?.password || '', 
                canScanQR: false, disciplines: [] 
            });
        }
        setActiveTab('clases'); // Go to classes to edit
        // A bit of a hack to make sure the sub-tab is correct
        setTimeout(() => {
            const btn = document.querySelector('#instructor-tab-button');
            if (btn) btn.click();
            setIsInstructorModalOpen(true);
        }, 50);
    };

    const handleCloseInstructorModal = () => setIsInstructorModalOpen(false);

    const handleSaveInstructor = async (instructorData) => {
        if (!db || !currentClub?.id) return;

        const batch = writeBatch(db);
        const { id, password, ...dataToSave } = instructorData;
        const usersCollectionPath = `artifacts/${appId}/public/data/club_users`;
        const instructorsCollectionPath = `artifacts/${appId}/public/data/instructors`;

        try {
            if (id) {
                // Editar instructor
                const instructorRef = doc(db, instructorsCollectionPath, id);
                batch.update(instructorRef, dataToSave);
                 const originalInstructor = instructors.find(i => i.id === id);
                if (password || (originalInstructor.email !== dataToSave.email)) {
                    const usersQuery = query(collection(db, usersCollectionPath), where("instructorId", "==", id), where("clubId", "==", currentClub.id));
                    const usersSnap = await getDocs(usersQuery);
                    if (!usersSnap.empty) {
                        const userRef = usersSnap.docs[0].ref;
                        const updateData = { email: dataToSave.email };
                        if (password) updateData.password = password;
                        batch.update(userRef, updateData);
                    }
                }

            } else {
                // Crear nuevo instructor
                const newInstructorRef = doc(collection(db, instructorsCollectionPath));
                batch.set(newInstructorRef, dataToSave);

                const newUserRef = doc(collection(db, usersCollectionPath));
                batch.set(newUserRef, { 
                    email: dataToSave.email, 
                    password, 
                    role: 'Instructor', 
                    clubId: currentClub.id, 
                    instructorId: newInstructorRef.id 
                });
            }

            await batch.commit();
            handleCloseInstructorModal();
        } catch (error) {
            console.error("Error al guardar el instructor: ", error);
        }
    };
    
    useEffect(() => { 
        if (!db || !currentClub) return;
        
        const unsubs = [];
        const collectionsToFetch = {
            members: `artifacts/${appId}/public/data/members`,
            payments: `artifacts/${appId}/public/data/payments`,
            dues: `artifacts/${appId}/public/data/dues`,
            schedule: `artifacts/${appId}/public/data/schedule`,
            activities: `artifacts/${appId}/public/data/activities`,
            instructors: `artifacts/${appId}/public/data/instructors`,
        };

        Object.entries(collectionsToFetch).forEach(([key, path]) => {
            const q = query(collection(db, path), where("clubId", "==", currentClub.id));
            const unsub = onSnapshot(q, snap => {
                const data = snap.docs.map(d => ({id: d.id, ...d.data()}));
                switch(key) {
                    case 'members': setMembers(data); break;
                    case 'payments': setPayments(data); break;
                    case 'dues': setDues(data); break;
                    case 'schedule': setSchedule(data); break;
                    case 'activities': setActivities(data); break;
                    case 'instructors': setInstructors(data); break;
                    default: break;
                }
            }, (error) => console.error(`Error fetching ${key}:`, error));
            unsubs.push(unsub);
        });

        return () => unsubs.forEach(unsub => unsub());
     }, [db, currentClub]);

    const handleFileUpload = async (file, pathPrefix) => {
        if (!storage || !db || !currentClub) return null;

        const currentUsage = config.totalStorageUsedInBytes || 0;
        if (currentUsage + file.size > STORAGE_LIMIT_BYTES) {
            alert("Límite de almacenamiento excedido. No se pueden subir más archivos. Por favor, contacte a su ejecutivo de ventas para ampliar su plan.");
            return null;
        }

        const storageRef = ref(storage, `${currentClub.id}/${pathPrefix}/${Date.now()}_${file.name}`);
        const metadata = {
            contentType: file.type
        };

        try {
            const uploadResult = await uploadBytes(storageRef, file, metadata);
            const downloadURL = await getDownloadURL(uploadResult.ref);

            const clubRef = doc(db, `artifacts/${appId}/public/data/clubs`, currentClub.id);
            await updateDoc(clubRef, {
                'config.totalStorageUsedInBytes': increment(file.size)
            });

            return downloadURL;
        } catch (error) {
            console.error("Error al subir archivo: ", error);
            alert("Error al subir archivo.");
            return null;
        }
    };


    const tabs = [
        { id: 'dashboard', label: 'Dashboard', icon: BarChart2 },
        { id: 'agenda', label: 'Agenda', icon: Calendar },
        { id: 'mensajes', label: 'Mensajes', icon: MailIcon },
    ];
    if (currentUser.role === 'Admin' || currentUser.role === 'Staff') {
         tabs.push({ id: 'asistencia', label: 'Asistencia', icon: ScanLine });
         tabs.push({ id: 'socios', label: 'Socios', icon: Users });
         tabs.push({ id: 'clases', label: 'Clases', icon: Dumbbell });
         tabs.push({ id: 'pagos', label: 'Cuotas y Pagos', icon: DollarSign });
         tabs.push({ id: 'noticias', label: 'Noticias', icon: Newspaper });
    }
    if (currentUser.role === 'Admin') {
         tabs.push({ id: 'informes', label: 'Informes', icon: FileText });
         tabs.push({ id: 'config', label: 'Configuración', icon: Settings });
         tabs.push({ id: 'usuarios', label: 'Usuarios', icon: Users });
    }
    
    return (
         <div className="w-full flex flex-col min-h-screen"> 
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                 <div>
                    <h1 className="text-3xl font-bold text-white flex items-center">
                        {config.logoURL ? <img src={config.logoURL} alt="Logo" className="h-10 mr-3"/> : <Building size={32} className="mr-3 text-blue-400"/>}
                        {currentClub.name}
                    </h1>
                    <p className="text-gray-400 mt-1">Sesión iniciada como: {currentUser.email} ({currentUser.role})</p>
                 </div>
                 <button onClick={onLogout} className="text-sm text-gray-400 hover:text-white flex items-center"><ArrowLeft size={16} className="mr-1" />Salir</button>
            </header>
            <div className="mb-6 border-b border-gray-700"><nav className="-mb-px flex space-x-4 overflow-x-auto"> {tabs.map(tab => (<button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center space-x-2 px-3 py-2 font-medium text-sm rounded-t-lg transition-colors whitespace-nowrap ${activeTab === tab.id ? 'border-b-2 border-blue-500 text-white' : 'text-gray-400 hover:text-white hover:border-gray-500'}`}><tab.icon size={16} /><span>{tab.label}</span></button>))} </nav></div>
            <main className="mt-4 flex-grow">
                {activeTab === 'dashboard' && <DashboardModule members={members} payments={payments} dues={dues} activities={activities} config={config} />}
                {activeTab === 'agenda' && <SpaceAgendaModule schedule={schedule} spaces={config.spaces || []} activities={activities} instructors={instructors} />}
                {activeTab === 'asistencia' && <AttendanceModule db={db} currentClub={currentClub} members={members} />}
                {activeTab === 'socios' && <MembersModule db={db} currentClub={currentClub} members={members} config={config} activities={activities} handleFileUpload={handleFileUpload} />}
                {activeTab === 'clases' && <ClassesModule db={db} currentClub={currentClub} config={config} handleFileUpload={handleFileUpload}/>}
                {activeTab === 'pagos' && <PaymentsModule db={db} currentClub={currentClub} members={members} config={config} dues={dues} payments={payments} handleFileUpload={handleFileUpload} />}
                {activeTab === 'noticias' && <NewsModule db={db} currentClub={currentClub} handleFileUpload={handleFileUpload} />}
                {activeTab === 'mensajes' && <MessagingModule db={db} currentClub={currentClub} currentUser={currentUser} allUsers={[...members, ...instructors]} handleFileUpload={handleFileUpload} />}
                {activeTab === 'informes' && <ReportsModule members={members} payments={payments} dues={dues} />}
                {activeTab === 'config' && <ConfigModule db={db} currentClub={currentClub} config={config} setConfig={setConfig} handleFileUpload={handleFileUpload} />}
                {activeTab === 'usuarios' && <UsersModule db={db} currentClub={currentClub} onOpenInstructorModal={handleOpenInstructorModal} />}
            </main>
            <InstructorFormModal
                isOpen={isInstructorModalOpen}
                onClose={handleCloseInstructorModal}
                onSave={handleSaveInstructor}
                instructorData={currentInstructorData}
                setInstructorData={setCurrentInstructorData}
                activities={activities}
                handleFileUpload={handleFileUpload}
            />
         </div>
    );
};


// --- COMPONENTE PRINCIPAL ---
export default function App() {
    const [db, setDb] = useState(null);
    const [storage, setStorage] = useState(null);
    const [isInitialSetupComplete, setIsInitialSetupComplete] = useState(false);
    
    // Estados de la Sesión
    const [portalMode, setPortalMode] = useState(null); 
    const [currentClub, setCurrentClub] = useState(null);
    const [loginError, setLoginError] = useState("");
    
    // Estados del Portal de Admin
    const [adminView, setAdminView] = useState('clubLogin');
    const [currentAdmin, setCurrentAdmin] = useState(null);
    const [clubConfig, setClubConfig] = useState(null);

    // Estados del Portal de Socios
    const [memberView, setMemberView] = useState('clubLogin');
    const [currentMember, setCurrentMember] = useState(null);
    
    // Estados del Portal de Instructor
    const [currentInstructor, setCurrentInstructor] = useState(null);

    const inactivityTimer = useRef(null);

    const handleLogout = useCallback(() => {
        setPortalMode(null);
        setAdminView('clubLogin');
        setMemberView('clubLogin');
        setCurrentClub(null);
        setCurrentAdmin(null);
        setCurrentMember(null);
        setCurrentInstructor(null);
        setLoginError("");
        localStorage.removeItem('tcc_session');
        if (inactivityTimer.current) {
            clearTimeout(inactivityTimer.current);
        }
    }, []);

    const resetInactivityTimer = useCallback(() => {
        if (inactivityTimer.current) {
            clearTimeout(inactivityTimer.current);
        }
        inactivityTimer.current = setTimeout(() => {
            alert("Tu sesión ha expirado por inactividad.");
            handleLogout();
        }, INACTIVITY_TIMEOUT_MS);
    }, [handleLogout]);

    useEffect(() => {
        const events = ['mousemove', 'keydown', 'scroll', 'click'];
        
        const resetTimer = () => {
            if (localStorage.getItem('tcc_session')) {
                resetInactivityTimer();
            }
        };

        events.forEach(event => window.addEventListener(event, resetTimer));

        return () => {
            events.forEach(event => window.removeEventListener(event, resetTimer));
            if (inactivityTimer.current) {
                clearTimeout(inactivityTimer.current);
            }
        };
    }, [resetInactivityTimer]);


    const saveSession = (sessionData) => {
        localStorage.setItem('tcc_session', JSON.stringify(sessionData));
        resetInactivityTimer();
    };
    
    const resetDemoData = useCallback(async (dbInstance) => {
        if (!dbInstance) { return; }
        console.log("Iniciando reinicio de datos DEMO...");
        const batch = writeBatch(dbInstance);

        const collectionsToClean = ['club_users', 'activities', 'instructors', 'news', 'schedule', 'members', 'dues', 'payments', 'attendance'];
        for (const coll of collectionsToClean) {
            const path = `artifacts/${appId}/public/data/${coll}`;
            const q = query(collection(dbInstance, path), where("clubId", "==", "DEMO"));
            const snapshot = await getDocs(q);
            snapshot.forEach(doc => batch.delete(doc.ref));
        }
        
        const clubRef = doc(dbInstance, `artifacts/${appId}/public/data/clubs`, 'DEMO');
        batch.delete(clubRef);

        try {
            await batch.commit();
            console.log("Datos DEMO previos borrados exitosamente.");
        } catch (error) {
            console.error("Error al borrar datos previos de DEMO:", error);
        }
        
        console.log("Creando nuevos datos para DEMO...");
        const createBatch = writeBatch(dbInstance);
        
        const newClubRef = doc(dbInstance, `artifacts/${appId}/public/data/clubs`, 'DEMO');
        const defaultConfig = { 
            spaces: [
                { name: "Salón Principal", color: "bg-blue-500" }, 
                { name: "Cancha 1", color: "bg-green-500" }, 
                { name: "Pileta", color: "bg-sky-500" }
            ], 
            fees: { 'Socio Pleno': 7500, 'Socio Cadete': 4500, 'Socio Demo': 5000 },
            talonarios: defaultTalonariosConfig,
            dashboardWidgets: defaultDashboardConfig,
            totalStorageUsedInBytes: 0
        };
        createBatch.set(newClubRef, { name: "Club DEMO", config: defaultConfig });
        
        const usersPath = `artifacts/${appId}/public/data/club_users`;
        createBatch.set(doc(collection(dbInstance, usersPath)), { clubId: 'DEMO', email: 'admin@demo.com', password: 'demo', role: 'Admin' });
        createBatch.set(doc(collection(dbInstance, usersPath)), { clubId: 'DEMO', email: 'usuario@demo.com', password: 'demo', role: 'Staff' });
        createBatch.set(doc(collection(dbInstance, usersPath)), { clubId: 'DEMO', email: 'instructor@demo.com', password: 'demo', role: 'Instructor' });
        
        const instructorsPath = `artifacts/${appId}/public/data/instructors`;
        createBatch.set(doc(collection(dbInstance, instructorsPath)), { clubId: 'DEMO', name: 'Instructor Demo', email: 'instructor@demo.com', canScanQR: true });

        const membersPath = `artifacts/${appId}/public/data/members`;
        createBatch.set(doc(collection(dbInstance, membersPath)), { clubId: 'DEMO', name: 'Ana García', email: 'ana.g@example.com', memberType: 'Socio Pleno', status: 'Activo', password: '123' });
        createBatch.set(doc(collection(dbInstance, membersPath)), { clubId: 'DEMO', name: 'Carlos Sanchez', email: 'carlos.s@example.com', memberType: 'Socio Cadete', status: 'Activo', password: '123' });
        createBatch.set(doc(collection(dbInstance, membersPath)), { clubId: 'DEMO', name: 'Socio Demo', email: 'socio@demo.com', memberType: 'Socio Demo', status: 'Activo', password: '123' });

        createBatch.set(doc(collection(dbInstance, `artifacts/${appId}/public/data/news`)), { clubId: 'DEMO', title: '¡Bienvenidos al nuevo sistema!', content: 'Estamos felices de lanzar nuestra nueva plataforma de gestión.', createdAt: serverTimestamp(), status: 'Publicado', imageUrl:'' });
        
        try {
            await createBatch.commit();
            console.log("Nuevos datos DEMO creados exitosamente.");
        } catch(e) {
            console.error("Error creando nuevos datos DEMO:", e);
        }
    }, []);
    
    const setupDemoClub = useCallback(async (db) => { 
        const demoClubRef = doc(db, `artifacts/${appId}/public/data/clubs`, 'DEMO');
        const demoClubSnap = await getDoc(demoClubRef);

        if (!demoClubSnap.exists()) {
            console.log("Creando datos de DEMO por primera vez...");
            await resetDemoData(db);
        }
    }, [resetDemoData]);
    
    useEffect(() => {
        let isInitialized = false;
        const init = async () => {
            if (isInitialized) return;
            isInitialized = true;
            try {
                const app = initializeApp(firebaseConfig);
                const firestoreDb = getFirestore(app);
                const firebaseAuth = getAuth(app);
                const firebaseStorage = getStorage(app);
                setDb(firestoreDb);
                setStorage(firebaseStorage);
                
                onAuthStateChanged(firebaseAuth, async (user) => {
                    if (!user) {
                       await signInAnonymously(firebaseAuth);
                    }
                });

                // Restaurar sesión desde localStorage
                const savedSession = localStorage.getItem('tcc_session');
                if (savedSession) {
                    const sessionData = JSON.parse(savedSession);
                    setPortalMode(sessionData.portalMode);
                    setCurrentClub(sessionData.currentClub);
                    setClubConfig(sessionData.clubConfig);
                    setCurrentAdmin(sessionData.currentAdmin);
                    setCurrentMember(sessionData.currentMember);
                    setCurrentInstructor(sessionData.currentInstructor);
                    if (sessionData.portalMode === 'admin') setAdminView('dashboard');
                    if (sessionData.portalMode === 'member') setMemberView('dashboard');
                    if (sessionData.portalMode === 'instructor') {
                        // No view state for instructor portal, it renders directly
                    }
                    resetInactivityTimer();
                }

                await setupDemoClub(firestoreDb);
                setIsInitialSetupComplete(true);
            } catch (error) {
                 console.error("Firebase initialization error", error);
                 setIsInitialSetupComplete(true);
            }
        };
        init().catch(console.error);
    }, [resetInactivityTimer, setupDemoClub]);

    const handleClubLogin = useCallback(async (clubId, forPortal) => {
        if (!db) return;
        setLoginError("");
        const clubRef = doc(db, `artifacts/${appId}/public/data/clubs`, clubId.toUpperCase());
        
        const unsub = onSnapshot(clubRef, (docSnap) => {
            if (docSnap.exists()) {
                const clubData = { id: docSnap.id, ...docSnap.data() };
                setCurrentClub(clubData);
                const currentConfig = clubData.config || {};
                const fullConfig = {
                    ...{ fees: {}, spaces: [], totalStorageUsedInBytes: 0 },
                    ...currentConfig,
                    talonarios: {
                        ...defaultTalonariosConfig,
                        ...(currentConfig.talonarios || {})
                    },
                    dashboardWidgets: {
                        ...defaultDashboardConfig,
                        ...(currentConfig.dashboardWidgets || {})
                    }
                };
                setClubConfig(fullConfig);

                if (forPortal === 'admin' && adminView === 'clubLogin') setAdminView('userLogin');
                if (forPortal === 'member' && memberView === 'clubLogin') setMemberView('userLogin');
            } else {
                setLoginError("Club no encontrado. Verifica el ID.");
            }
        });
        
    }, [db, adminView, memberView]);
    
    const handleAdminUserLogin = useCallback(async (email, password) => {
        if (!db || !currentClub) return; 
        setLoginError("");
        const q = query(collection(db, `artifacts/${appId}/public/data/club_users`), where("clubId", "==", currentClub.id), where("email", "==", email));
        const snapshot = await getDocs(q);
        if (snapshot.empty) { setLoginError("Usuario no encontrado."); return; }
        const userDoc = snapshot.docs[0];
        const userData = userDoc.data();

        if (userData.password === password) {
            let sessionData = { currentClub, clubConfig };
            if (userData.role === 'Instructor') {
                const instQuery = query(collection(db, `artifacts/${appId}/public/data/instructors`), where("email", "==", email), where("clubId", "==", currentClub.id));
                const instSnap = await getDocs(instQuery);
                if(!instSnap.empty) {
                    const instructorData = { id: instSnap.docs[0].id, ...instSnap.docs[0].data() };
                    setCurrentInstructor(instructorData);
                    setPortalMode('instructor');
                    saveSession({ ...sessionData, portalMode: 'instructor', currentInstructor: instructorData });
                } else {
                    setLoginError("Perfil de instructor no encontrado.");
                }
            } else {
                setCurrentAdmin({ id: userDoc.id, ...userData }); 
                setAdminView('dashboard');
                setPortalMode('admin');
                saveSession({ ...sessionData, portalMode: 'admin', currentAdmin: { id: userDoc.id, ...userData } });
            }
        } else {
            setLoginError("Contraseña incorrecta.");
        }
    }, [db, currentClub, clubConfig]);
    
    const handleMemberLogin = useCallback(async (email, password) => {
        if (!db || !currentClub) return;
        setLoginError("");
        const q = query(
            collection(db, `artifacts/${appId}/public/data/members`), 
            where("clubId", "==", currentClub.id), 
            where("email", "==", email),
            where("password", "==", password)
        );
        const snapshot = await getDocs(q);
        if (snapshot.empty) {
            setLoginError("Credenciales incorrectas o socio no encontrado.");
        } else {
            const memberData = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
            setCurrentMember(memberData);
            setMemberView('dashboard');
            setPortalMode('member');
            saveSession({ portalMode: 'member', currentMember: memberData, currentClub, clubConfig });
        }
    }, [db, currentClub, clubConfig]);

    const renderAdminPortal = () => {
        switch (adminView) {
            case 'clubLogin':
                return <ClubLoginScreen onClubLogin={(id) => handleClubLogin(id, 'admin')} error={loginError} onResetDemo={() => resetDemoData(db)} />;
            case 'userLogin':
                return <UserLoginScreen onUserLogin={handleAdminUserLogin} clubName={currentClub?.name} error={loginError} onBack={handleLogout} clubLogo={clubConfig?.logoURL}/>;
            case 'dashboard':
                return <ClubDashboard db={db} storage={storage} currentClub={currentClub} config={clubConfig} setConfig={setClubConfig} currentUser={currentAdmin} onLogout={handleLogout} />
            default:
                return <p className="text-white">Cargando...</p>;
        }
    }
    
    const renderMemberPortal = () => {
        switch (memberView) {
            case 'clubLogin':
                return <ClubLoginScreen onClubLogin={(id) => handleClubLogin(id, 'member')} error={loginError} forMember={true} />;
            case 'userLogin':
                return <MemberLoginScreen onMemberLogin={handleMemberLogin} clubName={currentClub?.name} error={loginError} onBack={handleLogout} clubLogo={clubConfig?.logoURL}/>;
            case 'dashboard':
                 return <MemberDashboard db={db} currentClub={currentClub} currentMember={currentMember} onLogout={handleLogout} />
            default:
                return <p className="text-white">Cargando...</p>;
        }
    }

    const InstructorPortal = () => {
        const [members, setMembers] = useState([]);
        useEffect(() => {
            if(!db || !currentClub) return;
            const q = query(collection(db, `artifacts/${appId}/public/data/members`), where("clubId", "==", currentClub.id));
            const unsub = onSnapshot(q, snap => {
                setMembers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            });
            return () => unsub();
        },[db, currentClub]);

        return <InstructorDashboard db={db} currentClub={currentClub} currentInstructor={currentInstructor} onLogout={handleLogout} members={members} />
    }

    const renderContent = () => {
        if (!isInitialSetupComplete || !db) {
            return <div className="text-center text-white flex items-center justify-center h-screen"><Loader2 className="animate-spin inline-block mr-2"/>Inicializando aplicación...</div>;
        }

        if (portalMode === null) return <PortalSelector setPortalMode={setPortalMode} />;
        if (portalMode === 'admin') return renderAdminPortal();
        if (portalMode === 'member') return renderMemberPortal();
        if (portalMode === 'instructor') return <InstructorPortal />;
    };

    return (<div className="bg-gray-900 min-h-screen text-white font-sans p-4 sm:p-6 lg:p-8 flex items-start justify-center"><div className="w-full max-w-7xl mx-auto">{renderContent()}</div></div>);
}
