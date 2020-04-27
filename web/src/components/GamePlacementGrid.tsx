import React, { useState, useRef, useEffect } from 'react'
import { Box, Grid, Button, Flex } from '@chakra-ui/core'
import { useDrag, useGesture } from 'react-use-gesture'

const xy = Array.from(Array(10)).map(() => Array.from(Array(10)).map(() => false))

const defaultShipPosition: { [key: string]: { x: number; y: number; rotated: boolean } } = {
  carrier: { x: 0, y: 0, rotated: false },
  battleship: { x: 0, y: 1, rotated: false },
  destroyer: { x: 0, y: 2, rotated: false },
  submarine: { x: 0, y: 3, rotated: false },
  patrol: { x: 0, y: 4, rotated: false },
}

const shipLength: { [key: string]: number } = {
  carrier: 5,
  battleship: 4,
  destroyer: 3,
  submarine: 3,
  patrol: 2,
}

const GamePlacementGrid = () => {
  const gridRef = useRef()
  const lastShipDragged = useRef<string>('')
  const [shipPlacement, setShipPlacement] = useState<any>(defaultShipPosition)
  const [shipDragPosition, setShipDragPosition] = useState<any | undefined>()
  const [gridWidth, setGridWidth] = useState<number>(0)
  const [isOverlapping, setIsOverlapping] = useState<boolean>(false)

  const bind = useGesture({
    onDrag: ({ movement: [mx, my] }) => {
      handleDrag(mx, my)
    },
    onDragStart: ({ event }) => {
      handleDragStart(event!.target)
    },
    onDragEnd: ({ movement: [mx, my] }) => {
      handleDragEnd(mx, my)
    },
  })

  const handleDrag = (x: number, y: number) => {
    const currentShipPlacement = shipPlacement[lastShipDragged.current]
    const newX = Math.min(
      10 - (!currentShipPlacement.rotated ? shipLength[lastShipDragged.current] : 1),
      Math.max(0, currentShipPlacement.x + Math.floor(x / gridWidth))
    )
    const newY = Math.min(
      10 - (currentShipPlacement.rotated ? shipLength[lastShipDragged.current] : 1),
      Math.max(0, currentShipPlacement.y + Math.floor(y / gridWidth))
    )
    const newPosition = { ...currentShipPlacement, x: newX, y: newY }
    setShipDragPosition({ ...shipPlacement, [lastShipDragged.current]: newPosition })
  }

  const handleDragStart = (target: EventTarget) => {
    const domElement = target as HTMLElement
    lastShipDragged.current = domElement.dataset.ship || lastShipDragged.current
  }

  const handleDragEnd = (x: number, y: number) => {
    const currentShipPlacement = shipPlacement[lastShipDragged.current]
    const newX = Math.min(
      10 - (!currentShipPlacement.rotated ? shipLength[lastShipDragged.current] : 1),
      Math.max(0, currentShipPlacement.x + Math.floor(x / gridWidth))
    )
    const newY = Math.min(
      10 - (currentShipPlacement.rotated ? shipLength[lastShipDragged.current] : 1),
      Math.max(0, currentShipPlacement.y + Math.floor(y / gridWidth))
    )
    const newPosition = { ...currentShipPlacement, x: newX, y: newY }
    setShipPlacement({ ...shipPlacement, [lastShipDragged.current]: newPosition })
    setShipDragPosition(undefined)
  }

  useEffect(() => {
    const squares = Object.entries<{ x: number; y: number; rotated: boolean }>(shipPlacement).map(([key, value]) => {
      return [...Array(shipLength[key])].map((_, index) =>
        value.rotated ? `x${value.x}y${value.y + index}` : `x${value.x + index}y${value.y}`
      )
    })
    const flatArray = squares.flat()
    setIsOverlapping(new Set(flatArray).size !== flatArray.length)
  }, [shipPlacement])

  useEffect(() => {
    const grid: HTMLElement = gridRef.current!
    const rect = grid.getBoundingClientRect()
    const width = (rect.width - 4) / 10
    setGridWidth(width)
  }, [])

  const calculateYPosition = (ship: string) => {
    if (shipDragPosition) {
      return `${shipDragPosition[ship].y * gridWidth}px`
    }
    return `${shipPlacement[ship].y * gridWidth}px`
  }

  const calculateXPosition = (ship: string) => {
    if (shipDragPosition) {
      return `${shipDragPosition[ship].x * gridWidth}px`
    }
    return `${shipPlacement[ship].x * gridWidth}px`
  }

  const rotateShip = (ship: string) => {
    const currentShip = shipPlacement[ship]
    const isRotated = currentShip.rotated

    if (isRotated) {
      const newX = Math.min(10 - shipLength[ship], currentShip.x)
      setShipPlacement({ ...shipPlacement, [ship]: { ...currentShip, x: newX, rotated: !isRotated } })
    } else {
      const newY = Math.min(10 - shipLength[ship], currentShip.y)
      setShipPlacement({ ...shipPlacement, [ship]: { ...currentShip, y: newY, rotated: !isRotated } })
    }
  }

  const widthForShip = (ship: string) => {
    if (shipPlacement[ship].rotated) {
      return `${gridWidth}px`
    }
    return `${shipLength[ship] * gridWidth}px`
  }

  const heightForShip = (ship: string) => {
    if (shipPlacement[ship].rotated) {
      return `${shipLength[ship] * gridWidth}px`
    }
    return `${gridWidth}px`
  }

  return (
    <>
      <Grid
        gridTemplateColumns="repeat(10, 1fr)"
        w="100%"
        maxW="550px"
        margin="0 auto"
        border="2px solid"
        borderColor="blue.500"
        pos="relative"
        ref={gridRef}
      >
        {xy.map((yArray, xIndex) => {
          return yArray.map((checked, yIndex) => (
            <Box
              key={`${xIndex}-${yIndex}`}
              outline="none"
              border="2px solid"
              borderColor="blue.500"
              w="100%"
              paddingTop="calc(100% - 4px)"
              bg="blue.700"
            ></Box>
          ))
        })}
        {Object.keys(shipPlacement).map((ship) => {
          return (
            <Box
              style={{
                width: widthForShip(ship),
                height: heightForShip(ship),
                top: calculateYPosition(ship),
                left: calculateXPosition(ship),
              }}
              background={ship === lastShipDragged.current ? 'brown' : 'orange'}
              pos="absolute"
              data-ship={ship}
              {...bind()}
            ></Box>
          )
        })}
      </Grid>
      <Flex w="200px" flexDir="column">
        <Button variantColor="blue" onClick={() => rotateShip(lastShipDragged.current)}>
          Rotate
        </Button>
        {isOverlapping ? 'Ships are overlapping' : 'Ships are well placed'}
      </Flex>
    </>
  )
}

export default GamePlacementGrid
