// src/graphics/Ball.ts
export class Ball {
    x: number;
    y: number;
    radius: number = 8;
    speedX: number = 4;
    speedY: number = 4;
  
    constructor(x: number, y: number) {
      this.x = x;
      this.y = y;
    }
  
    update() {
      this.x += this.speedX;
      this.y += this.speedY;
    }
  
    draw(ctx: CanvasRenderingContext2D) {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = "red";
      ctx.fill();
      ctx.closePath();
    }
  }
  