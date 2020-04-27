import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import * as shortid from 'shortid'
import { uniqueNamesGenerator, Config, adjectives, animals } from 'unique-names-generator'
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
        .update(firestore.collection('users').doc(uid).collection('games').doc(gameId), fieldsToUpdate)
        .update(firestore.collection('users').doc(opponent).collection('games').doc(gameId), fieldsToUpdate)
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

exports.sendFriendRequest = functions.region('europe-west1').https.onCall(async (data, context) => {
  const { userId: friendId } = data
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'User is not signed in')
  const { uid } = context.auth

  await firestore.runTransaction(async (transaction) => {
    // Fetch both users
    const meDoc = await transaction.get(firestore.collection('users').doc(uid))

    // Check if I exist
    if (!meDoc.exists) throw new functions.https.HttpsError('not-found', 'User is not found')
    const meData = meDoc.data()!

    // Check if current players turn
    // Will also secure any unauthorized activity
    if (meData.friends.includes(friendId))
      throw new functions.https.HttpsError('invalid-argument', "You're already friends")

    return transaction.create(firestore.collection('users').doc(friendId).collection('friend-requests').doc(uid), {
      displayName: meData.displayName,
      userId: uid,
    })
  })
  return {
    result: 'Friends request sent',
  }
})

exports.acceptFriendRequest = functions.region('europe-west1').https.onCall(async (data, context) => {
  const { userId: friendId } = data
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'User is not signed in')
  const { uid } = context.auth

  await firestore.runTransaction(async (transaction) => {
    // Fetch both users
    const meDocPromise = transaction.get(firestore.collection('users').doc(uid))
    const friendDocPromise = transaction.get(firestore.collection('users').doc(friendId))
    const [meDoc, friendDoc] = await Promise.all([meDocPromise, friendDocPromise])

    // Check if both users exist
    if (!meDoc.exists && !friendDoc.exists) throw new functions.https.HttpsError('not-found', 'User is not found')
    const meData = meDoc.data()!
    const friendData = friendDoc.data()!

    // Check if current players turn
    // Will also secure any unauthorized activity
    if (meData.friends.includes(friendId))
      throw new functions.https.HttpsError('invalid-argument', "You're already friends")

    return transaction
      .update(firestore.collection('users').doc(uid), { friends: [...meData.friends, friendId] })
      .update(firestore.collection('users').doc(friendId), { friends: [...friendData.friends, uid] })
      .create(firestore.collection('users').doc(uid).collection('friends').doc(friendId), {
        displayName: friendData.displayName,
        userId: friendId,
      })
      .create(firestore.collection('users').doc(friendId).collection('friends').doc(uid), {
        displayName: meData.displayName,
        userId: uid,
      })
      .delete(firestore.collection('users').doc(uid).collection('friend-requests').doc(friendId))
  })
  return {
    result: 'Friends request sent',
  }
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

exports.onUserCreate = functions
  .region('europe-west1')
  .auth.user()
  .onCreate(async (user) => {
    const customConfig: Config = {
      dictionaries: [adjectives, animals],
      separator: ' ',
      length: 2,
      style: 'capital',
    }
    const shortName: string = uniqueNamesGenerator(customConfig)
    const friendCode = shortid()
    try {
      await firestore
        .collection('users')
        .doc(user.uid)
        .create({
          displayName: user.displayName || shortName,
          friendCode,
          friends: [],
        })
      await firestore
        .collection('public-users')
        .doc(friendCode)
        .create({
          displayName: user.displayName || shortName,
          userId: user.uid,
        })
    } catch (error) {
      throw new functions.https.HttpsError('invalid-argument', 'I fucked up')
    }
  })

exports.sendChallenge = functions.region('europe-west1').https.onCall(async (data, context) => {
  const { userId: friendId } = data
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'User is not signed in')
  const { uid } = context.auth

  await firestore.runTransaction(async (transaction) => {
    // Fetch userdata for user
    const meDataDoc = await transaction.get(firestore.collection('users').doc(uid))
    const meData = meDataDoc.data()!
    // Check if friend already has a challenge from user
    const friendDoc = await transaction.get(
      firestore.collection('users').doc(friendId).collection('challenges').doc(uid)
    )

    // Check if I exist
    if (friendDoc.exists)
      throw new functions.https.HttpsError('failed-precondition', 'You already have sent this user a challenge')

    return transaction.create(firestore.collection('users').doc(friendId).collection('challenges').doc(uid), {
      displayName: meData.displayName,
      userId: uid,
    })
  })
  return {
    result: 'Game challenge sent',
  }
})

exports.acceptChallenge = functions.region('europe-west1').https.onCall(async (data, context) => {
  const { userId: friendId } = data
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'User is not signed in')
  const { uid } = context.auth

  await firestore.runTransaction(async (transaction) => {
    const player1 = friendId
    const player2 = uid

    // Fetch both users
    const player1Promise = transaction.get(firestore.collection('users').doc(player1))
    const player2Promise = transaction.get(firestore.collection('users').doc(player2))
    const [player1Doc, player2Doc] = await Promise.all([player1Promise, player2Promise])

    // Check if both users exist
    if (!player1Doc.exists && !player2Doc.exists) throw new functions.https.HttpsError('not-found', 'User is not found')
    const player1Data = player1Doc.data()!
    const player2Data = player2Doc.data()!

    const gameId = shortid.generate()
    const hits = {
      [player1]: [],
      [player2]: [],
    }
    return transaction
      .create(firestore.collection('games').doc(gameId), {
        players: [player1, player2],
        state: 'PLACEMENT',
        currentPlayer: player1,
        hits,
        tries: hits,
      })
      .create(firestore.collection('placements').doc(gameId), {})
      .create(firestore.collection('users').doc(player1).collection('games').doc(gameId), {
        opponent: player2,
        opponentName: player2Data.displayName,
      })
      .create(firestore.collection('users').doc(player2).collection('games').doc(gameId), {
        opponent: player1,
        opponentName: player1Data.displayName,
      })
      .delete(firestore.collection('users').doc(uid).collection('challenges').doc(friendId))
  })
  return {
    result: 'Challenge accepted!',
  }
})
