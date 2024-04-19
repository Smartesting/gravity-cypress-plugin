import express from "express";

export default function makeTestRouter() {
  const router = express.Router();

  router.get("/", express.text(), (_req, res) => {
    res.status(200).send(`
<html>
    <head>
        <title>Simple test app</title>
    </head>
    <script>
      function handleClick() {
          const clickList = document.getElementById('output');
          const item = document.createElement('li')
          item.append('Got clicked')
          clickList.appendChild(item)
      }
    </script>
    <body>
        <button title="Click me" onclick="handleClick()">Click me :)</button>
        <ul id="output">
        
        </ul>
    </body>
</html>
`);
  });

  router.get("/collector-enabled", express.text(), (req, res) => {
    const port = req.query.testServerPort ?? 3001;

    res.status(200).send(`
<html>
    <head>
        <script async id="logger" type="text/javascript" src="https://smartesting.github.io/gravity-data-collector/v6.0.0-1-beta/gravity-logger-min.js"></script>
        <title>Simple test app</title>
    </head>
    <script>
      const script = document.querySelector('#logger')
      script.addEventListener('load', function () {
        window.GravityCollector.init({
          authKey: '123123-123-123-123-123123',
          gravityServerUrl: 'http://localhost:${port}'
        })
      })
    </script>

    <script>
      function handleClick() {
          const clickList = document.getElementById('output');
          const item = document.createElement('li')
          item.append('Got clicked')
          clickList.appendChild(item)
      }
    </script>
    <body>
        <button title="Click me" onclick="handleClick()">Click me :)</button>
        <ul id="output">
        
        </ul>
    </body>
</html>
`);
  });

  router.get(
    "/api/tracking/:sessionCollectionAuthKey/settings",
    (_req, res) => {
      res.status(200).json({
        settings: {
          sessionRecording: true,
          videoRecording: true,
          snapshotRecording: true,
          videoAnonymization: true,
        },
        error: null,
      });
    },
  );

  router.post(
    "/api/tracking/:sessionCollectionAuthKey/publish",
    (_req, res) => {
      res.status(201).json({ error: null, jobId: "123" });
    },
  );

  router.post(
    "/api/tracking/:sessionCollectionAuthKey/record/:sessionId",
    (_req, res) => {
      res.status(200).json({ error: null });
    },
  );

  router.post(
    "/api/tracking/:sessionCollectionAuthKey/session/:sessionId/identifyTest",
    (_req, res) => {
      res.status(200).json({ error: null });
    },
  );

  router.post(
    "/api/tracking/:sessionCollectionAuthKey/snapshots/:snapshotId",
    (_req, res) => {
      res.status(200).json({ error: null });
    },
  );

  return router;
}
