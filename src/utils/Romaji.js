export class Romaji {
    /**
     * Checks if the input character matches the target character, considering Romaji variations.
     * Target is assumed to be in Kunrei-shiki (e.g., 'si', 'ti', 'tu', 'hu', 'zi').
     */
    static isMatch(input, targetChar, nextTargetChar) {
        // Direct match
        if (input === targetChar) return true;

        // Variations
        // 'c' -> 's' (if 'si')
        if (targetChar === 's' && nextTargetChar === 'i' && input === 'c') return true;

        // 'c' -> 't' (if 'ti')
        if (targetChar === 't' && nextTargetChar === 'i' && input === 'c') return true;

        // 'f' -> 'h' (if 'hu')
        if (targetChar === 'h' && nextTargetChar === 'u' && input === 'f') return true;

        // 'j' -> 'z' (if 'zi')
        if (targetChar === 'z' && nextTargetChar === 'i' && input === 'j') return true;

        return false;
    }

    /**
     * Checks if the input character should be ignored (silent) based on context.
     * Used for cases like 'shi' -> 'si', where 'h' is silent.
     */
    static isSilent(input, targetChar, prevInput) {
        // 'sh' -> 's...' (for 'si')
        // Context: We already matched 's' (or 'c'), now target is 'i', input is 'h'.
        if (targetChar === 'i' && input === 'h') {
            if (prevInput === 's' || prevInput === 'c') return true;
        }

        // 'ch' -> 't...' (for 'ti')
        // Context: We matched 'c' (as 't'), now target is 'i', input is 'h'.
        if (targetChar === 'i' && input === 'h') {
            if (prevInput === 'c') return true;
        }

        // 'ts' -> 't...' (for 'tu')
        // Context: We matched 't', now target is 'u', input is 's'.
        if (targetChar === 'u' && input === 's') {
            if (prevInput === 't') return true;
        }

        return false;
    }
}
