import { Flex, Heading, Icon, Link, Text } from '@chakra-ui/core'
import React, { FC } from 'react'

const Footer: FC = () => {
  return (
    <Flex align="center" justify="center" flexWrap="wrap" pt={8}>
      <Flex flexDir="column" p={4}>
        <Heading size="md">BETA</Heading>
        <Text maxW="400px">
          This game is currently in a public beta, and that means stuff might be a little unstable and any game or user
          data may be reset at any time.
        </Text>
      </Flex>
      <Flex flexDir="column" p={4}>
        <Heading size="md">Got feedback?</Heading>
        <Text maxW="400px">
          Please join our{' '}
          <Link textDecoration="underline" color="purple.100" href="http://discord.gg/vjWAPvC" isExternal>
            Discord <Icon name="external-link" mx="2px" />
          </Link>{' '}
          and give your feedback in the #beta-feedback channel.
        </Text>
      </Flex>
      <Flex flexDir="column" p={4}>
        <Heading size="md">Developed live on Twitch</Heading>
        <Text maxW="400px" mb={2}>
          If you would like to see how this game develops, please checkout our{' '}
          <Link textDecoration="underline" color="purple.100" href="https://twitch.tv/codepurpl" isExternal>
            Twitch stream. <Icon name="external-link" mx="2px" />
          </Link>
        </Text>
        Copyright © 2020 - Purpl AS
      </Flex>
    </Flex>
  )
}

export default Footer
