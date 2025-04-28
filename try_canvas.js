// ====================================================
// STEP 1: CODEBASE STRUCTURE AND CONFIGURATION
// ====================================================
// Wrap in an IIFE to avoid global scope pollution - prevents variables and functions from leaking to global scope
(function () {

    // 1.1 - CONFIGURATION PARAMETERS
    // This object contains all configurable parameters for the particle system
    const config = {
        particleBaseCount: 100,         // Base number of particles for small screens
        particleCountLargeScreenFactor: 4.5, // Multiply base count for larger screens
        smallScreenWidthThreshold: 600, // Width threshold to determine small/large screen
        particleRadiusMin: 1,           // Minimum particle radius
        particleRadiusMax: 11,          // Maximum particle radius (exclusive)
        particleVelocityFactor: 1.0,    // Controls initial particle speed
        mouseInteractionRadius: 200,    // Radius of mouse influence area
        particlePushFriction: 0.55,     // Friction factor - lower value means push force fades faster
        connectionMaxDistance: 100,     // Maximum distance for particle connections
        connectionMaxPeers: 4,          // Maximum number of connections per particle
        connectionOpacityFactor: 0.5,   // Base opacity multiplier for connection lines
        gradientColors: ['#d4362b', '#f89334', '#e4e706', '#00c975', '#1091e7'] // Colors for gradient
    };

    // 1.2 - UTILITY FUNCTIONS
    // Helper function to generate random float between min and max (inclusive of min, exclusive of max)
    function random(min, max) {
        return Math.random() * (max - min) + min;
    }

    // Helper function to generate random integer between min and max (inclusive of min, exclusive of max)
    function randomInt(min, max) {
        return Math.floor(random(min, max));
    }

    // ====================================================
    // STEP 2: PARTICLE DEFINITION
    // ====================================================
    // Defines individual particle behavior and properties
    class Particle {
        constructor(canvasWidth, canvasHeight) {
            // 2.1 - PARTICLE INITIALIZATION
            // Generate random radius within configured range
            this.radius = randomInt(config.particleRadiusMin, config.particleRadiusMax);
            
            // Set random position ensuring particle is fully inside canvas bounds
            this.x = random(this.radius, canvasWidth - this.radius);
            this.y = random(this.radius, canvasHeight - this.radius);
            
            // Set random initial velocity with configured factor
            this.vx = random(-0.5, 0.5) * config.particleVelocityFactor;
            this.vy = random(-0.5, 0.5) * config.particleVelocityFactor;
            
            // Initialize push forces (for mouse interaction) to zero
            this.pushX = 0;
            this.pushY = 0;
            
            // Copy friction value from config
            this.friction = config.particlePushFriction;
        }

        // 2.2 - PHYSICS SIMULATION
        // Updates particle position and handles collisions
        applyPhysics(canvasWidth, canvasHeight) {
            // Apply friction to reduce push force over time
            this.pushX *= this.friction;
            this.pushY *= this.friction;

            // Update position based on velocity and push force
            this.x += this.pushX + this.vx;
            this.y += this.pushY + this.vy;

            // 2.3 - BOUNDARY COLLISION HANDLING
            // Left boundary collision
            if (this.x < this.radius) {
                this.x = this.radius;        // Reposition to boundary
                this.vx *= -1;               // Reverse velocity (bounce)
                this.pushX *= -0.5;          // Reduce and reverse push force
            } 
            // Right boundary collision
            else if (this.x > canvasWidth - this.radius) {
                this.x = canvasWidth - this.radius;
                this.vx *= -1;
                this.pushX *= -0.5;
            }
            
            // Top boundary collision
            if (this.y < this.radius) {
                this.y = this.radius;
                this.vy *= -1;
                this.pushY *= -0.5;
            } 
            // Bottom boundary collision
            else if (this.y > canvasHeight - this.radius) {
                this.y = canvasHeight - this.radius;
                this.vy *= -1;
                this.pushY *= -0.5;
            }

            // Optional damping code (commented out)
            // this.pushX *= 0.99;
            // this.pushY *= 0.99;
        }

        // 2.4 - RENDERING
        // Draws the particle on the canvas
        draw(ctx) {
            ctx.beginPath();                             // Start a new path
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); // Draw full circle
            ctx.fill();                                  // Fill with current context fillStyle
        }
    }

    // ====================================================
    // STEP 3: PARTICLE SYSTEM MANAGER
    // ====================================================
    // Main class that manages all particles and rendering
    class ParticleSystem {
        // 3.1 - SYSTEM INITIALIZATION
        constructor(canvasSelector) {
            // Get canvas element from DOM
            this.canvas = document.querySelector(canvasSelector);
            if (!this.canvas) {
                console.error("Canvas element not found:", canvasSelector);
                return;
            }
            
            // Get 2D rendering context
            this.ctx = this.canvas.getContext("2d");
            
            // Initialize empty particle array
            this.particles = [];
            
            // Initialize canvas dimensions (will be set properly in handleResize)
            this.canvasWidth = 0;
            this.canvasHeight = 0;

            // 3.2 - MOUSE INTERACTION SETUP
            // Initialize mouse tracking object
            this.mouse = {
                x: undefined,
                y: undefined,
                radius: config.mouseInteractionRadius
            };

            // Bind methods to preserve 'this' context when used as event handlers
            this.handleMouseMove = this.handleMouseMove.bind(this);
            this.handleResize = this.handleResize.bind(this);
            this.animate = this.animate.bind(this);

            // Start initialization
            this.init();
        }

        // 3.3 - INITIALIZATION SEQUENCE
        init() {
            this.handleResize();        // Set initial size and create particles
            this.setupEventListeners(); // Set up event listeners
            this.animate();             // Start animation loop
        }

        // 3.4 - EVENT LISTENER SETUP
        setupEventListeners() {
            window.addEventListener('mousemove', this.handleMouseMove);
            window.addEventListener('resize', this.handleResize);
            // Comment indicates touch support could be added here
        }

        // 3.5 - MOUSE MOVEMENT HANDLER
        // Updates mouse position when mouse moves
        handleMouseMove(event) {
            this.mouse.x = event.clientX;
            this.mouse.y = event.clientY;
        }

        // 3.6 - WINDOW RESIZE HANDLER
        // Updates canvas dimensions and recreates particles on window resize
        handleResize() {
            // Set canvas dimensions to match window
            this.canvasWidth = window.innerWidth;
            this.canvasHeight = window.innerHeight;
            this.canvas.width = this.canvasWidth;
            this.canvas.height = this.canvasHeight;

            // Update gradient styling and recreate particles
            this.applyGradientStyle();
            this.createParticles();
        }

        // 3.7 - GRADIENT STYLING
        // Creates a linear gradient for particles and connections
        applyGradientStyle() {
            // Create gradient from top-left to bottom-right
            const gradient = this.ctx.createLinearGradient(0, 0, this.canvasWidth, this.canvasHeight);
            
            // Calculate step size for evenly distributing colors
            const step = 1 / (config.gradientColors.length - 1);
            
            // Add each color at its calculated position
            config.gradientColors.forEach((color, index) => {
                gradient.addColorStop(Math.min(index * step, 1.0), color); // Ensure stop is <= 1
            });
            
            // Apply gradient to both stroke (lines) and fill (particles)
            this.ctx.strokeStyle = gradient;
            this.ctx.fillStyle = gradient;
        }

        // ====================================================
        // STEP 4: PARTICLE MANAGEMENT
        // ====================================================
        
        // 4.1 - PARTICLE CREATION
        // Creates particles based on screen size
        createParticles() {
            // Clear existing particles
            this.particles = [];
            
            // Calculate particle count based on screen width
            const count = this.canvasWidth > config.smallScreenWidthThreshold
                ? config.particleBaseCount * config.particleCountLargeScreenFactor
                : config.particleBaseCount;

            // Create particles and add to array
            for (let i = 0; i < count; i++) {
                this.particles.push(new Particle(this.canvasWidth, this.canvasHeight));
            }
            
            // Initialize mouse position off-screen until first mouse movement
            this.mouse.x = -config.mouseInteractionRadius * 2;
            this.mouse.y = -config.mouseInteractionRadius * 2;
        }

        // 4.2 - MOUSE INTERACTION PHYSICS
        // Applies repulsive force to particles near mouse
        applyMouseInteraction() {
            // Skip if mouse position is undefined
            if (this.mouse.x === undefined || this.mouse.y === undefined) return;

            // Loop through all particles
            for (const particle of this.particles) {
                // Calculate vector from mouse to particle
                const dx = particle.x - this.mouse.x;
                const dy = particle.y - this.mouse.y;
                
                // Calculate distance using hypot (Pythagoras)
                const distance = Math.hypot(dx, dy);

                // Only apply force if particle is within radius and not too close
                if (distance < this.mouse.radius && distance > 0.1) {
                    // Calculate unit vector for force direction
                    const forceDirectionX = dx / distance;
                    const forceDirectionY = dy / distance;
                    
                    // Calculate force magnitude - stronger near mouse, weaker at edge
                    const forceMagnitude = (1 - distance / this.mouse.radius);

                    // Apply push force to particle
                    particle.pushX += forceDirectionX * forceMagnitude * 5;
                    particle.pushY += forceDirectionY * forceMagnitude * 5;
                }
            }
        }

        // 4.3 - PARTICLE CONNECTION RENDERING
        // Draws lines between nearby particles
        drawConnections() {
            // Square max distance for efficiency (avoids square root in distance check)
            const maxDistSq = config.connectionMaxDistance * config.connectionMaxDistance;

            // Check each particle
            for (let i = 0; i < this.particles.length; i++) {
                let connections = 0;
                const p1 = this.particles[i];

                // Compare with all subsequent particles (to avoid checking pairs twice)
                for (let j = i + 1; j < this.particles.length; j++) {
                    // Break if max connections reached for current particle
                    if (connections >= config.connectionMaxPeers) break;

                    const p2 = this.particles[j];
                    
                    // Calculate squared distance between particles
                    const dx = p1.x - p2.x;
                    const dy = p1.y - p2.y;
                    const distSq = dx * dx + dy * dy;

                    // If particles are close enough, draw connection
                    if (distSq < maxDistSq) {
                        this.ctx.save();  // Save current context state
                        
                        // Calculate actual distance for opacity
                        const distance = Math.sqrt(distSq);
                        
                        // Calculate opacity based on distance - closer = more opaque
                        const opacity = (1 - (distance / config.connectionMaxDistance)) * config.connectionOpacityFactor;
                        this.ctx.globalAlpha = Math.max(0, Math.min(opacity, 1)); // Clamp to valid range

                        // Draw line between particles
                        this.ctx.beginPath();
                        this.ctx.moveTo(p1.x, p1.y);
                        this.ctx.lineTo(p2.x, p2.y);
                        this.ctx.stroke();
                        
                        this.ctx.restore(); // Restore context state
                        connections++;      // Increment connection count
                    }
                }
            }
        }

        // ====================================================
        // STEP 5: ANIMATION LOOP
        // ====================================================
        // Main render loop that updates and draws all elements
        animate() {
            // 5.1 - Clear previous frame
            this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);

            // 5.2 - Apply mouse interactions
            this.applyMouseInteraction();

            // 5.3 - Update particle physics
            for (const particle of this.particles) {
                particle.applyPhysics(this.canvasWidth, this.canvasHeight);
            }

            // 5.4 - Draw connections between particles
            // (Drawn first so particles appear on top)
            this.drawConnections();

            // 5.5 - Draw all particles
            for (const particle of this.particles) {
                particle.draw(this.ctx);
            }

            // 5.6 - Schedule next frame
            requestAnimationFrame(this.animate);
        }
    }

    // ====================================================
    // STEP 6: APPLICATION INITIALIZATION
    // ====================================================
    // Initialize the system when DOM is ready
    document.addEventListener('DOMContentLoaded', () => {
        new ParticleSystem('canvas');
    });

})(); // End IIFE - Immediately Invoked Function Expression