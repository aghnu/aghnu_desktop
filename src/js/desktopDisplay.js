import { createHTMLElement,addButtonBehavior } from "./utilities";
import { createSVGIcon } from "./svgIcons";

export class MovingWindow {
    constructor(desktopDisplayManager, type, contentElement, options={}) {
        this.contentElement = contentElement;
        this.desktopDisplayManager = desktopDisplayManager;
        this.type = type;
        this.cleanFunc = [];
        this.windowState = {
            posX: 0,
            posY: 0,
            sizeX: 0,
            sizeY: 0,
            sizeMinX: 225,
            sizeMinY: 450,
            sizeMaxX: options?.sizeMaxX,
            sizeMaxY: options?.sizeMaxY,
            sizeInitPercX: (options?.sizeInitPercX) ? options.sizeInitPercX : 0.90,
            sizeInitPercY: (options?.sizeInitPercY) ? options.sizeInitPercY : 0.85,
            sizeInitRatioXY: (options?.sizeInitRatioXY) ? options.sizeInitRatioXY: 4/3,
            borderOverEdge: 50,         // 50px
        }    
        
        // elements
        this.windowElement = this.#constructWindow();
        this.windowTitleBarElement = this.windowElement.querySelector('.titlebar .movingbar');
        
        // init
        this.#initPosition();
        this.#initWindowMoving();
        this.#updateWindow();
        this.#initResizePanel();
        this.#initTitleBar();

        // intervals
        this.actionTimeout = null;
    }

    setWindowStateAndUpdate(subState) {
        Object.assign(this.windowState, subState);
        this.#updateWindow();
    }

    getWindowState() {
        return JSON.parse(JSON.stringify(this.windowState));
    }

    #initPosition() {

        const topWindow = this.desktopDisplayManager.getTopWindow(this.type);
        const areaSize = this.desktopDisplayManager.getDesktopAreaSize();
        
        const generateInitSize = () => {
            const initSizeY = this.windowState.sizeInitPercY * areaSize[1];
            const initSizeX = Math.min(this.windowState.sizeInitPercX * areaSize[0], this.windowState.sizeInitRatioXY * initSizeY);        
            
            this.#updateStateWindowSize([initSizeX, initSizeY]);    
        }

        const generateInitPos = () => {
            const initPosX = (areaSize[0] - this.windowState.sizeX) / 2;
            const initPosY = (areaSize[1] - this.windowState.sizeY) / 3;
            
            this.#updateStateWindowPosition([initPosX, initPosY]);        
        }
        
