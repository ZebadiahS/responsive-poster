// setup
const canvas = document.getElementById('canvas1');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
gradient.addColorStop(0.15, 'yellow');
gradient.addColorStop(0.5, 'blue');
gradient.addColorStop(0.85, 'green');

ctx.fillStyle = gradient;
ctx.strokeStyle = gradient;
ctx.lineWidth = 1;



class Particle {
  constructor(effect) {
    this.effect = effect;
    this.radius = Math.random() * 13 + 3;
    this.x = this.radius + Math.random() * (this.effect.width - this.radius * 2);
    this.y = -this.radius - Math.random() * this.effect.height * 0.5;
    this.vx = Math.random() * 6 - 2;
    this.vy = 0;
    this.gravity = this.radius * 0.003;
    this.width = this.radius * 2;
    this.height = this.radius * 2;
  }

  draw(context) {
    context.beginPath();
    const radiusFactor = this.effect.mode ? 0.5 : 1;
    context.arc(this.x, this.y, this.radius * radiusFactor, 0, Math.PI * 2);
    context.fill();
  }

  update() {
    this.vy += this.gravity;
    this.x += this.vx;
    this.y += this.vy;
    if (this.x > this.effect.width - this.radius || this.x < this.radius) {
      this.vx *= -1;
    }
    if (!this.effect.mode) {
      if (this.y > this.effect.height + this.radius + this.effect.maxDistance) {
        this.reset();
      }
    } else {
      // When mode is active particles move upward; if they pass the top,
      // respawn them just below the viewport (mirror of normal behavior).
      if (this.y < -this.radius - this.effect.maxDistance) {
        this.x = this.radius + Math.random() * (this.effect.width - this.radius * 2);
        this.y = this.effect.height + this.radius + this.effect.maxDistance + Math.random() * this.effect.height * 0.2;
        this.vx = Math.random() * 8 - 4;
        this.vy = 0;
      }
    }

    //collision detection
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

class Effect {
  constructor(canvas, context) {
    this.canvas = canvas;
    this.context = context;
    this.width = canvas.width;
    this.height = canvas.height;
    this.particles = [];
    this.numberOfParticles = 300;
    this.createParticles();

    this.element = document.getElementById('mainText1').getBoundingClientRect();
    this.element2 = document.getElementById('mainText2').getBoundingClientRect();

    this.maxDistance = 100;

    this.mode = false;

    window.addEventListener('keydown', e => {
      if (e.key === 'd') {
        this.toggleMode();
      }
    });

    window.addEventListener('resize', e => {
      this.resize(e.target.innerWidth, e.target.innerHeight);
    });
  }

  createParticles() {
    for (let i = 0; i < this.numberOfParticles; i++) {
      this.particles.push(new Particle(this));
    }
  }

  handleParticles(context) {
    this.connectParticles(context);
    this.particles.forEach(particle => {
      particle.draw(context);
      particle.update();
    });
  }

  connectParticles(context) {
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
    this.canvas.width = width;
    this.canvas.height = height;
    this.width = width;
    this.height = height;

    // Recalculate bounding boxes for text elements
    this.element = document.getElementById('mainText1').getBoundingClientRect();
    this.element2 = document.getElementById('mainText2').getBoundingClientRect();

    const gradient = this.context.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0.15, 'yellow');
    gradient.addColorStop(0.5, 'blue');
    gradient.addColorStop(0.85, 'green');

    this.context.fillStyle = gradient;
    this.context.strokeStyle = gradient;

    this.particles.forEach(particle => {
      particle.reset();
    });
  }

  toggleMode() {
    this.mode = !this.mode;
    if (this.mode) {
      this.context.fillStyle = 'blue';
      this.context.strokeStyle = 'white';
      this.context.lineWidth = 0;
    } else {
      const g = this.context.createLinearGradient(0, 0, this.width, this.height);
      g.addColorStop(0.15, 'yellow');
      g.addColorStop(0.5, 'blue');
      g.addColorStop(0.85, 'green');
      this.context.fillStyle = g;
      this.context.strokeStyle = g;
      this.context.lineWidth = 2;
    }
    this.particles.forEach(p => {
      p.gravity *= -1;
    });
  }

}

const effect = new Effect(canvas, ctx);

function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  effect.handleParticles(ctx);
  requestAnimationFrame(animate);
}


animate();
