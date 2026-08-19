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
import { SidebarContext } from 'contexts/SidebarContext';
import { useState, useEffect, useMemo } from 'react';
import { ensureAuthenticated } from '../../utils/auth';
import { Route, Routes, Navigate, useLocation } from 'react-router-dom';
import routes from 'routes';

// Import role-based utilities
import { getStoredUserRole, getStoredSidebarType } from '../../utils/roleRedirect';
import { getSidebarComponent, getResponsiveSidebarComponent, getSidebarRoutes } from '../../utils/sidebarFactory';

// Custom Chakra theme
export default function RoleBasedAdminLayout(props: { [x: string]: any }) {
  const { ...rest } = props;
  const location = useLocation();

  // states and functions
  const [fixed] = useState(false);
  const [toggleSidebar, setToggleSidebar] = useState(false);
  const [mini, setMini] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [sidebarType, setSidebarType] = useState<string | null>(null);
  const [currentRoutes, setCurrentRoutes] = useState(routes);

  // Load user role and sidebar type on component mount
  useEffect(() => {
    // Auth guard: redirect if no token or expired
    try {
      const ok = ensureAuthenticated();
      if (!ok) {
        window.location.href = '/auth/sign-in/custom';
        return;
      }
    } catch {}

    const role = getStoredUserRole();
    const sidebar = getStoredSidebarType();
    
    setUserRole(role);
    setSidebarType(sidebar);
    
    // Get appropriate routes based on role
    if (role) {
      const roleRoutes = getSidebarRoutes(role);
      setCurrentRoutes(roleRoutes);
    }
  }, []);

  // functions for changing the states from components
  const getRoute = () => {
    return window.location.pathname !== '/admin/full-screen-maps';
  };

  const getActiveRoute = (routes: RoutesType[], currentPath: string): string => {
    let activeRoute = 'Invoice';

    for (let i = 0; i < routes.length; i++) {
      if (routes[i].collapse) {
        let collapseActiveRoute = getActiveRoute(routes[i].items, currentPath);
        if (collapseActiveRoute !== activeRoute) {
          return collapseActiveRoute;
        }
      } else {
        const fullPath = routes[i].layout + routes[i].path;
        // Check if current path matches the route (exact match or starts with for dynamic routes)
        if (currentPath === fullPath || currentPath.startsWith(fullPath + '/')) {
          return routes[i].name;
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
    return getActiveRoute(currentRoutes, location.pathname);
  }, [location.pathname, currentRoutes]);

  const activeNavbar = useMemo(() => {
    return getActiveNavbar(currentRoutes, location.pathname);
  }, [location.pathname, currentRoutes]);
  
  const getRoutes = (routes: RoutesType[]): any => {
    return routes.map((route: RoutesType, key: number) => {
      if (route.layout === '/admin' || route.layout === '/organizer') {
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

  // Get the appropriate sidebar component based on user role
  const SidebarComponent = userRole ? getSidebarComponent(userRole) : null;
  const ResponsiveSidebarComponent = userRole ? getResponsiveSidebarComponent(userRole) : null;

  console.log('User Role:', userRole);
  console.log('Sidebar Type:', sidebarType);
  console.log('Current Routes:', currentRoutes);
  
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
        {/* Render the appropriate sidebar based on user role */}
        {SidebarComponent && (
          <SidebarComponent
            hovered={hovered}
            setHovered={setHovered}
            mini={mini}
            routes={currentRoutes}
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
                logoText={`Ideas - ${sidebarType?.toUpperCase() || 'ADMIN'}`}
                brandText={activeRoute}
                secondary={activeNavbar}
                theme={props.theme}
                setTheme={props.setTheme}
                fixed={fixed}
                sidebarContent={ResponsiveSidebarComponent ? <ResponsiveSidebarComponent /> : undefined}
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
              <Routes>
                {getRoutes(currentRoutes)}
                <Route
                  path="/"
                  element={<Navigate to="/admin/admin-dashboard" replace />}
                />
              </Routes>
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
