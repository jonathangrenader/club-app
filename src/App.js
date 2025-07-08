import React, { useState, useEffect, useCallback, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, onSnapshot, getDocs, collection, query, where, writeBatch, serverTimestamp } from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { ClubDataProvider } from './contexts/ClubDataContext.js';

// Vistas y Componentes Principales
import PortalSelector from './pages/login/PortalSelector.js';
import ClubLoginScreen from './pages/login/ClubLoginScreen.js';
import UserLoginScreen from './pages/login/UserLoginScreen.js';
import MemberLoginScreen from './pages/login/MemberLoginScreen.js';
import ClubDashboard from './pages/ClubDashboard.js'; 
import MemberDashboard from './pages/MemberDashboard.js'; 
import InstructorDashboard from './pages/InstructorDashboard.js'; 

// Iconos
import { Loader2 } from 'lucide-react';

// --- Configuración de Firebase y Constantes ---
const firebaseConfig = {
  apiKey: process.env.REACT_APP_API_KEY,
  authDomain: process.env.REACT_APP_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_PROJECT_ID,
  storageBucket: process.env.REACT_APP_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_APP_ID,
  measurementId: process.env.REACT_APP_MEASUREMENT_ID
};

const appId = 'the-club-cloud';
const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000;

// --- Componente Wrapper definido FUERA del componente App ---
// Al estar aquí, React sabe que es el mismo componente y no lo destruye en cada renderizado.
const ClubDashboardWrapper = (props) => (
    <ClubDataProvider db={props.db} currentClub={props.currentClub}>
        <ClubDashboard {...props} />
    </ClubDataProvider>
);

