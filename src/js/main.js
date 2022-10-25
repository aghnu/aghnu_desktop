import { DesktopDisplay } from "./desktopDisplay";
import '../style/styles.scss';
import { createHTMLElement } from "./utilities";

function main() {
    const siteElement = document.querySelector('#site');
    const desktopDisplay = new DesktopDisplay(siteElement);

    desktopDisplay.openWindow(createHTMLElement('iframe', {src: 'https://www.aghnu.me/', title: "Aghnu's Console"}));
}

main();