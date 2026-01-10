
import { AssessmentHistoryItem, Domain, FeedbackMessage } from '../types';
import { db } from './firebaseConfig';
import { collection, setDoc, getDocs, deleteDoc, doc, writeBatch, getDoc, addDoc, serverTimestamp, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { INITIAL_DOMAINS } from '../constants';

const COLLECTION_NAME = 'assessments';
const SETTINGS_COLLECTION = 'settings';
const SCHEMA_DOC_ID = 'assessment_schema';
const FEEDBACK_COLLECTION = 'public_feedback';

export const api = {
    /**
     * حفظ تقييم جديد في قاعدة البيانات (Firebase Firestore)
     */
    async saveAssessment(assessment: AssessmentHistoryItem): Promise<boolean> {
        try {
            // نستخدم معرف التقييم (UUID) كمعرف للمستند في Firestore لسهولة الوصول إليه لاحقاً
            const docRef = doc(db, COLLECTION_NAME, assessment.id);
            
            // حفظ البيانات
            await setDoc(docRef, assessment);
            
            return true;
        } catch (error: any) {
            console.error("Firebase Save Error:", error.message || String(error));
            throw new Error("فشل الحفظ في قاعدة البيانات السحابية");
        }
    },

    /**
     * استرجاع جميع التقييمات
     */
    async getAllAssessments(): Promise<AssessmentHistoryItem[]> {
        try {
            const q = collection(db, COLLECTION_NAME);
            const querySnapshot = await getDocs(q);
            
            const results: AssessmentHistoryItem[] = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data() as AssessmentHistoryItem;
                // Important: Ensure the ID we use is the Firestore Document ID
                results.push({ ...data, id: doc.id });
            });
            
            // ترتيب النتائج حسب التاريخ (الأحدث أولاً)
            return results.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            
        } catch (error: any) {
            console.error("Firebase Fetch Error:", error.message || String(error));
            return [];
        }
    },

    /**
     * حذف تقييم من قاعدة البيانات
     */
    async deleteAssessment(id: string): Promise<void> {
        if (!id) throw new Error("معرف المستند غير صالح");
        
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            await deleteDoc(docRef);
        } catch (error: any) {
            console.error("Firebase Delete Error:", error.message);
            const cleanError = new Error(error.message || "فشل الحذف");
            // @ts-ignore
            cleanError.code = error.code;
            throw cleanError;
        }
    },

    /**
     * حذف جميع التقييمات دفعة واحدة
     */
    async deleteAllAssessments(): Promise<boolean> {
        try {
            const q = collection(db, COLLECTION_NAME);
            const querySnapshot = await getDocs(q);
            
            if (querySnapshot.empty) return true;

            const batchSize = 500;
            const batches = [];
            let currentBatch = writeBatch(db);
            let currentBatchCount = 0;

            querySnapshot.docs.forEach((doc) => {
                currentBatch.delete(doc.ref);
                currentBatchCount++;

                if (currentBatchCount === batchSize) {
                    batches.push(currentBatch.commit());
                    currentBatch = writeBatch(db);
                    currentBatchCount = 0;
                }
            });

            if (currentBatchCount > 0) {
                batches.push(currentBatch.commit());
            }

            await Promise.all(batches);
            return true;
        } catch (error: any) {
            console.error("Firebase Batch Delete Error:", error.message);
            const cleanError = new Error(error.message || "فشل الحذف الجماعي");
            // @ts-ignore
            cleanError.code = error.code;
            throw cleanError;
        }
    },

    /**
     * جلب هيكل الأسئلة من قاعدة البيانات
     * إذا لم تكن موجودة، يعيد القيم الافتراضية ويقوم بحفظها في القاعدة
     */
    async getDomains(): Promise<Domain[]> {
        try {
            const docRef = doc(db, SETTINGS_COLLECTION, SCHEMA_DOC_ID);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.domains && Array.isArray(data.domains)) {
                    return data.domains as Domain[];
                }
            }

            // إذا لم يوجد المستند، قم بإنشائه بالقيم الافتراضية
            await setDoc(docRef, { domains: INITIAL_DOMAINS });
            return INITIAL_DOMAINS;

        } catch (error) {
            console.error("Error fetching domains:", error);
            return INITIAL_DOMAINS; // Fallback
        }
    },

    /**
     * حفظ تعديلات هيكل الأسئلة في قاعدة البيانات
     */
    async saveDomains(domains: Domain[]): Promise<void> {
        try {
            const docRef = doc(db, SETTINGS_COLLECTION, SCHEMA_DOC_ID);
            await setDoc(docRef, { domains: domains }, { merge: true });
        } catch (error: any) {
            console.error("Error saving domains:", error);
            throw new Error("فشل حفظ التعديلات في قاعدة البيانات");
        }
    },

    /**
     * إرسال رسالة جديدة للمجتمع
     */
    async sendFeedback(message: Omit<FeedbackMessage, 'id' | 'timestamp' | 'dateLabel'>): Promise<void> {
        try {
            await addDoc(collection(db, FEEDBACK_COLLECTION), {
                ...message,
                timestamp: serverTimestamp()
            });
        } catch (error: any) {
            console.error("Error sending feedback:", error);
            throw new Error("فشل إرسال الرسالة");
        }
    },

    /**
     * الاشتراك في رسائل المجتمع (تحديث لحظي)
     */
    subscribeToFeedback(callback: (messages: FeedbackMessage[]) => void): () => void {
        const q = query(
            collection(db, FEEDBACK_COLLECTION), 
            orderBy('timestamp', 'desc'), 
            limit(100)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const messages: FeedbackMessage[] = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                // Convert timestamp to readable string safely
                let dateLabel = "الآن";
                if (data.timestamp && data.timestamp.seconds) {
                    dateLabel = new Date(data.timestamp.seconds * 1000).toLocaleString('ar-SA');
                }
                
                messages.push({
                    id: doc.id,
                    name: data.name,
                    message: data.message,
                    role: data.role,
                    timestamp: data.timestamp,
                    dateLabel: dateLabel
                });
            });
            // Reverse to show newest at bottom if chat style, or keep desc for forum style.
            // Let's stick to Newest First (Top) for Forum style as per 'desc' order.
            callback(messages);
        });

        return unsubscribe;
    }
};
