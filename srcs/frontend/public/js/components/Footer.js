export class Footer {
    render() {
        const footer = document.createElement('footer');
        const content = document.createElement('p');
        content.innerHTML = `© ${new Date().getFullYear()} Transcendence. All rights reserved.`;
        footer.appendChild(content);
        return footer;
    }
}
