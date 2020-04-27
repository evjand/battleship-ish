import { Box, Grid, Heading, Text } from '@chakra-ui/core'
import React, { useContext, useEffect, useState, FC } from 'react'
import AddFriends from '../components/AddFriends'
import FriendList from '../components/FriendList'
import FriendRequests from '../components/FriendRequests'
import GameChallenges from '../components/GameChallenges'
import GameList from '../components/GameList'
import UserContext from '../context/userContext'
import { firestore } from '../firebaseApp'
import RaisedButton from '../components/UI/RaisedButton'

export interface MatchmakingProps {
  onStartMatchmaking: () => void
  onStopMatchmaking: () => void
  isMatchmaking: boolean
  time: number
}

const Home: FC<MatchmakingProps> = ({ onStartMatchmaking, onStopMatchmaking, isMatchmaking, time }) => {
  const { displayName, friendCode } = useContext(UserContext)

  return (
    <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} p={4} gridGap={6}>
      <Box bg="purple.800" p={4} rounded="lg" boxShadow="0px 0px 0px 8px #6B46C1">
        {!isMatchmaking ? (
          <RaisedButton w="100%" justifyContent="center" variantColor="teal.400" onClick={onStartMatchmaking}>
            <Text fontSize="1.25rem" fontWeight="700" color="white" textShadow="1px 1px 0px rgba(0,0,0,0.2)">
              Search for opponent
            </Text>
          </RaisedButton>
        ) : (
          <RaisedButton w="100%" justifyContent="center" variantColor="teal.400" onClick={onStopMatchmaking}>
            <Text fontSize="1.25rem" fontWeight="700" color="white" textShadow="1px 1px 0px rgba(0,0,0,0.2)">
              Searching for opponent ... {time}
            </Text>
          </RaisedButton>
        )}
        <GameList />
      </Box>
      <Box bg="purple.800" p={4} rounded="lg" boxShadow="0px 0px 0px 8px #6B46C1">
        <Heading>
          {displayName} ({friendCode})
        </Heading>
        <Heading mt={8} mb={2} size="md" fontWeight="900" textShadow="1px 1px 0px rgba(0,0,0,0.4)" letterSpacing="1px">
          Friends
        </Heading>
        <FriendList />
        <Heading mt={8} mb={2} size="md" fontWeight="900" textShadow="1px 1px 0px rgba(0,0,0,0.4)" letterSpacing="1px">
          Add new friends
        </Heading>
        <AddFriends />
      </Box>
    </Grid>
  )
}

export default Home