        if (topWindow) {

            // calculate size and pos from top window
            const initPosX = topWindow.windowState.posX + 20;
            const initPosY = topWindow.windowState.posY + 20;
            const initSizeX = topWindow.windowState.sizeX;
            const initSizeY = topWindow.windowState.sizeY;

            // set size and pos
            this.#updateStateWindowSize([initSizeX, initSizeY]);  
            this.#updateStateWindowPosition([initPosX, initPosY]);   
            
            if (this.checkWinInsideDesktopArea() === false) {
                // calculate size and pos from top window
                const initPosX = topWindow.windowState.posX + 20;
                const initPosY = topWindow.windowState.posY;

                // set size and pos
                this.#updateStateWindowSize([initSizeX, initSizeY]);  
                this.#updateStateWindowPosition([initPosX, initPosY]); 

                if (this.checkWinInsideDesktopArea() === false) {
                    // calculate size and pos from top window
                    const initPosX = topWindow.windowState.posX;
                    const initPosY = topWindow.windowState.posY + 20;
    
                    // set size and pos
                    this.#updateStateWindowSize([initSizeX, initSizeY]);  
                    this.#updateStateWindowPosition([initPosX, initPosY]);  
                    
                    // try if valid init position
                    if (this.checkWinInsideDesktopArea() === false) {
                        // not valid
                        // try to keep size and retry
                        generateInitPos();

                        // same position with old top window or size not valid
                        if (
                            (topWindow.windowState.posX === this.windowState.posX) && (topWindow.windowState.posY === this.windowState.posY) ||
                            (this.checkWinInsideDesktopArea() === false)
                        ) {
                            generateInitSize();
                            generateInitPos();
                        } 
                    } 
                }
            }

        } else {
            generateInitSize();
            generateInitPos();
        }
        
    }

    #constructWindow() {
        const el = 
            createHTMLElement('div', {class: 'window'}, [
                createHTMLElement('div', {class: 'content-display'}, [
                    createHTMLElement('div', {class: 'panel-content'}, [
                    
                        createHTMLElement('div', {class: 'titlebar'}, [
                            createHTMLElement('div', {class: 'movingbar'}),
                            createHTMLElement('div', {class: 'control'}, [
                                // createHTMLElement('div', {class: 'button fullscreen'}),
                                // createHTMLElement('div', {class: 'button close'})
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
        const newSizeX = (this.windowState.sizeMaxX) 
            ? Math.min(Math.max(x, this.windowState.sizeMinX), this.windowState.sizeMaxX)
            : Math.max(x, this.windowState.sizeMinX);

        const newSizeY = (this.windowState.sizeMaxY) 
            ? Math.min(Math.max(y, this.windowState.sizeMinY), this.windowState.sizeMaxY)
            : Math.max(y, this.windowState.sizeMinY);

        this.windowState.sizeX = newSizeX;
        this.windowState.sizeY = newSizeY;

        return [newSizeX, newSizeY];
    }

    #updateStateWindowPosition([x, y]) {
        // if x or y not given, calculate its value based on current percentage
        const size = this.desktopDisplayManager.getDesktopAreaSize();
        
        const maxX = size[0] - this.windowState.borderOverEdge;
        const maxY = size[1] - this.windowState.borderOverEdge;

        const minX = 0 - (this.windowState.sizeX - this.windowState.borderOverEdge);
        const minY = 0;

        const newPosX = Math.min(Math.max(x, minX), maxX);
        const newPosY = Math.min(Math.max(y, minY), maxY);

        this.windowState.posX = newPosX;
        this.windowState.posY = newPosY;

        return [newPosX, newPosY];
    }

    #updateWindow() {
        // position
        this.windowElement.style.left = `${this.windowState.posX}px`;  
        this.windowElement.style.top = `${this.windowState.posY}px`;   

        // size
        this.windowElement.style.width = `${this.windowState.sizeX}px`;
        this.windowElement.style.height = `${this.windowState.sizeY}px`;
    }

    #addEventListenerWithCleanUp(element, event, eventListner) {
        element.addEventListener(event, eventListner);
        this.addToCleanFunc(() => element.removeEventListener(event, eventListner));
    }

    #initWindowMoving() {
        // local state
        const windowMovingState = {
            windowMouseDown: false,
            windowStateSnapshot: this.getWindowState(),
            pointerPositionSnapshot: this.desktopDisplayManager.getPointerState(),       
        }

        // window moving
        const pointerMoveFunc = () => {
            if (windowMovingState.windowMouseDown) {
                const pointerStateCurrent = this.desktopDisplayManager.getPointerState();
                this.#updateStateWindowPosition([
                    windowMovingState.windowStateSnapshot.posX + pointerStateCurrent.posX - windowMovingState.pointerPositionSnapshot.posX, 
                    windowMovingState.windowStateSnapshot.posY + pointerStateCurrent.posY - windowMovingState.pointerPositionSnapshot.posY
                ]);
                this.#updateWindow();

                // update ghost window
                this.desktopDisplayManager.turnOnGhostWindow(this);
            }            
        }

        const pointerDownFunc = () => {
            this.windowElement.classList.add('moving');
            windowMovingState.pointerPositionSnapshot = this.desktopDisplayManager.getPointerState();
            windowMovingState.windowStateSnapshot = this.getWindowState();
            windowMovingState.windowMouseDown = true;
        }

        const pointerUpFunc = () => {
            this.windowElement.classList.remove('moving');
            windowMovingState.windowMouseDown = false;
            this.desktopDisplayManager.turnOffGhostWindow();
        }

        this.#addEventListenerWithCleanUp(document, 'mousemove', pointerMoveFunc);
        this.#addEventListenerWithCleanUp(document, 'touchmove', pointerMoveFunc);

        this.#addEventListenerWithCleanUp(this.windowTitleBarElement, 'mousedown', (e) => {e.preventDefault(); this.desktopDisplayManager.updatePointerPosition(e.clientX, e.clientY);pointerDownFunc()});
        this.#addEventListenerWithCleanUp(this.windowTitleBarElement, 'touchstart', (e) => {this.desktopDisplayManager.updatePointerPosition(e.touches[0].clientX, e.touches[0].clientY);pointerDownFunc()});

        this.#addEventListenerWithCleanUp(document, 'mouseup', pointerUpFunc);
        this.#addEventListenerWithCleanUp(document, 'touchend', pointerUpFunc);
        this.#addEventListenerWithCleanUp(document, 'blur', pointerUpFunc);

        // on top
        this.#addEventListenerWithCleanUp(this.windowElement, 'mousedown', (e) => {e.cancelBubble = true;this.desktopDisplayManager.moveWindowToTop(this)});
        this.#addEventListenerWithCleanUp(this.windowElement, 'touchstart', (e) => {e.cancelBubble = true;this.desktopDisplayManager.moveWindowToTop(this)});
        
    }

    #resizePanelToDirection(direction, windowStateSnapshot, pointerStateSnapshot) {
        const windowStateCurrent = this.getWindowState();
        const pointerStateCurrent = this.desktopDisplayManager.getPointerState();

        switch(direction) {
            case 'n':
                {
                    const newPosY = windowStateSnapshot.posY + pointerStateCurrent.posY - pointerStateSnapshot.posY;
                    const positionNew = this.#updateStateWindowPosition([windowStateCurrent.posX,newPosY]);

                    const newSizeY = windowStateSnapshot.sizeY - (positionNew[1] - windowStateSnapshot.posY );
                    const sizeNew = this.#updateStateWindowSize([windowStateCurrent.sizeX,newSizeY]);

                    if (sizeNew[1] !== newSizeY) {
                        this.windowState = windowStateCurrent;
                        const newPosYCorrected = windowStateSnapshot.posY + (windowStateSnapshot.sizeY - sizeNew[1]);
                        this.#updateStateWindowPosition([windowStateCurrent.posX,newPosYCorrected]);
                        this.#updateStateWindowSize([windowStateCurrent.sizeX, sizeNew[1]]);
                    }
                }
                break;
            case 'w':
                {
                    const newPosX = windowStateSnapshot.posX + pointerStateCurrent.posX - pointerStateSnapshot.posX;
                    const positionNew = this.#updateStateWindowPosition([newPosX, windowStateCurrent.posY]);

                    const newSizeX = windowStateSnapshot.sizeX - (positionNew[0] - windowStateSnapshot.posX );
                    const sizeNew = this.#updateStateWindowSize([newSizeX,windowStateCurrent.sizeY]);

                    if (sizeNew[0] !== newSizeX) {
                        this.windowState = windowStateCurrent;
                        const newPosXCorrected = windowStateSnapshot.posX + (windowStateSnapshot.sizeX - sizeNew[0]);
                        this.#updateStateWindowPosition([newPosXCorrected,windowStateCurrent.posY]);
                        this.#updateStateWindowSize([sizeNew[0],windowStateCurrent.sizeY]);
                    }
                }
                break;
            case 's':
                // south edge
                this.#updateStateWindowSize([
                    windowStateCurrent.sizeX, 
                    windowStateSnapshot.sizeY + pointerStateCurrent.posY - pointerStateSnapshot.posY
                ]);
                break;
            case 'e':
                // east edge
                this.#updateStateWindowSize([
                    windowStateSnapshot.sizeX + pointerStateCurrent.posX - pointerStateSnapshot.posX,
                    windowStateCurrent.sizeY
                ]);
                break;
        }
    }


    #initResizePanel() {
        // local globals

        const windowResizeState = {
            windowMouseDown: false,
            target: null,
            windowStateSnapshot: this.getWindowState(),
            pointerStateSnapshot: this.desktopDisplayManager.getPointerState(),          
        }

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
        resizePanelSE.customtype = 'se';
        resizePanelSW.customtype = 'sw';
        resizePanelNE.customtype = 'ne';
        resizePanelNW.customtype = 'nw';

        resizePanelN.customtype = 'n';
        resizePanelW.customtype = 'w';
        resizePanelS.customtype = 's';
        resizePanelE.customtype = 'e';
        
        // pointer action functions
        const pointerMoveFunc = () => {
            if (windowResizeState.windowMouseDown) {
                switch(windowResizeState.target.customtype) {
                    case 'se':
                        this.#resizePanelToDirection('s', windowResizeState.windowStateSnapshot, windowResizeState.pointerStateSnapshot);
                        this.#resizePanelToDirection('e', windowResizeState.windowStateSnapshot, windowResizeState.pointerStateSnapshot);
                        break;
                    case 'sw':
                        this.#resizePanelToDirection('s', windowResizeState.windowStateSnapshot, windowResizeState.pointerStateSnapshot);
                        this.#resizePanelToDirection('w', windowResizeState.windowStateSnapshot, windowResizeState.pointerStateSnapshot);
                        break;
                    case 'ne':
                        this.#resizePanelToDirection('n', windowResizeState.windowStateSnapshot, windowResizeState.pointerStateSnapshot);
                        this.#resizePanelToDirection('e', windowResizeState.windowStateSnapshot, windowResizeState.pointerStateSnapshot);
                        break;
                    case 'nw':
                        this.#resizePanelToDirection('n', windowResizeState.windowStateSnapshot, windowResizeState.pointerStateSnapshot);
                        this.#resizePanelToDirection('w', windowResizeState.windowStateSnapshot, windowResizeState.pointerStateSnapshot);
                        break;

                    case 'n':
                        this.#resizePanelToDirection('n', windowResizeState.windowStateSnapshot, windowResizeState.pointerStateSnapshot);
                        break;
                    case 'w':
                        this.#resizePanelToDirection('w', windowResizeState.windowStateSnapshot, windowResizeState.pointerStateSnapshot);
                        break;
                    case 's':
                        this.#resizePanelToDirection('s', windowResizeState.windowStateSnapshot, windowResizeState.pointerStateSnapshot);
                        break;
                    case 'e':
                        this.#resizePanelToDirection('e', windowResizeState.windowStateSnapshot, windowResizeState.pointerStateSnapshot);
                        break;
                }
                
                this.#updateWindow();
            }
        }

        const pointerDownFunc = (element) => {
            // update states
            windowResizeState.target = element;
            windowResizeState.windowStateSnapshot = this.getWindowState();
            windowResizeState.pointerStateSnapshot = this.desktopDisplayManager.getPointerState();
            windowResizeState.windowMouseDown = true;

            // update css state
            this.windowElement.classList.add('resizing');
            this.windowElement.classList.add(windowResizeState.target.customtype);
        }

        const pointerUpFunc = () => {
            if (windowResizeState.windowMouseDown) {
                // update css state
                this.windowElement.classList.remove('resizing');
                this.windowElement.classList.remove(windowResizeState.target.customtype); 

                // update states
                windowResizeState.windowMouseDown = false;
                windowResizeState.target = null;              
            }
        }

        // set up listener
        const setDownListener = (element) => {
            this.#addEventListenerWithCleanUp(element, 'mousedown', (e) => {e.preventDefault(); this.desktopDisplayManager.updatePointerPosition(e.clientX, e.clientY); pointerDownFunc(element)});
            this.#addEventListenerWithCleanUp(element, 'touchstart', (e) => {this.desktopDisplayManager.updatePointerPosition(e.touches[0].clientX, e.touches[0].clientY);pointerDownFunc(element)});            
        }

        setDownListener(resizePanelSE);
        setDownListener(resizePanelSW);
        setDownListener(resizePanelNE);
        setDownListener(resizePanelNW);

        setDownListener(resizePanelN);
        setDownListener(resizePanelW);
        setDownListener(resizePanelS);
        setDownListener(resizePanelE);
        
        this.#addEventListenerWithCleanUp(document, 'mousemove', pointerMoveFunc);
        this.#addEventListenerWithCleanUp(document, 'touchmove', pointerMoveFunc);

        this.#addEventListenerWithCleanUp(document, 'mouseup', pointerUpFunc);
        this.#addEventListenerWithCleanUp(document, 'touchend', pointerUpFunc);
        this.#addEventListenerWithCleanUp(document, 'blur', pointerUpFunc);

    }

    #initTitleBar() {
        const titlebarControl = this.windowElement.querySelector('.titlebar .control');

        const closeBtnEl = createHTMLElement('div', {class: 'button close'});
        this.#addEventListenerWithCleanUp(closeBtnEl, 'click', () => {
            this.desktopDisplayManager.removeWindow(this);
        });

        titlebarControl.appendChild(closeBtnEl);
    }

    getType() {
        return this.type;
    }

    addToCleanFunc(func) {
        // will be called when window close
        this.cleanFunc.push(func);
    }


    checkWinInsideDesktopArea() {
        const areaSize = this.desktopDisplayManager.getDesktopAreaSize();
        if (
            (this.windowState.posY < 0) || 
            (this.windowState.posX < 0) ||
            ((this.windowState.posY + this.windowState.sizeY) > areaSize[1]) ||
            ((this.windowState.posX + this.windowState.sizeX) > areaSize[0])
        ) {
            
            return false;
        } else {
            return true;
        }
    }

    getWindow() {
        return this.windowElement;
    }

    desktopSizeChange(oldSize) {
        const newSize = this.desktopDisplayManager.getDesktopAreaSize();

        const newPosX = (this.windowState.posX >= 0) ? this.windowState.posX / oldSize[0] * newSize[0] : (()=>{
            // special case left is out of desktop's left edge
            // make the change reverse
            const posXDiff = this.windowState.posX / oldSize[0] * newSize[0] - this.windowState.posX;
            return this.windowState.posX - posXDiff;
        })();
        const newPosY = this.windowState.posY / oldSize[1] * newSize[1];
    


        
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
        }, 100);
        
    }

    close(callback) {
        clearTimeout(this.actionTimeout);
        this.windowElement.classList.remove('open');
        this.actionTimeout = setTimeout(() => {
            // before remove run all the clean funcs
            this.cleanFunc.forEach(func => func());

            // callback
            callback();
        }, 150);
    }
}

