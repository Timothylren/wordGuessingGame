class Model {
    constructor() {
        this.maxChances = 10;
        this.incorrectGuesses = 0;
        this.currentWord = '';
        this.hiddenWord = '';
        this.correctWords = 0;
        this.guessHistory = new Set();
        this.timer = null;
        this.timeLimit = 60;
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
            // if (response.ok) {
            //     const [word] = await response.json();
            //     return word;
            // } else {
                throw new Error('API fetch error');
            // }
        } catch (error) {
            return this.fallbackWords[Math.floor(Math.random() * this.fallbackWords.length)];
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
            if (this.currentWord[i].toLowerCase() === letter.toLowerCase() && this.hiddenWord[i] == "_") {
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
        return this.incorrectGuesses >= this.maxChances;
    }

    isWordComplete() {
        return !this.hiddenWord.includes('_');
    }

    addToGuessHistory(letter, isCorrect) {
        this.guessHistory.add({ letter, isCorrect });
    }

    isInGuessHistory(letter) {
        return Array.from(this.guessHistory).some(item => item.letter === letter);
    }

    resetGuessHistory() {
        this.guessHistory.clear();
    }

    startTimer() {
        return new Promise((resolve) => {
            this.timer = setTimeout(() => {
                resolve(true);
            }, this.timeLimit * 1000);
        });
    }

    clearTimer() {
        clearTimeout(this.timer);
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

    updateGuessHistory(guessHistory) {
        const historyContainer = document.querySelector('.game__history');
        historyContainer.innerHTML = '';

        guessHistory.forEach(({ letter, isCorrect }) => {
            const span = document.createElement('span');
            span.textContent = letter;
            span.className = `game__history-letter${isCorrect ? ' game__history-letter--correct' : ' game__history-letter--incorrect'}`;
            historyContainer.appendChild(span);
        });
    }

    displayRepeatGuessMessage() {
        alert('You already guessed this letter');
    }

    displayGameOver(num){
        alert(`Game Over! You have correctly guessed ${num} words`);
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

        this.view.bindNewGame(this.initializeGame);
        this.view.bindProcessGuess(this.handleProcessGuess);

        this.initializeGame(); 
    }

    handleProcessGuess = async (letter) => {
        if (this.model.isInGuessHistory(letter)) {
            this.view.displayRepeatGuessMessage();
            return;
        }

        const isCorrect = this.model.checkLetter(letter);
        this.model.addToGuessHistory(letter, isCorrect);

        this.model.processGuess(letter);
        this.view.updateGameDisplay(this.model.hiddenWord, this.model.incorrectGuesses, this.model.maxChances);
        this.view.updateGuessHistory(this.model.guessHistory);

        if (this.model.isWordComplete()) {
            this.model.incrementCorrectWords();
            await this.handleNewGame();
        } else if (this.model.checkGameOver()) {
            this.handleGameOver();
        }
    }

    initializeGame = async () => {
        await this.handleNewGame();

        this.model.clearTimer();
        const timeUp = await this.model.startTimer();

        if (timeUp) {
            this.handleGameOver();
        }
    }

    handleNewGame = async () => {
        await this.model.setNewWord();
        this.model.resetGuessHistory();
        this.view.updateGameDisplay(this.model.hiddenWord, this.model.incorrectGuesses, this.model.maxChances);
        this.view.updateGuessHistory(this.model.guessHistory);
    }


    handleGameOver() {
        this.view.displayGameOver(this.model.correctWords);
        this.model.resetIncorrectGuesses();
        this.model.correctWords = 0; // Reset the correct words count for a new game
        this.initializeGame();
    }
}


const model = new Model();
const view = new View();
const controller = new Controller(model, view);
