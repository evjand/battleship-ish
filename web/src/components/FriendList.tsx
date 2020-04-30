import { Box, List, ListItem, Text } from '@chakra-ui/core'
import React, { useContext, useEffect, useRef, useState } from 'react'
import UserContext from '../context/userContext'
import { firestore, functions } from '../firebaseApp'
import RaisedButton from './UI/RaisedButton'

const FriendList = () => {
  const { user } = useContext(UserContext)
  const friendsRef = useRef<any[]>([])
  const [friends, setFriends] = useState<any[]>([])
  const [challengesLoading, setChallengesLoading] = useState<string[]>([])

  useEffect(() => {
    if (!user) return

    const unsubFriends = firestore
      .collection('users')
      .doc(user?.uid)
      .collection('friends')
      .onSnapshot((query) => {
        query.docChanges().forEach((change) => {
          const doc = change.doc
          if (change.type === 'added') {
            const data = { ...doc.data(), id: doc.id }
            friendsRef.current = [...friendsRef.current, data]
          }
          if (change.type === 'modified') {
            const id = doc.id
            friendsRef.current = friendsRef.current.map((game) => {
              if (game.id !== id) return game
              return { ...doc.data(), id: doc.id }
            })
          }
          if (change.type === 'removed') {
            const id = doc.id
            friendsRef.current = friendsRef.current.filter((game) => game.id !== id)
          }
        })
        setFriends(friendsRef.current)
      })

    return () => {
      unsubFriends()
    }
  }, [user])

  const sendChallenge = async (userId: string) => {
    if (challengesLoading.includes(userId)) return
    try {
      setChallengesLoading((ids) => [...ids, userId])
      const func = functions.httpsCallable('sendChallenge')
      await func({ userId })
      setChallengesLoading((ids) => ids.filter((id) => id !== userId))
    } catch (error) {
      setChallengesLoading((ids) => ids.filter((id) => id !== userId))
      console.error(error)
    }
  }

  return (
    <List>
      {friends.map((friend) => {
        return (
          <ListItem
            d="flex"
            py={4}
            alignItems="center"
            justifyContent="space-between"
            key={friend.id}
            borderBottom="2px solid"
            borderColor="purple.700"
          >
            <Text fontSize="1.25rem">{friend.displayName}</Text>
            <RaisedButton
              isLoading={challengesLoading.includes(friend.userId)}
              isDisabled={challengesLoading.includes(friend.userId)}
              variantColor="orange.300"
              onClick={() => sendChallenge(friend.userId)}
            >
              <Box w="32px" h="32px" mr={2}>
                <img src="/icons/swords.svg" alt="" />
              </Box>
              <Text fontSize="1.25rem" fontWeight="700" color="white" textShadow="1px 1px 0px rgba(0,0,0,0.2)">
                Challenge
              </Text>
            </RaisedButton>
          </ListItem>
        )
      })}
    </List>
  )
}

export default FriendList