export class DesktopDisplay {
    constructor(parentContainer) {
        this.parentContainer = parentContainer;
        
        this.desktopElement = this.#contructDesktop();
        this.desktopElementWindowsContainer = this.desktopElement.querySelector('.windows');
        this.desktopElementActionsBar = this.desktopElement.querySelector('.actions');
        this.ghostWindowElement = null;
        this.movingWins = [];

        this.clockInterval = null;

        // init
        this.parentContainer.appendChild(this.desktopElement);
        // this.#initClock();
        this.#initActionApps();
        this.#initGhostWindow();

        // state
        this.desktopSizeX = this.desktopElementWindowsContainer.offsetWidth;        // initial value
        this.desktopSizeY = this.desktopElementWindowsContainer.offsetHeight;

        this.pointerState = {
            posX: 0,
            posY: 0
        }

        // init listeners
        this.#initListners();

        // ghost panel
        this.GHOST_PANEL_CONFIGURATION = {CLOSE: 0, LEFT: 1, RIGHT: 2, TOP: 3};
        this.ghostPanelConfig = this.GHOST_PANEL_CONFIGURATION.CLOSE;
        this.ghostPanelActiveWindowState = null;
        this.ghostPanelAnimationTimeout = null;
        this.ghostPanelTargetWindow = null;

    }

