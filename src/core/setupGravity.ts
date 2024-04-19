import ILogger from "../logger/ILogger";
import CyLike from "./CyLike";
import GravityCollector from "@smartesting/gravity-data-collector/dist";
import { CollectorOptions } from "@smartesting/gravity-data-collector";

export default function setupGravity(cy: CyLike, logger: ILogger) {
  return cy.task("gravity:getCollectorOptions").then((collectorOptions) => {
    if (!isPartialCollectorOptions(collectorOptions)) return;

    cy.on("command:end", (args) => {
      if (args.attributes.name === "reload") {
        installGravityCollector(cy, collectorOptions);
      }
    });

    return installGravityCollector(cy, collectorOptions);
  });
}

function installGravityCollector(
  cy: CyLike,
  collectorOptions: Partial<CollectorOptions>,
) {
  return cy.window().then((win) => {
    function waitForPageToLoad(collectorOptions: Partial<CollectorOptions>) {
      const url = win.document.URL;

      if (url === undefined || url.startsWith("about:")) {
        setTimeout(() => waitForPageToLoad(collectorOptions), 50);
      } else {
        GravityCollector.initWithOverride({
          window: win,
          ...collectorOptions,
        });
      }
    }

    waitForPageToLoad(collectorOptions);
  });
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
