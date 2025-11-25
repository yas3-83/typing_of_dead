export class EntityManager {
    constructor() {
        this.zombies = [];
        this.spawnTimer = 0;
        this.spawnInterval = 2000; // ms
    }

    update(deltaTime, gameWidth, gameHeight) {
        // Move zombies
        this.zombies.forEach(z => {
            z.x -= z.speed * (deltaTime / 1000);
        });

        // Remove off-screen zombies (or handle damage in Game.js)
        // For now, just return list of zombies that reached the player (x < 0)
        const reached = this.zombies.filter(z => z.x < 50);
        this.zombies = this.zombies.filter(z => z.x >= 50);

        return reached;
    }

    setConfig(config) {
        this.config = config;
        this.spawnTimer = 0;
        // Create a shuffled deck of words
        this.wordDeck = [...config.words];
        this.shuffleDeck(this.wordDeck);
    }

    shuffleDeck(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    spawnZombie(gameWidth, gameHeight) {
        if (!this.config) return false;

        // Check max zombies
        if (this.zombies.length >= this.config.maxZombies) return false;

        // Check if deck is empty
        if (this.wordDeck.length === 0) return false;

        // Find a word that doesn't conflict with existing zombies
        // We iterate through the deck to find a valid word
        const existingPrefixes = new Set(this.zombies.map(z => z.textRoma[0]));

        let wordIndex = -1;
        for (let i = 0; i < this.wordDeck.length; i++) {
            if (!existingPrefixes.has(this.wordDeck[i].roma[0])) {
                wordIndex = i;
                break;
            }
        }

        if (wordIndex === -1) return false; // No valid word found in deck (all prefixes taken)

        // Remove the word from the deck
        const word = this.wordDeck.splice(wordIndex, 1)[0];

        const speedMin = this.config.zombieSpeedRange[0];
        const speedMax = this.config.zombieSpeedRange[1];
        const speed = speedMin + Math.random() * (speedMax - speedMin);

        const zombie = {
            id: crypto.randomUUID(),
            textJa: word.ja,
            textRoma: word.roma,
            typedIndex: 0,
            x: gameWidth,
            y: 50 + Math.random() * (gameHeight - 150),
            speed: speed,
            state: 'alive'
        };

        this.zombies.push(zombie);
        return true;
    }

    removeZombie(id) {
        this.zombies = this.zombies.filter(z => z.id !== id);
    }
}
