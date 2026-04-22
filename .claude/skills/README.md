# Skills de integración Strapi — CRM UNIMETA

Conjunto de tareas independientes pensadas para ser ejecutadas por un worker OpenCode (MiniMax 2.7). Cada `SKILL.md` es self-contained: contiene objetivo, archivos a tocar, especificación técnica, criterios de aceptación y restricciones.

## Orden de ejecución recomendado

```
01 → 02 → 03 → 04   (capa de datos — hacer en orden estricto)
            ↓
  ┌─────────┼─────────┬─────────┬─────────┐
  05       06        07        08        09   (UI — pueden paralelizarse)
  └─────────┴─────────┴─────────┴─────────┘
                        ↓
                       10   (documentación n8n — en cualquier momento tras 02)
```

| # | Skill | Archivos principales | Depende de |
|---|-------|---------------------|------------|
| 01 | [api-types](01-api-types/SKILL.md) | `src/lib/api.ts` | — |
| 02 | [api-crud](02-api-crud/SKILL.md) | `src/lib/api.ts` | 01 |
| 03 | [config-endpoints](03-config-endpoints/SKILL.md) | `src/lib/config.ts` | — |
| 04 | [react-query-hooks](04-react-query-hooks/SKILL.md) | `src/hooks/*` | 01, 02, 03 |
| 05 | [leads-page](05-leads-page/SKILL.md) | `src/pages/LeadsPage.tsx` | 04 |
| 06 | [seguimiento-page](06-seguimiento-page/SKILL.md) | `src/pages/SeguimientoPage.tsx` | 04, 05 |
| 07 | [mensajeria-page](07-mensajeria-page/SKILL.md) | `src/pages/MensajeriaPage.tsx` | 04 |
| 08 | [analiticas-page](08-analiticas-page/SKILL.md) | `src/pages/AnaliticasPage.tsx` | 04 |
| 09 | [configuracion-page](09-configuracion-page/SKILL.md) | `src/pages/ConfiguracionPage.tsx`, `src/lib/api.ts` | 04, 05, 06, 07, 08 |
| 10 | [n8n-contract](10-n8n-contract/SKILL.md) | `docs/n8n-strapi-contract.md` | 02 |
| 11 | [fix-modal-css-collision](11-fix-modal-css-collision/SKILL.md) | `src/pages/LeadsPage.{css,tsx}` | 05 |
| 12 | [asesor-quick-create](12-asesor-quick-create/SKILL.md) | `src/pages/LeadsPage.{tsx,css}` | 04, 05, 11 |

## Reglas para todos los workers

1. **Idioma:** todo el texto, comentarios y mensajes en español (consistente con el código existente).
2. **Aceptación obligatoria al final de cada skill:**
   ```bash
   npm run build
   npm run lint
   ```
   Ambos deben pasar. Si falla, no marcar el skill como completo.
3. **No instalar dependencias nuevas** salvo que el skill lo exija explícitamente (ninguno lo hace hoy).
4. **No tocar archivos fuera de los listados** en el skill.
5. **Estado del Strapi:** todas las colecciones ya existen pero están vacías. Las peticiones no llevan token — permisos públicos.
6. **Base de Strapi:** `http://localhost:1337/api` (ver [src/lib/config.ts](../../src/lib/config.ts)).

## Referencia de entidades
Ver [strapi.md](../../strapi.md) en la raíz del repo para el schema completo: 5 Collection Types (Lead, Asesor, Conversacion, Mensaje, Actividad) + 1 Single Type (ConfiguracionGlobal), 0 Components.

## Qué queda fuera de estos skills

- Autenticación de usuarios en el CRM (hoy no hay login).
- Workflows concretos de n8n (`.json`) — el skill 10 solo documenta el contrato.
- Seed inicial de datos — se hace manualmente desde el admin de Strapi o desde la UI ya cableada.
- Migración a API Tokens de Strapi — pendiente para cuando se exponga fuera de `localhost`.
