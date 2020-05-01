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
import UIFx from 'uifx'
import notificationSound from '../sounds/notification1.wav'
import acceptedSound from '../sounds/accepted.wav'
import declineSound from '../sounds/decline.wav'

const notificationFx = new UIFx(notificationSound, {
  volume: 0.5,
  throttleMs: 100,
})

const acceptedFx = new UIFx(acceptedSound, {
  volume: 0.5,
  throttleMs: 100,
})

const declineFx = new UIFx(declineSound, {
  volume: 0.5,
  throttleMs: 100,
})

const FriendRequests = () => {
  const { user } = useContext(UserContext)
  const friendsReqRef = useRef<any[]>([])
  const [friendsReq, setFriendsReq] = useState<any[]>([])
  const [requestsLoading, setRequestsLoading] = useState<string[]>([])

  useEffect(() => {
    if (!user) return

    const unsubFriendsReq = firestore
      .collection('users')
      .doc(user?.uid)
      .collection('friend-requests')
      .onSnapshot((query) => {
        query.docChanges().forEach((change) => {
          const doc = change.doc
          if (change.type === 'added') {
            const data = { ...doc.data(), id: doc.id }
            friendsReqRef.current = [...friendsReqRef.current, data]
            notificationFx.play()
          }
          if (change.type === 'modified') {
            const id = doc.id
            friendsReqRef.current = friendsReqRef.current.map((game) => {
              if (game.id !== id) return game
              return { ...doc.data(), id: doc.id }
            })
          }
          if (change.type === 'removed') {
            const id = doc.id
            friendsReqRef.current = friendsReqRef.current.filter((game) => game.id !== id)
          }
        })
        setFriendsReq(friendsReqRef.current)
      })

    return () => {
      unsubFriendsReq()
    }
  }, [user])

  const acceptFriendRequest = async (userId: string) => {
    if (requestsLoading.includes(userId)) return
    try {
      setRequestsLoading((ids) => [...ids, userId])
      const func = functions.httpsCallable('acceptFriendRequest')
      await func({ userId })
      acceptedFx.play()
      setRequestsLoading((ids) => ids.filter((id) => id !== userId))
    } catch (error) {
      setRequestsLoading((ids) => ids.filter((id) => id !== userId))
      console.error(error)
    }
  }

  const declineFriendRequest = async (requestId: string) => {
    if (requestsLoading.includes(requestId)) return
    try {
      setRequestsLoading((ids) => [...ids, requestId])
      await firestore.collection('users').doc(user?.uid).collection('friend-requests').doc(requestId).delete()
      declineFx.play()
      setRequestsLoading((ids) => ids.filter((id) => id !== requestId))
    } catch (error) {
      setRequestsLoading((ids) => ids.filter((id) => id !== requestId))
      console.error(error)
    }
  }

  return (
    <Popover>
      <PopoverTrigger>
        <Box as="button" w="32px" h="32px" mr={4} pos="relative">
          <img src="/icons/users.svg" alt="" />
          {friendsReq.length > 0 && (
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
              {friendsReq.length}
            </Box>
          )}
        </Box>
      </PopoverTrigger>
      <PopoverContent zIndex={4} w="400px" maxW="calc(100% - 32px)" bg="purple.600" borderColor="purple.700">
        <PopoverArrow />
        <PopoverHeader borderColor="purple.700">Friend requests</PopoverHeader>
        <PopoverBody>
          <List>
            {friendsReq.map((friendReq) => {
              return (
                <ListItem
                  d="flex"
                  p={2}
                  alignItems="center"
                  justifyContent="space-between"
                  key={friendReq.id}
                  borderBottom="1px solid"
                  borderColor="purple.700"
                >
                  <Text whiteSpace="nowrap" mr={4}>
                    {friendReq.displayName}
                  </Text>
                  <Flex>
                    <RaisedButton
                      isLoading={requestsLoading.includes(friendReq.id)}
                      isDisabled={requestsLoading.includes(friendReq.id)}
                      mr={2}
                      variantColor="green.400"
                      onClick={() => acceptFriendRequest(friendReq.id)}
                    >
                      <Box w="32px" h="32px" mr={2}>
                        <img src="/icons/like.svg" alt="" />
                      </Box>
                      <Text fontSize="1.25rem" fontWeight="700" color="white" textShadow="1px 1px 0px rgba(0,0,0,0.2)">
                        Accept
                      </Text>
                    </RaisedButton>
                    <IconButton
                      isLoading={requestsLoading.includes(friendReq.id)}
                      isDisabled={requestsLoading.includes(friendReq.id)}
                      variantColor="red.400"
                      onClick={() => declineFriendRequest(friendReq.id)}
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

export default FriendRequests
