import React, { useContext, useRef, useState, useEffect } from 'react'
import UserContext from '../context/userContext'
import { firestore } from '../firebaseApp'
import { List, ListItem, Flex, Button, Text, Box } from '@chakra-ui/core'
import { Link } from 'react-router-dom'
import RaisedButton from './UI/RaisedButton'

const GameList = () => {
  const { user, displayName } = useContext(UserContext)
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
    <List mt={4}>
      {games.map((game) => {
        console.log(game)
        return (
          <ListItem key={game.id} mb={4} p={4} borderRadius="lg" bg="purple.700">
            <Flex justifyContent="space-between">
              <Box>
                <Text fontSize="0.75rem">{displayName}</Text>
                {game.hits && (
                  <Box
                    borderRadius="md"
                    d="flex"
                    w="128px"
                    h="32px"
                    bg="purple.500"
                    justifyContent="space-around"
                    p={1}
                    transform="skewX(12deg)"
                  >
                    {game.hits[user!.uid].map(() => (
                      <Box borderRadius="sm" w="8px" bg="green.400"></Box>
                    ))}
                    {[...Array.from(Array(10 - game.hits[user!.uid].length))].map(() => (
                      <Box borderRadius="sm" w="8px" bg="purple.400"></Box>
                    ))}
                  </Box>
                )}
              </Box>
              <Box textAlign="right">
                <Text fontSize="0.75rem">{game.opponentName || game.opponent}</Text>
                {game.hits && (
                  <Box
                    d="flex"
                    w="128px"
                    h="32px"
                    borderRadius="md"
                    bg="purple.500"
                    justifyContent="space-around"
                    p={1}
                    mb={2}
                    transform="skewX(-12deg)"
                  >
                    {game.hits[game.opponent].map(() => (
                      <Box borderRadius="sm" w="8px" bg="red.400"></Box>
                    ))}
                    {[...Array.from(Array(10 - game.hits[game.opponent].length))].map(() => (
                      <Box borderRadius="sm" w="8px" bg="purple.400"></Box>
                    ))}
                  </Box>
                )}
              </Box>
            </Flex>
            <Link to={`/game/${game.id}`}>
              <RaisedButton
                mt={4}
                w="100%"
                justifyContent="center"
                variantColor={game.currentPlayer === user?.uid ? 'teal.400' : 'purple.400'}
              >
                <Text
                  whiteSpace="nowrap"
                  fontSize="1.25rem"
                  fontWeight="700"
                  color="white"
                  textShadow="1px 1px 0px rgba(0,0,0,0.2)"
                >
                  {game.currentPlayer === user?.uid ? 'Your turn' : 'View game'}
                </Text>
              </RaisedButton>
            </Link>
          </ListItem>
        )
      })}
    </List>
  )
}

export default GameList
