export class Renderer {
    constructor() {
        this.gameArea = document.getElementById('game-area');
        this.scoreEl = document.getElementById('score');
        this.livesEl = document.getElementById('lives');
        this.overlay = document.getElementById('overlay');
        this.overlayTitle = document.getElementById('overlay-title');
        this.overlayMessage = document.getElementById('overlay-message');
        this.zombieElements = new Map(); // ID -> DOM Element
    }

    updateHUD(score, lives, stageTitle) {
        this.scoreEl.textContent = `Score: ${score}`;
        this.livesEl.textContent = `Lives: ${lives}`;
        // Assuming we might want to add a stage display element later, 
        // for now let's just update the document title or log it, 
        // or we can add a stage element to the HUD in HTML.
        // Let's add a stage element dynamically if it doesn't exist or just append to HUD.
        let stageEl = document.getElementById('stage-info');
        if (!stageEl) {
            stageEl = document.createElement('div');
            stageEl.id = 'stage-info';
            document.getElementById('hud').appendChild(stageEl);
        }
        stageEl.textContent = stageTitle || '';
    }

    triggerHitEffect(id) {
        const el = this.zombieElements.get(id);
        if (el) {
            el.classList.remove('hit');
            void el.offsetWidth; // Trigger reflow
            el.classList.add('hit');

            // Note: The transform in CSS animation might conflict with the style.transform set in renderZombies.
            // Ideally, we should wrap the content in a div and animate that, or use a different property.
            // For MVP, let's just change color or border, or use a separate inner element for shaking.
            // Let's rely on the color change in .hit for now, as transform is overwritten every frame.
        }
    }

    renderZombies(zombies, currentTargetId) {
        // Remove zombies that no longer exist
        for (const [id, el] of this.zombieElements) {
            if (!zombies.find(z => z.id === id)) {
                el.remove();
                this.zombieElements.delete(id);
            }
        }

        // Update or create zombies
        zombies.forEach(z => {
            let el = this.zombieElements.get(z.id);
            if (!el) {
                el = document.createElement('div');
                el.className = 'zombie';
                this.gameArea.appendChild(el);
                this.zombieElements.set(z.id, el);
            }

            // Position
            el.style.transform = `translate(${z.x}px, ${z.y}px)`;

            // Styling for target
            if (z.id === currentTargetId) {
                el.classList.add('locked-on');
            } else {
                el.classList.remove('locked-on');
            }

            // Text Content (Highlight typed part)
            const typed = z.textRoma.substring(0, z.typedIndex);
            const remaining = z.textRoma.substring(z.typedIndex);

            el.innerHTML = `
                <span class="ja-text">${z.textJa}</span>
                <span class="roma-text">
                    <span class="roma-typed">${typed}</span>${remaining}
                </span>
            `;
        });
    }

    showOverlay(title, message) {
        this.overlayTitle.textContent = title;
        this.overlayMessage.textContent = message;
        this.overlay.classList.remove('hidden');
    }

    hideOverlay() {
        this.overlay.classList.add('hidden');
    }
}
