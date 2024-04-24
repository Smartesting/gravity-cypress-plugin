import ILogger from "../logger/ILogger";
import CyLike from "./CyLike";
import GravityCollector from "@smartesting/gravity-data-collector/dist";
import { CollectorOptions } from "@smartesting/gravity-data-collector";

export default function setupGravity(cy: CyLike, logger: ILogger) {
  return cy.task("gravity:getCollectorOptions").then((collectorOptions) => {
    if (!isPartialCollectorOptions(collectorOptions)) return;

    return cy.on("window:before:load", (win) => {
      installGravityCollector(win, collectorOptions);
    });
  });
}

function installGravityCollector(
  win: Cypress.AUTWindow,
  collectorOptions: Partial<CollectorOptions>,
) {
  function waitForPageToLoad(collectorOptions: Partial<CollectorOptions>) {
    const url = win.document.URL;

    if (url === undefined || url.startsWith("about:")) {
      setTimeout(() => waitForPageToLoad(collectorOptions), 5);
    } else {
      GravityCollector.initWithOverride({
        window: win,
        ...collectorOptions,
      });
    }
  }

  waitForPageToLoad(collectorOptions);
}

function isPartialCollectorOptions(
  toBeDetermined: unknown,
): toBeDetermined is Partial<CollectorOptions> {
  return (
    toBeDetermined !== undefined &&
    typeof toBeDetermined === "object" &&
    (toBeDetermined as CollectorOptions).authKey !== undefined
  );
}
