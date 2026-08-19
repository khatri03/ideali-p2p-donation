// Chakra imports
import {
  Portal,
  Box,
  useDisclosure,
  useColorModeValue,
} from '@chakra-ui/react';
import Footer from 'themeComponents/footer/FooterAdmin';
// Layout components
import Navbar from 'themeComponents/navbar/NavbarAdmin';
import Sidebar from 'themeComponents/sidebar/Sidebar';
import { AdminSidebarResponsive } from 'themeComponents/sidebar/AdminSidebar';
import { SidebarContext } from 'contexts/SidebarContext';
import { useState, Suspense, useEffect } from 'react';
import { Route, Routes, Navigate, useLocation, useNavigate } from 'react-router-dom';
import SuspenseLoader from '../../app/components/common/SuspenseLoader';
import { adminRoutes } from '../../routes/adminRoutes';
import { isRealAdmin } from '../../app/service/organizer/rolesPermissions/permissionsService';

// Custom Chakra theme
export default function Dashboard(props: { [x: string]: any }) {
  const { ...rest } = props;
  // states and functions
  const [fixed] = useState(false);
  const [toggleSidebar, setToggleSidebar] = useState(false);
  const [mini, setMini] = useState(false);
  const [hovered, setHovered] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Route-level guard: only the real admin (userId === organizerId AND 'Admin' role) may enter
  useEffect(() => {
    if (!isRealAdmin()) {
      navigate('/auth/sign-in/custom', { replace: true });
    }
  }, [location.pathname]);
  // functions for changing the states from components
  const getRoute = () => {
    return location.pathname !== '/admin/full-screen-maps';
  };
  // Helper to check if pathname matches a route path (handles dynamic segments like :id)
  const matchRoute = (pathname: string, routePath: string): boolean => {
    // Remove dynamic segments for comparison (e.g., :organizerUniqueId)
    const staticPath = routePath.split('/').filter(segment => !segment.startsWith(':')).join('/');
    const fullPath = '/admin' + staticPath;
    return pathname.startsWith(fullPath) && pathname.includes(staticPath);
  };

  const getActiveRoute = (routes: RoutesType[]): string => {
    let activeRoute = 'Invoice';
    for (let i = 0; i < routes.length; i++) {
      if (routes[i].collapse) {
        let collapseActiveRoute = getActiveRoute(routes[i].items);
        if (collapseActiveRoute !== activeRoute) {
          return collapseActiveRoute;
        }
      } else {
        if (matchRoute(location.pathname, routes[i].path)) {
          // Use navbarTitle if available, otherwise fall back to name
          return (routes[i] as any).navbarTitle || routes[i].name;
        }
      }
    }
    return activeRoute;
  };
  const getActiveNavbar = (routes: RoutesType[]): boolean => {
    let activeNavbar = false;
    for (let i = 0; i < routes.length; i++) {
      if (routes[i].collapse) {
        let collapseActiveNavbar = getActiveNavbar(routes[i].items);
        if (collapseActiveNavbar !== activeNavbar) {
          return collapseActiveNavbar;
        }
      } else {
        if (matchRoute(location.pathname, routes[i].path)) {
          return routes[i].secondary;
        }
      }
    }
    return activeNavbar;
  };
  const getRoutes = (routes: RoutesType[]): any => {
    return routes.map((route: RoutesType, key: number) => {
      if (route.layout === '/admin') {
        return (
          <Route path={`${route.path}`} element={route.component} key={key} />
        );
      }
      if (route.collapse) {
        return getRoutes(route.items);
      } else {
        return null;
      }
    });
  };
  console.log(mini);
  document.documentElement.dir = 'ltr';
  const { onOpen } = useDisclosure();
  const bg = useColorModeValue('background.100', 'background.900');
  return (
    <Box bg={bg} h="100vh" w="100vw">
      <SidebarContext.Provider
        value={{
          toggleSidebar,
          setToggleSidebar,
        }}
      >
        <Sidebar
          hovered={hovered}
          setHovered={setHovered}
          mini={mini}
          routes={adminRoutes as unknown as RoutesType[]}
          display="none"
          {...rest}
        />
        <Box
          float="right"
          minHeight="100vh"
          height="100%"
          overflow="auto"
          position="relative"
          maxHeight="100%"
          w={
            mini === false
              ? { base: '100%', xl: 'calc( 100% - 290px )' }
              : mini === true && hovered === true
              ? { base: '100%', xl: 'calc( 100% - 290px )' }
              : { base: '100%', xl: 'calc( 100% - 120px )' }
          }
          maxWidth={
            mini === false
              ? { base: '100%', xl: 'calc( 100% - 290px )' }
              : mini === true && hovered === true
              ? { base: '100%', xl: 'calc( 100% - 290px )' }
              : { base: '100%', xl: 'calc( 100% - 120px )' }
          }
          transition="all 0.33s cubic-bezier(0.685, 0.0473, 0.346, 1)"
          transitionDuration=".2s, .2s, .35s"
          transitionProperty="top, bottom, width"
          transitionTimingFunction="linear, linear, ease"
        >
          <Portal>
            <Box>
              <Navbar
                hovered={hovered}
                setMini={setMini}
                mini={mini}
                onOpen={onOpen}
                logoText={'Ideas'}
                brandText={getActiveRoute(adminRoutes as unknown as RoutesType[])}
                secondary={getActiveNavbar(adminRoutes as unknown as RoutesType[])}
                theme={props.theme}
                setTheme={props.setTheme}
                fixed={fixed}
                sidebarContent={<AdminSidebarResponsive />}
                {...rest}
              />
            </Box>
          </Portal>

          {getRoute() ? (
            <Box
              mx="auto"
              p={{ base: '20px', md: '30px' }}
              pe="20px"
              minH="100vh"
              pt="50px"
            >
              <Suspense fallback={<SuspenseLoader />}>
                <Routes>
                  {getRoutes(adminRoutes as unknown as RoutesType[])}
                  <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
                </Routes>
              </Suspense>
            </Box>
          ) : null}
          <Box>
            <Footer />
          </Box>
        </Box>
      </SidebarContext.Provider>
    </Box>
  );
}
