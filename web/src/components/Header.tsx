import React, { FC, useContext } from 'react'
import { Box, Button, Flex, Avatar } from '@chakra-ui/core'
import { Link } from 'react-router-dom'
import UserContext from '../context/userContext'
import {
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuGroup,
  MenuDivider,
  MenuOptionGroup,
  MenuItemOption,
} from '@chakra-ui/core'
import { auth } from '../firebaseApp'

export interface HeaderProps {
  onStartMatchmaking: () => void
  onStopMatchmaking: () => void
  isMatchmaking: boolean
  time: number
}

const Header: FC<HeaderProps> = ({ onStopMatchmaking, onStartMatchmaking, isMatchmaking, time }) => {
  const { user } = useContext(UserContext)

  const signOut = () => {
    auth.signOut()
  }

  return (
    <Flex px={4} align="center" justify="space-between" bg="gray.800" w="100%" h="4rem">
      <Link to="/">Bombergrid</Link>
      {!isMatchmaking ? (
        <Button variantColor="green" onClick={onStartMatchmaking}>
          Search for opponent
        </Button>
      ) : (
        <Button variantColor="green" onClick={onStopMatchmaking}>
          Searching for opponent ... {time}
        </Button>
      )}
      <Menu>
        <MenuButton>
          <Avatar name={user?.displayName ?? undefined} />
        </MenuButton>
        <MenuList>
          <MenuItem onClick={signOut}>Sign out</MenuItem>
        </MenuList>
      </Menu>
    </Flex>
  )
}

export default Header
