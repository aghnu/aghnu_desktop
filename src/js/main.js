import { DesktopDisplay } from "./desktopDisplay";
import '../style/styles.scss';

function main() {
    const siteElement = document.querySelector('#site');
    const desktopDisplay = new DesktopDisplay(siteElement);

    desktopDisplay.openWindow();
}

main();