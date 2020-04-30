import firebase from 'firebase'
import { firestore } from './firebaseApp'

class FirebaseMatchmakingManager {
  matchmakingListener: (() => void) | null = null

  joinQueue = (uid: string): Promise<void> => {
    return firestore
      .collection('matchmaking')
      .doc(uid)
      .set({ created: firebase.firestore.FieldValue.serverTimestamp() })
  }

  exitQueue = (uid: string): Promise<void> => {
    return firestore.collection('matchmaking').doc(uid).delete()
  }

  subMatchmaking = (
    uid: string,
    success: (snapshot: firebase.firestore.DocumentSnapshot<firebase.firestore.DocumentData>) => void,
    error: (error: Error) => void
  ) => {
    this.matchmakingListener = firestore
      .collection('matchmaking')
      .doc(uid)
      .onSnapshot({ includeMetadataChanges: false }, success, error)
  }

  unsubMatchmaking = () => {
    this.matchmakingListener && this.matchmakingListener()
  }
}

export default FirebaseMatchmakingManager
