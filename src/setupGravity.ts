import { CollectorOptions } from '@smartesting/gravity-data-collector'
import GravityCollector from "@smartesting/gravity-data-collector/dist";

export default function setupGravity() {
    const defaultOptions: Partial<CollectorOptions> = {
        requestInterval: 10,
        gravityServerUrl: "http://localhost:3000/"
    };

    cy.task("gravity:getCollectorOptions").then((collectorOptions) => {
        cy.window().then((win) => {
            function installCollector() {
                if (!isPartialCollectorOptions(collectorOptions)) return;

                GravityCollector.init({
                    window: win,
                    ...defaultOptions,
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
