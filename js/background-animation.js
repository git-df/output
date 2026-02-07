// Particle Background Animation
class Particle {
    constructor(canvas) {
        this.canvas = canvas;
        this.reset();
        // Start at random position
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
    }

    reset() {
        this.x = Math.random() * this.canvas.width;
        this.y = Math.random() * this.canvas.height;

        // Wider size range for more variation (1-4px)
        this.size = Math.random() * 3 + 0.5;

        // Depth-based speed: larger particles = closer = faster
        // Speed multiplier ranges from 1x to 3x based on size
        this.speedMultiplier = this.size / 16;

        // Base velocity with depth consideration
        this.vx = (Math.random() - 0.5) * 0.8 * this.speedMultiplier;
        this.vy = (Math.random() - 0.5) * 0.8 * this.speedMultiplier;

        // Opacity correlates with size (larger = more opaque = closer)
        this.opacity = (0.2 + (this.size / 4) * 0.6);

        // Store base drift for continuous movement
        this.baseDriftX = (Math.random() - 0.5) * 0.3 * this.speedMultiplier;
        this.baseDriftY = (Math.random() - 0.5) * 0.3 * this.speedMultiplier;
    }

    update(mouse) {
        // Apply mouse repulsion with depth-based force
        if (mouse.x !== null && mouse.y !== null) {
            const dx = this.x - mouse.x;
            const dy = this.y - mouse.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const maxDistance = 150 * this.size/2; // Larger particles react from further away

            if (distance < maxDistance) {
                const force = (maxDistance - distance) / maxDistance;
                const angle = Math.atan2(dy, dx);
                this.vx += Math.cos(angle) * force * 1.8 * this.speedMultiplier;
                this.vy += Math.sin(angle) * force * 1.8 * this.speedMultiplier;
            }
        }

        // Apply velocity with speed multiplier
        this.x += this.vx;
        this.y += this.vy;

        // Apply friction (less friction for larger particles)
        const friction = 0.96 - (this.speedMultiplier * 0.01);
        this.vx *= friction;
        this.vy *= friction;

        // Add continuous base drift + random variation for organic movement
        this.vx += this.baseDriftX + (Math.random() - 0.5) * 0.1 * this.speedMultiplier;
        this.vy += this.baseDriftY + (Math.random() - 0.5) * 0.1 * this.speedMultiplier;

        // Wrap around edges
        if (this.x < 0) this.x = this.canvas.width;
        if (this.x > this.canvas.width) this.x = 0;
        if (this.y < 0) this.y = this.canvas.height;
        if (this.y > this.canvas.height) this.y = 0;
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
        ctx.fill();
    }
}

class ParticleBackground {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            console.error(`Canvas with id "${canvasId}" not found`);
            return;
        }

        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.mouse = { x: null, y: null };
        this.particleCount = 120;

        this.init();
    }

    init() {
        this.resize();
        this.createParticles();
        this.addEventListeners();
        this.animate();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    createParticles() {
        this.particles = [];
        for (let i = 0; i < this.particleCount; i++) {
            this.particles.push(new Particle(this.canvas));
        }
    }

    addEventListeners() {
        window.addEventListener('resize', () => {
            this.resize();
            this.createParticles();
        });

        document.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        });

        document.addEventListener('mouseleave', () => {
            this.mouse.x = null;
            this.mouse.y = null;
        });
    }

    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.particles.forEach(particle => {
            particle.update(this.mouse);
            particle.draw(this.ctx);
        });

        requestAnimationFrame(() => this.animate());
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new ParticleBackground('background-canvas');
    });
} else {
    new ParticleBackground('background-canvas');
}
