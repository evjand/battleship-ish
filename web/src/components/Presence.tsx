import { Heading } from '@chakra-ui/core'
import firebase from 'firebase'
import React, { useContext, useEffect, useRef, useState } from 'react'
import UserContext from '../context/userContext'
import { firestore } from '../firebaseApp'

const Presence = () => {
  const { user } = useContext(UserContext)
  const presenceRef = useRef<any[]>([])
  const [usersOnline, setUsersOnline] = useState<string[]>([])
  useEffect(() => {
    if (!user) return
    const unsubPresence = firestore.collection('presence').onSnapshot((query) => {
      query.docChanges().forEach((change) => {
        const doc = change.doc
        if (change.type === 'added') {
          const data = { ...doc.data(), id: doc.id }
          presenceRef.current = [...presenceRef.current, data]
        }
        if (change.type === 'modified') {
          const id = doc.id
          presenceRef.current = presenceRef.current.map((uid) => {
            if (uid.id !== id) return uid
            return { ...doc.data(), id: doc.id }
          })
        }
        if (change.type === 'removed') {
          const id = doc.id
          presenceRef.current = presenceRef.current.filter((uid) => uid.id !== id)
        }
      })
      setUsersOnline(presenceRef.current)
    })

    addPresence(user.uid)
    setupBeforeUnloadListener()
    return () => {
      unsubPresence()
      deletePresence(user.uid)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const addPresence = async (userId: string) => {
    try {
      await firestore
        .collection('presence')
        .doc(userId)
        .set({ lastOnline: firebase.firestore.FieldValue.serverTimestamp() })
    } catch (error) {
      console.log(userId)
      console.log('Cant add presence')
    }
  }

  const deletePresence = async (userId: string) => {
    try {
      await firestore.collection('presence').doc(userId).delete()
    } catch (error) {
      console.log(userId)
      console.log('Cant delete presence')
      console.log(error)
    }
  }

  const setupBeforeUnloadListener = () => {
    if (!user) return
    window.addEventListener('beforeunload', (ev) => {
      ev.preventDefault()
      return deletePresence(user.uid)
    })
  }

  return <Heading>Users online: {usersOnline.length}</Heading>
}

export default Presence
