import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';
import { Request, Response, NextFunction } from 'express';

type SwaggerSection = {
  path: string;
  title: string;
  description: string;
  tagPrefix: string;
  siteTitle: string;
  titleColor: string;
};

export function setupSwagger(app: INestApplication) {
  // Page d'accueil pour /api
  app.use('/api', (req: Request, res: Response, next: NextFunction) => {
    if (req.url === '/' || req.url === '') {
      const apiUrl =
        process.env.API_URL || `http://localhost:${process.env.PORT ?? 3002}`;

      res.setHeader('Content-Type', 'text/html');
      return res.send(`
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Taraki API - Documentations</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      background: white;
      border-radius: 20px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      padding: 50px;
      max-width: 900px;
      width: 100%;
    }
    h1 {
      font-size: 2.5em;
      margin-bottom: 10px;
      color: #333;
      text-align: center;
    }
    .subtitle {
      text-align: center;
      color: #666;
      margin-bottom: 40px;
      font-size: 1.1em;
    }
    .links-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 20px;
      margin-top: 30px;
    }
    .api-link {
      display: block;
      padding: 25px;
      border-radius: 15px;
      text-decoration: none;
      transition: all 0.3s ease;
      border: 2px solid transparent;
    }
    .api-link:hover {
      transform: translateY(-5px);
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
    }
    .api-link.admin {
      background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%);
    }
    .api-link.admin:hover {
      border-color: #ef4444;
    }
    .api-link.teacher {
      background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
    }
    .api-link.teacher:hover {
      border-color: #f97316;
    }
    .api-link.client {
      background: linear-gradient(135deg, #96fbc4 0%, #f9f586 100%);
    }
    .api-link.client:hover {
      border-color: #3b82f6;
    }
    .api-link.common {
      background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
    }
    .api-link.common:hover {
      border-color: #8b5cf6;
    }
    .icon {
      font-size: 2.5em;
      margin-bottom: 10px;
      display: block;
    }
    .link-title {
      font-size: 1.3em;
      font-weight: bold;
      color: #333;
      margin-bottom: 5px;
    }
    .link-description {
      color: #666;
      font-size: 0.95em;
    }
    .footer {
      text-align: center;
      margin-top: 40px;
      padding-top: 30px;
      border-top: 2px solid #eee;
      color: #999;
      font-size: 0.9em;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🚀 Taraki API</h1>
    <p class="subtitle">📚 Documentations Swagger disponibles</p>

    <div class="links-grid">
      <a href="${apiUrl}/api/admin" class="api-link admin" target="_blank">
        <span class="icon">🔧</span>
        <div class="link-title">Admin</div>
        <div class="link-description">Endpoints administrateur</div>
      </a>

      <a href="${apiUrl}/api/teacher" class="api-link teacher" target="_blank">
        <span class="icon">👩‍🏫</span>
        <div class="link-title">Teacher</div>
        <div class="link-description">Endpoints enseignants</div>
      </a>

      <a href="${apiUrl}/api/client" class="api-link client" target="_blank">
        <span class="icon">👨‍👩‍👧</span>
        <div class="link-title">Client</div>
        <div class="link-description">Endpoints clients (parents / kids)</div>
      </a>

      <a href="${apiUrl}/api/common" class="api-link common" target="_blank">
        <span class="icon">🌐</span>
        <div class="link-title">Common</div>
        <div class="link-description">Endpoints communs</div>
      </a>
    </div>

    <div class="footer">
      Taraki API v1.0 - Documentation interactive
    </div>
  </div>
</body>
</html>
      `);
    }

    next();
  });

  const sections: SwaggerSection[] = [
    {
      path: 'api/admin',
      title: 'Taraki Admin API',
      description: 'Administrative endpoints for Tarakid',
      tagPrefix: 'Admin',
      siteTitle: 'Taraki Admin API',
      titleColor: '#ef4444',
    },
    {
      path: 'api/teacher',
      title: 'Taraki Teacher API',
      description: 'Endpoints for Tarakid teachers',
      tagPrefix: 'Teacher',
      siteTitle: 'Taraki Teacher API',
      titleColor: '#f97316',
    },
    {
      path: 'api/client',
      title: 'Taraki Client API',
      description: 'Endpoints for Tarakid clients (parents/kids)',
      tagPrefix: 'Client',
      siteTitle: 'Taraki Client API',
      titleColor: '#3b82f6',
    },
    {
      path: 'api/common',
      title: 'Taraki Common API',
      description: 'Common utility and Auth endpoints',
      tagPrefix: 'Common',
      siteTitle: 'Taraki Common API',
      titleColor: '#8b5cf6',
    },
  ];

  sections.forEach((section) => {
    const config = new DocumentBuilder()
      .setTitle(section.title)
      .setDescription(section.description)
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    let document = SwaggerModule.createDocument(app, config, {
      deepScanRoutes: true,
    });

    document = filterDocumentByTagPrefix(document, section.tagPrefix);

    SwaggerModule.setup(section.path, app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        defaultModelsExpandDepth: 0,
      },
      customSiteTitle: section.siteTitle,
      customCss: `
        .swagger-ui .topbar { display: none; }
        .swagger-ui .info { margin: 20px 0; }
        .swagger-ui .info .title { color: ${section.titleColor}; }
      `,
    });
  });
}

function filterDocumentByTagPrefix(
  document: OpenAPIObject,
  tagPrefix: string,
): OpenAPIObject {
  const filteredPaths: OpenAPIObject['paths'] = {};
  const normalizedPrefix = tagPrefix.toLowerCase();

  Object.entries(document.paths).forEach(([path, pathItem]) => {
    if (!pathItem) return;

    const methods = [
      'get',
      'put',
      'post',
      'delete',
      'options',
      'head',
      'patch',
      'trace',
    ] as const;

    const filteredPathItem: Record<string, unknown> = {};
    let hasMatchingOperation = false;

    methods.forEach((method) => {
      const operation = pathItem[method];

      if (!operation?.tags?.length) return;

      const hasMatchingTag = operation.tags.some((tag) =>
        tag.toLowerCase().startsWith(normalizedPrefix),
      );

      if (hasMatchingTag) {
        filteredPathItem[method] = operation;
        hasMatchingOperation = true;
      }
    });

    if (hasMatchingOperation) {
      const metadataProps = [
        'summary',
        'description',
        'servers',
        'parameters',
      ] as const;

      metadataProps.forEach((prop) => {
        if (pathItem[prop]) {
          filteredPathItem[prop] = pathItem[prop];
        }
      });

      filteredPaths[path] = filteredPathItem as OpenAPIObject['paths'][string];
    }
  });

  const filteredTags =
    document.tags?.filter((tag) =>
      tag.name.toLowerCase().startsWith(normalizedPrefix),
    ) ?? [];

  return {
    ...document,
    tags: filteredTags,
    paths: filteredPaths,
  };
}
