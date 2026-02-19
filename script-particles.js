// setup: grab the canvas and prepare the drawing context
const canvas = document.getElementById('canvas1');
const ctx = canvas.getContext('2d');

// Size the canvas to cover the viewport
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Create a gradient used for particle fill and stroke
const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
gradient.addColorStop(0.15, 'yellow');
gradient.addColorStop(0.5, 'green');
gradient.addColorStop(0.85, 'rgb(0,200,200)');

// Apply initial drawing styles
ctx.fillStyle = gradient;
ctx.strokeStyle = gradient;
ctx.lineWidth = 2;



class Particle {
  constructor(effect) {
    // Reference back to the parent Effect instance (contains shared state)
    this.effect = effect;

    // Size and position
    this.radius = Math.random() * 13 + 3;
    this.x = this.radius + Math.random() * (this.effect.width - this.radius * 2);
    // Start above the viewport so particles fall into view
    this.y = -this.radius - Math.random() * this.effect.height * 0.5;

    // Velocity
    this.vx = Math.random() * 6 - 2;
    this.vy = 0;

    // Gravity is proportional to radius (larger particles fall faster)
    this.gravity = this.radius * 0.01;

    // Cached size values useful for collision math
    this.width = this.radius * 2;
    this.height = this.radius * 2;
  }

  draw(context) {
    // Draw a circle at the particle's position. When the Effect `mode`
    // is active the visual radius is scaled to create a different look.
    context.beginPath();
    const radiusFactor = this.effect.large ? 2 : 1;
    context.arc(this.x, this.y, this.radius * radiusFactor, 0, Math.PI * 2);
    context.fill();
  }

  update() {
    // Integrate gravity and velocity
    this.vy += this.gravity;
    this.x += this.vx;
    this.y += this.vy;

    // Simple horizontal bounce on left/right edges
    if (this.x > this.effect.width - this.radius || this.x < this.radius) {
      this.vx *= -1;
    }

    // Reset/respawn logic depends on the visual `mode`:
    // - Normal: when particle falls below the bottom, reset above.
    // - Inverted (`mode` true): particles travel upward; when they pass the
    //   top, respawn them just below the viewport so they re-enter upwards.
    if (!this.effect.gravityChange) {
      if (this.y > this.effect.height + this.radius + this.effect.maxDistance) {
        this.reset();
      }
    } else {
      if (this.y < -this.radius - this.effect.maxDistance) {
        this.x = this.radius + Math.random() * (this.effect.width - this.radius * 2);
        this.y = this.effect.height + this.radius + this.effect.maxDistance + Math.random() * this.effect.height * 0.2;
        this.vx = Math.random() * 8 - 4;
        this.vy = 0;
      }
    }

    // Collision detection with two DOM elements (AABB tests)
    // If a collision is found, `element` is set to that bounding rect.
    const collisionWithElement1 = (
      this.x + this.radius > this.effect.element.x &&
      this.x - this.radius < this.effect.element.x + this.effect.element.width &&
      this.y + this.radius > this.effect.element.y &&
      this.y - this.radius < this.effect.element.y + this.effect.element.height
    );

    const collisionWithElement2 = (
      this.x + this.radius > this.effect.element2.x &&
      this.x - this.radius < this.effect.element2.x + this.effect.element2.width &&
      this.y + this.radius > this.effect.element2.y &&
      this.y - this.radius < this.effect.element2.y + this.effect.element2.height
    );

    let element = null;

    if (collisionWithElement1) element = this.effect.element;
    if (collisionWithElement2) element = this.effect.element2;

    if (element) {

      // Rectangle center
      const rectCenterX = element.x + element.width / 2;
      const rectCenterY = element.y + element.height / 2;

      // Distance from particle center to rectangle center
      const dx = this.x - rectCenterX;
      const dy = this.y - rectCenterY;

      // Combined half sizes
      const halfWidth = element.width / 2;
      const halfHeight = element.height / 2;

      // Calculate overlap in both directions
      const overlapX = halfWidth + this.radius - Math.abs(dx);
      const overlapY = halfHeight + this.radius - Math.abs(dy);

      // Resolve on the axis with the smaller overlap
      if (overlapX < overlapY) {
        // Horizontal collision
        if (dx > 0) {
          this.x += overlapX;
        } else {
          this.x -= overlapX;
        }
        this.vx *= -1;
      } else {
        // Vertical collision
        if (dy > 0) {
          this.y += overlapY; // bottom collision
        } else {
          this.y -= overlapY; // top collision
        }
        this.vy *= -0.7;
      }

    } else {
      this.color = "blue";
    }
  }

  reset() {
    this.x = this.radius + Math.random() * (this.effect.width - this.radius * 2);
    this.y = -this.radius - this.effect.maxDistance - Math.random() * this.effect.height * 0.2;
    this.vx = Math.random() * 8 - 4;
    this.vy = 0;
  }

}

