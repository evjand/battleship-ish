interface Game {
  id: string
  currentPlayer: string
  players: string[]
  hasPlaced: string[]
  hits: { [key: string]: HitShip[] }
  tries: { [key: string]: Square[] }
  state: GameState
  winner?: string
}

interface UserGame {
  id: string
  currentPlayer?: string
  placement?: { rotated: boolean; x: number; y: number }[]
  hits?: { [key: string]: HitShip[] }
  opponent: string
  opponentName: string
  state?: GameState
  tries?: { [key: string]: Square[] }
  winner?: string
}

type Square = string

enum GameState {
  Placement = 'PLACEMENT',
  Playing = 'PLAYING',
  Done = 'DONE',
}

interface HitShip {
  hits: Square[]
  sunk: boolean
}
