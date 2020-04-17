import React, { useContext, useEffect, useState } from 'react'
import { firestore, functions } from '../firebaseApp'
import UserContext from '../context/userContext'
import { useParams } from 'react-router'
import { Button, Grid, Box, Flex, Heading, Text, useToast } from '@chakra-ui/core'

const xy = Array.from(Array(10)).map(() => Array.from(Array(10)).map(() => false))

const Game = () => {
  const { user } = useContext(UserContext)
  const toast = useToast()
  const { gameId } = useParams()
  const [game, setGame] = useState<firebase.firestore.DocumentData>({})
  const [placement, setPlacement] = useState<string[]>([])
  const [isTrying, setIsTrying] = useState<boolean>(false)

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
    if (placement.length >= 10) {
      return
    }
    setPlacement((places) => (places.includes(square) ? places.filter((p) => p !== square) : [...places, square]))
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

  return (
    <Flex direction="column">
      {game.winner && <Heading>Winner {game.winner === user?.uid ? 'You won' : 'Your opponent won'}</Heading>}
      <Heading>
        Status: {game.state}, {game.currentPlayer === user?.uid ? 'Your' : 'Opponents'} turn
      </Heading>
      <Flex>
        {game.state === 'PLAYING' ? (
          <>
            <Grid gridTemplateColumns="repeat(10, 3rem)" mr={4}>
              {xy.map((yArray, xIndex) => {
                return yArray.map((checked, yIndex) => (
                  <Button
                    onClick={() => trySquare(`x${xIndex}y${yIndex}`)}
                    key={`${xIndex}-${yIndex}`}
                    isDisabled={game.tries[user!.uid].includes(`x${xIndex}y${yIndex}`)}
                    borderColor="gray.400"
                    border="1px solid"
                    w="3rem"
                    h="3rem"
                    minW={0}
                    rounded="none"
                    p={0}
                    fontSize="0.3rem"
                    background={
                      game.hits[user!.uid].includes(`x${xIndex}y${yIndex}`)
                        ? 'green'
                        : game.tries[user!.uid].includes(`x${xIndex}y${yIndex}`)
                        ? 'red'
                        : 'grey'
                    }
                  >{`x${xIndex}y${yIndex}`}</Button>
                ))
              })}
            </Grid>
            <Grid gridTemplateColumns="repeat(10, 3rem)">
              {xy.map((yArray, xIndex) => {
                return yArray.map((checked, yIndex) => (
                  <Box
                    key={`${xIndex}-${yIndex}`}
                    //={() => toggleButtonAt(xIndex, yIndex)}
                    borderColor="gray.400"
                    border="1px solid"
                    w="3rem"
                    h="3rem"
                    background={
                      game.hits[opponent].includes(`x${xIndex}y${yIndex}`)
                        ? 'red'
                        : game.tries[opponent].includes(`x${xIndex}y${yIndex}`)
                        ? 'green'
                        : 'grey'
                    }
                  ></Box>
                ))
              })}
            </Grid>
          </>
        ) : game.hasPlaced && game.hasPlaced.includes(user?.uid) ? (
          <Heading>Waiting for opponent to place their ships</Heading>
        ) : (
          <>
            <Grid gridTemplateColumns="repeat(10, 3rem)">
              {xy.map((yArray, xIndex) => {
                return yArray.map((checked, yIndex) => (
                  <Box
                    as="button"
                    onClick={() => addToPlacement(`x${xIndex}y${yIndex}`)}
                    key={`${xIndex}-${yIndex}`}
                    //={() => toggleButtonAt(xIndex, yIndex)}
                    borderColor="gray.400"
                    border="1px solid"
                    w="3rem"
                    h="3rem"
                    background={placement.includes(`x${xIndex}y${yIndex}`) ? 'green' : 'grey'}
                  >{`x${xIndex}y${yIndex}`}</Box>
                ))
              })}
            </Grid>
            <Flex p={6} direction="column">
              Current placements:{' '}
              <ul>
                {placement.map((square) => (
                  <li>{square}</li>
                ))}
              </ul>
              <Button isDisabled={placement.length !== 10} onClick={() => confirmPlacement()}>
                Submit placement
              </Button>
            </Flex>
          </>
        )}
      </Flex>
    </Flex>
  )
}

export default Game
