import React, { useState } from 'react';
import { useClubData } from '../contexts/ClubDataContext';
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, updateDoc, increment } from 'firebase/firestore';

// Módulos
import DashboardModule from '../modules/DashboardModule.js';
import MembersModule from '../modules/MembersModule.js';
import PaymentsModule from '../modules/PaymentsModule.js';
import NewsModule from '../modules/NewsModule.js';
import ClassesModule from '../modules/ClassesModule.js';
import ReportsModule from '../modules/ReportsModule.js';
import AttendanceModule from '../modules/AttendanceModule.js';
import ConfigModule from '../modules/ConfigModule.js';
import UsersModule from '../modules/UsersModule.js';

// Iconos
import { ArrowLeft, Building, Mail as MailIcon, Calendar, BarChart2, ScanLine, Users, Dumbbell, DollarSign, Newspaper, FileText, Settings, Loader2 } from 'lucide-react';

const appId = 'the-club-cloud';

const ClubDashboard = ({ db, storage, currentClub, config, setConfig, currentUser, onLogout }) => {
    const [activeTab, setActiveTab] = useState('dashboard');
    // Obtenemos TODOS los datos y el estado de carga desde el contexto
    const { loading, members, payments, dues, activities, schedule, instructors } = useClubData();

    // Esta función se puede quedar aquí para pasarla a los módulos que la necesiten
    const handleFileUpload = async (file, pathPrefix) => {
        if (!storage || !db || !currentClub) return null;
        const storageRef = ref(storage, `${currentClub.id}/${pathPrefix}/${Date.now()}_${file.name}`);
        try {
            const uploadResult = await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(uploadResult.ref);
            const clubRef = doc(db, `artifacts/${appId}/public/data/clubs`, currentClub.id);
            await updateDoc(clubRef, { 'config.totalStorageUsedInBytes': increment(file.size) });
            return downloadURL;
        } catch (error) {
            console.error("Error al subir archivo: ", error);
            alert("Error al subir archivo.");
            return null;
        }
    };

    const tabs = [
        { id: 'dashboard', label: 'Dashboard', icon: BarChart2, role: ['Admin', 'Staff'] },
        { id: 'asistencia', label: 'Asistencia', icon: ScanLine, role: ['Admin', 'Staff'] },
        { id: 'socios', label: 'Socios', icon: Users, role: ['Admin', 'Staff'] },
        { id: 'clases', label: 'Clases', icon: Dumbbell, role: ['Admin', 'Staff'] },
        { id: 'pagos', label: 'Cuotas y Pagos', icon: DollarSign, role: ['Admin', 'Staff'] },
        { id: 'noticias', label: 'Noticias', icon: Newspaper, role: ['Admin', 'Staff'] },
        { id: 'informes', label: 'Informes', icon: FileText, role: ['Admin'] },
        { id: 'config', label: 'Configuración', icon: Settings, role: ['Admin'] },
        { id: 'usuarios', label: 'Usuarios', icon: Users, role: ['Admin'] },
    ];
    
    const visibleTabs = tabs.filter(tab => tab.role.includes(currentUser.role));

    // Si el contexto está cargando datos, mostramos un spinner global
    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen w-full">
                <Loader2 className="animate-spin text-white" size={48} />
            </div>
        );
    }

    return (
         <div className="w-full flex flex-col min-h-screen"> 
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                 <div>
                    <h1 className="text-3xl font-bold text-white flex items-center">
                        {config.logoURL ? <img src={config.logoURL} alt="Logo" className="h-10 mr-3 object-contain"/> : <Building size={32} className="mr-3 text-blue-400"/>}
                        {currentClub.name}
                    </h1>
                    <p className="text-gray-400 mt-1">Sesión iniciada como: {currentUser.email} ({currentUser.role})</p>
                 </div>
                 <button onClick={onLogout} className="text-sm text-gray-400 hover:text-white flex items-center">
                    <ArrowLeft size={16} className="mr-1" />Volver
                 </button>
            </header>
            <div className="mb-6 border-b border-gray-700">
                <nav className="-mb-px flex space-x-4 overflow-x-auto">
                    {visibleTabs.map(tab => (
                        <button 
                            key={tab.id} 
                            onClick={() => setActiveTab(tab.id)} 
                            className={`flex items-center space-x-2 px-3 py-2 font-medium text-sm rounded-t-lg transition-colors whitespace-nowrap ${activeTab === tab.id ? 'border-b-2 border-blue-500 text-white' : 'text-gray-400 hover:text-white hover:border-gray-500'}`}
                        >
                            <tab.icon size={16} />
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </nav>
            </div>
            <main className="mt-4 flex-grow">
                {activeTab === 'dashboard' && <DashboardModule members={members} payments={payments} dues={dues} activities={activities} config={config} />}
                {activeTab === 'asistencia' && <AttendanceModule db={db} currentClub={currentClub} members={members} />}
                {activeTab === 'socios' && <MembersModule db={db} currentClub={currentClub} members={members} config={config} activities={activities} handleFileUpload={handleFileUpload} />}
                {activeTab === 'pagos' && <PaymentsModule db={db} currentClub={currentClub} members={members} config={config} dues={dues} payments={payments} handleFileUpload={handleFileUpload} />}
                {activeTab === 'noticias' && <NewsModule db={db} currentClub={currentClub} handleFileUpload={handleFileUpload} />}
                {activeTab === 'clases' && <ClassesModule db={db} currentClub={currentClub} config={config} activities={activities} schedule={schedule} instructors={instructors} handleFileUpload={handleFileUpload} />}
                {activeTab === 'informes' && <ReportsModule members={members} payments={payments} dues={dues} />}
                {activeTab === 'config' && <ConfigModule db={db} currentClub={currentClub} config={config} setConfig={setConfig} handleFileUpload={handleFileUpload} />}
                {activeTab === 'usuarios' && <UsersModule db={db} currentClub={currentClub} />}
            </main>
         </div>
    );
};

export default ClubDashboard;