// Wrap everything in an IIFE (Immediately Invoked Function Expression) to prevent global scope pollution
(function () {

    // Configuration object containing all adjustable parameters for the particle system
    const config = {
        particleBaseCount: 100,              // Base number of particles for small screens
        particleCountLargeScreenFactor: 4.5, // Multiplier for particle count on larger screens
        smallScreenWidthThreshold: 600,      // Width threshold to determine small/large screen
        particleRadiusMin: 1,                // Minimum particle size
        particleRadiusMax: 11,               // Maximum particle size (exclusive)
        particleVelocityFactor: 1.0,         // Speed multiplier for particles
        mouseInteractionRadius: 200,         // Radius of mouse influence area
        particlePushFriction: 0.55,         // Friction coefficient for push forces
        connectionMaxDistance: 100,          // Maximum distance for particle connections
        connectionMaxPeers: 4,              // Maximum number of connections per particle
        connectionOpacityFactor: 0.5,       // Base opacity for connection lines
        gradientColors: ['#d4362b', '#f89334', '#e4e706', '#00c975', '#1091e7'] // Colors for gradient
    };

    // Helper function to generate random decimal number between min and max
    function random(min, max) {
        return Math.random() * (max - min) + min;
    }

    // Helper function to generate random integer between min and max
    function randomInt(min, max) {
        return Math.floor(random(min, max));
    }

    // Particle class - represents individual particles in the system
    class Particle {
        constructor(canvasWidth, canvasHeight) {
            // Initialize particle with random radius within configured bounds
            this.radius = randomInt(config.particleRadiusMin, config.particleRadiusMax);

            // Set random starting position ensuring particle is fully within canvas bounds
            this.x = random(this.radius, canvasWidth - this.radius);
            this.y = random(this.radius, canvasHeight - this.radius);

            // Set random initial velocity with configured speed factor
            this.vx = random(-0.5, 0.5) * config.particleVelocityFactor;
            this.vy = random(-0.5, 0.5) * config.particleVelocityFactor;

            // Initialize push force components (used for mouse interaction)
            this.pushX = 0;
            this.pushY = 0;
            this.friction = config.particlePushFriction;
        }

        // Update particle physics each frame
        applyPhysics(canvasWidth, canvasHeight) {
            // Apply friction to slow down push forces over time
            this.pushX *= this.friction;
            this.pushY *= this.friction;

            // Update particle position based on velocity and push forces
            this.x += this.pushX + this.vx;
            this.y += this.pushY + this.vy;

            // Handle collisions with canvas boundaries
            // Left boundary
            if (this.x < this.radius) {
                this.x = this.radius;
                this.vx *= -1;              // Reverse velocity
                this.pushX *= -0.5;         // Reduce push force
            }
            // Right boundary
            else if (this.x > canvasWidth - this.radius) {
                this.x = canvasWidth - this.radius;
                this.vx *= -1;
                this.pushX *= -0.5;
            }
            // Top boundary
            if (this.y < this.radius) {
                this.y = this.radius;
                this.vy *= -1;
                this.pushY *= -0.5;
            }
            // Bottom boundary
            else if (this.y > canvasHeight - this.radius) {
                this.y = canvasHeight - this.radius;
                this.vy *= -1;
                this.pushY *= -0.5;
            }
        }

        // Draw the particle on the canvas
        draw(ctx) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Main system class managing all particles and interactions
    class ParticleSystem {
        constructor(canvasSelector) {
            // Initialize canvas and context
            this.canvas = document.querySelector(canvasSelector);
            if (!this.canvas) {
                console.error("Canvas element not found:", canvasSelector);
                return;
            }
            this.ctx = this.canvas.getContext("2d");

            // Initialize particle array and canvas dimensions
            this.particles = [];
            this.canvasWidth = 0;
            this.canvasHeight = 0;

            // Initialize mouse tracking object
            this.mouse = {
                x: undefined,
                y: undefined,
                radius: config.mouseInteractionRadius
            };

            // Bind methods to maintain correct 'this' context
            this.handleMouseMove = this.handleMouseMove.bind(this);
            this.handleResize = this.handleResize.bind(this);
            this.animate = this.animate.bind(this);

            // Start initialization
            this.init();
        }

        init() {
            // Initial setup
            this.handleResize(); // Set initial size and create particles
            this.setupEventListeners();
            this.animate(); // Start the animation loop
        }

        setupEventListeners() {
            window.addEventListener('mousemove', this.handleMouseMove);
            window.addEventListener('resize', this.handleResize);
            // Add touch listeners if needed
        }

        handleMouseMove(event) {
            this.mouse.x = event.clientX;
            this.mouse.y = event.clientY;
        }

        handleResize() {
            this.canvasWidth = window.innerWidth;
            this.canvasHeight = window.innerHeight;
            this.canvas.width = this.canvasWidth;
            this.canvas.height = this.canvasHeight;

            this.applyGradientStyle();
            this.createParticles(); // Recreate particles on resize for simplicity here
        }

        applyGradientStyle() {
            const gradient = this.ctx.createLinearGradient(0, 0, this.canvasWidth, this.canvasHeight);
            const step = 1 / (config.gradientColors.length - 1);
            config.gradientColors.forEach((color, index) => {
                gradient.addColorStop(Math.min(index * step, 1.0), color); // Ensure stop is <= 1
            });
            this.ctx.strokeStyle = gradient;
            this.ctx.fillStyle = gradient;
        }

        createParticles() {
            this.particles = [];
            const count = this.canvasWidth > config.smallScreenWidthThreshold
                ? config.particleBaseCount * config.particleCountLargeScreenFactor
                : config.particleBaseCount;

            for (let i = 0; i < count; i++) {
                this.particles.push(new Particle(this.canvasWidth, this.canvasHeight));
            }
            // Initialize mouse position off-screen until first move
            this.mouse.x = -config.mouseInteractionRadius * 2;
            this.mouse.y = -config.mouseInteractionRadius * 2;
        }

        applyMouseInteraction() {
            if (this.mouse.x === undefined || this.mouse.y === undefined) return;

            for (const particle of this.particles) {
                const dx = particle.x - this.mouse.x;
                const dy = particle.y - this.mouse.y;
                const distance = Math.hypot(dx, dy);

                if (distance < this.mouse.radius && distance > 0.1) { // Add small threshold to avoid division by zero/huge forces
                    const forceDirectionX = dx / distance;
                    const forceDirectionY = dy / distance;
                    // Force stronger closer to center, falls off towards radius edge
                    const forceMagnitude = (1 - distance / this.mouse.radius); // Simple linear falloff

                    // Apply push force (consider scaling by particle mass/radius if desired)
                    particle.pushX += forceDirectionX * forceMagnitude * 5; // Adjust multiplier for desired push strength
                    particle.pushY += forceDirectionY * forceMagnitude * 5;
                }
            }
        }


        drawConnections() {
            const maxDistSq = config.connectionMaxDistance * config.connectionMaxDistance; // Use squared distance for efficiency

            for (let i = 0; i < this.particles.length; i++) {
                let connections = 0;
                const p1 = this.particles[i];

                for (let j = i + 1; j < this.particles.length; j++) { // Check each pair only once
                    if (connections >= config.connectionMaxPeers) break; // Max connections reached for p1

                    const p2 = this.particles[j];
                    const dx = p1.x - p2.x;
                    const dy = p1.y - p2.y;
                    const distSq = dx * dx + dy * dy;

                    if (distSq < maxDistSq) {
                        this.ctx.save();
                        const distance = Math.sqrt(distSq); // Need actual distance for opacity
                        const opacity = (1 - (distance / config.connectionMaxDistance)) * config.connectionOpacityFactor;
                        this.ctx.globalAlpha = Math.max(0, Math.min(opacity, 1)); // Clamp opacity 0-1

                        this.ctx.beginPath();
                        this.ctx.moveTo(p1.x, p1.y);
                        this.ctx.lineTo(p2.x, p2.y);
                        this.ctx.stroke();
                        this.ctx.restore();
                        connections++;
                    }
                }
            }
        }

        animate() {
            // 1. Clear Canvas
            this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);

            // 2. Apply Interactions
            this.applyMouseInteraction();

            // 3. Update Particles
            for (const particle of this.particles) {
                particle.applyPhysics(this.canvasWidth, this.canvasHeight);
            }

            // 4. Draw Connections (draw lines first, underneath particles)
            this.drawConnections();

            // 5. Draw Particles
            for (const particle of this.particles) {
                particle.draw(this.ctx);
            }

            // 6. Request Next Frame
            requestAnimationFrame(this.animate);
        }
    }

    // Initialize the particle system when DOM is fully loaded
    document.addEventListener('DOMContentLoaded', () => {
        new ParticleSystem('canvas');
    });

})();