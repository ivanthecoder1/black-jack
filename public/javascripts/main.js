// Track current score and hand of dealer and player
// Inspired from recitation 
const gameState = {
    deck_id: null,
    dealer: {
        current_hand: [null, null],
        current_score: 0
    },
    player: {
        current_hand: [null, null],
        current_score: 0
    }
}

// Function to add a card's value to a person's score
const addCard = function (person, card) {
    // Find the first occurrence of null in the current hand and replace it with the new card code
    const nullIndex = person.current_hand.indexOf(null);
    if (nullIndex !== -1) {
        person.current_hand[nullIndex] = card.code;
    } else {
        person.current_hand.push(card.code)
    }

    // Get the value from a card
    let score = parseInt(card.value)

    // Deal with aces (add 11 or 1 depending if current score goes over 21 or not)
    if (card.code[0] == "A") {
        if (person.current_score + 11 > 21) {
            score = 1
        }
        else {
            score = 11
        }
    }
    // Deal with cards that are a king, queen, or jack
    else if (card.code[0] == "K" || card.code[0] == "Q" || card.code[0] == "J") {
        score = 10
    }

    // Add card value to person's score
    person.current_score += score
}

// Update and display total wins
const refreshWins = async function () {
    const playerScore = document.getElementById("player-score")
    const dealerScore = document.getElementById("dealer-score")

    // Extract player and dealer scores from the server
    const response = await fetch("http://localhost:3000/score", {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    });

    // Parse the JSON response
    const scores = await response.json();

    // Update the player and dealer scores on the front end
    playerScore.innerText = `Player's wins: ${scores.player}`;
    dealerScore.innerText = `Dealer's wins: ${scores.dealer}`;
}

// Function to draw a card from a deck
const drawCard = async function (person, count) {
    // Make api call to draw specified amount of cards
    const { cards } = await fetch(`https://deckofcardsapi.com/api/deck/${gameState.deck_id}/draw/?count=${count}`).then(res => res.json())

    // For each card drawn, add it to the corresponding person
    cards.forEach(card => {
        addCard(person, card)
    })

    // Update cards based on card draws
    displayCards()
}


// Function to displays player and dealer hand
const displayCards = function () {
    // Show player hand and points
    const playerCards = document.getElementById("player-hand")
    const playerPoints = document.getElementById("playerPoints")

    // Update points and clear player cards
    playerCards.innerHTML = ""
    playerPoints.innerText = `Player Points: ${gameState.player.current_score}`;

    // For each card in the player's hand, add the image of the card on the frontend
    gameState.player.current_hand.forEach(card => {
        const playerCard = document.createElement("img")
        // Display back of the card if value is null, otherwise the front of the card
        if (card === null) {
            playerCard.setAttribute("src", "https://deckofcardsapi.com/static/img/back.png")
        } else {
            playerCard.setAttribute("src", `https://deckofcardsapi.com/static/img/${card}.png`)
        }
        playerCards.appendChild(playerCard)
    })


    // same as above but with dealer
    const dealerCards = document.getElementById("dealer-hand")
    const dealerPoints = document.getElementById("dealerPoints")

    dealerCards.innerHTML = ""
    dealerPoints.innerText = `Dealer Points: ${gameState.dealer.current_score}`;

    gameState.dealer.current_hand.forEach(card => {
        const dealerCard = document.createElement("img")
        if (card === null) {
            dealerCard.setAttribute("src", "https://deckofcardsapi.com/static/img/back.png")
        } else {
            dealerCard.setAttribute("src", `https://deckofcardsapi.com/static/img/${card}.png`)
        }
        dealerCards.appendChild(dealerCard)
    })
}


// Function to start game
const start = function () {
    // Hide start modal
    $("#start").modal("hide")

    // Update cards
    displayCards()

    // Update score tally
    refreshWins()
}

// Function to reset the game state
const resetGame = function () {
    gameState.deck_id = null;
    gameState.dealer.current_hand = [null, null];
    gameState.dealer.current_score = 0;
    gameState.player.current_hand = [null, null];
    gameState.player.current_score = 0;

    // Clear the cards and update the display
    displayCards();
}

