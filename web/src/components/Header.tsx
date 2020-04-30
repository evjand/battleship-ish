import { Avatar, Flex, Menu, MenuButton, MenuItem, MenuList } from '@chakra-ui/core'
import React, { FC, useContext } from 'react'
import { Link } from 'react-router-dom'
import UserContext from '../context/userContext'
import { auth } from '../firebaseApp'
import FriendRequests from './FriendRequests'
import GameChallenges from './GameChallenges'

const Header: FC = () => {
  const { user } = useContext(UserContext)

  const signOut = () => {
    auth.signOut()
  }

  return (
    <Flex
      px={4}
      align="center"
      justify="space-between"
      bg="purple.800"
      borderBottomWidth="2px"
      borderBottomColor="purple.900"
      w="100%"
      h="5rem"
    >
      <Link to="/">FireShips</Link>
      <Flex>
        <FriendRequests />
        <GameChallenges />
        <Menu>
          <MenuButton>
            <Avatar size="sm" name={user?.displayName ?? undefined} />
          </MenuButton>
          <MenuList border="none" boxShadow="md" bg="purple.500">
            <MenuItem
              _hover={{ backgroundColor: 'purple.600' }}
              _focus={{ backgroundColor: 'purple.600' }}
              onClick={signOut}
            >
              Sign out
            </MenuItem>
          </MenuList>
        </Menu>
      </Flex>
    </Flex>
  )
}

export default Header
