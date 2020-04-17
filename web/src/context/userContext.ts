import React from 'react'
import * as firebase from 'firebase'

const UserContext = React.createContext<{ user: firebase.User | null }>({ user: null })
export default UserContext
