var myCanvas = document.querySelector("canvas");
myCanvas.height = window.innerHeight;
myCanvas.width = window.innerWidth;

var c = myCanvas.getContext("2d");
// console.log(c);

colorPalette = ["#e63946", "#F7F3D9", "#a8dadc", "#457b9d", "#1d3557"]
// c.fillStyle = 'blue';

const gradient = c.createLinearGradient(0, 0, myCanvas.width, myCanvas.height);
gradient.addColorStop(0, '#d4362b');
gradient.addColorStop(0.25, '#f89334');
gradient.addColorStop(0.5, '#e4e706');
gradient.addColorStop(0.75, '#65dd15');
gradient.addColorStop(1, '#35d1d6');
c.fillStyle = gradient;



// Fix the size of the canvas frame as the window gets resized.
window.addEventListener('resize', () => {
    myCanvas.height = window.innerHeight;
    myCanvas.width = window.innerWidth;
    c.fillStyle = gradient;
})

// mouse events
let mouse = {
    x: undefined,
    y: undefined,
    pressed: false,
    radius: 200
}

window.addEventListener('mousemove', (e) => {
    mouse.x = e.x;
    mouse.y = e.y;
})



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
        this.friction = 0.45; // maybe modify this value according to the weight of the particle. Closer the value to Zero, lesser the effect on the particle, since the particle's coordinates are being multiply with the friction value. 
    }
    draw(ctx) {
        // console.log("PARTICLE----->draw");
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }


}

class Collection {
    constructor(count, behaviour) {
        // console.log("COLLECTION CLASS");
        this.count = count;
        this.particles = [];
        this.behavior = behaviour;
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
    create() {
        // console.log("COLLECTION---->create");
        for (let i = 0; i < this.count; i++) {
            this.particles.push(new Particle())
        }
    }
    start() {
        // console.log("COLLECTION---->start");

        this.behavior.behave(this.particles);
    }



}

class Behavior {
    constructor() {
        // console.log("BEHAVIOR CLASS");

    }
    behave(collection) {
        // console.log("BEHAVIOR---->behave");
        collection.forEach(particle => {
            // console.log(particle);
            particle.draw(c);
            this.effect(particle);

        });


    }
    effect(particle) {
        // console.log("BEHAVIOR--->effect");

        const dx = particle.x - mouse.x;
        const dy = particle.y - mouse.y;
        const distance = Math.hypot(dx, dy);
        const force = (mouse.radius / distance);
        if (distance < mouse.radius) {
            const angle = Math.atan2(dy, dx);
            particle.pushX += Math.cos(angle) * force;
            particle.pushY += Math.sin(angle) * force;
        }

        particle.x += (particle.pushX *= particle.friction) + particle.vx;
        particle.y += (particle.pushY *= particle.friction) + particle.vy;

        if (particle.x < particle.radius) {
            particle.x = particle.radius;
            particle.vx *= -1;
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


}

// class Interaction {

// }

let behaviour1 = new Behavior();
let particlesCollection = new Collection(1000, behaviour1);


function animate() {

    c.clearRect(0, 0, innerWidth, innerHeight); // To clear the previously drawn objects every frame.
    // particlesCollection
    particlesCollection.start();
    requestAnimationFrame(animate);
}



// Calling the animate function 
animate();