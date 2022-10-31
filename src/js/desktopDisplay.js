import { createHTMLElement,addButtonBehavior } from "./utilities";
import { createSVGIcon } from "./svgIcons";

export class MovingWindow {
    constructor(desktopDisplayManager, contentElement) {
        this.contentElement = contentElement;
        this.windowElement = this.#constructWindow();
        this.desktopDisplayManager = desktopDisplayManager;
        this.windowState = {
            window: {
                posX: 0,
                posY: 0,
                sizeX: 0,
                sizeY: 0,
                sizeMinX: 320,
                sizeMinY: 420,
                borderOverEdge: 50,         // 50px
            },

            mouse: {
                posX: 0,
                posY: 0
            }
        }

        this.#initPosition();
        this.#initListerner();
        this.#updateWindow();
        this.#initResizePanel();
    }

    #initPosition() {
        
        const areaSize = this.desktopDisplayManager.getDesktopAreaSize(true);
        
        const SIZE_PERC_Y = 0.95;
        const SIZE_PERC_X = 0.95;
        const SIZE_RATIO_XY = 4/3;
        
        const initSizeY = SIZE_PERC_Y * areaSize[1];
        const initSizeX = Math.min(SIZE_PERC_X * areaSize[0], SIZE_RATIO_XY * initSizeY);
        

        const initPosX = (areaSize[0] - initSizeX) / 2;
        const initPosY = (areaSize[1] - initSizeY) / 2;

