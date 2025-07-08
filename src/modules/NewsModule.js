import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { saveNews, deleteNews } from '../services/firebaseServices';
import NewsFormModal from '../components/forms/NewsFormModal';
import ConfirmationModal from '../components/ConfirmationModal';
import { Loader2, Plus, Edit, Trash2, MessageCircle, Mail as MailIcon } from 'lucide-react';

const appId = 'the-club-cloud';

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
        const q = query(collection(db, newsPath), where("clubId", "==", currentClub.id), orderBy("createdAt", "desc"));
        const unsub = onSnapshot(q, snap => {
            setNews(snap.docs.map(d => ({id: d.id, ...d.data()})));
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
    
    const handleCloseConfirmModal = () => setNewsToDelete(null);

    const handleSaveNewsWithService = async (newsData) => {
        try {
            await saveNews(db, currentClub.id, newsData);
            handleCloseFormModal();
        } catch (error) {
            console.error("Error al guardar la noticia:", error);
        }
    };

    const handleConfirmDeleteWithService = async () => {
        if (!newsToDelete) return;
        try {
            await deleteNews(db, newsToDelete);
            handleCloseConfirmModal();
        } catch (error) {
            console.error("Error al eliminar la noticia:", error);
        }
    };
    
    const handleShare = (type, item) => {
        const message = `${item.title}\n\n${item.content}`;
        const url = `https://the-club-cloud.web.app/news/${item.id}`;
        const fullMessage = `${message}\n\nLee más aquí: ${url}`;
        
        if (type === 'whatsapp') {
            window.open(`https://wa.me/?text=${encodeURIComponent(fullMessage)}`, '_blank');
        } else if (type === 'email') {
            window.open(`mailto:?subject=${encodeURIComponent(item.title)}&body=${encodeURIComponent(fullMessage)}`, '_blank');
        }
    };

    if (loading) return <div className="text-white flex items-center justify-center p-8"><Loader2 className="animate-spin mr-2" /> Cargando noticias...</div>

    return (
        <>
            <NewsFormModal 
                isOpen={isFormModalOpen} 
                onClose={handleCloseFormModal} 
                onSave={handleSaveNewsWithService} 
                newsData={currentNewsData} 
                setNewsData={setCurrentNewsData}
                handleFileUpload={handleFileUpload}
            />
            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={handleCloseConfirmModal}
                onConfirm={handleConfirmDeleteWithService}
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
                        <div key={item.id} className="bg-gray-700 rounded-lg overflow-hidden flex flex-col md:flex-row">
                             {item.imageUrl && <img src={item.imageUrl} alt={item.title} className="w-full md:w-1/3 h-48 md:h-auto object-cover"/>}
                            <div className="p-4 flex flex-col justify-between flex-grow">
                                <div>
                                    <div className="flex justify-between items-start">
                                        <h3 className="font-bold text-lg text-white">{item.title}</h3>
                                        <span className={`flex-shrink-0 ml-4 px-2 py-1 text-xs font-bold rounded-full ${
                                            item.status === 'Publicado' ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300'
                                        }`}>{item.status}</span>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1 mb-2">{item.createdAt?.toDate().toLocaleDateString()}</p>
                                    <p className="text-gray-300 mt-1 text-sm">{item.content}</p>
                                </div>
                                <div className="flex items-center gap-2 mt-4 pt-2 border-t border-gray-600">
                                    <button onClick={() => handleOpenFormModal(item)} className="p-2 text-gray-400 hover:text-white" title="Editar"><Edit size={16} /></button>
                                    <button onClick={() => handleOpenConfirmModal(item.id)} className="p-2 text-gray-400 hover:text-red-400" title="Eliminar"><Trash2 size={16} /></button>
                                    <button onClick={() => handleShare('whatsapp', item)} className="p-2 text-gray-400 hover:text-white" title="Compartir en WhatsApp"><MessageCircle size={16} /></button>
                                    <button onClick={() => handleShare('email', item)} className="p-2 text-gray-400 hover:text-white" title="Compartir por Email"><MailIcon size={16} /></button>
                                </div>
                            </div>
                        </div>
                    )) : <p className="text-gray-400 text-center py-8">No hay noticias publicadas.</p>}
                </div>
            </div>
        </>
    );
};

export default NewsModule;