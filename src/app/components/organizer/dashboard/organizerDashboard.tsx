

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
import Sidebar, { OrganizerSidebarResponsive } from 'themeComponents/sidebar/OrganizerSidebar';
import { SidebarContext } from 'contexts/SidebarContext';
import { useState, useMemo, Suspense, useEffect } from 'react';
import { Route, Routes, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { hasPermission, getFirstAvailableOrganizerPath } from 'app/service/organizer/rolesPermissions/permissionsService';
import SuspenseLoader from '../../common/SuspenseLoader';
// import { adminRoutes } from '../../routes/adminRoutes';
import { organizerRoutes } from '../../../../routes/organizerRoutes';
// Custom Chakra theme
export default function OrganizerDashboard(props: { [x: string]: any }) {
  const { ...rest } = props;
  const location = useLocation();
  const navigate = useNavigate();
  const [permissionChecked, setPermissionChecked] = useState(false);

  useEffect(() => {
    if (
      location.pathname === '/organizer/organizer-dashboard' &&
      !hasPermission('Donation.Dashboard.View')
    ) {
      navigate(getFirstAvailableOrganizerPath(), { replace: true });
    }
    setPermissionChecked(true);
  }, []);

  // states and functions
  const [fixed] = useState(false);
  const [toggleSidebar, setToggleSidebar] = useState(false);
  const [mini, setMini] = useState(false);
  const [hovered, setHovered] = useState(false);

  // functions for changing the states from components
  const getRoute = () => {
    return window.location.pathname !== '/admin/full-screen-maps';
  };

  const matchesRoute = (routeFullPath: string, currentPath: string): boolean => {
    if (currentPath === routeFullPath) return true;
    // Handle optional trailing segments
    if (currentPath.startsWith(routeFullPath + '/')) return true;
    // Handle dynamic :param segments
    const routeParts = routeFullPath.split('/');
    const currentParts = currentPath.split('/');
    if (routeParts.length !== currentParts.length) return false;
    return routeParts.every((part, i) => part.startsWith(':') || part === currentParts[i]);
  };

  const getActiveRoute = (routes: RoutesType[], currentPath: string): string => {
    let activeRoute = 'Receipt';

    for (let i = 0; i < routes.length; i++) {
      if (routes[i].collapse) {
        let collapseActiveRoute = getActiveRoute(routes[i].items, currentPath);
        if (collapseActiveRoute !== activeRoute) {
          return collapseActiveRoute;
        }
      } else {
        const fullPath = routes[i].layout + routes[i].path;
        if (matchesRoute(fullPath, currentPath)) {
          return (routes[i] as any).navbarTitle || routes[i].name || activeRoute;
        }
      }
    }

    return activeRoute;
  };

  const getActiveNavbar = (routes: RoutesType[], currentPath: string): boolean => {
    let activeNavbar = false;

    for (let i = 0; i < routes.length; i++) {
      if (routes[i].collapse) {
        let collapseActiveNavbar = getActiveNavbar(routes[i].items, currentPath);
        if (collapseActiveNavbar !== activeNavbar) {
          return collapseActiveNavbar;
        }
      } else {
        const fullPath = routes[i].layout + routes[i].path;
        // Check if current path matches the route (exact match or starts with for dynamic routes)
        if (currentPath === fullPath || currentPath.startsWith(fullPath + '/')) {
          return routes[i].secondary;
        }
      }
    }
    return activeNavbar;
  };

  // Memoize the active route and navbar state based on location changes
  const activeRoute = useMemo(() => {
    return getActiveRoute(organizerRoutes as unknown as RoutesType[], location.pathname);
  }, [location.pathname]);

  const activeNavbar = useMemo(() => {
    return getActiveNavbar(organizerRoutes as unknown as RoutesType[], location.pathname);
  }, [location.pathname]);
  const getRoutes = (routes: RoutesType[]): any => {
    return routes.map((route: RoutesType, key: number) => {
      if (route.layout === '/organizer') {
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

  if (!permissionChecked) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" h="100vh" w="100vw" bg={bg}>
        <SuspenseLoader />
      </Box>
    );
  }

  const isAccessDenied = location.pathname === '/organizer/access-denied';

  return (
    <Box bg={bg} h="100vh" w="100vw">
      <SidebarContext.Provider
        value={{
          toggleSidebar,
          setToggleSidebar,
        }}
      >
        {!isAccessDenied && (
          <Sidebar
            hovered={hovered}
            setHovered={setHovered}
            mini={mini}
            routes={organizerRoutes as unknown as RoutesType[]}
            display="none"
            {...rest}
          />
        )}
        <Box
          float="right"
          minHeight="100vh"
          height="100%"
          overflow="auto"
          position="relative"
          maxHeight="100%"
          w={
            isAccessDenied ? '100%'
              : mini === false
              ? { base: '100%', xl: 'calc( 100% - 290px )' }
              : mini === true && hovered === true
              ? { base: '100%', xl: 'calc( 100% - 290px )' }
              : { base: '100%', xl: 'calc( 100% - 120px )' }
          }
          maxWidth={
            isAccessDenied ? '100%'
              : mini === false
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
                logoText={'Ideas - ORGANIZER'}
                brandText={activeRoute}
                secondary={activeNavbar}
                theme={props.theme}
                setTheme={props.setTheme}
                fixed={fixed}
                sidebarContent={!isAccessDenied ? <OrganizerSidebarResponsive /> : undefined}
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
                  {getRoutes(organizerRoutes as unknown as RoutesType[])}
                  <Route path="/" element={<Navigate to="/organizer/organizerDashboard" replace />} />
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

