import {
  Box,
  Flex,
  List,
  ListItem,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverContent,
  PopoverHeader,
  PopoverTrigger,
  Text,
} from '@chakra-ui/core'
import React, { useContext, useEffect, useRef, useState } from 'react'
import UserContext from '../context/userContext'
import { firestore, functions } from '../firebaseApp'
import IconButton from './UI/IconButton'
import RaisedButton from './UI/RaisedButton'
const GameChallenges = () => {
  const { user } = useContext(UserContext)
  const challengesRef = useRef<any[]>([])
  const [challenges, setChallenges] = useState<any[]>([])
  const [requestsLoading, setRequestsLoading] = useState<string[]>([])

  useEffect(() => {
    if (!user) return

    const unsubChallenges = firestore
      .collection('users')
      .doc(user?.uid)
      .collection('challenges')
      .onSnapshot((query) => {
        query.docChanges().forEach((change) => {
          const doc = change.doc
          if (change.type === 'added') {
            const data = { ...doc.data(), id: doc.id }
            challengesRef.current = [...challengesRef.current, data]
          }
          if (change.type === 'modified') {
            const id = doc.id
            challengesRef.current = challengesRef.current.map((challenge) => {
              if (challenge.id !== id) return challenge
              return { ...doc.data(), id: doc.id }
            })
          }
          if (change.type === 'removed') {
            const id = doc.id
            challengesRef.current = challengesRef.current.filter((challenge) => challenge.id !== id)
          }
        })
        setChallenges(challengesRef.current)
      })

    return () => {
      unsubChallenges()
    }
  }, [user])

  const declineChallenge = async (challengeId: string) => {
    if (requestsLoading.includes(challengeId)) return
    try {
      setRequestsLoading((ids) => [...ids, challengeId])
      await firestore.collection('users').doc(user?.uid).collection('challenges').doc(challengeId).delete()
      setRequestsLoading((ids) => ids.filter((id) => id !== challengeId))
    } catch (error) {
      setRequestsLoading((ids) => ids.filter((id) => id !== challengeId))
      console.error(error)
    }
  }

  const acceptChallenge = async (userId: string) => {
    if (requestsLoading.includes(userId)) return
    try {
      setRequestsLoading((ids) => [...ids, userId])
      const func = functions.httpsCallable('acceptChallenge')
      await func({ userId })
      setRequestsLoading((ids) => ids.filter((id) => id !== userId))
    } catch (error) {
      setRequestsLoading((ids) => ids.filter((id) => id !== userId))
      console.error(error)
    }
  }

  return (
    <Popover>
      <PopoverTrigger>
        <Box as="button" w="32px" h="32px" mr={4} pos="relative">
          <img src="/icons/bell.svg" alt="" />
          {challenges.length > 0 && (
            <Box
              pos="absolute"
              display="fled"
              justifyContent="center"
              alignItems="center"
              w={5}
              h={5}
              borderRadius="full"
              bg="red.500"
              color="white"
              fontSize="0.75rem"
              fontWeight="800"
              top="-0.5rem"
              right="-0.5rem"
            >
              {challenges.length}
            </Box>
          )}
        </Box>
      </PopoverTrigger>
      <PopoverContent zIndex={4} w="400px" maxW="calc(100% - 32px)" bg="purple.600" borderColor="purple.700">
        <PopoverArrow />
        <PopoverHeader borderColor="purple.700">Game challenges</PopoverHeader>
        <PopoverBody>
          <List>
            {challenges.map((challenge) => {
              return (
                <ListItem
                  d="flex"
                  p={2}
                  alignItems="center"
                  justifyContent="space-between"
                  key={challenge.id}
                  borderBottom="1px solid"
                  borderColor="purple.700"
                >
                  <Text whiteSpace="nowrap" mr={4}>
                    {challenge.displayName}
                  </Text>
                  <Flex>
                    <RaisedButton
                      isLoading={requestsLoading.includes(challenge.id)}
                      isDisabled={requestsLoading.includes(challenge.id)}
                      mr={2}
                      variantColor="green.400"
                      onClick={() => acceptChallenge(challenge.userId)}
                    >
                      <Box w="32px" h="32px" mr={2}>
                        <img src="/icons/like.svg" alt="" />
                      </Box>
                      <Text fontSize="1.25rem" fontWeight="700" color="white" textShadow="1px 1px 0px rgba(0,0,0,0.2)">
                        Accept
                      </Text>
                    </RaisedButton>
                    <IconButton
                      isLoading={requestsLoading.includes(challenge.id)}
                      isDisabled={requestsLoading.includes(challenge.id)}
                      variantColor="red.400"
                      onClick={() => declineChallenge(challenge.id)}
                    >
                      <Box w="32px" h="32px">
                        <img src="/icons/bad.svg" alt="" />
                      </Box>
                    </IconButton>
                  </Flex>
                </ListItem>
              )
            })}
          </List>
        </PopoverBody>
      </PopoverContent>
    </Popover>
  )
}

export default GameChallenges
