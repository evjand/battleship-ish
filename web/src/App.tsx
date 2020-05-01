import { Box, Spinner } from '@chakra-ui/core'
import firebase from 'firebase'
import React, { useEffect, useRef, useState } from 'react'
import { Route, Switch, useHistory } from 'react-router-dom'
import Header from './components/Header'
import UserContext from './context/userContext'
import { auth, firestore } from './firebaseApp'
import FirebaseMatchmakingManager from './FirebaseMatchmakingManager'
import Game from './pages/Game'
import Home from './pages/Home'
import Login from './pages/Login'
import Footer from './components/Footer'

const matchmakingManager = new FirebaseMatchmakingManager()

const App = () => {
  const [user, setUser] = useState<firebase.User | null>(null)
  const timerRef = useRef<NodeJS.Timeout>()
  const matchmakingListener = useRef<() => void>()

  const history = useHistory()

  const [time, setTime] = useState<number>(0)
  const [isMatchmaking, setIsMatchmaking] = useState<boolean>(false)

  const [initialLoad, setInitialLoad] = useState<boolean>(true)

  const startMatchmaking = async () => {
    if (!user) return
    setIsMatchmaking(true)
    startTimer()
    await matchmakingManager.joinQueue(user.uid)
    matchmakingManager.subMatchmaking(
      user.uid,
      (snapshot) => {
        if (snapshot.data()?.gameId) {
          stopMatchmaking()
          history.push(`/game/${snapshot.data()?.gameId}`)
        }
      },
      (error) => {
        console.error(error)
      }
    )
  }

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setTime((time) => time + 1)
    }, 1000)
  }

  const stopTimer = (timerRef: React.MutableRefObject<NodeJS.Timeout | undefined>) => {
    timerRef.current && clearInterval(timerRef.current)
  }

  const stopMatchmaking = () => {
    if (!user) return
    setIsMatchmaking(false)
    stopTimer(timerRef)
    setTime(0)
    matchmakingListener.current && matchmakingListener.current()
    matchmakingManager.exitQueue(user.uid)
  }

  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setUser(user)
      } else {
        setUser(null)
        try {
          //await auth.signInAnonymously()
        } catch (error) {
          console.error(error)
        }
      }
      setInitialLoad(false)
    })

    return () => {
      unsubAuth()
      matchmakingManager.unsubMatchmaking()
    }
  }, [])

  const [userData, setUserData] = useState<any>({})

  useEffect(() => {
    if (!user) return

    const unsubUserdata = firestore
      .collection('users')
      .doc(user?.uid)
      .onSnapshot((snapshot) => {
        if (snapshot.exists) {
          setUserData(snapshot.data())
        }
      })

    return () => {
      unsubUserdata()
    }
  }, [user])

  if (initialLoad)
    return (
      <Box as="main" h="100vh" overflow="auto" bg="gray.900" color="white">
        <Spinner
          color="white"
          position="absolute"
          top="50%"
          left="50%"
          transform="translate3d(-50%, -50%, 0)"
          size="xl"
        />
      </Box>
    )

  if (!user) {
    return <Login></Login>
  }

  return (
    <UserContext.Provider
      value={{ user, displayName: userData.displayName || '', friendCode: userData.friendCode || '' }}
    >
      <Box
        as="main"
        h="100vh"
        overflow="auto"
        background="linear-gradient(152deg, #6B46C1 0%, #553C9A 100%)"
        color="white"
      >
        <Header></Header>

        <Switch>
          <Route path="/game/:gameId">
            <Game />
          </Route>
          <Route path="/add/:friendCode">
            <Home
              onStartMatchmaking={startMatchmaking}
              onStopMatchmaking={stopMatchmaking}
              isMatchmaking={isMatchmaking}
              time={time}
            />
          </Route>
          <Route path="/">
            <Home
              onStartMatchmaking={startMatchmaking}
              onStopMatchmaking={stopMatchmaking}
              isMatchmaking={isMatchmaking}
              time={time}
            />
          </Route>
        </Switch>
        <Footer></Footer>
      </Box>
    </UserContext.Provider>
  )
}

export default App
