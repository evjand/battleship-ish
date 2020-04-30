import React, { FC, useContext } from 'react'
import { PseudoBox } from '@chakra-ui/core'
import UserContext from '../context/userContext'

interface GameBoardSquareProps {
  xIndex: number
  yIndex: number
  game: Game
  trySquare: (square: string) => void
  isPersonalBoard: boolean
}

const GameBoardSquare: FC<GameBoardSquareProps> = ({ xIndex, yIndex, game, trySquare, isPersonalBoard }) => {
  const { user } = useContext(UserContext)
  const opponent = game?.players.find((player: string) => player !== user!.uid)!
  const square = `x${xIndex}y${yIndex}`
  const hits: { square: string; sunk: boolean }[] = game.hits[
    !isPersonalBoard ? user!.uid : opponent
  ].flatMap((ship: HitShip) => ship.hits.map((hit) => ({ square: hit, sunk: ship.sunk })))
  const hit: { square: string; sunk: boolean } | undefined = hits.find((h) => h.square === square)
  const tried = game.tries[!isPersonalBoard ? user!.uid : opponent].includes(square)
  return (
    <PseudoBox
      as={tried || isPersonalBoard ? 'div' : 'button'}
      onClick={() => trySquare(square)}
      key={`${xIndex}-${yIndex}`}
      aria-disabled={tried}
      border="2px solid"
      borderColor={hit && hit.sunk ? 'red.800' : 'blue.500'}
      borderRadius="none"
      w="100%"
      p={0}
      paddingTop="calc(100% - 4px)"
      minW="auto"
      h="auto"
      _hover={{
        boxShadow: tried || isPersonalBoard ? 'none' : 'inset 0px 0px 0px 2px red',
      }}
      _disabled={{
        boxShadow: 'none',
        cursor: 'default',
      }}
      _active={{}}
      opacity={hit && hit.sunk ? 0.8 : 1}
      transition="none"
      backgroundRepeat="no-repeat"
      backgroundPosition="center center"
      backgroundSize="80%"
      backgroundColor={hit ? (hit.sunk ? 'red.800' : 'blue.800') : tried ? 'blue.800' : 'blue.700'}
      backgroundImage={hit ? 'url(/icons/explosion.svg)' : tried ? 'url(/icons/miss.svg)' : 'none'}
    />
  )
}

export default GameBoardSquare
