import { createRouter, createRootRoute, createRoute, Outlet } from '@tanstack/react-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from './lib/query';
import { Layout } from './components/layout/Layout';
import { DashboardPage } from './pages/DashboardPage';
import { LeadsPage } from './pages/LeadsPage';
import { MensajeriaPage } from './pages/MensajeriaPage';
import { SeguimientoPage } from './pages/SeguimientoPage';
import { AnaliticasPage } from './pages/AnaliticasPage';
import { ConfiguracionPage } from './pages/ConfiguracionPage';
import './index.css';

const rootRoute = createRootRoute({
  component: () => (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  ),
});

const layoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'layout',
  component: () => <Layout />,
});

const indexRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/',
  component: DashboardPage,
});

const mensajeriaRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/mensajeria',
  component: MensajeriaPage,
});

const leadsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/leads',
  component: LeadsPage,
});

const seguimientoRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/seguimiento',
  component: SeguimientoPage,
});

const analiticasRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/analiticas',
  component: AnaliticasPage,
});

const configuracionRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/configuracion',
  component: ConfiguracionPage,
});

const routeTree = rootRoute.addChildren([
  layoutRoute.addChildren([
    indexRoute,
    mensajeriaRoute,
    leadsRoute,
    seguimientoRoute,
    analiticasRoute,
    configuracionRoute,
  ]),
]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
