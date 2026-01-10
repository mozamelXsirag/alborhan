
import { AssessmentHistoryItem } from '../types';
import { db } from './firebaseConfig';
import { collection, setDoc, getDocs, deleteDoc, doc, writeBatch } from 'firebase/firestore';

const COLLECTION_NAME = 'assessments';

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
            // إنشاء خطأ جديد نظيف لتجنب مشاكل Circular Structure
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
            // إنشاء خطأ جديد نظيف لتجنب مشاكل Circular Structure
            const cleanError = new Error(error.message || "فشل الحذف الجماعي");
            // @ts-ignore
            cleanError.code = error.code;
            throw cleanError;
        }
    }
};
