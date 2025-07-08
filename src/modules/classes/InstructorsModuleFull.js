import React, { useState } from 'react';
import { saveInstructor, deleteInstructor } from '../../services/firebaseServices';
import InstructorFormModal from '../../components/forms/InstructorFormModal';
import ConfirmationModal from '../../components/ConfirmationModal';
import { UserPlus, Edit, Trash2 } from 'lucide-react';

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

    const handleSave = async (data) => {
        try {
            await saveInstructor(db, currentClub.id, data);
            handleCloseFormModal();
        } catch (e) { 
            console.error("Error al guardar el instructor:", e);
            alert("Hubo un error al guardar el instructor.");
        }
    };

    const handleDelete = async () => {
        if (!instructorToDelete) return;
        try {
            await deleteInstructor(db, currentClub.id, instructorToDelete);
            handleCloseConfirmModal();
        } catch (e) { 
            console.error("Error al eliminar el instructor:", e);
            alert("Hubo un error al eliminar el instructor.");
        }
    };

    return (
        <>
            <InstructorFormModal
                isOpen={isFormModalOpen}
                onClose={handleCloseFormModal}
                onSave={handleSave}
                instructorData={currentInstructorData}
                setInstructorData={setCurrentInstructorData}
                activities={activities}
                handleFileUpload={handleFileUpload}
            />
            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={handleCloseConfirmModal}
                onConfirm={handleDelete}
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

export default InstructorsModuleFull;