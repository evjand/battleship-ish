import React, { useContext, useEffect, useState } from 'react'
import { firestore, functions } from '../firebaseApp'
import UserContext from '../context/userContext'
import { useParams } from 'react-router'
import { Button, Grid, Box, Flex, Heading, Text, useToast } from '@chakra-ui/core'
import RaisedButton from '../components/UI/RaisedButton'
import { useDrag } from 'react-use-gesture'
import GamePlacementGrid from '../components/GamePlacementGrid'

const xy = Array.from(Array(10)).map(() => Array.from(Array(10)).map(() => false))

const Game = () => {
  const { user, displayName } = useContext(UserContext)
  const toast = useToast()
  const { gameId } = useParams()
  const [game, setGame] = useState<firebase.firestore.DocumentData>({})
  const [placement, setPlacement] = useState<string[]>([])
  const [isTrying, setIsTrying] = useState<boolean>(false)
  const [showOwnBoard, setShowOwnBoard] = useState<boolean>(false)

  useEffect(() => {
    if (!user) return

    const unsubGames = firestore
      .collection('games')
      .doc(gameId)
      .onSnapshot((snapshot) => {
        setGame(snapshot.data()!)
      })

    return () => {
      unsubGames()
    }
  }, [user, gameId])

  const addToPlacement = (square: string) => {
    setPlacement((places) =>
      places.includes(square)
        ? places.filter((p) => p !== square)
        : placement.length < 10
        ? [...places, square]
        : places
    )
  }

  const trySquare = async (square: string) => {
    //functions.useFunctionsEmulator('http://localhost:5001')
    if (game.currentPlayer !== user?.uid || isTrying) {
      toast({
        title: 'Not your turn.',
        description: "Couldn't fire rocket, its not your turn.",
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    } else {
      const trySquareFunc = functions.httpsCallable('trySquare')
      try {
        setIsTrying(true)
        const response = await trySquareFunc({ square, gameId })
        const { isHit, gameIsWon } = response.data
        if (isHit) {
          toast({
            title: 'You hit one of the ships',
            status: 'info',
            duration: 3000,
            isClosable: true,
          })
        }
        if (gameIsWon) {
          toast({
            title: 'You one the game!!',
            description: 'Congrats',
            status: 'success',
            duration: 3000,
            isClosable: true,
          })
        }

        setIsTrying(false)
      } catch (error) {
        console.error(error)
        setIsTrying(false)
      }
    }
  }

  const confirmPlacement = async () => {
    if (placement.length !== 10) return
    try {
      await firestore
        .collection('placements')
        .doc(gameId)
        .update({
          [user!.uid]: placement,
        })
      const hasPlaced = [...(game.hasPlaced || []), user?.uid]
      firestore.collection('games').doc(gameId).update({
        hasPlaced,
      })
    } catch (error) {
      console.error(error)
    }
  }

  if (!game.players) return <Text>Loading</Text>

  const opponent = game.players.find((player: string) => player !== user!.uid)

  console.log(game)

  return (
    <Flex direction="column" justify="space-between">
      <Flex direction="column" p={2}>
        {game.winner && <Heading>Winner {game.winner === user?.uid ? 'You won' : 'Your opponent won'}</Heading>}
        {game.state === 'PLAYING' ? (
          <>
            <Heading textAlign="center">{game.currentPlayer === user?.uid ? 'Your' : 'Opponents'} turn</Heading>
            <Flex justifyContent="space-between" w="100%" maxW="550px" margin="0 auto" mb={2}>
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
                <Text fontSize="0.75rem">{game.opponentName || game.opponent || 'Opponent'}</Text>
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
                    {game.hits[opponent].map(() => (
                      <Box borderRadius="sm" w="8px" bg="red.400"></Box>
                    ))}
                    {[...Array.from(Array(10 - game.hits[opponent].length))].map(() => (
                      <Box borderRadius="sm" w="8px" bg="purple.400"></Box>
                    ))}
                  </Box>
                )}
              </Box>
            </Flex>
            {!showOwnBoard ? (
              <Grid
                gridTemplateColumns="repeat(10, 1fr)"
                w="100%"
                maxW="550px"
                margin="0 auto"
                border="2px solid"
                borderColor="blue.500"
              >
                {xy.map((yArray, xIndex) => {
                  return yArray.map((checked, yIndex) => (
                    <Button
                      onClick={() => trySquare(`x${xIndex}y${yIndex}`)}
                      key={`${xIndex}-${yIndex}`}
                      isDisabled={game.tries[user!.uid].includes(`x${xIndex}y${yIndex}`)}
                      border="2px solid"
                      borderColor="blue.500"
                      borderRadius="none"
                      w="100%"
                      p={0}
                      paddingTop="100%"
                      minW="auto"
                      h="auto"
                      _hover={{
                        boxShadow: 'inset 0px 0px 0px 2px red',
                      }}
                      _disabled={{
                        boxShadow: 'none',
                      }}
                      _active={{}}
                      transition="none"
                      bg={
                        game.hits[user!.uid].includes(`x${xIndex}y${yIndex}`)
                          ? 'green.300'
                          : game.tries[user!.uid].includes(`x${xIndex}y${yIndex}`)
                          ? 'red.500'
                          : 'blue.700'
                      }
                    >
                      <Text></Text>
                    </Button>
                  ))
                })}
              </Grid>
            ) : (
              <Grid
                gridTemplateColumns="repeat(10, 1fr)"
                w="100%"
                maxW="550px"
                margin="0 auto"
                border="2px solid"
                borderColor="blue.200"
              >
                {xy.map((yArray, xIndex) => {
                  return yArray.map((checked, yIndex) => (
                    <Box
                      key={`${xIndex}-${yIndex}`}
                      //={() => toggleButtonAt(xIndex, yIndex)}
                      border="2px solid"
                      borderColor="blue.200"
                      w="100%"
                      paddingTop="100%"
                      bg={
                        game.hits[opponent].includes(`x${xIndex}y${yIndex}`)
                          ? 'red.500'
                          : game.tries[opponent].includes(`x${xIndex}y${yIndex}`)
                          ? 'green.300'
                          : 'blue.300'
                      }
                    ></Box>
                  ))
                })}
              </Grid>
            )}
            <Flex margin="0 auto" p={8}>
              <Button mr={2} variantColor="teal" isDisabled={!showOwnBoard} onClick={() => setShowOwnBoard(false)}>
                Playing board
              </Button>
              <Button variantColor="teal" isDisabled={showOwnBoard} onClick={() => setShowOwnBoard(true)}>
                My board
              </Button>
            </Flex>
          </>
        ) : game.hasPlaced && game.hasPlaced.includes(user?.uid) ? (
          <Heading>Waiting for opponent to place their ships</Heading>
        ) : (
          <>
            <Heading py={4}>Select 10 squares to place ships on</Heading>
            <GamePlacementGrid />
            <Box p={8}>
              <RaisedButton
                w="100%"
                justifyContent="center"
                isDisabled={placement.length !== 10}
                onClick={() => confirmPlacement()}
              >
                <Text fontSize="1.25rem" fontWeight="700" color="white" textShadow="1px 1px 0px rgba(0,0,0,0.2)">
                  {placement.length !== 10 ? `${10 - placement.length} squares left` : 'Submit placement'}
                </Text>
              </RaisedButton>
            </Box>
          </>
        )}
      </Flex>
    </Flex>
  )
}

export default Game
