import React from 'react'
import { PseudoBox, PseudoBoxProps, ButtonProps, Flex, Spinner } from '@chakra-ui/core'

interface IconButton {
  variantColor?: string
}

const IconButton: React.FC<PseudoBoxProps & ButtonProps & IconButton> = ({
  children,
  variantColor = 'purple.300',
  isLoading,
  isDisabled,
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
      p={2}
      alignItems="center"
      borderRadius={6}
      borderBottomColor={`${color}.${Math.min(colorGrade + 100, 900)}`}
      borderBottomWidth={4}
      transition="all 0.2s ease"
      outline="none"
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

export default IconButton