    removeWindow(window) {
        const winIndex = this.movingWins.indexOf(window);
        if (winIndex > -1) {
            // remove
            this.movingWins.splice(winIndex, 1);
            
            // call window close function
            window.close(() => {
                // remove from desktop
                this.desktopElementWindowsContainer.removeChild(window.getWindow());
            });
        }
    }

    getPointerState() {
        return JSON.parse(JSON.stringify(this.pointerState));
    }

    updatePointerPosition(x, y) {
        const desktopAreaPosition = this.getDesktopAreaPosition();
        const desktopAreaSize = this.getDesktopAreaSize();

        const PosX = Math.min(Math.max(x, desktopAreaPosition[0]), desktopAreaPosition[0] + desktopAreaSize[0]) - desktopAreaPosition[0];
        const PosY = Math.min(Math.max(y, desktopAreaPosition[1]), desktopAreaPosition[1] + desktopAreaSize[1]) - desktopAreaPosition[1];

        this.pointerState.posX = PosX;
        this.pointerState.posY = PosY;

        // update ghost panel config
        if ((PosX >= 0) && (PosX <= 16)) {
            // left
            this.ghostPanelConfig = this.GHOST_PANEL_CONFIGURATION.LEFT;
        } else if ((PosX >= desktopAreaSize[0] - 16) && (PosX <= desktopAreaSize[0])) {
            // right
            this.ghostPanelConfig = this.GHOST_PANEL_CONFIGURATION.RIGHT;
        } else if (PosY <= 0) {
            // top
            this.ghostPanelConfig = this.GHOST_PANEL_CONFIGURATION.TOP;
        } else {
            // close
            this.ghostPanelConfig = this.GHOST_PANEL_CONFIGURATION.CLOSE;
        }
    }

