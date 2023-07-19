var myCanvas = document.querySelector("canvas"); // grabbing the element from the DOM structure as an object

// setting the height and the width of the canvas
myCanvas.height = window.innerHeight;
myCanvas.width = window.innerWidth;

// getting the 2D context of the canvas
var c = myCanvas.getContext("2d");
// console.log(c);

colorPalette = ["#e63946", "#F7F3D9", "#a8dadc", "#457b9d", "#1d3557"]
// c.fillStyle = 'blue';


// Adding the linear gradient in 5 parts with different colors.
const gradient = c.createLinearGradient(0, 0, myCanvas.width, myCanvas.height);
gradient.addColorStop(0, '#d4362b');
gradient.addColorStop(0.25, '#f89334');
gradient.addColorStop(0.5, '#e4e706');
gradient.addColorStop(0.75, '#65dd15');
gradient.addColorStop(1, '#35d1d6');
c.strokeStyle = gradient;
c.fillStyle = gradient; // styling the context with the above gradient



// Fix the size of the canvas frame as the window gets resized.
window.addEventListener('resize', () => {
    myCanvas.height = window.innerHeight;
    myCanvas.width = window.innerWidth;
    c.strokeStyle = gradient;
    c.fillStyle = gradient; // also re-style the canvas using its context 
})

// mouse events stored in a global object named "mouse"
let mouse = {
    x: undefined,
    y: undefined,
    pressed: false,
    radius: 200
}


// event listner of moving mouse
window.addEventListener('mousemove', (e) => {
    mouse.x = e.x;
    mouse.y = e.y;
})


// Creating the class for defining the properties of each particle.
class Particle {

    constructor() {
        // console.log("PARTICLE CLASS");
        this.radius = Math.floor(Math.random() * 10 + 1);
        this.x = this.radius + Math.random() * (myCanvas.width - this.radius * 2);
        this.y = this.radius + Math.random() * (myCanvas.height - this.radius * 2);
        this.vx = Math.random() * 1 - 0.5;
        this.vy = Math.random() * 1 - 0.5;
        this.pushX = 0;
        this.pushY = 0;

        // More the friction value gets closer to 1, more will be the effect of Push value, as the Push value is being multiplied with friction value later in the code.
        this.friction = 0.45;
        //maybe modify this value according to the weight of the particle. Closer the value to Zero, lesser the effect on the particle, since the particle's coordinates are being multiply with the friction value. 
    }

    // method to draw the particle (using arc method to create a circle.)
    draw(ctx) {
        // console.log("PARTICLE----->draw");
        ctx.beginPath(); // needed to indicate that we are draw again from the start, otherwise it might get connected with the other drawingd.
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); // creating the arc (circle)
        ctx.fill(); // THIS IS THE METHOD THAT ACTUALLY DISPLAYS THE ARC. (we could use ctx.stroke() if we wanted a hollow circle)
    }
}



// Class for the collections of the particles defined in the other class.
class Collection {
    constructor(count, behaviour, interacion) {
        // console.log("COLLECTION CLASS");
        this.count = count;
        this.particles = [];
        this.behavior = behaviour;
        this.selfInteraction = interacion;
        // this.mouse = {
        //     x: 0,
        //     y: 0,
        //     pressed: false,
        //     radius: 200
        // }
        this.create();

        //     window.addEventListener('mousemove', (e) => {
        //         this.mouse.x = e.x;
        //         this.mouse.y = e.y;
        //     })
    }

    // creating an array with a collection of particles according to the given count.
    create() {
        // console.log("COLLECTION---->create");
        for (let i = 0; i < this.count; i++) {
            this.particles.push(new Particle())
        }
    }

    // internally calls the behave function of the behavior object that we have chosen for this collection. 
    start() {
        // console.log("COLLECTION---->start");
        this.selfInteraction.connectParticles(c, this.particles);
        this.behavior.behave(this.particles);
    }
}



// Class for defining the properties for as to how should the collections of the particles behave according to the user interaction.
class Behavior {
    constructor() {
        // console.log("BEHAVIOR CLASS");

    }

    // actual effect w.r.t the mouse events 
    effect(particle) {
        // console.log("BEHAVIOR--->effect");

        const dx = particle.x - mouse.x; // x-distance between particle and the cursor.
        const dy = particle.y - mouse.y; // x-distance between particle and the cursor.

        const distance = Math.hypot(dx, dy);// actual distance between the cursor and the particle.
        const force = (mouse.radius / distance); // force related to the effecting radius defined in the mouse object above.

        // if the the particle comes within the effecting radius, it push value gets calculated.
        if (distance < mouse.radius) {
            const angle = Math.atan2(dy, dx);
            particle.pushX += Math.cos(angle) * force;
            particle.pushY += Math.sin(angle) * force;
        }

        // actually pushing the particle
        particle.x += (particle.pushX *= particle.friction) + particle.vx;
        particle.y += (particle.pushY *= particle.friction) + particle.vy;

        // making it reverse the direction if the window is resized so that the particles do not get out of the canvas.
        if (particle.x < particle.radius) {
            particle.x = particle.radius;
            particle.vx *= -1;
            // making it reverse the direction from the edges of the screen.
        } else if (particle.x > window.innerWidth - particle.radius) {
            particle.x = window.innerWidth - particle.radius;
            particle.vx *= -1;
        }
        if (particle.y < particle.radius) {
            particle.y = particle.radius;
            particle.vy *= -1;
        } else if (particle.y > window.innerHeight - particle.radius) {
            particle.y = window.innerHeight - particle.radius;
            particle.vy *= -1;
        }

    }

    // behave method consists of applying a callback function for each particle in the collection
    behave(collection) {
        // console.log("BEHAVIOR---->behave");

        collection.forEach(particle => {
            // console.log(particle);
            particle.draw(c);
            this.effect(particle);


        });
    }



}

class CollectionSelfInteraction {
    constructor() {
        // console.log("CollectionSelfInteraction Constructor");

    }
    connectParticles(context, particles) {
        const maxDistance = 70;
        for (let a = 0; a < particles.length; a++) {
            for (let b = a; b < particles.length; b++) {
                const ab_x = particles[a].x - particles[b].x;
                const ab_y = particles[a].y - particles[b].y;
                const distance = Math.hypot(ab_x, ab_y);
                if (distance < maxDistance) {
                    context.save(); // creating a savepoint

                    // changing the opacity according to the distance to maxdistance ratio.
                    const opacity = 1 - (distance / maxDistance);
                    context.globalAlpha = opacity;
                    context.beginPath();
                    context.moveTo(particles[a].x, particles[a].y);
                    context.lineTo(particles[b].x, particles[b].y);
                    context.stroke();

                    context.restore(); // restoring back to the previous saved point.
                }
            }
        }
    }

}

// creating a custom behavior object
let behaviour1 = new Behavior();


//creating a custom CollectionSelfInteraction object.
let selfInteraction1 = new CollectionSelfInteraction();


// collection object
let particlesCollection = new Collection(1000, behaviour1, selfInteraction1);


// defining the animate function
function animate() {

    c.clearRect(0, 0, innerWidth, innerHeight); // To clear the previously drawn objects every frame.

    // particlesCollection
    particlesCollection.start();

    // calls a function asynchronously for each new frame.
    requestAnimationFrame(animate);
}



// Calling the animate function 
animate();