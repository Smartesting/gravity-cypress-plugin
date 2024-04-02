import { CollectorOptions } from '@smartesting/gravity-data-collector'
import GravityCollector from "@smartesting/gravity-data-collector/dist";
import ILogger from "./logger/ILogger";

export default function setupGravity(logger: ILogger = console) {
    cy.on("fail", (err) => {
        if (err.message.includes("gravity:getCollectorOptions")) {
            logger.error('cy.task("gravity:getCollectorOptions") is not defined. Did you add "gravityCypressPlugin(...)" in your E2E setup');
            return false;
        }
        throw err
    });

    cy.task("gravity:getCollectorOptions")
        .then((collectorOptions) => {
        cy.window().then((win) => {
            function installCollector() {
                if (!isPartialCollectorOptions(collectorOptions)) return;

                GravityCollector.init({
                    window: win,
                    ...collectorOptions,
                });
            }

            function waitForPageToLoad() {
                const url = win.document.URL;
                if (url === undefined || url.startsWith("about:")) {
                    setTimeout(waitForPageToLoad, 50);
                } else {
                    installCollector();
                }
            }

            waitForPageToLoad();
        });
    });
}

function isPartialCollectorOptions(
    toBeDetermined: unknown
): toBeDetermined is Partial<CollectorOptions> {
    return (
        toBeDetermined !== undefined &&
        typeof toBeDetermined === "object" &&
        (toBeDetermined as CollectorOptions).authKey !== undefined
    );
}
