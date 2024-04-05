import ILogger from "../logger/ILogger";
import CyLike from "./CyLike";
import GravityCollector from "@smartesting/gravity-data-collector/dist";
import { CollectorOptions } from "@smartesting/gravity-data-collector";

import ignoreGravityMissingTasks from "../utils/ignoreGravityMissingTasks";

export default function setupGravity(cy: CyLike, logger: ILogger) {
  ignoreGravityMissingTasks(cy, logger);

  cy.task("gravity:getCollectorOptions").then((collectorOptions) => {
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
  toBeDetermined: unknown,
): toBeDetermined is Partial<CollectorOptions> {
  return (
    toBeDetermined !== undefined &&
    typeof toBeDetermined === "object" &&
    (toBeDetermined as CollectorOptions).authKey !== undefined
  );
}
