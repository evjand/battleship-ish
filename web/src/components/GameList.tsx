import { List, Heading } from '@chakra-ui/core'
import React, { useContext, useEffect, useRef, useState } from 'react'
import UserContext from '../context/userContext'
import { firestore } from '../firebaseApp'
import GameItem from './GameItem'

const GameList = () => {
  const { user } = useContext(UserContext)
  const gamesRef = useRef<any[]>([])
  const [games, setGames] = useState<UserGame[]>([])

  useEffect(() => {
    if (!user) return

    const unsubGames = firestore
      .collection('users')
      .doc(user?.uid)
      .collection('games')
      .onSnapshot((query) => {
        query.docChanges().forEach((change) => {
          const doc = change.doc
          if (change.type === 'added') {
            const data = { ...doc.data(), id: doc.id }
            gamesRef.current = [...gamesRef.current, data]
          }
          if (change.type === 'modified') {
            const id = doc.id
            gamesRef.current = gamesRef.current.map((game) => {
              if (game.id !== id) return game
              return { ...doc.data(), id: doc.id }
            })
          }
          if (change.type === 'removed') {
            const id = doc.id
            gamesRef.current = gamesRef.current.filter((game) => game.id !== id)
          }
        })
        setGames(gamesRef.current)
      })

    return () => {
      unsubGames()
    }
  }, [user])

  const notStarted = games.filter((game) => !game.currentPlayer)
  const playing = games.filter((game) => game.state === 'PLAYING')
  const done = games.filter((game) => game.state === 'DONE')

  return (
    <List mt={4}>
      {notStarted.length > 0 && <Heading>Not started</Heading>}
      {notStarted.map((game) => {
        return <GameItem game={game} />
      })}
      {playing.length > 0 && <Heading>Playing</Heading>}
      {playing.map((game) => {
        return <GameItem game={game} />
      })}
      {done.length > 0 && <Heading>Finished</Heading>}
      {done.map((game) => {
        return <GameItem game={game} />
      })}
    </List>
  )
}

export default GameList
