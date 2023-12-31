const express = require('express');
const Game = require('../models/Game.js');
const router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Front Page' });
});

// GET request on /score that gives a JSON object of dealer and player wins. 
// This is used to update the scoring tally each time the game is played.
router.get('/score', async function (req, res, next) {
  try {
    // Retrieve and aggregate the data from the database
    const result = await Game.aggregate([
      {
        $group: {
          _id: null,
          player_wins: { $sum: '$player_score' },
          dealer_wins: { $sum: '$dealer_score' },
        },
      },
    ]);

    // Prepare the result in JSON format
    const score = {
      player: result.length > 0 ? result[0].player_wins : 0,
      dealer: result.length > 0 ? result[0].dealer_wins : 0,
    };

    res.status(200).json(score);
  } catch (err) {
    console.error('Error retrieving score:', err);
    res.status(500).send('Internal Server Error');
  }
});

// POST request on /score that accepts a JSON body of who won that round, 
// and what the winning hand was (using the coding scheme used by the Deck of Cards API). 
// For example (KH, QC) would be a winning hand that has the King of Hearts and the Queen of Clubs.
router.post('/score', async function (req, res, next) {
  try {
    const { Winner, Winning_Hand } = req.body;

    // Ensure the request includes the necessary fields
    if (!Winner || !Winning_Hand) {
      res.status(400).send('Missing required fields');
      return;
    }

    // Create a new game with server-generated GameID and Date
    const newGame = new Game({
      player_score: Winner === 'player' ? 1 : 0,
      dealer_score: Winner === 'dealer' ? 1 : 0,
      winning_hand: Winning_Hand
    });

    // Save new game to game Collection
    const savedGame = await newGame.save();
    res.status(201).send(savedGame);
  } catch (err) {
    next(err);
  }
});




module.exports = router;
