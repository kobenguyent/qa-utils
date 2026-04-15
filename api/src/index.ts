import { createApp } from './app';

const PORT = process.env['PORT'] ? parseInt(process.env['PORT'], 10) : 3333;

const app = createApp();

app.listen(PORT, () => {
  console.log(`\n🚀  QA Utils API running on http://localhost:${PORT}`);
  console.log(`📖  Swagger UI:   http://localhost:${PORT}/api-docs`);
  console.log(`📄  OpenAPI spec: http://localhost:${PORT}/openapi.json\n`);
});
