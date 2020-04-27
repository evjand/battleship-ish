import React from 'react'
import { PseudoBox, PseudoBoxProps, ButtonProps, Spinner, Box, Flex } from '@chakra-ui/core'

interface RaisedButtonProps {
  variantColor?: string
}

const RaisedButton: React.FC<PseudoBoxProps & ButtonProps & RaisedButtonProps> = ({
  children,
  variantColor = 'purple.400',
  isDisabled,
  isLoading,
  ...props
}) => {
  const splitColor = variantColor.split('.')
  const colorGrade = parseInt(splitColor[1], 10)
  const color = splitColor[0]
  return (
    <PseudoBox
      as="button"
      d="flex"
      bg={variantColor}
      py={2}
      pb={1}
      px={4}
      alignItems="center"
      borderRadius={6}
      borderBottomColor={`${color}.${Math.min(colorGrade + 100, 900)}`}
      borderBottomWidth={4}
      transition="all 0.2s ease"
      outline="none"
      pos="relative"
      aria-disabled={isDisabled}
      _hover={{
        backgroundColor: `${color}.${Math.min(colorGrade + 100, 900)}`,
        borderBottomColor: `${color}.${Math.min(colorGrade + 200, 900)}`,
      }}
      _focus={{
        boxShadow: 'outline',
      }}
      _active={{
        borderBottomWidth: '2px',
        mt: '2px',
      }}
      _disabled={{
        opacity: 0.5,
        cursor: 'not-allowed',
      }}
      {...props}
    >
      <Flex opacity={isLoading ? 0 : 1}>{children}</Flex>
      <Spinner
        opacity={isLoading ? 1 : 0}
        pos="absolute"
        top="calc(50% - 12px)"
        left="calc(50% - 12px)"
        w="24px"
        h="24px"
      />
    </PseudoBox>
  )
}

export default RaisedButton