// The Effect class manages shared state for all particles and handles
// drawing, collisions, and mode toggling.
class Effect {
  constructor(canvas, context) {
    this.canvas = canvas;
    this.context = context;
    this.width = canvas.width;
    this.height = canvas.height;

    // Particle container and count
    this.particles = [];
    this.numberOfParticles = 300;
    this.createParticles();

    // Bounding rectangles for two DOM elements that particles can collide with
    this.element = document.getElementById('mainText1').getBoundingClientRect();
    this.element2 = document.getElementById('mainText2').getBoundingClientRect();

    // Maximum connection distance for connecting lines between particles
    this.maxDistance = 125;

    // Visual/physics mode flag toggled by the user (keydown 'd')
    this.mode = false;
    this.gravityChange = false;

    // Listen for 'd' to toggle effect mode
    window.addEventListener('keydown', e => {
      if (e.key === ' ') {
        this.gravityMode();
      } else if (e.key === '1') {
        this.largeMode();     
      }  else if (e.key === '2') {
        this.connectorMode();
      } else if (e.key === 'a') {
        this.gradientMode();
      } else if (e.key === 's') {
        this.blueMode();
      } else if (e.key === 'd') {
        this.redMode();
      } else if (e.key === 'f') {
        this.yellowMode();
      }
    });

    // Resize handler: keep canvas and bounding boxes in sync with viewport
    window.addEventListener('resize', e => {
      this.resize(e.target.innerWidth, e.target.innerHeight);
    });
  }

  createParticles() {
    // Instantiate the requested number of particles and store them
    for (let i = 0; i < this.numberOfParticles; i++) {
      this.particles.push(new Particle(this));
    }
  }

  handleParticles(context) {
    // Draw connecting lines first (unless `mode` is active, which disables
    // connections for visual clarity and performance).
    if (!this.mode) this.connectParticles(context);
    this.particles.forEach(particle => {
      particle.draw(context);
      particle.update();
    });
  }

  connectParticles(context) {
    // Draw faint lines between nearby particles to create a network effect
    for (let a = 0; a < this.particles.length; a++) {
      for (let b = a; b < this.particles.length; b++) {
        const dx = this.particles[a].x - this.particles[b].x;
        const dy = this.particles[a].y - this.particles[b].y;
        const distance = Math.hypot(dx, dy);
        if (distance < this.maxDistance) {
          context.save();
          const opacity = 1 - distance / this.maxDistance;
          context.globalAlpha = opacity;
          context.beginPath();
          context.moveTo(this.particles[a].x, this.particles[a].y);
          context.lineTo(this.particles[b].x, this.particles[b].y);
          context.stroke();
          context.restore();
        }
      }
    }
  }

  resize(width, height) {
    // Resize canvas and update internal dimensions
    this.canvas.width = width;
    this.canvas.height = height;
    this.width = width;
    this.height = height;

    // Recalculate bounding boxes for text elements (their position may change)
    this.element = document.getElementById('mainText1').getBoundingClientRect();
    this.element2 = document.getElementById('mainText2').getBoundingClientRect();

    // Recreate the gradient to match the new size and apply styles
    const gradient = this.context.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0.15, 'yellow');
    gradient.addColorStop(0.5, 'blue');
    gradient.addColorStop(0.85, 'green');

    this.context.fillStyle = gradient;
    this.context.strokeStyle = gradient;

    // Reset all particles so they are distributed properly for the new size
    this.particles.forEach(particle => {
      particle.reset();
    });
  }

  gravityMode() {
    this.gravityChange = !this.gravityChange;
    // Invert gravity for every particle so motion direction reverses
    this.particles.forEach(p => {
      p.gravity *= -1;
    });
  } 

  connectorMode() {
    this.mode = !this.mode;
  }

  largeMode() {
    this.large = !this.large;
  }

  blueMode() {
      // Alternate visual style when mode enabled
      this.context.fillStyle = 'blue';
      this.context.strokeStyle = 'blue';
  }

  redMode() {
      this.context.fillStyle = 'red';
      this.context.strokeStyle = 'red';
  }

  yellowMode() {
      this.context.fillStyle = 'yellow';
      this.context.strokeStyle = 'yellow';
  }

  gradientMode() {
      // Restore gradient-based styling when mode is disabled
      const g = this.context.createLinearGradient(0, 0, this.width, this.height);
      g.addColorStop(0.15, 'yellow');
      g.addColorStop(0.5, 'green');
      g.addColorStop(0.85, 'rgb(0,200,200)');
      this.context.fillStyle = g;
      this.context.strokeStyle = g;
  }
}

// Instantiate the Effect and start the render loop
const effect = new Effect(canvas, ctx);

// Main animation loop: clear canvas, draw/update particles, schedule next frame
function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  effect.handleParticles(ctx);
  requestAnimationFrame(animate);
}

document.addEventListener('keypress', e => {
  if (e.key === 'g') {
    animate();
  }
})
