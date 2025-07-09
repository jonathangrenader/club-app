import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

const ClubDataContext = createContext();

export const useClubData = () => {
    return useContext(ClubDataContext);
};

const appId = 'the-club-cloud';

export const ClubDataProvider = ({ children, db, currentClub, isAuthReady }) => {
    const [loading, setLoading] = useState(true);
    const [members, setMembers] = useState([]);
    const [payments, setPayments] = useState([]);
    const [dues, setDues] = useState([]);
    const [schedule, setSchedule] = useState([]);
    const [activities, setActivities] = useState([]);
    const [instructors, setInstructors] = useState([]);

    useEffect(() => {
        // CORRECCIÓN: No hacer nada si Firebase no está listo o si el usuario no se ha autenticado.
        if (!db || !currentClub?.id || !isAuthReady) {
            setLoading(false);
            return;
        }

        setLoading(true);

        const collectionsToFetch = {
            members: `artifacts/${appId}/public/data/members`,
            payments: `artifacts/${appId}/public/data/payments`,
            dues: `artifacts/${appId}/public/data/dues`,
            schedule: `artifacts/${appId}/public/data/schedule`,
            activities: `artifacts/${appId}/public/data/activities`,
            instructors: `artifacts/${appId}/public/data/instructors`,
        };

        const listeners = Object.entries(collectionsToFetch).map(([key, path]) => {
            const q = query(collection(db, path), where("clubId", "==", currentClub.id));
            return onSnapshot(q, snap => {
                const data = snap.docs.map(d => ({id: d.id, ...d.data()}));
                switch(key) {
                    case 'members': setMembers(data); break;
                    case 'payments': setPayments(data); break;
                    case 'dues': setDues(data); break;
                    case 'schedule': setSchedule(data); break;
                    case 'activities': setActivities(data); break;
                    case 'instructors': setInstructors(data); break;
                    default: break;
                }
            }, (error) => {
                console.error(`Error fetching ${key}:`, error);
            });
        });
        
        setLoading(false);

        return () => listeners.forEach(unsub => unsub());
    }, [db, currentClub?.id, isAuthReady]);
    
    const value = useMemo(() => ({
        loading,
        members,
        payments,
        dues,
        schedule,
        activities,
        instructors
    }), [loading, members, payments, dues, schedule, activities, instructors]);

    return (
        <ClubDataContext.Provider value={value}>
            {children}
        </ClubDataContext.Provider>
    );
};