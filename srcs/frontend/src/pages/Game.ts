import { IComponent } from "../components/IComponent.js";

export class Game implements IComponent {

    private canvas: HTMLCanvasElement;
    private context: CanvasRenderingContext2D;


    constructor() {
        this.canvas = document.createElement('canvas');
        this.canvas.width = 900;
        this.canvas.height = 600;

        const ctx = this.canvas.getContext("2d");
        if (!ctx) throw new Error("Failed to get canvas context");
        this.context = ctx;
    }

    public render(): HTMLElement {
        const container = document.createElement('div');
        container.className = 'game_page';

        //Load css
        this.loadPageStyles();


        // Canvas container
        const canvasContainer = document.createElement('div');
        canvasContainer.className = 'canvas_container';

        //title container
        const titleContainer = document.createElement('div');
        titleContainer.className = 'title_container';

        const userLeft = document.createElement('h2');
        userLeft.textContent = 'User 1';
        userLeft.className = 'user';
        
        const VS = document.createElement('h1');
        VS.textContent = 'VS';
        userLeft.className = 'VS';
        
        const userRight = document.createElement('h2');
        userRight.textContent = 'User 2';
        userLeft.className = 'user';

        titleContainer.appendChild(userLeft);
        titleContainer.appendChild(VS);
        titleContainer.appendChild(userRight);

        container.appendChild(titleContainer);

        this.canvas.className = 'game_canvas';
        canvasContainer.appendChild(this.canvas);
        container.appendChild(canvasContainer);

        // Controls container
        const controlsContainer = document.createElement('div');
        controlsContainer.className = 'controls_container';

        // Start/Pause button
        const startBtn = document.createElement('button');
        startBtn.className = 'start_btn';
        startBtn.textContent = 'Start Game';
        controlsContainer.appendChild(startBtn);

        container.appendChild(controlsContainer);

        this.drawInitialScreen();
        return container;
    }

    private loadPageStyles(): void {
        if (document.getElementById('game-styles')) return;
        
        const link = document.createElement('link');
        link.id = 'game-styles';
        link.rel = 'stylesheet';
        link.href = '/styles/Game.css';
        document.head.appendChild(link);
    }

    private drawInitialScreen(){
        if(!this.context)
            return;
    
        //background
        this.context.fillStyle = '#F2F1FA';
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

        //ball
        this.context.fillStyle = "#423f6a";
        this.context.beginPath();
        this.context.arc(this.canvas.width / 2, this.canvas.height / 2, 12, 0, Math.PI * 2);
        this.context.fill();
    
        /// Left paddle
        this.drawRoundedRect(20, this.canvas.height / 2 - 40, 10, 100, 5, "#423f6a");

        // Right paddle
        this.drawRoundedRect(this.canvas.width - 30, this.canvas.height / 2 - 40, 10, 100, 5, "#423f6a");

        //divider
        this.context.beginPath();
        this.context.setLineDash([10, 15]);
        this.context.strokeStyle = "#423f6a";
        this.context.lineWidth = 4;
        this.context.moveTo(this.canvas.width / 2, 0);
        this.context.lineTo(this.canvas.width / 2, this.canvas.height);
        this.context.stroke();
        this.context.setLineDash([]); // reset dashes
    }

    private drawRoundedRect(
        x: number,
        y: number,
        width: number,
        height: number,
        radius: number,
        fillColor: string,
        // strokeColor?: string
    ) {
        if (!this.context) return;
        const ctx = this.context;
    
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    
        ctx.fillStyle = fillColor;
        ctx.fill();
    
        // if (strokeColor) {
        //     ctx.strokeStyle = strokeColor;
        //     ctx.lineWidth = 2;
        //     ctx.stroke();
        // }
    }

}