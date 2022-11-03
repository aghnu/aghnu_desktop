import { createHTMLElement,addButtonBehavior } from "./utilities";
import { createSVGIcon } from "./svgIcons";

export class MovingWindow {
    constructor(desktopDisplayManager, contentElement, options={}) {
        this.contentElement = contentElement;
        this.windowElement = this.#constructWindow();
        this.desktopDisplayManager = desktopDisplayManager;
        this.windowState = {
            window: {
                posX: 0,
                posY: 0,
                sizeX: 0,
                sizeY: 0,
                sizeMinX: 350,
                sizeMinY: 450,
                sizeMaxX: options?.sizeMaxX,
                sizeMaxY: options?.sizeMaxY,
                sizeInitPercX: (options?.sizeInitPercX) ? options.sizeInitPercX : 0.95,
                sizeInitPercY: (options?.sizeInitPercY) ? options.sizeInitPercY : 0.95,
                sizeInitRatioXY: (options?.sizeInitRatioXY) ? options.sizeInitRatioXY: 4/3,
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

        // intervals
        this.actionTimeout = null;
    }

    #initPosition() {
        
        const areaSize = this.desktopDisplayManager.getDesktopAreaSize();
        
        const initSizeY = this.windowState.window.sizeInitPercY * areaSize[1];
        const initSizeX = Math.min(this.windowState.window.sizeInitPercX * areaSize[0], this.windowState.window.sizeInitRatioXY * initSizeY);
        this.#updateStateWindowSize([initSizeX, initSizeY]);

        const initPosX = (areaSize[0] - this.windowState.window.sizeX) / 2;
        const initPosY = (areaSize[1] - this.windowState.window.sizeY) / 2;
        this.#updateStateWindowPosition([initPosX, initPosY]);
    }

    #constructWindow() {
        const el = 
            createHTMLElement('div', {class: 'window'}, [
                createHTMLElement('div', {class: 'content-display'}, [
                    createHTMLElement('div', {class: 'panel-content'}, [
                    
                        createHTMLElement('div', {class: 'titlebar'}, [
                            createHTMLElement('div', {class: 'movingbar'}),
                            createHTMLElement('div', {class: 'control'}, [
                                createHTMLElement('div', {class: 'button fullscreen'}),
                                createHTMLElement('div', {class: 'button close'})
                            ]),
                        ]),
                        createHTMLElement('div', {class: 'content'}, [
                            (this.contentElement !== null) ? this.contentElement : null
                        ])
                    ]),
                    createHTMLElement('div', {class: 'panel-resize se'}),
                    createHTMLElement('div', {class: 'panel-resize sw'}),
                    createHTMLElement('div', {class: 'panel-resize ne'}),
                    createHTMLElement('div', {class: 'panel-resize nw'}),
    
                    createHTMLElement('div', {class: 'panel-resize n'}),
                    createHTMLElement('div', {class: 'panel-resize w'}),
                    createHTMLElement('div', {class: 'panel-resize s'}),
                    createHTMLElement('div', {class: 'panel-resize e'}),
                ]),

            ]);

        return el;
    }

    #updateStateWindowSize([x, y]) {
        const newSizeX = (this.windowState.window.sizeMaxX) 
            ? Math.min(Math.max(x, this.windowState.window.sizeMinX), this.windowState.window.sizeMaxX)
            : Math.max(x, this.windowState.window.sizeMinX);

        const newSizeY = (this.windowState.window.sizeMaxY) 
            ? Math.min(Math.max(y, this.windowState.window.sizeMinY), this.windowState.window.sizeMaxY)
            : Math.max(y, this.windowState.window.sizeMinY);

        this.windowState.window.sizeX = newSizeX;
        this.windowState.window.sizeY = newSizeY;

