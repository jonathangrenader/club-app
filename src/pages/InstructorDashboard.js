import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, where, onSnapshot, getDocs, doc, updateDoc } from 'firebase/firestore';
import QRScannerModal from '../components/modals/QRScannerModal';
import RejectionModal from '../components/modals/RejectionModal';
import EnrolledListModal from '../components/modals/EnrolledListModal';
import ActivityIcon from '../components/ActivityIcon';
import { Loader2, QrCode, LogOut, ThumbsUp, ThumbsDown, MessageSquare } from 'lucide-react';

const appId = 'the-club-cloud';

const InstructorDashboard = ({ db, currentClub, currentInstructor, onLogout }) => {
    const [mySchedule, setMySchedule] = useState([]);
    const [members, setMembers] = useState([]);
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [scanResult, setScanResult] = useState("");
    const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
    const [isSuggestionModalOpen, setIsSuggestionModalOpen] = useState(false);
    const [isEnrolledListModalOpen, setIsEnrolledListModalOpen] = useState(false);
    const [classToUpdate, setClassToUpdate] = useState(null);

    const activityMap = useMemo(() => new Map(activities.map(a => [a.id, a.name])), [activities]);

    useEffect(() => {
        if (!db || !currentInstructor || !currentClub?.id) {
            setLoading(false);
            return;
        }
        setLoading(true);

        const scheduleQuery = query(
            collection(db, `artifacts/${appId}/public/data/schedule`),
            where("clubId", "==", currentClub.id),
            where("instructorId", "==", currentInstructor.id)
        );
        const unsubSchedule = onSnapshot(scheduleQuery, (snap) => {
            const scheduleItems = snap.docs.map(d => ({id: d.id, ...d.data(), activityName: activityMap.get(d.data().activityId) || 'Cargando...'}));
            setMySchedule(scheduleItems);
            setLoading(false);
        });

        const membersQuery = query(collection(db, `artifacts/${appId}/public/data/members`), where("clubId", "==", currentClub.id));
        const unsubMembers = onSnapshot(membersQuery, (snap) => {
            setMembers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        const activitiesQuery = query(collection(db, `artifacts/${appId}/public/data/activities`), where("clubId", "==", currentClub.id));
        const unsubActivities = onSnapshot(activitiesQuery, (snap) => {
            setActivities(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        return () => {
            unsubSchedule();
            unsubMembers();
            unsubActivities();
        };
    }, [db, currentInstructor, currentClub?.id, activityMap]);

    const handleScanSuccess = (text) => {
        setIsScannerOpen(false);
        setScanResult(`Datos escaneados: ${text}. La lógica de registro de asistencia se puede implementar aquí.`);
    };

    const handleUpdateClassStatus = async (classId, newStatus, comment = "") => {
        const classRef = doc(db, `artifacts/${appId}/public/data/schedule`, classId);
        await updateDoc(classRef, { status: newStatus, rejectionComment: comment });
        if (isRejectionModalOpen) setIsRejectionModalOpen(false);
        if (isSuggestionModalOpen) setIsSuggestionModalOpen(false);
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
                title={`Inscriptos en ${classToUpdate?.activityName || 'la clase'}`}
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
                                        <td className="p-3">{activityMap.get(item.activityId) || item.activityId}</td>
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

export default InstructorDashboard;