        this.windowState.window.posX = initPosX;
        this.windowState.window.posY = initPosY;
        this.windowState.window.sizeX = initSizeX;
        this.windowState.window.sizeY = initSizeY;
    }

    #constructWindow() {
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
                        (this.contentElement !== null) ? this.contentElement : null
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

        // // if x or y not given, calculate its value based on current percentage
        const size = this.desktopDisplayManager.getDesktopAreaSize();
        
        const maxX = size[0] - this.windowState.window.borderOverEdge;
        const maxY = size[1] - this.windowState.window.borderOverEdge;

        const minX = 0 - (this.windowState.window.sizeX - this.windowState.window.borderOverEdge);
        const minY = 0;

        this.windowState.window.posX = Math.min(Math.max(x, minX), maxX);
        this.windowState.window.posY = Math.min(Math.max(y, minY), maxY);

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

        // on top
        this.windowElement.addEventListener('mousedown', () => {this.desktopDisplayManager.moveWindowToTop(this)});
        this.windowElement.addEventListener('touchstart', () => {this.desktopDisplayManager.moveWindowToTop(this)});

        // re position
        const pointerMoveFunc = (x, y) => {
            this.windowState.mouse.posX = x;
            this.windowState.mouse.posY = y;

            if (windowMouseDown) {
                const desktopAreaSize = this.desktopDisplayManager.getDesktopAreaSize();

                const posX = (windowStateSnapshot.window.posX + this.windowState.mouse.posX - windowStateSnapshot.mouse.posX);
                const posY = (windowStateSnapshot.window.posY + this.windowState.mouse.posY - windowStateSnapshot.mouse.posY);
                this.#updateStateWindowPosition(posX, posY);
                this.#updateWindow();
            }            
        }

        document.addEventListener('mousemove', (e) => {pointerMoveFunc(e.clientX, e.clientY)});
        document.addEventListener('touchmove', (e) => {pointerMoveFunc(e.touches[0].clientX, e.touches[0].clientY)});


        const pointerDownFunc = (x, y) => {
            this.windowState.mouse.posX = x;
            this.windowState.mouse.posY = y;
            this.windowElement.classList.add('moving');
            windowStateSnapshot = JSON.parse(JSON.stringify(this.windowState));
            windowMouseDown = true;            
        }

        const pointerUpFunc = () => {
            this.windowElement.classList.remove('moving');
            windowMouseDown = false;
        }
        
        windowTitleBarElement.addEventListener('mousedown', (e) => {e.preventDefault(); pointerDownFunc(e.clientX, e.clientY)});
        windowTitleBarElement.addEventListener('touchstart', (e) => {e.preventDefault(); pointerDownFunc(e.touches[0].clientX, e.touches[0].clientY)});
        
        document.addEventListener('mouseup', pointerUpFunc);
        document.addEventListener('touchend', pointerUpFunc);
    }

    #initResizePanel() {
        const resizeButton = this.windowElement.querySelector('.panel-resize.se');
        let windowMouseDown = false;
        let windowStateSnapshot = JSON.parse(JSON.stringify(this.windowState));
        
        const pointerMoveFunc = () => {
            if (windowMouseDown) {
                const sizeX = windowStateSnapshot.window.sizeX + this.windowState.mouse.posX - windowStateSnapshot.mouse.posX;
                const sizeY = windowStateSnapshot.window.sizeY + this.windowState.mouse.posY - windowStateSnapshot.mouse.posY
                this.#updateStateWindowSize(sizeX, sizeY);
                this.#updateWindow();
            }
        }

        const pointerDownFunc = (x, y) => {
            this.windowState.mouse.posX = x;
            this.windowState.mouse.posY = y;
            this.windowElement.classList.add('moving');
            windowStateSnapshot = JSON.parse(JSON.stringify(this.windowState));
            windowMouseDown = true;
        }

        const pointerUpFunc = () => {
            this.windowElement.classList.remove('moving');
            windowMouseDown = false;
        }

        document.addEventListener(('mousemove'), pointerMoveFunc);
        document.addEventListener(('touchmove'), pointerMoveFunc);

        resizeButton.addEventListener('mousedown', (e) => {e.preventDefault(); pointerDownFunc(e.clientX, e.clientY)});
        resizeButton.addEventListener('touchstart', (e) => {e.preventDefault(); pointerDownFunc(e.touches[0].clientX, e.touches[0].clientY)});
        
        document.addEventListener('mouseup', pointerUpFunc);
        document.addEventListener('touchend', pointerUpFunc);

    }

    getWindow() {
        return this.windowElement;
    }

    desktopSizeChange(oldSize) {
        const newSize = this.desktopDisplayManager.getDesktopAreaSize();

        const newPosX = (this.windowState.window.posX >= 0) ? this.windowState.window.posX / oldSize[0] * newSize[0] : (()=>{
            // special case left is out of desktop's left edge
            // make the change reverse
            const posXDiff = this.windowState.window.posX / oldSize[0] * newSize[0] - this.windowState.window.posX;
            return this.windowState.window.posX - posXDiff;
        })();
        const newPosY = this.windowState.window.posY / oldSize[1] * newSize[1];
    


        
        this.#updateStateWindowPosition(newPosX, newPosY);
        this.#updateWindow();

    }

    loadContent(content) {
        
        const contentContainer = this.windowElement.querySelector('.panel-content .content')
        this.contentElement = content;
        contentContainer.innerHTML = '';
        contentContainer.appendChild(this.contentElement);
    }
}

export class DesktopDisplay {
    constructor(parentContainer) {
        this.parentContainer = parentContainer;
        
        this.desktopElement = this.#contructDesktop();
        this.desktopElementWindowsContainer = this.desktopElement.querySelector('.container .windows');
        this.desktopElementActionsBar = this.desktopElement.querySelector('.container .actions');
        this.movingWins = [];

        this.clockInterval = null;

        // init
        this.parentContainer.appendChild(this.desktopElement);
        this.#initClock();
        this.#initActionApps();

        // state
        this.desktopSizeX = this.desktopElementWindowsContainer.offsetWidth;        // initial value
        this.desktopSizeY = this.desktopElementWindowsContainer.offsetHeight;

        // init listeners
        this.#initListners();

    }

