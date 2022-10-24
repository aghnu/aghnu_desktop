function createHTMLElement(type, attributes={}, children=[], options={innerText: "", eventListeners: []}) {
    const el = document.createElement(type);
    
    // set inner text if provided
    el.innerText = options.innerText;

    // set element attributes
    for (let att in attributes) {
        el.setAttribute(att, attributes[att]);
    }

    // append children
    for (let i = 0; i < children.length; i++) {
        el.appendChild(children[i]);
    }

    // setup event listeners if provided
    // element is passed to listener as the second argument
    for (let i = 0; i < options.eventListeners.length; i++) {
        const els = options.eventListeners[i];
        el.addEventListener(els.event, (e) => {els.listener(e, el)});
    }
    
    return el;
}