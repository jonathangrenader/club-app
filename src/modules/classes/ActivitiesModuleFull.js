import React, { useState } from 'react';
import { saveActivity, deleteActivity } from '../../services/firebaseServices';
import ActivityFormModal from '../../components/forms/ActivityFormModal';
import ConfirmationModal from '../../components/ConfirmationModal';
import ActivityIcon from '../../components/ActivityIcon';
import { Plus, Edit, Trash2 } from 'lucide-react';

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

    const handleCloseConfirmModal = () => setActivityToDelete(null);

    const handleSave = async (data) => {
        try {
            await saveActivity(db, currentClub.id, data);
            handleCloseFormModal();
        } catch(e) {
            console.error("Error al guardar la actividad:", e);
            alert("Error al guardar la actividad.");
        }
    };

    const handleDelete = async () => {
        if (!activityToDelete) return;
        try {
            await deleteActivity(db, activityToDelete);
            handleCloseConfirmModal();
        } catch(e) {
            console.error("Error al eliminar la actividad:", e);
            alert("Error al eliminar la actividad.");
        }
    };

    return (
        <>
            <ActivityFormModal 
                isOpen={isFormModalOpen} 
                onClose={handleCloseFormModal} 
                onSave={handleSave} 
                activityData={currentActivityData} 
                setActivityData={setCurrentActivityData} 
                spaces={spaces}
            />
            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={handleCloseConfirmModal}
                onConfirm={handleDelete}
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
                    )) : <p className="text-gray-400 text-center py-4">No hay actividades definidas.</p>}
                </ul>
            </div>
        </>
    );
};

export default ActivitiesModuleFull;