        return [newSizeX, newSizeY];
    }

    #updateStateWindowPosition([x, y]) {
        // if x or y not given, calculate its value based on current percentage
        const size = this.desktopDisplayManager.getDesktopAreaSize();
        
        const maxX = size[0] - this.windowState.window.borderOverEdge;
        const maxY = size[1] - this.windowState.window.borderOverEdge;

        const minX = 0 - (this.windowState.window.sizeX - this.windowState.window.borderOverEdge);
        const minY = 0;

        const newPosX = Math.min(Math.max(x, minX), maxX);
        const newPosY = Math.min(Math.max(y, minY), maxY);

        this.windowState.window.posX = newPosX;
        this.windowState.window.posY = newPosY;

        return [newPosX, newPosY];
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
        const windowTitleBarElement = this.windowElement.querySelector('.titlebar .movingbar');
        let windowMouseDown = false;
        let windowStateSnapshot = JSON.parse(JSON.stringify(this.windowState));

        // on top
        this.windowElement.addEventListener('mousedown', (e) => {e.cancelBubble = true;this.desktopDisplayManager.moveWindowToTop(this)});
        this.windowElement.addEventListener('touchstart', (e) => {e.cancelBubble = true;this.desktopDisplayManager.moveWindowToTop(this)});

        // re position
        const pointerMoveFunc = (x, y) => {
            const desktopAreaPosition = this.desktopDisplayManager.getDesktopAreaPosition();
            const desktopAreaSize = this.desktopDisplayManager.getDesktopAreaSize();

            const mousePosX = Math.min(Math.max(x, desktopAreaPosition[0]), desktopAreaPosition[0] + desktopAreaSize[0]);
            const mousePosY = Math.min(Math.max(y, desktopAreaPosition[1]), desktopAreaPosition[1] + desktopAreaSize[1]);

            this.windowState.mouse.posX = mousePosX;
            this.windowState.mouse.posY = mousePosY;

            if (windowMouseDown) {
                const posX = windowStateSnapshot.window.posX + this.windowState.mouse.posX - windowStateSnapshot.mouse.posX;
                const posY = windowStateSnapshot.window.posY + this.windowState.mouse.posY - windowStateSnapshot.mouse.posY;
                this.#updateStateWindowPosition([posX, posY]);
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


    #resizePanelToDirection(direction, snapshot) {
        switch(direction) {
            case 'n':
                {
                    const windowStateSnapshot = JSON.parse(JSON.stringify(this.windowState));

                    const newPosY = snapshot.window.posY + this.windowState.mouse.posY - snapshot.mouse.posY;
                    const positionNew = this.#updateStateWindowPosition([this.windowState.window.posX,newPosY]);

                    const newSizeY = snapshot.window.sizeY - (positionNew[1] - snapshot.window.posY );
                    const sizeNew = this.#updateStateWindowSize([this.windowState.window.sizeX,newSizeY]);

                    if (sizeNew[1] !== newSizeY) {
                        this.windowState = windowStateSnapshot;
                        const newPosYCorrected = snapshot.window.posY + (snapshot.window.sizeY - sizeNew[1]);
                        this.#updateStateWindowPosition([this.windowState.window.posX,newPosYCorrected]);
                        this.#updateStateWindowSize([this.windowState.window.sizeX, sizeNew[1]]);
                    }
                }
                break;
            case 'w':
                {
                    const windowStateSnapshot = JSON.parse(JSON.stringify(this.windowState));

                    const newPosX = snapshot.window.posX + this.windowState.mouse.posX - snapshot.mouse.posX;
                    const positionNew = this.#updateStateWindowPosition([newPosX, this.windowState.window.posY]);

                    const newSizeX = snapshot.window.sizeX - (positionNew[0] - snapshot.window.posX );
                    const sizeNew = this.#updateStateWindowSize([newSizeX,this.windowState.window.sizeY]);

                    if (sizeNew[0] !== newSizeX) {
                        this.windowState = windowStateSnapshot;
                        const newPosXCorrected = snapshot.window.posX + (snapshot.window.sizeX - sizeNew[0]);
                        this.#updateStateWindowPosition([newPosXCorrected,this.windowState.window.posY]);
                        this.#updateStateWindowSize([sizeNew[0],this.windowState.window.sizeY]);
                    }
                }
                break;
            case 's':
                // south edge
                this.#updateStateWindowSize([
                    this.windowState.window.sizeX, 
                    snapshot.window.sizeY + this.windowState.mouse.posY - snapshot.mouse.posY
                ]);
                break;
            case 'e':
                // east edge
                this.#updateStateWindowSize([
                    snapshot.window.sizeX + this.windowState.mouse.posX - snapshot.mouse.posX,
                    this.windowState.window.sizeY
                ]);
                break;
        }
    }


    #initResizePanel() {
        // get elements
        const resizePanelSE = this.windowElement.querySelector('.panel-resize.se');
        const resizePanelSW = this.windowElement.querySelector('.panel-resize.sw');
        const resizePanelNE = this.windowElement.querySelector('.panel-resize.ne');
        const resizePanelNW = this.windowElement.querySelector('.panel-resize.nw');

        const resizePanelN = this.windowElement.querySelector('.panel-resize.n');
        const resizePanelW = this.windowElement.querySelector('.panel-resize.w');
        const resizePanelS = this.windowElement.querySelector('.panel-resize.s');
        const resizePanelE = this.windowElement.querySelector('.panel-resize.e');

        // set action functions
        resizePanelSE.customPointerMoveFunc = () => {
            this.#resizePanelToDirection('e', windowStateSnapshot);
            this.#resizePanelToDirection('s', windowStateSnapshot);
        }
        resizePanelSW.customPointerMoveFunc = () => {
            this.#resizePanelToDirection('s', windowStateSnapshot);
            this.#resizePanelToDirection('w', windowStateSnapshot);
        }
        resizePanelNE.customPointerMoveFunc = () => {
            this.#resizePanelToDirection('n', windowStateSnapshot);
            this.#resizePanelToDirection('e', windowStateSnapshot);
        }
        resizePanelNW.customPointerMoveFunc = () => {
            this.#resizePanelToDirection('n', windowStateSnapshot);
            this.#resizePanelToDirection('w', windowStateSnapshot);
        }

        resizePanelN.customPointerMoveFunc = () => {
            this.#resizePanelToDirection('n', windowStateSnapshot);
        }
        resizePanelW.customPointerMoveFunc = () => {
            this.#resizePanelToDirection('w', windowStateSnapshot);
        }
        resizePanelS.customPointerMoveFunc = () => {
            this.#resizePanelToDirection('s', windowStateSnapshot);
        }
        resizePanelE.customPointerMoveFunc = () => {
            this.#resizePanelToDirection('e', windowStateSnapshot);
        }

        // local globals
        let windowMouseDown = false;
        let target = null;
        let windowStateSnapshot = JSON.parse(JSON.stringify(this.windowState));
        
        // pointer action functions
        const pointerMoveFunc = () => {
            if (windowMouseDown) {

                target.customPointerMoveFunc();
                this.#updateWindow();
            }
        }

        const pointerDownFunc = (x, y, targetElement) => {
            target = targetElement;
            this.windowState.mouse.posX = x;
            this.windowState.mouse.posY = y;
            this.windowElement.classList.add('resizing');
            windowStateSnapshot = JSON.parse(JSON.stringify(this.windowState));
            windowMouseDown = true;
        }

        const pointerUpFunc = () => {
            this.windowElement.classList.remove('resizing');
            windowMouseDown = false;
            target = null;
        }

        // set up listener
        const setDownListener = (element) => {
            element.addEventListener('mousedown', (e) => {e.preventDefault(); pointerDownFunc(e.clientX, e.clientY, element)});
            element.addEventListener('touchstart', (e) => {e.preventDefault(); pointerDownFunc(e.touches[0].clientX, e.touches[0].clientY, element)});            
        }

        setDownListener(resizePanelSE);
        setDownListener(resizePanelSW);
        setDownListener(resizePanelNE);
        setDownListener(resizePanelNW);

        setDownListener(resizePanelN);
        setDownListener(resizePanelW);
        setDownListener(resizePanelS);
        setDownListener(resizePanelE);
        
        document.addEventListener(('mousemove'), pointerMoveFunc);
        document.addEventListener(('touchmove'), pointerMoveFunc);

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
    


        
        this.#updateStateWindowPosition([newPosX, newPosY]);
        this.#updateWindow();

    }

    loadContent(content) {
        
        const contentContainer = this.windowElement.querySelector('.panel-content .content')
        this.contentElement = content;
        contentContainer.innerHTML = '';
        contentContainer.appendChild(this.contentElement);
    }

    open() {
        clearTimeout(this.actionTimeout);

        this.actionTimeout = setTimeout(() => {
            this.windowElement.classList.add('open');
        }, 250);
        
    }
}

