import { Box, Button, Flex, Grid, Heading, Text, useToast } from '@chakra-ui/core'
import React, { useContext, useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router'
import GameBoardSquare from '../components/GameBoardSquare'
import GamePlacementGrid from '../components/GamePlacementGrid'
import Score from '../components/Score'
import RaisedButton from '../components/UI/RaisedButton'
import UserContext from '../context/userContext'
import { firestore, functions } from '../firebaseApp'

import UIFx from 'uifx'
import notificationSound from '../sounds/notification3.wav'
import hitSound from '../sounds/hit.wav'
import missSound from '../sounds/miss.wav'
import notAllowedSound from '../sounds/notallowed.wav'

const notificationFx = new UIFx(notificationSound, {
  volume: 0.05,
  throttleMs: 500,
})

const hitFx = new UIFx(hitSound, {
  volume: 0.5,
  throttleMs: 500,
})

const missFx = new UIFx(missSound, {
  volume: 0.5,
  throttleMs: 500,
})

const notAllowedFx = new UIFx(notAllowedSound, {
  volume: 0.5,
  throttleMs: 500,
})

const xy = Array.from(Array(10)).map(() => Array.from(Array(10)).map(() => false))

const shipLength = [5, 4, 3, 3, 2]

const Game = () => {
  const { user, displayName } = useContext(UserContext)
  const gridRef = useRef()
  const toast = useToast()
  const { gameId } = useParams()
  const [game, setGame] = useState<Game>()
  const [placement, setPlacement] = useState<{ [key: string]: [string] }>({})
  const [canSendPlacement, setCanSendPlacement] = useState<boolean>(false)
  const [isTrying, setIsTrying] = useState<boolean>(false)
  const [showOwnBoard, setShowOwnBoard] = useState<boolean>(false)
  const [personalPlacement, setPersonalPlacement] = useState<{ positions: string[] }[]>([])
  const [gridWidth, setGridWidth] = useState<number>(0)

  useEffect(() => {
    if (!user) return

    const unsubGames = firestore
      .collection('games')
      .doc(gameId)
      .onSnapshot((snapshot) => {
        const game: Game = { id: snapshot.id, ...snapshot.data()! } as Game
        notificationFx.play()
        setGame(game)
      })

    firestore
      .collection('users')
      .doc(user.uid)
      .collection('games')
      .doc(gameId)
      .get()
      .then((snapshot) => {
        console.log(snapshot.data())
        if (snapshot.data()!.placement) {
          setPersonalPlacement(snapshot.data()!.placement)
        }
      })
      .catch((err) => {
        console.log(err)
      })

    return () => {
      unsubGames()
    }
  }, [user, gameId])

  useEffect(() => {
    if (!gridRef.current) {
      return
    }
    const grid: HTMLElement = gridRef.current!
    const rect = grid.getBoundingClientRect()
    const width = (rect.width - 4) / 10
    setGridWidth(width)
  }, [showOwnBoard])

  const widthForShip = (ship: { positions: string[] }, index: number) => {
    const rotated = parseInt(ship.positions[0][1], 10) === parseInt(ship.positions[1][1], 10)
    if (rotated) {
      return `${gridWidth - 16}px`
    }
    return `${shipLength[index] * gridWidth - 16}px`
  }

  const heightForShip = (ship: { positions: string[] }, index: number) => {
    const rotated = parseInt(ship.positions[0][1], 10) === parseInt(ship.positions[1][1], 10)
    if (rotated) {
      return `${shipLength[index] * gridWidth - 16}px`
    }
    return `${gridWidth - 16}px`
  }

  const calculateYPosition = (ship: { positions: string[] }) => {
    const y = parseInt(ship.positions[0][3], 10)
    return `${y * gridWidth}px`
  }

  const calculateXPosition = (ship: { positions: string[] }) => {
    const x = parseInt(ship.positions[0][1], 10)
    return `${x * gridWidth}px`
  }

  const trySquare = async (square: string) => {
    //functions.useFunctionsEmulator('http://localhost:5001')
    if (game?.currentPlayer !== user?.uid || isTrying) {
      notAllowedFx.play()
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
          hitFx.play()
        } else {
          missFx.play()
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
    if (Object.keys(placement).length !== 5) return
    try {
      await firestore
        .collection('placements')
        .doc(gameId)
        .update({
          [user!.uid]: Object.values(placement),
        })
      const hasPlaced = [...(game?.hasPlaced || []), user?.uid]
      firestore.collection('games').doc(gameId).update({
        hasPlaced,
      })
    } catch (error) {
      console.error(error)
    }
  }

  if (!game?.players) return <Text>Loading</Text>

  const opponent = game?.players.find((player: string) => player !== user!.uid)!

  const handleShipsPlaced = (positions: { [key: string]: [string] }, isOverlapping: boolean) => {
    setPlacement(positions)
    setCanSendPlacement(!isOverlapping)
  }

  return (
    <Flex direction="column" justify="space-between">
      <Flex direction="column" p={2}>
        {game.winner ? (
          <Heading textAlign="center">
            {game.winner === user?.uid ? (
              <span>
                <span role="img" aria-label="Confetti">
                  🎉
                </span>
                You won
              </span>
            ) : (
              <span>
                <span role="img" aria-label="Sad face">
                  😔
                </span>
                Your opponent won
              </span>
            )}
          </Heading>
        ) : game.state === 'PLAYING' ? (
          <>
            <Heading textAlign="center">{game.currentPlayer === user?.uid ? 'Your' : 'Opponents'} turn</Heading>
            <Flex flexWrap="wrap" justifyContent="space-between" w="100%" maxW="550px" margin="0 auto" mb={2}>
              <Box>
                <Text fontSize="0.75rem">{displayName}</Text>
                {game.hits && (
                  <Score
                    isOpponent={false}
                    hits={game.hits[user!.uid].flatMap((ship: { hits: string[]; sunk: boolean }) => ship.hits)}
                  />
                )}
              </Box>
              <Box ml="auto" textAlign="right">
                <Text fontSize="0.75rem">{opponent || 'Opponent'}</Text>
                {game.hits && (
                  <Score
                    isOpponent
                    hits={game.hits[opponent].flatMap((ship: { hits: string[]; sunk: boolean }) => ship.hits)}
                  />
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
                boxShadow={game.currentPlayer === user?.uid ? '0px 0px 48px #FFEB3B' : 'none'}
              >
                {xy.map((yArray, yIndex) => {
                  return yArray.map((checked, xIndex) => (
                    <GameBoardSquare
                      xIndex={xIndex}
                      yIndex={yIndex}
                      game={game}
                      trySquare={trySquare}
                      isPersonalBoard={false}
                    />
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
                borderColor="blue.500"
                position="relative"
                ref={gridRef}
              >
                {xy.map((yArray, yIndex) => {
                  return yArray.map((checked, xIndex) => (
                    <GameBoardSquare
                      xIndex={xIndex}
                      yIndex={yIndex}
                      game={game}
                      trySquare={trySquare}
                      isPersonalBoard
                    />
                  ))
                })}
                {personalPlacement.map((ship, index) => {
                  return (
                    <Box
                      style={{
                        width: widthForShip(ship, index),
                        height: heightForShip(ship, index),
                        top: calculateYPosition(ship),
                        left: calculateXPosition(ship),
                      }}
                      borderRadius="full"
                      transform="translate3d(8px, 8px, 0px)"
                      bg="gray.400"
                      border="4px solid"
                      opacity={0.35}
                      pos="absolute"
                    ></Box>
                  )
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
        ) : game.hasPlaced && game.hasPlaced.includes(user!.uid) ? (
          <Heading p={4} textAlign="center">
            Waiting for opponent to place their ships
          </Heading>
        ) : (
          <>
            <Heading p={4} textAlign="center">
              Drag your ship placements
            </Heading>
            <GamePlacementGrid onShipsPlaced={handleShipsPlaced} />
            <Box p={8}>
              <RaisedButton
                w="100%"
                justifyContent="center"
                isDisabled={!canSendPlacement}
                onClick={() => confirmPlacement()}
              >
                <Text fontSize="1.25rem" fontWeight="700" color="white" textShadow="1px 1px 0px rgba(0,0,0,0.2)">
                  {!canSendPlacement ? `Position ships so they are not overlapping` : 'Submit placement'}
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
