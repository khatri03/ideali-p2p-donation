import { Box, Portal, useColorModeValue, useDisclosure } from '@chakra-ui/react';
import Footer from 'themeComponents/footer/FooterAdmin';
import Navbar from 'themeComponents/navbar/NavbarAdmin';
import MemberSidebar, { MemberSidebarResponsive } from 'themeComponents/sidebar/MemberSidebar';
import { SidebarContext } from 'contexts/SidebarContext';
import { lazy, Suspense, useMemo, useState } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { memberRoutes } from '../../../../routes/memberRoutes';

const MembershipInvoiceDetailPage = lazy(
  () => import('../membershipHistory/MembershipInvoiceDetailPage'),
);

export default function MemberLayout(props: { [x: string]: any }) {
  const { ...rest } = props;
  const [fixed] = useState(false);
  const [toggleSidebar, setToggleSidebar] = useState(false);
  const [mini, setMini] = useState(false);
  const [hovered, setHovered] = useState(false);
  const location = useLocation();
  const { onOpen } = useDisclosure();
  const bg = useColorModeValue('background.100', 'background.900');

  const matchesRoute = (routeFullPath: string, currentPath: string): boolean => {
    if (currentPath === routeFullPath) return true;
    if (currentPath.startsWith(routeFullPath + '/')) return true;
    const rp = routeFullPath.split('/');
    const cp = currentPath.split('/');
    if (rp.length !== cp.length) return false;
    return rp.every((part, i) => part.startsWith(':') || part === cp[i]);
  };

  const getActiveRoute = (routes: RoutesType[], currentPath: string): string => {
    if (currentPath.startsWith('/member/membership-history/invoice-detail/')) {
      return 'Receipt';
    }
    for (const route of routes) {
      if (route.collapse) {
        const nested = getActiveRoute(route.items, currentPath);
        if (nested !== 'Dashboard') return nested;
      } else {
        if (matchesRoute(route.layout + route.path, currentPath)) return (route as any).navbarTitle || route.name;
      }
    }
    return 'Dashboard';
  };

  const getActiveNavbar = (routes: RoutesType[], currentPath: string): boolean => {
    for (const route of routes) {
      if (route.collapse) { if (getActiveNavbar(route.items, currentPath)) return true; }
      else if (currentPath === route.layout + route.path || currentPath.startsWith(route.layout + route.path + '/')) return route.secondary;
    }
    return false;
  };

  const activeRoute = useMemo(() => getActiveRoute(memberRoutes as unknown as RoutesType[], location.pathname), [location.pathname]);
  const activeNavbar = useMemo(() => getActiveNavbar(memberRoutes as unknown as RoutesType[], location.pathname), [location.pathname]);

  const getRoutes = (routes: RoutesType[]): any =>
    routes.map((route, key) => {
      if (route.layout === '/member') return <Route path={route.path} element={route.component} key={key} />;
      if (route.collapse) return getRoutes(route.items);
      return null;
    });

  return (
    <Box bg={bg} h="100vh" w="100vw">
      <SidebarContext.Provider value={{ toggleSidebar, setToggleSidebar }}>
        <MemberSidebar hovered={hovered} setHovered={setHovered} mini={mini} display="none" {...rest} />
        <Box
          float="right" minHeight="100vh" height="100%" overflow="auto" position="relative" maxHeight="100%"
          w={mini === false ? { base: '100%', xl: 'calc( 100% - 265px )' } : mini === true && hovered === true ? { base: '100%', xl: 'calc( 100% - 265px )' } : { base: '100%', xl: 'calc( 100% - 120px )' }}
          maxWidth={mini === false ? { base: '100%', xl: 'calc( 100% - 265px )' } : mini === true && hovered === true ? { base: '100%', xl: 'calc( 100% - 265px )' } : { base: '100%', xl: 'calc( 100% - 120px )' }}
          transition="all 0.33s cubic-bezier(0.685, 0.0473, 0.346, 1)" transitionDuration=".2s, .2s, .35s" transitionProperty="top, bottom, width" transitionTimingFunction="linear, linear, ease"
        >
          <Portal>
            <Box>
              <Navbar hovered={hovered} setMini={setMini} mini={mini} onOpen={onOpen} logoText="Ideali - Donor Portal" brandText={activeRoute} secondary={activeNavbar} theme={props.theme} setTheme={props.setTheme} fixed={fixed} sidebarContent={<MemberSidebarResponsive />} expandedLeft="285px" navMinH="64px" {...rest} />
            </Box>
          </Portal>
          <Box mx="auto" p={{ base: '20px', md: '30px' }} pe="20px" minH="100vh" pt="50px">
            <Suspense fallback={null}>
              <Routes>
                <Route
                  path="/membership-history/invoice-detail/:invoiceId"
                  element={<MembershipInvoiceDetailPage />}
                />
                {getRoutes(memberRoutes as unknown as RoutesType[])}
                <Route path="/" element={<Navigate to="/member/dashboard" replace />} />
              </Routes>
            </Suspense>
          </Box>
          <Box><Footer /></Box>
        </Box>
      </SidebarContext.Provider>
    </Box>
  );
}
