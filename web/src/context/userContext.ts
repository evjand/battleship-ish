import React from 'react'
import * as firebase from 'firebase'

interface UserContext {
  user: firebase.User | null
  displayName: string
  friendCode: string
}

const UserContext = React.createContext<UserContext>({
  user: null,
  displayName: '',
  friendCode: '',
})
export default UserContext
