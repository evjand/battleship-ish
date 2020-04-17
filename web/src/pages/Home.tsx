import { Box, Heading, List, ListItem, Text } from '@chakra-ui/core'
import React, { useContext, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import UserContext from '../context/userContext'
import { firestore } from '../firebaseApp'

const Home = () => {
  const { user } = useContext(UserContext)
  const gamesRef = useRef<any[]>([])
  const [games, setGames] = useState<any[]>([])
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
  return (
    <>
      <Heading>Home</Heading>
      <Box bg="gray.800" p={8}>
        <List>
          {games.map((game) => {
            return (
              <ListItem key={game.id} pb={4}>
                <Link to={`/game/${game.id}`}>
                  <Text>Game ID: {game.id}</Text>
                </Link>
                <Text>{game.currentPlayer === user?.uid ? 'Your turn' : 'Not your turn'}</Text>
                <Text>Opponent ID: {game.opponent}</Text>
              </ListItem>
            )
          })}
        </List>
      </Box>
    </>
  )
}

export default Home
