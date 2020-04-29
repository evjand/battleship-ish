import React, { useState, useEffect } from 'react'
import { Input, Text, Box, Button } from '@chakra-ui/core'
import { firestore, functions } from '../firebaseApp'
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
} from '@chakra-ui/core'

interface PublicUser {
  displayName: string
  userId: string
}

const AddFriends = () => {
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [foundUser, setFoundUser] = useState<PublicUser | undefined>()

  useEffect(() => {
    if (searchQuery.length < 3) return

    searchForUsers(searchQuery)
  }, [searchQuery])

  const sendFriendRequest = async (userId: string) => {
    try {
      const func = functions.httpsCallable('sendFriendRequest')
      await func({ userId })
    } catch (error) {
      console.error(error)
    }
  }

  const searchForUsers = async (query: string) => {
    try {
      const publicUserSnapshot = await firestore.collection('public-users').doc(query).get()
      if (!publicUserSnapshot.exists) {
        setFoundUser(undefined)
        console.log('No user found')
        return
      }
      const publicUser: PublicUser = publicUserSnapshot.data() as PublicUser
      console.log(publicUser)
      setFoundUser(publicUser)
    } catch (error) {
      console.log('Error, No user found')
      setFoundUser(undefined)
    }
  }

  const onClose = () => {
    setFoundUser(undefined)
    setSearchQuery('')
  }

  return (
    <>
      <Input
        bg="purple.400"
        color="purple.900"
        h="52px"
        border="none"
        placeholder="Friend Code"
        _placeholder={{
          color: 'purple.700',
        }}
        value={searchQuery}
        onChange={(event: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(event.target.value)}
      />
      <Modal isOpen={!!foundUser} onClose={onClose}>
        <ModalOverlay />
        {foundUser && (
          <ModalContent>
            <ModalHeader>{foundUser.displayName}</ModalHeader>
            <ModalCloseButton />
            <ModalBody></ModalBody>

            <ModalFooter>
              <Button variantColor="blue" mr={3} onClick={onClose}>
                Close
              </Button>
              <Button variantColor="green" onClick={() => sendFriendRequest(foundUser.userId)}>
                Add friend
              </Button>
            </ModalFooter>
          </ModalContent>
        )}
      </Modal>
    </>
  )
}

export default AddFriends