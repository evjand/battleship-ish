import React, { FC } from 'react'
import { Grid, Flex, Heading, Text } from '@chakra-ui/core'

const Footer: FC = () => {
  return (
    <Flex align="center" justify="center" flexWrap="wrap" pt={8}>
      <Flex flexDir="column" p={4}>
        <Heading size="md">BETA</Heading>
        <Text maxW="400px">
          This game is currently in a public beta, and that means stuff might be a little unstable and any game or user
          date may be reset at any time.
        </Text>
      </Flex>
      <Flex flexDir="column" p={4}>
        <Heading size="md">Got feedback?</Heading>
        <Text maxW="400px">
          Please join our <a href="http://discord.gg/vjWAPvC">Discord</a> and give your feedback in the #beta-feedback
          channel.
        </Text>
      </Flex>
      <Flex flexDir="column" p={4}>
        Copyright © 2020 - Purpl AS
      </Flex>
    </Flex>
  )
}

export default Footer
