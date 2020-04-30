import React, { FC } from 'react'
import { Box } from '@chakra-ui/core'

interface ScoreProps {
  isOpponent: boolean
  hits: any[]
}

const Score: FC<ScoreProps> = ({ isOpponent, hits }) => {
  const skewDeg = isOpponent ? -12 : 12
  const hitColor = isOpponent ? 'red.400' : 'green.400'
  return (
    <Box
      d="flex"
      w="212px"
      h="32px"
      borderRadius="md"
      bg="purple.500"
      justifyContent="space-around"
      p={1}
      mb={2}
      transform={`skewX(${skewDeg}deg)`}
    >
      {hits.map(() => (
        <Box borderRadius="sm" w="8px" bg={hitColor}></Box>
      ))}
      {[...Array.from(Array(17 - hits.length))].map(() => (
        <Box borderRadius="sm" w="8px" bg="purple.400"></Box>
      ))}
    </Box>
  )
}

export default Score
