import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, getDoc, doc, orderBy } from 'firebase/firestore';
import QRScannerModal from '../components/modals/QRScannerModal.js';
import { Loader2, QrCode } from 'lucide-react';
import InputField from '../components/InputField.js';

const appId = 'the-club-cloud';

const AttendanceModule = ({ db, currentClub, members }) => {
    const [attendanceLog, setAttendanceLog] = useState([]);
    const [loadingLogs, setLoadingLogs] = useState(true);
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [scanResult, setScanResult] = useState({ message: "", type: "" });

    useEffect(() => {
        if (!db || !currentClub?.id) return;
        
        const attendancePath = `artifacts/${appId}/public/data/attendance`;
        const q = query(collection(db, attendancePath), where("clubId", "==", currentClub.id), orderBy("timestamp", "desc"));
        
        const unsub = onSnapshot(q, (snap) => {
            setAttendanceLog(snap.docs.map(d => ({id: d.id, ...d.data()})).slice(0, 20));
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
        setScanResult({ message: `¡Acceso Correcto! Ingreso de ${member.name} registrado.`, type: 'success' });
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
                } else {
                    setScanResult({ message: "Error: Socio no encontrado.", type: 'error' });
                }
            } else {
                setScanResult({ message: "Error: QR no válido para este club.", type: 'error' });
            }
        } catch (e) {
            setScanResult({ message: "Error: Código QR no válido.", type: 'error' });
        }
    };
    
    useEffect(() => {
        if(scanResult.message) {
            const timer = setTimeout(() => setScanResult({ message: "", type: "" }), 5000);
            return () => clearTimeout(timer);
        }
    }, [scanResult])

    return (
        <>
            <QRScannerModal isOpen={isScannerOpen} onClose={() => setIsScannerOpen(false)} onScanSuccess={handleScanSuccess} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-bold text-white">Registrar Ingreso</h2>
                         <button onClick={() => setIsScannerOpen(true)} className="flex items-center px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700">
                            <QrCode size={18} className="mr-2" />
                            Escanear QR
                        </button>
                    </div>
                     {scanResult.message && (
                        <div className={`p-3 rounded-md mb-4 text-white ${scanResult.type === 'error' ? 'bg-red-500/20 text-red-300' : 'bg-green-500/20 text-green-300'}`}>
                            {scanResult.message}
                        </div>
                    )}
                    <div className="overflow-y-auto max-h-96">
                        <table className="w-full text-left">
                            <thead className="bg-gray-700 sticky top-0">
                                <tr>
                                    <th className="p-3 text-sm font-semibold text-gray-300">Nombre del Socio</th>
                                    <th className="p-3 text-sm font-semibold text-gray-300 text-right">Acción</th>
                                </tr>
                            </thead>
                            <tbody>
                                {members.map(member => (
                                    <tr key={member.id} className="border-b border-gray-700">
                                        <td className="p-3">{member.name}</td>
                                        <td className="p-3 text-right">
                                            <button onClick={() => handleRegisterEntry(member)} className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700">Registrar Ingreso</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                 <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                    <h2 className="text-2xl font-bold text-white mb-4">Últimos Ingresos</h2>
                     <div className="overflow-y-auto max-h-96">
                        {loadingLogs ? <div className="flex justify-center items-center h-full"><Loader2 className="animate-spin" /></div> :
                            <table className="w-full text-left">
                                <thead className="bg-gray-700 sticky top-0">
                                    <tr>
                                        <th className="p-2 text-sm font-semibold text-gray-300">Socio</th>
                                        <th className="p-2 text-sm font-semibold text-gray-300 text-right">Fecha y Hora</th>
                                    </tr>
                                </thead>
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

export default AttendanceModule;