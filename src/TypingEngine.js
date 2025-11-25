import { Romaji } from './utils/Romaji.js';

export class TypingEngine {
    constructor(game) {
        this.game = game;
        this.lastInputChar = null;
        window.addEventListener('keydown', (e) => this.handleKey(e));
    }

    handleKey(e) {
        if (this.game.state !== 'playing') {
            if (e.key === 'Enter' && this.game.state === 'gameover') {
                this.game.restart();
            }
            return;
        }

        // Ignore non-character keys (simplified)
        if (e.key.length !== 1) return;

        // Prevent default browser actions (like search) for typing keys
        e.preventDefault();

        const char = e.key.toLowerCase();
        // Note: For MVP we assume direct mapping. 
        // Real implementation needs a buffer for 'shi' etc if we want to support 's' -> 'h' -> 'i' typing.
        // But the requirement says "normalizeRomaji()". 
        // If the user types 's', we check against 's'.
        // If the user types 'h' (after 's'), we check...
        // Wait, the specification says: "Player input is normalized".
        // If the zombie has "si" (normalized from "shi"), and user types "s", it matches "s".
        // Then user types "h". "sh" normalizes to... wait.
        // "shi" -> "si".
        // If I type 's', it matches 's' of 'si'.
        // If I type 'h', it does NOT match 'i' of 'si'.
        // This is a tricky part of "Normalize Input" vs "Normalize Target".

        // Let's stick to the plan:
        // Zombie holds "si" (normalized).
        // User types 's' -> matches 's'.
        // User types 'i' -> matches 'i'.
        // User types 'h' -> (if they wanted 'shi') -> this logic breaks if we only store 'si'.

        // RE-READING SPEC:
        // "Player input is normalized... e.g. input 'shi' -> 'si'"
        // This implies we need an input buffer.
        // Buffer: "s" -> norm: "s"
        // Buffer: "sh" -> norm: "s" (incomplete?) or "sh"?
        // Buffer: "shi" -> norm: "si"

        // For MVP, I will implement a simpler version:
        // The Zombie holds the *display* romaji (e.g. "shi" or "si" depending on data).
        // Actually, let's just use the raw romaji from the word list for now.
        // And implement the "Unique Prefix" logic.

        this.processInput(char);
    }

    processInput(char) {
        const zombies = this.game.entityManager.zombies;
        let target = this.game.currentTargetId ? zombies.find(z => z.id === this.game.currentTargetId) : null;

        if (target) {
            // Locked on
            this.checkHit(target, char);
        } else {
            // Find target
            // For target selection, we only check the FIRST character of the remaining text.
            // We need to check if 'char' matches the start of any zombie's textRoma.
            // Using Romaji.isMatch for the first character.

            const candidates = zombies.filter(z => {
                const targetChar = z.textRoma[z.typedIndex];
                const nextTargetChar = z.textRoma[z.typedIndex + 1];
                return Romaji.isMatch(char, targetChar, nextTargetChar);
            });

            if (candidates.length > 0) {
                // Unique prefix rule ensures only one candidate (or we pick the first one)
                this.game.currentTargetId = candidates[0].id;
                this.checkHit(candidates[0], char);
            } else {
                this.game.onMiss();
            }
        }
    }

    checkHit(target, char) {
        const targetChar = target.textRoma[target.typedIndex];
        const nextTargetChar = target.textRoma[target.typedIndex + 1];

        // Check for silent character (skip input, don't advance target, but don't miss)
        if (Romaji.isSilent(char, targetChar, this.lastInputChar)) {
            // It's a valid silent character (e.g. 'h' in 'shi')
            // Do nothing, but record it as last input
            this.lastInputChar = char;
            return;
        }

        if (Romaji.isMatch(char, targetChar, nextTargetChar)) {
            target.typedIndex++;
            this.lastInputChar = char;

            // Visual feedback
            this.game.onHit(target.id);

            if (target.typedIndex >= target.textRoma.length) {
                this.game.onZombieKilled(target.id);
                this.lastInputChar = null; // Reset context
            }
        } else {
            this.game.onMiss();
            // Don't reset lastInputChar on miss? Or should we?
            // Usually keep it to avoid punishing "shx" -> "s" is kept.
        }
    }
}
