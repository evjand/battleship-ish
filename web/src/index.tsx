import React from 'react'
import ReactDOM from 'react-dom'
import App from './App'
import { ThemeProvider, CSSReset, ColorModeProvider } from '@chakra-ui/core'
import { BrowserRouter as Router } from 'react-router-dom'
import theme from './theme'

ReactDOM.render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <ColorModeProvider value="light">
        <CSSReset />
        <Router>
          <App />
        </Router>
      </ColorModeProvider>
    </ThemeProvider>
  </React.StrictMode>,
  document.getElementById('root')
)