export class DesktopDisplay {
    constructor(parentContainer) {
        this.parentContainer = parentContainer;
        
        this.desktopElement = this.#contructDesktop();
        this.desktopElementWindowsContainer = this.desktopElement.querySelector('.windows');
        this.desktopElementActionsBar = this.desktopElement.querySelector('.actions');
        this.movingWins = [];

        this.clockInterval = null;

        // init
        this.parentContainer.appendChild(this.desktopElement);
        // this.#initClock();
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

        this.desktopElement.addEventListener('mousedown', () => {this.refreshWindowOrder(true)});
        this.desktopElement.addEventListener('touchstart', () => {this.refreshWindowOrder(true)});

    }

    #contructDesktop() {
        const el = 
            createHTMLElement('div', {class: 'desktop'}, [
                createHTMLElement('div', {class: 'windows'}),
                createHTMLElement('div', {class: 'actions'}, [
                    createHTMLElement('div', {class: 'button apps'}, [createSVGIcon('apps')]),
                    createHTMLElement('div', {class: 'button terminal'}, [createSVGIcon('terminal')]),
                    createHTMLElement('div', {class: 'button reader'}, [createSVGIcon('reader')]),
                    createHTMLElement('div', {class: 'button github'}, [createSVGIcon('github')]),
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

    refreshWindowOrder(lostFocus = false) {
        const totalWins = this.movingWins.length;

        if (lostFocus) {
            for (let i = totalWins - 1; i >= 0; i--) {
                const win = this.movingWins[i];
                win.getWindow().style.zIndex = i;
                win.getWindow().classList.remove('frontstage');
            }
        } else {
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


    }

    moveWindowToTop(window) {
        this.movingWins = this.movingWins.filter((el) => {return window !== el});
        this.movingWins.push(window);
        this.refreshWindowOrder();
    }

    openApp(name) {
        switch (name) {
            case 'console':
                this.openWindow(createHTMLElement('iframe', {src: 'http://192.168.125.128:8080?options=desktop', title: "Aghnu's Console"}), {sizeInitRatioXY: 4/3});
                // this.openWindow();
                break;
            default:
                break;
        }
    }

    openWindow(contentElement=null, options={}) {
        const newWindow = new MovingWindow(this, contentElement, options);
        this.movingWins.push(newWindow);
        this.desktopElementWindowsContainer.appendChild(newWindow.getWindow());
        this.refreshWindowOrder();
        newWindow.open();
        return newWindow;
    }

    getDesktopAreaSize() {
        const windowsAreaSizeX = this.desktopElementWindowsContainer.offsetWidth;
        const windowsAreaSizeY = this.desktopElementWindowsContainer.offsetHeight;

        return [windowsAreaSizeX, windowsAreaSizeY];
    }

    getDesktopAreaPosition() {
        const rect = this.desktopElementWindowsContainer.getBoundingClientRect();
        return [rect.left, rect.top];
    }
}