// --- COMPONENTE PRINCIPAL ---
export default function App() {
    const [db, setDb] = useState(null);
    const [storage, setStorage] = useState(null);
    const [isInitialSetupComplete, setIsInitialSetupComplete] = useState(false);
    
    // Estados de la Sesión
    const [portalMode, setPortalMode] = useState(null); 
    const [currentClub, setCurrentClub] = useState(null);
    const [loginError, setLoginError] = useState("");
    
    // Estados de Portales
    const [adminView, setAdminView] = useState('clubLogin');
    const [currentAdmin, setCurrentAdmin] = useState(null);
    const [clubConfig, setClubConfig] = useState(null);
    const [memberView, setMemberView] = useState('clubLogin');
    const [currentMember, setCurrentMember] = useState(null);
    const [currentInstructor, setCurrentInstructor] = useState(null);

    const inactivityTimer = useRef(null);

    const handleLogout = useCallback(() => {
        setPortalMode(null);
        setAdminView('clubLogin');
        setMemberView('clubLogin');
        setCurrentClub(null);
        setCurrentAdmin(null);
        setCurrentMember(null);
        setCurrentInstructor(null);
        setLoginError("");
        localStorage.removeItem('tcc_session');
        if (inactivityTimer.current) {
            clearTimeout(inactivityTimer.current);
        }
    }, []);

    const resetInactivityTimer = useCallback(() => {
        if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
        inactivityTimer.current = setTimeout(() => {
            alert("Tu sesión ha expirado por inactividad.");
            handleLogout();
        }, INACTIVITY_TIMEOUT_MS);
    }, [handleLogout]);

    useEffect(() => {
        const events = ['mousemove', 'keydown', 'scroll', 'click'];
        const resetTimer = () => {
            if (localStorage.getItem('tcc_session')) resetInactivityTimer();
        };
        events.forEach(event => window.addEventListener(event, resetTimer));
        return () => {
            events.forEach(event => window.removeEventListener(event, resetTimer));
            if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
        };
    }, [resetInactivityTimer]);

    const saveSession = (sessionData) => {
        localStorage.setItem('tcc_session', JSON.stringify(sessionData));
        resetInactivityTimer();
    };
    
    const resetDemoData = useCallback(async (dbInstance) => {
      // Lógica para reiniciar datos de demo
    }, []);
    
    const setupDemoClub = useCallback(async (db) => { 
      // Lógica para crear datos de demo si no existen
    }, [resetDemoData]);
    
    useEffect(() => {
        let isInitialized = false;
        if(isInitialized) return;
        isInitialized = true;

        const init = async () => {
            try {
                const app = initializeApp(firebaseConfig);
                const firestoreDb = getFirestore(app);
                const firebaseAuth = getAuth(app);
                const firebaseStorage = getStorage(app);
                setDb(firestoreDb);
                setStorage(firebaseStorage);
                
                onAuthStateChanged(firebaseAuth, async (user) => {
                    if (!user) await signInAnonymously(firebaseAuth);
                });

                const savedSession = localStorage.getItem('tcc_session');
                if (savedSession) {
                    const sessionData = JSON.parse(savedSession);
                    setPortalMode(sessionData.portalMode);
                    setCurrentClub(sessionData.currentClub);
                    setClubConfig(sessionData.clubConfig);
                    setCurrentAdmin(sessionData.currentAdmin);
                    setCurrentMember(sessionData.currentMember);
                    setCurrentInstructor(sessionData.currentInstructor);
                    if (sessionData.portalMode === 'admin' || sessionData.portalMode === 'instructor') {
                        setAdminView('dashboard');
                    }
                    if (sessionData.portalMode === 'member') {
                        setMemberView('dashboard');
                    }
                    resetInactivityTimer();
                }

                if (firestoreDb) {
                  await setupDemoClub(firestoreDb);
                }
            } catch (error) {
                 console.error("Firebase initialization error", error);
            } finally {
                setIsInitialSetupComplete(true);
            }
        };
        init().catch(console.error);
    }, [resetInactivityTimer, setupDemoClub]);

    const handleClubLogin = useCallback(async (clubId, forPortal) => {
        if (!db) return;
        setLoginError("");
        const clubRef = doc(db, `artifacts/${appId}/public/data/clubs`, clubId.toUpperCase());
        onSnapshot(clubRef, (docSnap) => {
            if (docSnap.exists()) {
                const clubData = { id: docSnap.id, ...docSnap.data() };
                setCurrentClub(clubData);
                setClubConfig(clubData.config || {});
                if (forPortal === 'admin') setAdminView('userLogin');
                if (forPortal === 'member') setMemberView('userLogin');
            } else {
                setLoginError("Club no encontrado. Verifica el ID.");
            }
        });
    }, [db]);
    
    const handleAdminUserLogin = useCallback(async (email, password) => {
        if (!db || !currentClub) return;
        setLoginError("");
        const q = query(collection(db, `artifacts/${appId}/public/data/club_users`), where("clubId", "==", currentClub.id), where("email", "==", email));
        const snapshot = await getDocs(q);
        if (snapshot.empty) { setLoginError("Usuario no encontrado."); return; }
        const userDoc = snapshot.docs[0];
        const userData = { id: userDoc.id, ...userDoc.data() };

        if (userData.password === password) {
            const sessionData = { currentClub, clubConfig };
            if (userData.role === 'Instructor') {
                const instQuery = query(collection(db, `artifacts/${appId}/public/data/instructors`), where("email", "==", email), where("clubId", "==", currentClub.id));
                const instSnap = await getDocs(instQuery);
                if(!instSnap.empty) {
                    const instructorData = { id: instSnap.docs[0].id, ...instSnap.docs[0].data() };
                    setCurrentInstructor(instructorData);
                    setPortalMode('instructor');
                    setAdminView('dashboard');
                    saveSession({ ...sessionData, portalMode: 'instructor', currentInstructor: instructorData });
                } else { setLoginError("Perfil de instructor no encontrado."); }
            } else {
                setCurrentAdmin(userData); 
                setAdminView('dashboard');
                setPortalMode('admin');
                saveSession({ ...sessionData, portalMode: 'admin', currentAdmin: userData });
            }
        } else {
            setLoginError("Contraseña incorrecta.");
        }
    }, [db, currentClub, clubConfig]);
    
    const handleMemberLogin = useCallback(async (email, password) => {
        if (!db || !currentClub) return;
        setLoginError("");
        const q = query(
            collection(db, `artifacts/${appId}/public/data/members`),
            where("clubId", "==", currentClub.id),
            where("email", "==", email),
            where("password", "==", password)
        );
        const snapshot = await getDocs(q);
        if (snapshot.empty) {
            setLoginError("Credenciales incorrectas o socio no encontrado.");
        } else {
            const memberData = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
            setCurrentMember(memberData);
            setMemberView('dashboard');
            setPortalMode('member');
            saveSession({ portalMode: 'member', currentMember: memberData, currentClub, clubConfig });
        }
    }, [db, currentClub, clubConfig]);

    const renderAdminPortal = () => {
        switch (adminView) {
            case 'clubLogin':
                return <ClubLoginScreen onClubLogin={(id) => handleClubLogin(id, 'admin')} error={loginError} onResetDemo={() => resetDemoData(db)} />;
            case 'userLogin':
                return <UserLoginScreen onUserLogin={handleAdminUserLogin} clubName={currentClub?.name} error={loginError} onBack={handleLogout} clubLogo={clubConfig?.logoURL}/>;
            case 'dashboard':
                return <ClubDashboardWrapper db={db} storage={storage} currentClub={currentClub} config={clubConfig} setConfig={setClubConfig} currentUser={currentAdmin} onLogout={handleLogout} />
            default:
                return <p className="text-white">Cargando...</p>;
        }
    }
    
    const renderMemberPortal = () => {
        switch (memberView) {
            case 'clubLogin':
                return <ClubLoginScreen onClubLogin={(id) => handleClubLogin(id, 'member')} error={loginError} forMember={true} />;
            case 'userLogin':
                return <MemberLoginScreen onMemberLogin={handleMemberLogin} clubName={currentClub?.name} error={loginError} onBack={handleLogout} clubLogo={clubConfig?.logoURL}/>;
            case 'dashboard':
                 return <MemberDashboard db={db} currentClub={currentClub} currentMember={currentMember} onLogout={handleLogout} />
            default:
                return <p className="text-white">Cargando...</p>;
        }
    }
    
    const renderInstructorPortal = () => {
        if (!currentClub || !currentInstructor) return <div className="text-white">Cargando...</div>;
        return <InstructorDashboard db={db} currentClub={currentClub} currentInstructor={currentInstructor} onLogout={handleLogout} />
    }

    const renderContent = () => {
        if (!isInitialSetupComplete) {
            return (
                <div className="flex items-center justify-center h-screen">
                    <Loader2 className="animate-spin mr-2 text-white"/>
                    <span className="text-white">Inicializando aplicación...</span>
                </div>
            );
        }

        if (portalMode === null) return <PortalSelector setPortalMode={setPortalMode} />;
        if (portalMode === 'admin' || portalMode === 'instructor') return renderAdminPortal();
        if (portalMode === 'member') return renderMemberPortal();
    };

    return (
        <div className="bg-gray-900 min-h-screen text-white font-sans p-4 sm:p-6 lg:p-8 flex items-start justify-center">
            <div className="w-full max-w-7xl mx-auto">
                {renderContent()}
            </div>
        </div>
    );
}