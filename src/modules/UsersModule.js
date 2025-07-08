import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { saveUser, deleteUser } from '../services/firebaseServices';
import UserFormModal from '../components/forms/UserFormModal';
import ConfirmationModal from '../components/ConfirmationModal';
import { Loader2, UserPlus, Edit, Trash2 } from 'lucide-react';

const appId = 'the-club-cloud';

const UsersModule = ({ db, currentClub, onOpenInstructorModal }) => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [currentUserData, setCurrentUserData] = useState(null);
    const [userToDelete, setUserToDelete] = useState(null);

    useEffect(() => {
        if (!db || !currentClub?.id) { 
            setLoading(false); 
            return; 
        }
        setLoading(true);
        const usersCollectionPath = `artifacts/${appId}/public/data/club_users`;
        const q = query(collection(db, usersCollectionPath), where("clubId", "==", currentClub.id));
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
        setCurrentUserData(user ? {...user} : { email: '', password: '', role: 'Staff' });
        setIsFormModalOpen(true);
    };

    const handleCloseFormModal = () => setIsFormModalOpen(false);

    const handleOpenConfirmModal = (userId) => {
        setUserToDelete(userId);
        setIsConfirmModalOpen(true);
    };

    const handleCloseConfirmModal = () => setUserToDelete(null);

    const handleSaveUser = async (userData) => {
        if (userData.role === 'Instructor') {
            onOpenInstructorModal(userData);
            handleCloseFormModal();
            return;
        }
        try {
            await saveUser(db, currentClub.id, userData);
            handleCloseFormModal();
        } catch (error) {
            console.error("Error al guardar el usuario: ", error);
            alert("Error al guardar el usuario.");
        }
    };

    const handleConfirmDelete = async () => {
        if (!userToDelete) return;
        try {
            await deleteUser(db, userToDelete);
            handleCloseConfirmModal();
        } catch (error) {
            console.error("Error al eliminar el usuario: ", error);
            alert("Error al eliminar el usuario.");
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
                message="¿Estás seguro de que quieres eliminar a este usuario?"
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
                                <th className="p-3">Email</th>
                                <th className="p-3">Rol</th>
                                <th className="p-3">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user.id} className="border-b border-gray-700">
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
                                    <td className="p-3 flex gap-2">
                                        <button onClick={() => handleOpenFormModal(user)} className="p-1 text-gray-400 hover:text-white"><Edit size={16}/></button>
                                        <button onClick={() => handleOpenConfirmModal(user.id)} className="p-1 text-gray-400 hover:text-red-400"><Trash2 size={16}/></button>
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

export default UsersModule;