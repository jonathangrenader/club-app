import { doc, addDoc, updateDoc, deleteDoc, collection, serverTimestamp, writeBatch, query, where, getDocs } from 'firebase/firestore';

const appId = 'the-club-cloud';

// --- Funciones de Socios ---
export const saveMember = async (db, clubId, memberData) => {
    const membersPath = `artifacts/${appId}/public/data/members`;
    const { id, confirmPassword, ...dataToSave } = memberData;
    dataToSave.clubId = clubId;
    if (!dataToSave.password) {
        delete dataToSave.password;
    }
    if (id) {
        const memberRef = doc(db, membersPath, id);
        await updateDoc(memberRef, dataToSave);
    } else {
        if (!dataToSave.password) {
            dataToSave.password = Math.random().toString(36).slice(-8);
        }
        await addDoc(collection(db, membersPath), { ...dataToSave, createdAt: serverTimestamp() });
    }
};
export const deleteMember = async (db, memberId) => {
    if (!memberId) throw new Error("Se requiere el ID del socio para eliminarlo.");
    const memberRef = doc(db, `artifacts/${appId}/public/data/members`, memberId);
    await deleteDoc(memberRef);
};

// --- Funciones de Pagos y Cuotas ---
export const generateMonthlyDues = async (db, clubId, members, fees) => {
    const batch = writeBatch(db);
    const activeMembers = members.filter(m => m.status === 'Activo');
    const now = new Date();
    const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    const duesPath = `artifacts/${appId}/public/data/dues`;
    const q = query(collection(db, duesPath), where('clubId', '==', clubId), where('period', '==', period));
    const existingDuesSnap = await getDocs(q);
    const existingDuesForPeriod = new Set(existingDuesSnap.docs.map(d => d.data().memberId));

    let generatedCount = 0;
    activeMembers.forEach(member => {
        if (!existingDuesForPeriod.has(member.id)) {
            const amount = fees[member.memberType] || 0;
            if (amount > 0) {
                const dueRef = doc(collection(db, duesPath));
                batch.set(dueRef, {
                    clubId: clubId,
                    memberId: member.id,
                    period: period,
                    amount: amount,
                    status: 'Pendiente',
                    createdAt: serverTimestamp()
                });
                generatedCount++;
            }
        }
    });

    if (generatedCount > 0) {
        await batch.commit();
    }
    return generatedCount;
};
export const registerPayment = async (db, due, details, fileUrl, receiptConfig) => {
    const batch = writeBatch(db);
    const dueRef = doc(db, `artifacts/${appId}/public/data/dues`, due.id);
    batch.update(dueRef, { status: 'Pagada' });
    const paymentRef = doc(collection(db, `artifacts/${appId}/public/data/payments`));
    batch.set(paymentRef, {
        clubId: due.clubId,
        memberId: due.memberId,
        amount: due.amount,
        period: due.period,
        date: serverTimestamp(),
        method: 'Manual',
        details: details || "",
        proofUrl: fileUrl || "",
        receiptConfig: receiptConfig
    });
    await batch.commit();
};

// --- Funciones de Noticias ---
export const saveNews = async (db, clubId, newsData) => {
    const newsPath = `artifacts/${appId}/public/data/news`;
    const { id, ...dataToSave } = newsData;
    dataToSave.clubId = clubId;
    if (id) {
        const newsRef = doc(db, newsPath, id);
        await updateDoc(newsRef, dataToSave);
    } else {
        await addDoc(collection(db, newsPath), { ...dataToSave, createdAt: serverTimestamp() });
    }
};
export const deleteNews = async (db, newsId) => {
    if (!newsId) throw new Error("Se requiere el ID de la noticia.");
    const newsRef = doc(db, `artifacts/${appId}/public/data/news`, newsId);
    await deleteDoc(newsRef);
};

