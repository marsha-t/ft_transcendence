export class Main {
    render() {
        const container = document.createElement('div');
        container.className = "main_page";
        this.loadPageStyles();
        const textSection = document.createElement('div');
        textSection.className = "text_section";
        const heading = document.createElement('h1');
        heading.className = "main_title";
        heading.textContent = "About the game";
        textSection.appendChild(heading);
        const description = document.createElement('p');
        description.className = "description";
        description.textContent = `Experience the classic Pong game with a modern twist! Challenge friends or compete in thrilling matches. 
                                Transcendence Pong offers fast-paced gameplay, sleek design, and exciting multiplayer features. 
                                Sign up or log in to join the fun and test your skills in this timeless arcade classic! Experience the classic Pong game with a modern twist! Challenge friends or compete in thrilling matches. 
                                Transcendence Pong offers fast-paced gameplay, sleek design, and exciting multiplayer features. 
                                Sign up or log in to join the fun and test your skills in this timeless arcade classic!Experience the classic Pong game with a modern twist! Challenge friends or compete in thrilling matches. 
                                Transcendence Pong offers fast-paced gameplay, sleek design, and exciting multiplayer features. 
                                Sign up or log in to join the fun and test your skills in this timeless arcade classic!Experience the classic Pong game with a modern twist! Challenge friends or compete in thrilling matches. 
                                Transcendence Pong offers fast-paced gameplay, sleek design, and exciting multiplayer features. 
                                Sign up or log in to join the fun and test your skills in this timeless arcade classic!`;
        textSection.appendChild(description);
        const rightSection = document.createElement('div');
        rightSection.className = "right_section";
        const playButton = document.createElement('a');
        playButton.href = "/game";
        playButton.className = "play_btn";
        playButton.textContent = "PLAY NOW";
        const arrow = document.createElement('img');
        arrow.src = "/assets/arrow.png";
        arrow.alt = "Arrow icon";
        arrow.className = 'arrow';
        playButton.appendChild(arrow);
        rightSection.appendChild(playButton);
        container.appendChild(textSection);
        container.appendChild(rightSection);
        return container;
    }
    loadPageStyles() {
        if (document.getElementById('main-styles'))
            return;
        const link = document.createElement('link');
        link.id = 'main-styles';
        link.rel = 'stylesheet';
        link.href = '/styles/Main.css';
        document.head.appendChild(link);
    }
}
