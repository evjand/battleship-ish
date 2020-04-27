import React from 'react'
import * as firebase from 'firebase'

const UserContext = React.createContext<{ user: firebase.User | null; displayName: string; friendCode: string }>({
  user: null,
  displayName: '',
  friendCode: '',
})
export default UserContext
