import React, { FC, useContext } from 'react'
import { ListItem, Flex, Box, Text } from '@chakra-ui/core'
import Score from './Score'
import { Link } from 'react-router-dom'
import RaisedButton from './UI/RaisedButton'
import UserContext from '../context/userContext'

interface GameItemProps {
  game: UserGame
}

const GameItem: FC<GameItemProps> = ({ game }) => {
  const { user, displayName } = useContext(UserContext)
  return (
    <ListItem key={game.id} mb={4} p={4} borderRadius="lg" bg="purple.700">
      <Flex flexWrap="wrap" justifyContent="space-between">
        <Box>
          <Text fontSize="0.75rem">{displayName}</Text>
          {game.hits && <Score isOpponent={false} hits={game.hits[user!.uid].flatMap((ship) => ship.hits)} />}
        </Box>
        <Box ml="auto" textAlign="right">
          <Text fontSize="0.75rem">{game.opponentName || game.opponent}</Text>
          {game.hits && <Score isOpponent hits={game.hits[game.opponent].flatMap((ship) => ship.hits)} />}
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
            {game.currentPlayer === user?.uid ? 'Your turn' : game.state === 'PLAYING' ? 'View game' : 'Place ships'}
          </Text>
        </RaisedButton>
      </Link>
    </ListItem>
  )
}

export default GameItem
