class Model {
    constructor() {
        this.maxChances = 10;
        this.incorrectGuesses = 0;
        this.currentWord = '';
        this.hiddenWord = '';
        this.correctWords = 0;
        this.fallbackWords =[
            "ballot",
            "soil",
            "legislation",
            "valley",
            "country",
            "nail",
            "piano",
            "speech",
            "efflux",
            "reason",
            "alcohol",
            "stable",
            "slice",
            "situation",
            "profession",
            "restaurant",
            "pocket",
            "satisfaction",
            "condition",
            "comfortable"
        ];
    }

    async fetchRandomWord() {
        try {
            const response = await fetch('https://random-word-api.herokuapp.com/word');
            if (response.ok) {
                const [word] = await response.json();
                return word;
            } else {
                throw new Error('API fetch error');
            }
        } catch (error) {
            return fallbackWords[Math.floor(Math.random() * fallbackWords.length)];
        }
    }

    hideRandomLetters(word) {
        const concealedCount = Math.floor(Math.random() * word.length) + 1;
        const concealedPositions = new Set();
        while (concealedPositions.size < concealedCount) {
            concealedPositions.add(Math.floor(Math.random() * word.length));
        }
    
        return word.split('').map((char, idx) => concealedPositions.has(idx) ? '_' : char).join('');
    }

    async handleNewGame(){
        await this.setNewWord();
        this.resetIncorrectGuesses();
    }

    async setNewWord() {
        this.currentWord = await this.fetchRandomWord();
        this.hiddenWord = this.hideRandomLetters(this.currentWord);
    }

    resetIncorrectGuesses() {
        this.incorrectGuesses = 0;
    }

    incrementCorrectWords(){
        this.correctWords++;
    }

    checkLetter(letter) {
        for (let i = 0; i < this.currentWord.length; i++) {
            if (this.currentWord[i].toLowerCase() === letter.toLowerCase()) {
                return true;
            }
        }
        return false;
    }


    processGuess(letter) {
        const isCorrect = this.checkLetter(letter);
        if (isCorrect && this.hiddenWord.includes(letter)) {
            this.incorrectGuesses++;
        } else if (isCorrect) {
            let updatedHiddenWord = '';
            for (let i = 0; i < this.currentWord.length; i++) {
                if (this.currentWord[i] === letter) {
                    updatedHiddenWord += letter;
                } else {
                    updatedHiddenWord += this.hiddenWord[i];
                }
            }
            this.hiddenWord = updatedHiddenWord;
        } else {
            this.incorrectGuesses++;
        }
    }
    checkGameOver() {
        return this.incorrectGuesses >= this.maxChances;
    }

    isWordComplete() {
        return !this.hiddenWord.includes('_');
    }
    
}

class View {
    constructor() {
        this.gameTitle = document.querySelector('.game__title');
        this.gameCounter = document.querySelector('.game__counter');
        this.gameInput = document.querySelector('.game__input');
        this.newGameBtn = document.querySelector('.game__new-game');
        this.gameWord = document.querySelector('.game__word');
    }

    bindNewGame(handler) {
        this.newGameBtn.addEventListener('click', handler);
    }
    bindProcessGuess(handler) {
        this.gameInput.addEventListener('keyup', async (e) => {
            if (e.key === 'Enter') {
                const letter = e.target.value;
                e.target.value = '';
                await handler(letter);
            }
        });
    }


    updateGameDisplay(hiddenWord, incorrectGuesses, maxChances) {
        this.gameWord.textContent = hiddenWord;
        this.gameCounter.textContent = `${incorrectGuesses} / ${maxChances}`;
    }
}


class Controller {
    constructor(model, view) {
        this.model = model;
        this.view = view;

        this.view.bindNewGame(this.handleNewGame);
        this.view.bindProcessGuess(this.handleProcessGuess);

        this.handleNewGame();
    }

    handleNewGame = async () => {
        await this.model.setNewWord();
        this.view.updateGameDisplay(this.model.hiddenWord, this.model.incorrectGuesses, this.model.maxChances);
    }

    handleProcessGuess = async (letter) => {
        this.model.processGuess(letter);
        this.view.updateGameDisplay(this.model.hiddenWord, this.model.incorrectGuesses, this.model.maxChances);

        if (this.model.isWordComplete()) {
            this.model.incrementCorrectWords(); // Update the number of correctly guessed words
            await this.handleNewGame();
        } else if (this.model.checkGameOver()) {
            this.handleGameOver();
        }
    }

    handleGameOver() {
        alert(`Game over! You have guessed ${this.model.correctWords} words!`); // Display the number of correctly guessed words
        this.model.resetIncorrectGuesses();
        this.model.correctWords = 0; // Reset the correct words count for a new game
        this.handleNewGame();
    }
}


const model = new Model();
const view = new View();
const controller = new Controller(model, view);
