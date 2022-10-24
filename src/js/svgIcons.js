


export const icons = {
    'terminal': (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" viewBox="0 0 20 20.5"><g transform="translate(-1 -1)"><circle cx="10" cy="10" r="10" transform="translate(1 1.5)" opacity="0.2"/><circle cx="10" cy="10" r="10" transform="translate(1 1)" fill="#ff8a18"/><path d="M11,1A10,10,0,0,0,1,11q0,.146.011.291a9.992,9.992,0,0,1,19.979-.082Q21,11.1,21,11A10,10,0,0,0,11,1Z" fill="#fff" opacity="0.2"/><circle cx="7" cy="7" r="7" transform="translate(4 4.5)" opacity="0.2"/><circle cx="7" cy="7" r="7" transform="translate(4 4)" fill="#f8f8f8"/><path d="M8.474,5.258l-.53.53L9.534,7.379,7.943,8.97l.53.53,1.591-1.591.53-.53-.53-.53Z" transform="translate(-0.762 2.888)" fill="#3f3f3f"/><path d="M7.943,8.97l.53.53L11.3,6.672l-.53-.53Z" transform="translate(11.17 -0.272) rotate(45)" fill="#3f3f3f"/></g></svg>`
}

export function createSVGIcon(type) {
    const el = document.createElement('div');
    el.classList.add('icon');
    el.innerHTML = icons[type]('100%');

    return el;
}