//Run once broswer has loaded everything
window.onload = function () {

    // Ask player if they want to play
    $("#start").modal("show")

    // Show deck 
    const deck = document.getElementById("Deck")
    const deckImage = document.createElement("img")
    deckImage.setAttribute("src", "https://deckofcardsapi.com/static/img/back.png")
    deck.appendChild(deckImage)

    // Game starts and cards are given to player and dealer
    document.getElementById("Deal").addEventListener("click", async function () {
        // Extract deck id from a new deck
        const { deck_id } = await fetch("https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=1").then(res => res.json())
        gameState.deck_id = deck_id
        start()

        await drawCard(gameState.player, 2)
        await drawCard(gameState.dealer, 1)
    })

    // Game logic
    // Player draws a card
    document.getElementById("Hit").addEventListener("click", async function () {
        await drawCard(gameState.player, 1)

        // Track winner and their hand
        let winner = null
        winningHand = null
        let winnerFound = false

        // Player loses if their points goes over 21
        if (gameState.player.current_score > 21) {
            // Reveal dealer hand
            await drawCard(gameState.dealer, 1)
            winner = "dealer"
            winningHand = gameState.dealer.current_hand
            winnerFound = true
        } 
        // Tie
        else if (gameState.dealer.current_score == gameState.player.current_score) {
            // Go to game over modal and display a tie
            const result = document.getElementById("result")
            result.innerText = `Result: Tie`;
            $("#gameOver").modal("show")
        }

        // Make post request to who won if winnerFound is true
        if (winnerFound) {
            const formattedHand = `(${winningHand.join(', ')})`;
            
            // Post request
            const winnerResults = {
                "Winner": winner,
                "Winning_Hand": formattedHand
            }
            const jsonResults = JSON.stringify(winnerResults);

            const response = await fetch("http://localhost:3000/score", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: jsonResults
            });
            
            // display who won on frontend
            const result = document.getElementById("result")
            result.innerText = `Result: ${winner} Wins`;
            $("#gameOver").modal("show")
        }
    })

    // Player stays and dealer draws
    document.getElementById("Stay").addEventListener("click", async function () {
        // Track winer
        let winner = null
        winningHand = null
        let winnerFound = false

        // Dealer keeps drawing until their score is less than 17
        while (gameState.dealer.current_score < 17) {
            await drawCard(gameState.dealer, 1)
        }

        // Dealer loses
        if (gameState.dealer.current_score > 21) {
            winner = "player"
            winningHand = gameState.player.current_hand
            winnerFound = true 
        }
        // Dealer wins if their score doesn't go over 21, and has a higher score
        else if (gameState.dealer.current_score < 21 && gameState.dealer.current_score > gameState.player.current_score) {
            winner = "dealer"
            winningHand = gameState.dealer.current_hand
            winnerFound = true
        }
        // Player wins if their score doesn't go over 21, and has a higher score
        else if (gameState.player.current_score < 21 && gameState.dealer.current_score < gameState.player.current_score) {
            winner = "player"
            winningHand = gameState.player.current_hand
            winnerFound = true 
        }
        // Tie
        else if (gameState.dealer.current_score == gameState.player.current_score) {
            // Go to game over modal and display a tie
            const result = document.getElementById("result")
            result.innerText = `Result: Tie`;
            $("#gameOver").modal("show")
        }

        // Make post request to who won if winnerFound is true
        if (winnerFound) {
            const formattedHand = `(${winningHand.join(', ')})`;

            // Post request
            const winnerResults = {
                "Winner": winner,
                "Winning_Hand": formattedHand 
            }
            const jsonResults = JSON.stringify(winnerResults);

            const response = await fetch("http://localhost:3000/score", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: jsonResults
            });

            const result = document.getElementById("result")
            result.innerText = `Result: ${winner} Wins`;
            $("#gameOver").modal("show")
        }
    })

    // Player plays again, and game is restarted
    document.getElementById("playAgain").addEventListener("click", async function () {
        // Reset the game state
        resetGame();
    
        // Hide the game over modal
        $("#gameOver").modal("hide");
    
        // Show the start modal
        $("#start").modal("show");
    });



};
