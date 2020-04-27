import React, { useState } from 'react'
import { Box, Flex, FormControl, FormLabel, Input, FormErrorMessage, Button } from '@chakra-ui/core'
import { auth } from '../firebaseApp'

interface EmailSigninError {
  code: string
  message: string
}

const Login = () => {
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [formError, setFormError] = useState<EmailSigninError>()
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    try {
      setIsLoggingIn(true)
      await auth.signInWithEmailAndPassword(email, password)
      setFormError(undefined)
      setIsLoggingIn(false)
    } catch (error) {
      setFormError(error)
      setIsLoggingIn(false)
    }
  }

  const signInAnonymously = async () => {
    try {
      await auth.signInAnonymously()
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <Flex align="center" justify="center" w="100%" minH="100vh">
      <Flex direction="column">
        <Box as="form" mb={4} onSubmit={handleSubmit}>
          <FormControl isInvalid={!!formError}>
            <FormLabel htmlFor="email">Email</FormLabel>
            <Input
              name="email"
              placeholder="E-mail"
              value={email}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => setEmail(event.target.value)}
            />
            <FormLabel htmlFor="password">Password</FormLabel>
            <Input
              name="password"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => setPassword(event.target.value)}
            />
            <FormErrorMessage>{formError && formError.message}</FormErrorMessage>
          </FormControl>
          <Button mt={4} variantColor="teal" isLoading={isLoggingIn} type="submit">
            Sign in with email/password
          </Button>
        </Box>
        <Button onClick={signInAnonymously} variantColor="teal" variant="ghost">
          Continue without signing in
        </Button>
      </Flex>
    </Flex>
  )
}

export default Login