    #initListners() {
        // resizing
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

        // lost focus
        this.desktopElement.addEventListener('mousedown', () => {this.refreshWindowOrder(true)});
        this.desktopElement.addEventListener('touchstart', () => {this.refreshWindowOrder(true)});

        // mouse position
        document.addEventListener('mousemove', (e) => {this.updatePointerPosition(e.clientX, e.clientY)});
        document.addEventListener('touchmove', (e) => {this.updatePointerPosition(e.touches[0].clientX, e.touches[0].clientY)});
    }

    #initGhostWindow() {
        this.ghostWindowElement = createHTMLElement('div', {class: 'ghost-window'}, [
            createHTMLElement('div', {class: 'inner'}),
        ]);
        this.desktopElementWindowsContainer.appendChild(this.ghostWindowElement);
    }

    turnOnGhostWindow(window) {
        const windowState = window.getWindowState();
        const desktopAreaSize = this.getDesktopAreaSize();
        this.ghostWindowElement.style.zIndex = window.getWindow().style.zIndex;
        this.ghostPanelTargetWindow = window;

        const moveGhostWindowToOrigin = () => {
            const windowSubState = {
                posX: windowState.posX,
                posY: windowState.posY,
                sizeX: windowState.sizeX,
                sizeY: windowState.sizeY
            }

            this.ghostWindowElement.style.left = `${windowSubState.posX}px`;
            this.ghostWindowElement.style.top = `${windowSubState.posY}px`;
            this.ghostWindowElement.style.width = `${windowSubState.sizeX}px`;
            this.ghostWindowElement.style.height = `${windowSubState.sizeY}px`;   

            return windowSubState;
        }

        const moveGhostWindowToTop = () => {
            const windowSubState = {
                posX: 0,
                posY: 0,
                sizeX: desktopAreaSize[0],
                sizeY: desktopAreaSize[1]
            }

            if (desktopAreaSize[0] >= windowState.sizeMinX) {
                this.ghostWindowElement.style.left = `${windowSubState.posX}px`;
                this.ghostWindowElement.style.top = `${windowSubState.posY}px`;
                this.ghostWindowElement.style.width = `${windowSubState.sizeX}px`;
                this.ghostWindowElement.style.height = `${windowSubState.sizeY}px`;   
                return windowSubState;               
            } else {
                return null;
            }
 
        }

        const moveGhostWindowToLeft = () => {
            const windowSubState = {
                posX: 0,
                posY: 0,
                sizeX: desktopAreaSize[0]/2,
                sizeY: desktopAreaSize[1]
            }


            if (desktopAreaSize[0]/2 >= windowState.sizeMinX) {
                this.ghostWindowElement.style.left = `${windowSubState.posX}px`;
                this.ghostWindowElement.style.top = `${windowSubState.posY}px`;
                this.ghostWindowElement.style.width = `${windowSubState.sizeX}px`;
                this.ghostWindowElement.style.height = `${windowSubState.sizeY}px`; 
                return windowSubState;                
            } else {
                return moveGhostWindowToTop();
            }
 
        }

        const moveGhostWindowToRight = () => {
            const windowSubState = {
                posX: desktopAreaSize[0]/2,
                posY: 0,
                sizeX: desktopAreaSize[0]/2,
                sizeY: desktopAreaSize[1]
            }

            if ((desktopAreaSize[0]/2 >= windowState.sizeMinX)) {
                this.ghostWindowElement.style.left = `${windowSubState.posX}px`;
                this.ghostWindowElement.style.top = `${windowSubState.posY}px`;
                this.ghostWindowElement.style.width = `${windowSubState.sizeX}px`;
                this.ghostWindowElement.style.height = `${windowSubState.sizeY}px`; 
                return windowSubState;                
            } else {
                return moveGhostWindowToTop();
            }
        }


        if (this.ghostPanelActiveWindowState !== null) {

            switch(this.ghostPanelConfig) {
                case this.GHOST_PANEL_CONFIGURATION.CLOSE:
                    this.ghostPanelActiveWindowState = null;
                    moveGhostWindowToOrigin();
                    this.ghostWindowElement.classList.remove('show');   
                    break;
                case this.GHOST_PANEL_CONFIGURATION.LEFT:

                    this.ghostPanelActiveWindowState = moveGhostWindowToLeft();
                    break;
                case this.GHOST_PANEL_CONFIGURATION.RIGHT:
                    this.ghostPanelActiveWindowState = moveGhostWindowToRight();

                    break;
                case this.GHOST_PANEL_CONFIGURATION.TOP:
                    this.ghostPanelActiveWindowState = moveGhostWindowToTop();
                    break;
            }

        } else {

            switch(this.ghostPanelConfig) {
                case this.GHOST_PANEL_CONFIGURATION.CLOSE:
                    moveGhostWindowToOrigin();  
                    break;
                case this.GHOST_PANEL_CONFIGURATION.LEFT:
                    this.ghostPanelActiveWindowState = moveGhostWindowToLeft();
                    if (this.ghostPanelActiveWindowState !== null) {
                        this.ghostWindowElement.classList.add('show');
                    }
                    break;
                case this.GHOST_PANEL_CONFIGURATION.RIGHT:
                    this.ghostPanelActiveWindowState = moveGhostWindowToRight();
                    if (this.ghostPanelActiveWindowState !== null) {
                        this.ghostWindowElement.classList.add('show');
                    }
                    
                    break;
                case this.GHOST_PANEL_CONFIGURATION.TOP:
                    this.ghostPanelActiveWindowState = moveGhostWindowToTop();
                    if (this.ghostPanelActiveWindowState !== null) {
                        this.ghostWindowElement.classList.add('show');
                    }
                    
                    break;
            }

        }
    }

    turnOffGhostWindow() {
        if (this.ghostPanelTargetWindow !== null) {
            const windowState = this.ghostPanelTargetWindow.getWindowState();
            this.ghostWindowElement.style.zIndex = this.ghostPanelTargetWindow.getWindow().style.zIndex;
            
            if (this.ghostPanelActiveWindowState !== null) {
                // turn off ghost panel
                this.ghostWindowElement.style.left = `${windowState.posX}px`;
                this.ghostWindowElement.style.top = `${windowState.posY}px`;
                this.ghostWindowElement.style.width = `${windowState.sizeX}px`;
                this.ghostWindowElement.style.height = `${windowState.sizeY}px`;
                this.ghostWindowElement.classList.remove('show');

                // change window size
                this.ghostPanelTargetWindow.setWindowStateAndUpdate(this.ghostPanelActiveWindowState);
                
            }

            this.ghostPanelTargetWindow = null;
            this.ghostPanelActiveWindowState = null;            
        }

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
                this.openWindow('console', createHTMLElement('iframe', {src: 'https://www.aghnu.me?options=desktop', title: "Aghnu's Console"}), {sizeInitRatioXY: 4/3});
                // this.openWindow();
                break;
            default:
                break;
        }
    }

    openWindow(type, contentElement=null, options={}) {
        const newWindow = new MovingWindow(this, type, contentElement, options);
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

    getTopWindow(type='*') {
        // return undefined if no window
        if (type === '*') {
            return this.movingWins[this.movingWins.length - 1];
        } else {
            const movingWinsSubset = this.movingWins.filter(win => (win.getType() === type));
            return movingWinsSubset[this.movingWins.length - 1];
        }   
    }
}


