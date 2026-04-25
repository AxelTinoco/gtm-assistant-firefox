# Changelog

Todas las notas importantes de este proyecto se documentan aquí.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y este proyecto se adhiere a [Semantic Versioning](https://semver.org/lang/es/).

## [Unreleased]

## [1.1.0] - 2026-04-25

### Added
- Licencia MIT, README completo, `.gitignore`
- Configuración de `package.json` con pnpm, ESLint, Prettier y web-ext
- `CONTRIBUTING.md`, `SECURITY.md`, `CODE_OF_CONDUCT.md`
- Plantillas de issues y pull requests
- Mejoras de accesibilidad WCAG 2.1 (Phase 1) en popup y panel de DevTools: roles ARIA, navegación por teclado, `aria-expanded` en cards/eventos, `role="tablist"` y patrón de tabs accesible, estilos `:focus-visible`

### Changed
- Migración a ESLint flat config
- Formateo Prettier aplicado en toda la base de código

## [1.0.0] - 2026-03-02

### Added
- Detección automática de contenedores GTM y Measurement IDs de GA4
- Intercepción de hits de red en tiempo real (GTM, GA4, Universal Analytics legacy)
- Popup con resumen de la pestaña activa
- Panel de DevTools para inspección detallada

[Unreleased]: https://github.com/AxelTinoco/tag-assistant-firefox/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/AxelTinoco/tag-assistant-firefox/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/AxelTinoco/tag-assistant-firefox/releases/tag/v1.0.0
