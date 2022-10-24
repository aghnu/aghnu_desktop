import { createHTMLElement } from "./utilities";
import { createSVGIcon } from "./svgIcons";

export class MovingWindow {
    constructor() {
        this.windowElement = this.#constructWindow();
        
        this.windowState = {
            window: {
                posX: 50,
                posY: 50,
                sizeX: 500,
                sizeY: 500,
                sizeMinX: 300,
                sizeMinY: 400,
                padding: 5,
            },

            mouse: {
                posX: 0,
                posY: 0
            }
        }

        this.#initListerner();
        this.#updateWindow();
        this.#initResizePanel();
    }

    #constructWindow() {
        // export function createHTMLElement(type, attributes={}, children=[], options={innerText: "", eventListeners: []}) {
        const el = 
            createHTMLElement('div', {class: 'window'}, [
                createHTMLElement('div', {class: 'panel-content'}, [
                    createHTMLElement('div', {class: 'titlebar'}, [
                        createHTMLElement('div', {class: 'control'}, [
                            createHTMLElement('div', {class: 'button fullscreen'}),
                            createHTMLElement('div', {class: 'button close'})
                        ]),
                    ]),
                    createHTMLElement('div', {class: 'content'}, [
                        createHTMLElement('iframe', {src: 'https://www.aghnu.me/', title: ""})
                    ])
                ]),
                createHTMLElement('div', {class: 'panel-resize se'})
            ]);

        return el;
    }

    #updateStateWindowSize(x, y) {
        this.windowState.window.sizeX = Math.max(x, this.windowState.window.sizeMinX);
        this.windowState.window.sizeY = Math.max(y, this.windowState.window.sizeMinY);
    }

    #updateStateWindowPosition(x, y) {
        const maxX = window.innerWidth - this.windowState.window.sizeX;
        const maxY = window.innerHeight - this.windowState.window.sizeY;


        this.windowState.window.posX = Math.min(Math.max(x, 0), maxX);
        this.windowState.window.posY = Math.min(Math.max(y, 0), maxY);
    }

    #updateWindow() {
        // position
        this.windowElement.style.left = `${this.windowState.window.posX}px`;
        this.windowElement.style.top = `${this.windowState.window.posY}px`;   

        // size
        this.windowElement.style.width = `${this.windowState.window.sizeX}px`;
        this.windowElement.style.height = `${this.windowState.window.sizeY}px`;
    }

    #initListerner() {
        const windowTitleBarElement = this.windowElement.querySelector('.titlebar');
        let windowMouseDown = false;
        let windowStateSnapshot = JSON.parse(JSON.stringify(this.windowState));

        document.addEventListener(('mousemove'), (e) => {
            this.windowState.mouse.posX = e.clientX;
            this.windowState.mouse.posY = e.clientY;

            if (windowMouseDown) {
                const posX = windowStateSnapshot.window.posX + this.windowState.mouse.posX - windowStateSnapshot.mouse.posX;
                const posY = windowStateSnapshot.window.posY + this.windowState.mouse.posY - windowStateSnapshot.mouse.posY;
                this.#updateStateWindowPosition(posX, posY);
                this.#updateWindow();
            }
        });
        
        windowTitleBarElement.addEventListener('mousedown', (e) => {
            e.preventDefault();
            this.windowElement.classList.add('moving');
            windowStateSnapshot = JSON.parse(JSON.stringify(this.windowState));
            windowMouseDown = true;
        });
        
        document.addEventListener('mouseup', (e) => {
            this.windowElement.classList.remove('moving');
            windowMouseDown = false;
        });
    }

    #initResizePanel() {
        const resizeButton = this.windowElement.querySelector('.panel-resize.se');
        let windowMouseDown = false;
        let windowStateSnapshot = JSON.parse(JSON.stringify(this.windowState));
        
        resizeButton.addEventListener('mousedown', (e) => {
            e.preventDefault();
            
            this.windowElement.classList.add('moving');
            windowStateSnapshot = JSON.parse(JSON.stringify(this.windowState));
            windowMouseDown = true;
        });
        
        document.addEventListener('mouseup', (e) => {
            this.windowElement.classList.remove('moving');
            windowMouseDown = false;
        });

        document.addEventListener(('mousemove'), (e) => {
            if (windowMouseDown) {
                const sizeX = windowStateSnapshot.window.sizeX + this.windowState.mouse.posX - windowStateSnapshot.mouse.posX;
                const sizeY = windowStateSnapshot.window.sizeY + this.windowState.mouse.posY - windowStateSnapshot.mouse.posY
                this.#updateStateWindowSize(sizeX, sizeY);
                this.#updateWindow();
            }
        });
    }

    getWindow() {
        return this.windowElement;
    }
}

export class DesktopDisplay {
    constructor(parentContainer) {
        this.parentContainer = parentContainer;
        this.desktopElement = this.#contructDesktop();
        this.desktopElementWindowsContainer = this.desktopElement.querySelector('.container .windows');
        this.movingWins = [];

        // init
        this.parentContainer.appendChild(this.desktopElement);
    }

    #contructDesktop() {
        const el = 
            createHTMLElement('div', {class: 'desktop'}, [
                createHTMLElement('div', {class: 'toolbar'}, [
                    createHTMLElement('p', {class: 'clock'}, [], {innerText: '4:41 PM'})
                ]),
                createHTMLElement('div', {class: 'container'}, [
                    createHTMLElement('div', {class: 'background'}),
                    createHTMLElement('div', {class: 'windows'}),
                    createHTMLElement('div', {class: 'actions'}, [
                        createHTMLElement('div', {class: 'button terminal'}, [createSVGIcon('terminal')]),

                    ]),
                ]),
                
            ]);
        return el;
    }

    openWindow() {
        const newWindow = new MovingWindow();
        this.movingWins.push(newWindow);
        this.desktopElementWindowsContainer.appendChild(newWindow.getWindow());
    }
}