// --- Funciones de Horarios (Schedule) ---
export const saveSchedule = async (db, clubId, scheduleData, existingSchedule) => {
    const { id, ...dataToSave } = scheduleData;
    dataToSave.clubId = clubId;
    const allSchedulesForInstructor = existingSchedule.filter(s => s.instructorId === dataToSave.instructorId && s.id !== id);
    const hasConflict = allSchedulesForInstructor.some(s => {
        if (s.dayOfWeek !== dataToSave.dayOfWeek) return false;
        return dataToSave.startTime < s.endTime && dataToSave.endTime > s.startTime;
    });
    if (hasConflict) {
        throw new Error("Conflicto de horario. El instructor ya tiene una clase programada en ese día y rango de tiempo.");
    }
    const schedulePath = `artifacts/${appId}/public/data/schedule`;
    if (id) {
        await updateDoc(doc(db, schedulePath, id), dataToSave);
    } else {
        dataToSave.status = 'Pendiente';
        dataToSave.enrolledMembers = [];
        await addDoc(collection(db, schedulePath), dataToSave);
    }
};
export const deleteSchedule = async (db, scheduleId) => {
    if (!scheduleId) throw new Error("Se requiere el ID del horario.");
    await deleteDoc(doc(db, `artifacts/${appId}/public/data/schedule`, scheduleId));
};

// --- Funciones de Actividades ---
export const saveActivity = async (db, clubId, activityData) => {
    const { id, ...dataToSave } = activityData;
    dataToSave.clubId = clubId;
    const activityPath = `artifacts/${appId}/public/data/activities`;
    if (id) {
        await updateDoc(doc(db, activityPath, id), dataToSave);
    } else {
        await addDoc(collection(db, activityPath), dataToSave);
    }
};
export const deleteActivity = async (db, activityId) => {
    if (!activityId) throw new Error("Se requiere el ID de la actividad.");
    await deleteDoc(doc(db, `artifacts/${appId}/public/data/activities`, activityId));
};

// --- Funciones de Instructores y Usuarios ---
export const saveInstructor = async (db, clubId, instructorData) => {
    const batch = writeBatch(db);
    const { id, password, ...dataToSave } = instructorData;
    const instructorsPath = `artifacts/${appId}/public/data/instructors`;
    const usersPath = `artifacts/${appId}/public/data/club_users`;
    if (id) {
        const instructorRef = doc(db, instructorsPath, id);
        batch.update(instructorRef, dataToSave);
        if (password) { 
            const usersQuery = query(collection(db, usersPath), where("instructorId", "==", id), where("clubId", "==", clubId));
            const usersSnap = await getDocs(usersQuery);
            if (!usersSnap.empty) {
                batch.update(usersSnap.docs[0].ref, { password });
            }
        }
    } else {
        const newInstructorRef = doc(collection(db, instructorsPath));
        batch.set(newInstructorRef, dataToSave);
        const newUserRef = doc(collection(db, usersPath));
        batch.set(newUserRef, { 
            email: dataToSave.email, 
            password, 
            role: 'Instructor', 
            clubId: clubId, 
            instructorId: newInstructorRef.id 
        });
    }
    await batch.commit();
};
export const deleteInstructor = async (db, clubId, instructor) => {
    if (!instructor?.id) throw new Error("Datos del instructor incompletos.");
    const batch = writeBatch(db);
    batch.delete(doc(db, `artifacts/${appId}/public/data/instructors`, instructor.id));
    const usersQuery = query(collection(db, `artifacts/${appId}/public/data/club_users`), where("instructorId", "==", instructor.id), where("clubId", "==", clubId));
    const usersSnap = await getDocs(usersQuery);
    if (!usersSnap.empty) {
        batch.delete(usersSnap.docs[0].ref);
    }
    await batch.commit();
};
export const saveUser = async (db, clubId, userData) => {
    const usersPath = `artifacts/${appId}/public/data/club_users`;
    const { id, ...dataToSave } = userData;
    dataToSave.clubId = clubId;
    if (id) {
        const userRef = doc(db, usersPath, id);
        await updateDoc(userRef, dataToSave);
    } else {
        await addDoc(collection(db, usersPath), dataToSave);
    }
};
export const deleteUser = async (db, userId) => {
    if (!userId) throw new Error("Se requiere el ID del usuario.");
    await deleteDoc(doc(db, `artifacts/${appId}/public/data/club_users`, userId));
};