    #initListners() {
        window.addEventListener('resize', () => {
            const oldDesktopSizeX = this.desktopSizeX;
            const oldDesktopSizeY = this.desktopSizeY;
            this.desktopSizeX = this.desktopElementWindowsContainer.offsetWidth;
            this.desktopSizeY = this.desktopElementWindowsContainer.offsetHeight;

            for (let i = 0; i < this.movingWins.length; i++) {
                new Promise(()=>{
                    this.movingWins[i].desktopSizeChange([oldDesktopSizeX, oldDesktopSizeY]);
                });
            }
        });
    }

    #initClock() {
        const toolbar = this.desktopElement.querySelector('.toolbar');
        const clock = createHTMLElement('p', {class: 'clock'});

        const updateClock = () => {
            const date = new Date();
            // clock.innerHTML = date.toLocaleDateString('en-CA', {year: 'numeric', month: 'long', day: 'numeric'}) + "&nbsp&nbsp&nbsp" + date.toLocaleTimeString('en-CA');

            clock.innerHTML = date.toLocaleTimeString('en-CA');
        }

        updateClock();
        this.clockInterval = setInterval(() => {
            updateClock();
        }, 1000);
        
        toolbar.appendChild(clock);
    }

    #contructDesktop() {
        const el = 
            createHTMLElement('div', {class: 'desktop'}, [
                createHTMLElement('div', {class: 'toolbar'}),
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

    #initActionApps() {
        // terminal open
        const buttonTerminal = this.desktopElementActionsBar.querySelector('.terminal');
        const buttonTerminalDownFunc = () => {
            buttonTerminal.classList.add('pressed');
        }
        const buttonTerminalUpFunc = () => {
            this.openApp('console');
            buttonTerminal.classList.remove('pressed');            
        }
        
        setTimeout(() => {
            buttonTerminalDownFunc();
            setTimeout(() => {
                buttonTerminalUpFunc();
                addButtonBehavior(buttonTerminal, buttonTerminalDownFunc, buttonTerminalUpFunc);
            }, 250);
        }, 250);
    }

    refreshWindowOrder() {
        const totalWins = this.movingWins.length;

        if (totalWins > 0) {
            const frontWindow = this.movingWins[totalWins - 1].getWindow()
            frontWindow.style.zIndex = totalWins - 1;
            frontWindow.classList.add('frontstage');

            for (let i = totalWins - 2; i >= 0; i--) {
                const win = this.movingWins[i];
                win.getWindow().style.zIndex = i;
                win.getWindow().classList.remove('frontstage');
            }

        }
    }

    moveWindowToTop(window) {
        this.movingWins = this.movingWins.filter((el) => {return window !== el});
        this.movingWins.push(window);
        this.refreshWindowOrder();
    }

    openApp(name) {
        switch (name) {
            case 'console':
                this.openWindow(createHTMLElement('iframe', {src: 'https://www.aghnu.me/', title: "Aghnu's Console"}));
                break;
            default:
                break;
        }
    }

    openWindow(contentElement=null) {
        const newWindow = new MovingWindow(this, contentElement);
        this.movingWins.push(newWindow);
        this.desktopElementWindowsContainer.appendChild(newWindow.getWindow());
        this.refreshWindowOrder();
        return newWindow;
    }

    getDesktopAreaSize(contentArea=false) {
        const windowsAreaSizeX = this.desktopElementWindowsContainer.offsetWidth;
        const windowsAreaSizeY = this.desktopElementWindowsContainer.offsetHeight;

        if (contentArea) {
            const actionBarHeight = this.desktopElementActionsBar.offsetHeight;
            const actionBarTop = this.desktopElementActionsBar.offsetTop;
    
            const padding = windowsAreaSizeY - actionBarTop - actionBarHeight;
            
            const areaContentX = windowsAreaSizeX;
            const areaContentY = windowsAreaSizeY - actionBarHeight - padding * 1.5;    

            return [areaContentX, areaContentY];        
        } else {

            return [windowsAreaSizeX, windowsAreaSizeY];
        }
    }
}


