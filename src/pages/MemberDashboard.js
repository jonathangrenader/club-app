import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import QRCode from "qrcode.react";
import { Building, LogOut, ExternalLink } from 'lucide-react';

const appId = 'the-club-cloud';

const MemberDashboard = ({ db, currentClub, currentMember, onLogout }) => {
    const [dues, setDues] = useState([]);
    const [payments, setPayments] = useState([]);
    const [schedule, setSchedule] = useState([]);
    const [activities, setActivities] = useState([]);
    const [instructors, setInstructors] = useState([]);

    const activityMap = useMemo(() => new Map(activities.map(a => [a.id, a.name])), [activities]);
    const instructorMap = useMemo(() => new Map(instructors.map(i => [i.id, `${i.firstName} ${i.lastName}`])), [instructors]);
    
    const daysOrder = useMemo(() => ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"], []);
    
    const groupedSchedule = useMemo(() => {
        const grouped = schedule.reduce((acc, item) => {
            const day = item.dayOfWeek;
            if (!acc[day]) acc[day] = [];
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
        });
    }, [currentMember, currentClub.id]);

    useEffect(() => {
        if(!db || !currentMember?.id || !currentClub?.id) return;
        
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
                               {currentClub.config?.logoURL ? <img src={currentClub.config.logoURL} alt="Logo" className="h-10 object-contain"/> : <Building size={24}/>}
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
                                {dues.filter(d=> d.status === 'Pendiente').length === 0 && (
                                    <tr><td colSpan="3" className="text-center text-gray-400 p-4">¡Estás al día con tus cuotas!</td></tr>
                                )}
                            </tbody>
                        </table>
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
                                    {groupedSchedule[day].sort((a, b) => a.startTime.localeCompare(b.startTime)).map(item => (
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

export default MemberDashboard;