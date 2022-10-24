export class HTMLElementReference {
    constructor() {
        this.el = null;
    }

    getRef() {
        return this.el;
    }

    setRef(el) {
        this.el = el;
    }
}

export function createHTMLElement(type, attributes={}, children=[], options={innerText: "", eventListeners: [], reference: null}) {
    const el = document.createElement(type);

    // set element attributes
    for (let att in attributes) {
        el.setAttribute(att, attributes[att]);
    }

    // append children
    for (let i = 0; i < children.length; i++) {
        el.appendChild(children[i]);
    }

    // set options
    if (options?.innerText) {
        el.innerText = options.innerText;
    }

    if (options?.eventListeners) {                                          // setup event listeners if provided
        for (let i = 0; i < options.eventListeners.length; i++) {
            const els = options.eventListeners[i];
            el.addEventListener(els.event, (e) => {els.listener(e, el)});   // element is passed to listener as the second argument
        }        
    }

    if (options?.reference) {
        if (options.reference !== null) {
            options.reference.setRef(el);
        }        
    }
    
    return el;
}