import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

// Firebase Admin SDK configuration with better error handling
let app: any;

try {
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;

  if (!projectId || !clientEmail || !privateKey) {
    console.warn('Firebase Admin SDK environment variables not found. Some features may not work.');
    app = null;
  } else {
    const firebaseAdminConfig = {
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
      projectId,
    };

    // Initialize Firebase Admin SDK
    app = getApps().length === 0 ? initializeApp(firebaseAdminConfig) : getApps()[0]!;
  }
} catch (error) {
  console.error('Failed to initialize Firebase Admin SDK:', error);
  app = null;
}

// Export services with null checks
export const adminAuth = app ? getAuth(app) : null;
export const adminDb = app ? getFirestore(app) : null;
export const adminStorage = app ? getStorage(app) : null;

export default app;
