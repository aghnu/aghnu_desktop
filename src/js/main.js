import { DesktopDisplay } from "./desktopDisplay";
import '../style/styles.scss';
import { createHTMLElement } from "./utilities";

function main() {
    const siteElement = document.querySelector('#site');
    const desktopDisplay = new DesktopDisplay(siteElement);
}

main();