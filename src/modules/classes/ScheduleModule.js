import React, { useState, useMemo } from 'react';
import { saveSchedule, deleteSchedule } from '../../services/firebaseServices';
import ScheduleFormModal from '../../components/forms/ScheduleFormModal';
import ConfirmationModal from '../../components/ConfirmationModal';
import ActivityIcon from '../../components/ActivityIcon'; 
import { Plus, Edit, Trash2, CheckCircle, XCircle, MessageSquare, Clock } from 'lucide-react';

const ScheduleModule = ({ db, currentClub, schedule, activities, instructors, spaces }) => {
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
    const handleCloseConfirmModal = () => setScheduleToDelete(null);

    const handleSave = async (data) => {
        try {
            await saveSchedule(db, currentClub.id, data, schedule);
            handleCloseFormModal();
        } catch (error) {
            alert(error.message);
        }
    };

    const handleDelete = async () => {
        if (!scheduleToDelete) return;
        try {
            await deleteSchedule(db, scheduleToDelete);
            handleCloseConfirmModal();
        } catch (error) {
            console.error(error);
            alert("Error al eliminar la clase.");
        }
    };
    
    const StatusIcon = ({ status, comment }) => {
        const title = comment ? `${status} - Comentario: ${comment}` : status;
        switch (status) {
            case 'Aceptada': return <CheckCircle size={16} className="text-green-400" title={title}/>;
            case 'Rechazada': return <XCircle size={16} className="text-red-400" title={title}/>;
            case 'Sugerencia': return <MessageSquare size={16} className="text-blue-400" title={title}/>;
            default: return <Clock size={16} className="text-yellow-400" title={title}/>;
        }
    };

    return (
        <>
            <ScheduleFormModal isOpen={isFormModalOpen} onClose={handleCloseFormModal} onSave={handleSave} scheduleData={currentScheduleData} setScheduleData={setCurrentScheduleData} activities={activities} instructors={instructors} spaces={spaces} />
            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={handleCloseConfirmModal}
                onConfirm={handleDelete}
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

export default ScheduleModule;