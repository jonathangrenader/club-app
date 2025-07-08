import React, { useState, useMemo, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, orderBy } from 'firebase/firestore';
import { generateMonthlyDues, registerPayment } from '../services/firebaseServices';
import PaymentFormModal from '../components/forms/PaymentFormModal';
import ReceiptPreviewModal from '../components/modals/ReceiptPreviewModal';
import EditPaymentModal from '../components/modals/EditPaymentModal';
import { Loader2, Plus, Download, MessageCircle, Mail as MailIcon, FileDown, Pencil } from 'lucide-react';

const appId = 'the-club-cloud';

const PaymentsModule = ({ db, currentClub, members, config, handleFileUpload }) => {
    const [dues, setDues] = useState([]);
    const [payments, setPayments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('dues');
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
    const [isEditPaymentModalOpen, setIsEditPaymentModalOpen] = useState(false);
    const [currentDue, setCurrentDue] = useState(null);
    const [currentPayment, setCurrentPayment] = useState(null);

    const membersMap = useMemo(() => new Map(members.map(m => [m.id, m])), [members]);

    useEffect(() => {
        if (!db || !currentClub?.id) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        const duesPath = `artifacts/${appId}/public/data/dues`;
        const paymentsPath = `artifacts/${appId}/public/data/payments`;

        const qDues = query(collection(db, duesPath), where("clubId", "==", currentClub.id));
        const qPayments = query(collection(db, paymentsPath), where("clubId", "==", currentClub.id), orderBy("date", "desc"));

        const unsubDues = onSnapshot(qDues, (snap) => {
            setDues(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        const unsubPayments = onSnapshot(qPayments, (snap) => {
            setPayments(snap.docs.map(p => ({ id: p.id, ...p.data() })));
            setIsLoading(false);
        });

        return () => {
            unsubDues();
            unsubPayments();
        };
    }, [db, currentClub]);

    const handleOpenPaymentModal = (due) => {
        setCurrentDue({...due, memberName: membersMap.get(due.memberId)?.name});
        setIsPaymentModalOpen(true);
    };

    const handleOpenReceiptModal = (payment) => {
        const member = membersMap.get(payment.memberId);
        setCurrentPayment({ ...payment, memberName: member?.name, memberDni: member?.dni, memberType: member?.memberType, receiptConfig: payment.receiptConfig || config.talonarios?.recibo });
        setIsReceiptModalOpen(true);
    };

    const handleOpenEditPaymentModal = (payment) => {
        const member = membersMap.get(payment.memberId);
        setCurrentPayment({ ...payment, memberName: member?.name });
        setIsEditPaymentModalOpen(true);
    };

    const handleSavePaymentEdit = async () => {
        if (!currentPayment) return;
        setIsLoading(true);
        try {
            const paymentRef = doc(db, `artifacts/${appId}/public/data/payments`, currentPayment.id);
            await updateDoc(paymentRef, { details: currentPayment.details });
            setIsEditPaymentModalOpen(false);
        } catch (error) {
            console.error("Error al editar el pago:", error);
            alert("No se pudo guardar el detalle del pago.");
        }
        setIsLoading(false);
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
        try {
            const generatedCount = await generateMonthlyDues(db, currentClub.id, members, config.fees);
            if (generatedCount > 0) {
                alert(`${generatedCount} cuotas nuevas generadas.`);
            } else {
                alert("No se generaron cuotas nuevas. Ya existen para este período o no hay socios activos con planes pagos.");
            }
        } catch (error) {
            console.error("Error al generar cuotas:", error);
            alert("Error al generar las cuotas.");
        }
        setIsLoading(false);
    };
    
    const handleRegisterPayment = async (due, details, fileUrl) => {
        setIsLoading(true);
        try {
            await registerPayment(db, due, details, fileUrl, config.talonarios?.recibo);
            setIsPaymentModalOpen(false);
        } catch (error) {
            console.error("Error al registrar el pago:", error);
            alert("Error al registrar el pago.");
        }
        setIsLoading(false);
    };

    const pendingDues = useMemo(() => dues.filter(d => d.status === 'Pendiente'), [dues]);

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
                    <button onClick={() => setActiveTab('dues')} className={`w-full p-2 text-sm font-medium rounded-md ${activeTab === 'dues' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>Cuotas Pendientes ({pendingDues.length})</button>
                    <button onClick={() => setActiveTab('payments')} className={`w-full p-2 text-sm font-medium rounded-md ${activeTab === 'payments' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>Historial de Pagos ({payments.length})</button>
                </div>
            
                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                     {isLoading ? <div className="text-center p-8"><Loader2 className="animate-spin inline-block"/></div> :
                     activeTab === 'dues' ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-700"><tr><th className="p-3">Socio</th><th className="p-3">Período</th><th className="p-3">Monto</th><th className="p-3">Estado</th><th className="p-3">Acciones</th></tr></thead>
                                <tbody>
                                    {pendingDues.map(due => (
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
                             {pendingDues.length === 0 && <p className="text-center text-gray-400 py-4">No hay cuotas pendientes.</p>}
                        </div>
                     ) : (
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
                             {payments.length === 0 && <p className="text-center text-gray-400 py-4">No hay pagos registrados.</p>}
                        </div>
                     )}
                </div>
            </div>
        </>
    );
};

export default PaymentsModule;