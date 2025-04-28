# canvas-particles-simulation
Particles simulation that interacts with the users' mouse movements.

Demo: https://dynstat.github.io/canvas-particles-simulation/


## Flow

### 1. Overall Structure
The code is wrapped in an IIFE (Immediately Invoked Function Expression) to prevent global scope pollution. The main components are:

- Configuration object
- Helper functions
- Particle class
- ParticleSystem class
- Initialization code

### 2. Configuration
```javascript
const config = {
    particleBaseCount: 100,
    // ... other configuration options
};
```
Defines all adjustable parameters for the particle system, including particle counts, sizes, velocities, and visual settings.

### 3. Flow of Execution

#### A. Initial Setup
1. DOM loads and triggers:
```javascript
document.addEventListener('DOMContentLoaded', () => {
    new ParticleSystem('canvas');
});
```

2. ParticleSystem constructor:
   - Gets canvas element
   - Sets up context
   - Initializes properties
   - Calls `init()`

#### B. Initialization Phase
1. `handleResize()` is called to:
   - Set canvas dimensions
   - Apply gradient styling
   - Create initial particles

2. Event listeners are set up for:
   - Mouse movement
   - Window resizing

#### C. Animation Loop
The main animation loop (`animate()`) runs continuously with these steps:

1. Clear canvas
2. Apply mouse interactions
3. Update particle physics
4. Draw connections between particles
4. Draw particles
5. Request next animation frame

### 4. Key Classes and Methods

#### Particle Class
- **Constructor**: Initializes particle with:
  - Random position within canvas
  - Random velocity
  - Size (radius)
  - Push forces (for mouse interaction)

- **applyPhysics**: Handles:
  - Position updates
  - Boundary collisions
  - Force friction
  - Velocity changes

#### ParticleSystem Class
- **Mouse Interaction**: `applyMouseInteraction()`
  - Calculates force based on mouse proximity
  - Applies push forces to nearby particles

- **Connections**: `drawConnections()`
  - Draws lines between nearby particles
  - Controls opacity based on distance
  - Limits connections per particle

### 5. Data Flow
1. Mouse movement → Updates mouse coordinates
2. Animation frame starts
3. Mouse position → Affects particle push forces
4. Particles update positions based on:
   - Base velocity
   - Push forces
   - Boundary collisions
5. System draws connections between particles
6. System draws updated particle positions
7. Process repeats for next frame

### 6. Visual Elements
- Particles are drawn as circles
- Connections are lines with gradient colors
- Opacity changes based on distance
- Mouse interaction creates a repulsion effect

---