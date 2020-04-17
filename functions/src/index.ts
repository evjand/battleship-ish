import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import * as shortid from 'shortid'
const app = admin.initializeApp()

const firestore = app.firestore()

exports.trySquare = functions.region('europe-west1').https.onCall((data, context) => {
  const { square, gameId } = data
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'User is not signed in')
  const { uid } = context.auth

  let isHit = false
  let gameIsWon = false

  return firestore
    .runTransaction(async (transaction) => {
      // Fetch current state of game
      const gameDocPromise = transaction.get(firestore.collection('games').doc(gameId))
      const placementDocPromise = transaction.get(firestore.collection('placements').doc(gameId))
      const [gameDoc, placementDoc] = await Promise.all([gameDocPromise, placementDocPromise])

      // Check for game and placement data
      if (!gameDoc.exists && !placementDoc.exists)
        throw new functions.https.HttpsError('not-found', 'Game is not found')
      const gameData = gameDoc.data()!
      const placementData = placementDoc.data()!

      // Check if current players turn
      // Will also secure any unauthorized activity
      if (gameData.currentPlayer !== uid) throw new functions.https.HttpsError('invalid-argument', 'Not your turn')

      // Check if we still are in a playing state
      if (gameData.state !== 'PLAYING') throw new functions.https.HttpsError('invalid-argument', 'Game is not playing')

      // Gather the info we need
      const players: [string] = gameData.players
      const opponent = players.find((player) => player !== uid)!

      // Check if not already guessed
      const formerTries = gameData.tries[uid]
      if (formerTries.includes(square))
        throw new functions.https.HttpsError('invalid-argument', 'This square has already been guessed')

      // Check if opponents placement data exists
      if (!placementData[opponent]) throw new functions.https.HttpsError('not-found', 'Placement data does not exist')
      isHit = placementData[opponent].includes(square)

      const tries = { ...gameData.tries, [uid]: [...formerTries, square] }

      const formerHits = gameData.hits[uid]
      gameIsWon = formerHits.length === 9 && isHit

      const hits = isHit ? { ...gameData.hits, [uid]: [...formerHits, square] } : gameData.hits

      const fieldsToUpdate = {
        tries,
        hits,
        currentPlayer: opponent,
        winner: gameIsWon ? uid : null,
        state: gameIsWon ? 'DONE' : 'PLAYING',
      }

      return transaction
        .update(firestore.collection('games').doc(gameId), fieldsToUpdate)
        .update(firestore.collection('users').doc(uid).collection('games').doc(gameId), {
          winner: gameIsWon ? uid : null,
          currentPlayer: opponent,
        })
        .update(firestore.collection('users').doc(opponent).collection('games').doc(gameId), {
          winner: gameIsWon ? uid : null,
          currentPlayer: opponent,
        })
        .create(firestore.collection('games').doc(gameId).collection('turns').doc(), {
          created: admin.firestore.FieldValue.serverTimestamp(),
          ...fieldsToUpdate,
        })
    })
    .then(() => {
      return {
        isHit,
        gameIsWon,
      }
    })
})

exports.matchPlayers = functions
  .region('europe-west1')
  .firestore.document('matchmaking/{userId}')
  .onCreate((snap, context) => {
    return firestore.runTransaction(async (transaction) => {
      const firstInQueueRef = firestore
        .collection('matchmaking')
        .where('handled', '==', true)
        .orderBy('created')
        .limit(1)
      const firstInQueue = await transaction.get(firstInQueueRef)
      if (firstInQueue.docs.length > 0) {
        const player1 = firstInQueue.docs[0]
        const player2 = snap.id
        const gameId = shortid.generate()
        const hits = {
          [player1.id]: [],
          [player2]: [],
        }
        return transaction
          .create(firestore.collection('games').doc(gameId), {
            players: [player1.id, player2],
            state: 'PLACEMENT',
            currentPlayer: player1.id,
            hits,
            tries: hits,
          })
          .create(firestore.collection('placements').doc(gameId), {})
          .create(firestore.collection('users').doc(player1.id).collection('games').doc(gameId), { opponent: player2 })
          .create(firestore.collection('users').doc(player2).collection('games').doc(gameId), { opponent: player1.id })
          .update(player1.ref, { gameId })
          .update(snap.ref, { gameId })
        //return firestore.collection('games').add({ players: [player1.id, userId] })
      } else {
        return transaction.update(snap.ref, { handled: true })
      }
    })
  })

exports.deleteMatched = functions
  .region('europe-west1')
  .firestore.document('matchmaking/{userId}')
  .onUpdate((change) => {
    const data = change.after.data()
    if (data?.gameId) {
      return change.after.ref.delete()
    }
    return
  })

exports.placementAdded = functions
  .region('europe-west1')
  .firestore.document('placements/{gameId}')
  .onUpdate((change) => {
    return firestore.runTransaction((transaction) => {
      return transaction.get(firestore.collection('games').doc(change.after.id)).then((snapshot) => {
        const docData = snapshot.data()!
        const placementData = change.after.data()!
        if (
          Object.keys(placementData).includes(docData.players[0]) &&
          Object.keys(placementData).includes(docData.players[1])
        ) {
          return transaction.update(firestore.collection('games').doc(change.after.id), { state: 'PLAYING' })
        } else {
          return transaction
        }
      })
    })
  })
