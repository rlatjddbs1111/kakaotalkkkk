import { getApp, getApps, initializeApp } from 'firebase/app'
import { getAuth, onAuthStateChanged, signInAnonymously, signOut, type User } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const env = import.meta.env

export const firebaseConfigured = Boolean(
  env.VITE_FIREBASE_API_KEY &&
  env.VITE_FIREBASE_AUTH_DOMAIN &&
  env.VITE_FIREBASE_PROJECT_ID &&
  env.VITE_FIREBASE_APP_ID,
)

const app = firebaseConfigured
  ? getApps().length ? getApp() : initializeApp({
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || undefined,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || undefined,
    appId: env.VITE_FIREBASE_APP_ID,
  })
  : null

export const firebaseAuth = app ? getAuth(app) : null
export const firestore = app ? getFirestore(app) : null

let identityPromise: Promise<User> | null = null

export function getAnonymousUser() {
  if (!firebaseAuth) return Promise.reject(new Error('Firebase 환경변수가 설정되지 않았습니다.'))
  if (firebaseAuth.currentUser) return Promise.resolve(firebaseAuth.currentUser)
  if (identityPromise) return identityPromise

  identityPromise = new Promise<User>((resolve, reject) => {
    let unsubscribe = () => {}
    unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
      unsubscribe()
      try {
        resolve(user ?? (await signInAnonymously(firebaseAuth)).user)
      } catch (error) {
        identityPromise = null
        reject(error)
      }
    }, (error) => {
      unsubscribe()
      identityPromise = null
      reject(error)
    })
  })
  return identityPromise
}

export async function beginAnonymousParticipant() {
  if (!firebaseAuth) return null
  if (firebaseAuth.currentUser) await signOut(firebaseAuth)
  identityPromise = null
  return getAnonymousUser()
}
