class Model {
    constructor() {
        this.maxChances = 10;
        this.incorrectGuesses = 0;
        this.currentWord = '';
        this.hiddenWord = '';
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

    async startNewGame() {
        this.incorrectGuesses = 0;
        this.currentWord = await this.fetchRandomWord();
        this.hiddenWord = this.hideRandomLetters(this.currentWord);
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
        if (isCorrect) {
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
        return this.incorrectGuesses >= this.maxChances || !this.hiddenWord.includes('_');
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
        await this.model.startNewGame();
        this.view.updateGameDisplay(this.model.hiddenWord, this.model.incorrectGuesses, this.model.maxChances);
    }

    handleProcessGuess = async (letter) => {
        this.model.processGuess(letter);
        this.view.updateGameDisplay(this.model.hiddenWord, this.model.incorrectGuesses, this.model.maxChances);
    
        if (this.model.checkGameOver()) {
            this.handleGameOver();
        }
    }

    handleGameOver() {
        const correctWords = this.model.hiddenWord.split('').filter(char => char !== '_').length;
        alert(`Game over! You have guessed ${correctWords} words!`);
        this.handleNewGame();
    }
}


const model = new Model();
const view = new View();
const controller = new Controller(model, view);