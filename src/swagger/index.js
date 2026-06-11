const swaggerJsdoc = require('swagger-jsdoc');
const swaggerOptions = require('./swaggerOptions');

const SWAGGER_UI_VERSION = '5.20.1';
const SWAGGER_CDN = `https://cdn.jsdelivr.net/npm/swagger-ui-dist@${SWAGGER_UI_VERSION}`;

function resolvePublicBaseUrl(req) {
    if (process.env.API_PUBLIC_URL) {
        return process.env.API_PUBLIC_URL.replace(/\/$/, '');
    }

    if (process.env.VERCEL_URL) {
        return `https://${process.env.VERCEL_URL}`;
    }

    if (req) {
        const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
        const host = req.headers['x-forwarded-host'] || req.get('host');
        if (host) {
            return `${protocol}://${host}`;
        }
    }

    return 'http://localhost:3000';
}

function buildSwaggerSpec(req) {
    const baseUrl = resolvePublicBaseUrl(req);
    const options = swaggerOptions(baseUrl);
    return swaggerJsdoc(options);
}

/**
 * Власна HTML-сторінка: swagger-ui-express за замовчуванням тягне ./swagger-ui-*.js,
 * на /api/docs без слеша браузер запитує /api/swagger-ui-bundle.js → 404 на Vercel.
 */
function renderSwaggerDocsHtml(specObject) {
    const specJson = JSON.stringify(specObject).replace(/</g, '\\u003c');

    return `<!DOCTYPE html>
<html lang="uk">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>TeamWave API — Swagger</title>
  <link rel="stylesheet" href="${SWAGGER_CDN}/swagger-ui.css"/>
  <link rel="icon" href="${SWAGGER_CDN}/favicon-32x32.png"/>
  <style>
    html { box-sizing: border-box; overflow-y: scroll; }
    *, *:before, *:after { box-sizing: inherit; }
    body { margin: 0; background: #fafafa; }
    .swagger-ui .topbar { display: none; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="${SWAGGER_CDN}/swagger-ui-bundle.js"></script>
  <script src="${SWAGGER_CDN}/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function () {
      window.ui = SwaggerUIBundle({
        spec: ${specJson},
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
        plugins: [SwaggerUIBundle.plugins.DownloadUrl],
        layout: 'StandaloneLayout',
        persistAuthorization: true,
      });
    };
  </script>
</body>
</html>`;
}

function setupSwagger(app) {
    app.get('/api/docs/swagger.json', (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.send(buildSwaggerSpec(req));
    });

    app.get('/api/docs/open', (req, res) => {
        const baseUrl = resolvePublicBaseUrl(req);
        const specUrl = `${baseUrl}/api/docs/swagger.json`;
        const editorUrl = `https://editor.swagger.io/?url=${encodeURIComponent(specUrl)}`;
        res.redirect(302, editorUrl);
    });

    const sendDocsPage = (req, res) => {
        const spec = buildSwaggerSpec(req);
        res.type('html').send(renderSwaggerDocsHtml(spec));
    };

    app.get('/api/docs', sendDocsPage);
    app.get('/api/docs/', sendDocsPage);
}

module.exports = {
    setupSwagger,
    buildSwaggerSpec,
    resolvePublicBaseUrl,
};
