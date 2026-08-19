/* eslint-disable */

import { NavLink, useLocation } from 'react-router-dom';
import { useMemo } from 'react';
import { jwtDecode } from 'jwt-decode';
import { getStoredPermissions, isMainOrganizer, isRealAdmin } from '../../../app/service/organizer/rolesPermissions/permissionsService';
// chakra imports
import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Flex,
  HStack,
  Text,
  List,
  Icon,
  ListItem,
  useColorModeValue,
} from '@chakra-ui/react';
// Assets
import { FaCircle } from 'react-icons/fa';

const getAllowedModules = (): string[] => {
  try {
    const token = localStorage.getItem('AuthToken');
    if (!token) return [];

    const decoded = jwtDecode(token) as Record<string, any>;
    const modules = decoded.allowedModules;

    if (!modules) return [];
    if (Array.isArray(modules)) return modules;

    if (typeof modules === 'string') {
      return modules.includes(',') ? modules.split(',').map(m => m.trim()) : [modules];
    }

    return [];
  } catch (error) {
    console.error('Error decoding token:', error);
    return [];
  }
};

const filterRoutesByModules = (routes: RoutesType[], allowedModules: string[]): RoutesType[] => {
  // Real admin: userId === organizerId AND has system 'Admin' role in JWT
  const hasAdminRole = isRealAdmin();
  // Main organizer: carries the system-assigned "Organizer" role in the JWT
  const hasNoRestrictions = isMainOrganizer();
  const hasBothRoles = hasAdminRole && hasNoRestrictions;

  const storedPermissions = getStoredPermissions();

  // Permission required to show each named sub-item in a collapse menu.
  // Nested by parent collapse name — sub-item names like "Payments" repeat across
  // modules (Donation, Membership), so a flat map would let one module's entry
  // silently overwrite another's.
  const subItemViewPermissions: Record<string, Record<string, string>> = {
    'Donation': {
      'Campaigns': 'Donation.Campaign.View',
      'Payments': 'Donation.Invoice.View',
      'Donors': 'Donation.Donors.View',
      'Recurring Donations': 'Donation.Recurring.View',
      'Archived List': 'Donation.Archived.View',
      'Payment Account': 'payment-account:list',
      'Integrations': 'integration:list:view',
      'Connectors': 'integration:list:view',
    },
    'Membership': {
      'Members': 'membership:member:view',
      'Pending Approvals': 'membership:member:view',
      'Payments': 'membership:invoice:view',
      'Custom Lists': 'membership:custom-list:view',
    },
  };

  const filterSubItems = (route: RoutesType): RoutesType | null => {
    if (!route.collapse || !route.items) return route;
    const visibleItems = route.items.filter(item => {
      if (!item.name?.trim()) return true; // keep unnamed/hidden route entries
      // Profile Settings is only visible to the main organizer
      if (item.name === 'Profile Settings') return hasNoRestrictions;
      const required = subItemViewPermissions[route.name]?.[item.name];
      if (!required) return true; // no permission mapping → always show
      return hasNoRestrictions || storedPermissions.includes(required);
    });
    // Hide the parent collapse entirely if no named items remain
    const hasVisibleNamedItem = visibleItems.some(item => !!item.name?.trim());
    if (!hasVisibleNamedItem) return null;
    return { ...route, items: visibleItems };
  };

  if (!allowedModules || allowedModules.length === 0) {
    console.log('⚠️ No allowed modules found');
    return routes
      .filter(route => {
        if (route.name === 'Dashboard') return hasNoRestrictions || storedPermissions.includes('Donation.Dashboard.View');
        if (route.name === 'AdminDashboard') return hasBothRoles;
        if (route.name === 'Settings') return true;
        if (route.name === 'Notifications') return true;
        if (route.name === 'Roles & Permissions') return hasNoRestrictions;
        if (route.name === 'Custom Forms') return hasNoRestrictions || storedPermissions.includes('customform:view');
        return false;
      })
      .map(filterSubItems)
      .filter((r): r is RoutesType => r !== null);
  }

  return routes.filter(route => {
    if (route.name === 'Dashboard') {
      const show = hasNoRestrictions || storedPermissions.includes('Donation.Dashboard.View');
      console.log(`${show ? '✅' : '❌'} "${route.name}" - ${show ? 'Shown' : 'Hidden (no Donation.Dashboard.View permission)'}`);
      return show;
    }

    if (route.name === 'AdminDashboard') {
      if (hasBothRoles) {
        console.log(`✅ "${route.name}" - Shown (user has both Admin and Organizer roles)`);
        return true;
      } else {
        console.log(`❌ "${route.name}" - Hidden (user doesn't have both roles)`);
        return false;
      }
    }

    // Always show Donars - not dependent on allowedModules
    if (route.name === 'Donars') {
      console.log(`✅ "${route.name}" - Always shown (donars menu)`);
      return true;
    }

    // Always show Settings - available for all user roles
    if (route.name === 'Settings') {
      console.log(`✅ "${route.name}" - Always shown (settings menu)`);
      return true;
    }

    // Only show Roles & Permissions to the main Organizer role
    if (route.name === 'Roles & Permissions') {
      const show = hasNoRestrictions;
      console.log(`${show ? '✅' : '❌'} "${route.name}" - ${show ? 'Shown (Organizer)' : 'Hidden (not Organizer)'}`);
      return show;
    }

    // Always show Notifications - every organizer should see their notifications
    if (route.name === 'Notifications') {
      console.log(`✅ "${route.name}" - Always shown (notifications menu)`);
      return true;
    }

    // Custom Forms is a standalone module gated by its own view permission
    if (route.name === 'Custom Forms') {
      const show = hasNoRestrictions || storedPermissions.includes('customform:view');
      console.log(`${show ? '✅' : '❌'} "${route.name}" - ${show ? 'Shown' : 'Hidden (no customform:view permission)'}`);
      return show;
    }

    const routeNameLower = route.name.toLowerCase();
    const matchedModule = allowedModules.find(module => {
      const moduleLower = module.toLowerCase();
      return routeNameLower === moduleLower || routeNameLower.startsWith(moduleLower);
    });

    if (matchedModule) {
      console.log(`✅ "${route.name}" - Matched with module "${matchedModule}"`);
      return true;
    } else {
      console.log(`❌ "${route.name}" - Not in allowed modules`);
      return false;
    }
  }).map(filterSubItems)
    .filter((r): r is RoutesType => r !== null);
};

export function SidebarLinks(props: {
  routes: RoutesType[];
  [x: string]: any;
}) {
  //   Chakra color mode
  let location = useLocation();
  let activeColor = useColorModeValue('#044bd9', 'white');
  let inactiveColor = useColorModeValue('gray.600', 'gray.300');
  let activeIcon = useColorModeValue('#044bd9', 'white');

  const { routes, hovered, mini, compact } = props;

  // Filter routes based on allowed modules for organizer sidebar ONLY
  const filteredRoutes = useMemo(() => {
    // Check if we're in organizer context
    const isOrganizerPath = location.pathname.includes('/organizer');

    console.log('=== Links.tsx Filtering ===');
    console.log('Current path:', location.pathname);
    console.log('Is organizer path:', isOrganizerPath);

    if (isOrganizerPath) {
      const allowedModules = getAllowedModules();
      console.log('Allowed modules from JWT:', allowedModules);
      console.log('Original routes:', routes.map(r => r.name));
      const filtered = filterRoutesByModules(routes, allowedModules);
      console.log('Filtered routes:', filtered.map(r => r.name));
      return filtered;
    }

    // For admin or other contexts, return all routes
    console.log('Not organizer - showing all routes');
    return routes;
  }, [routes, location.pathname]);

  // verifies if routeName is the one active (in browser input)
  const activeRoute = (routeName: string) => {
    return location.pathname.includes(routeName);
  };

  // verifies if a collapse parent or any of its children is active
  const activeCollapse = (route: RoutesType) => {
    if (activeRoute(route.path.toLowerCase())) return true;
    if (route.items) {
      return route.items.some(
        (item) => item.path && location.pathname.includes(item.path.toLowerCase()),
      );
    }
    return false;
  };

  // this function creates the links and collapses that appear in the sidebar (left menu)
  const createLinks = (routes: RoutesType[]) => {
    return routes.map((route, key) => {
      // Skip routes with empty/blank names (hidden utility routes)
      if (!route.name?.trim() && !route.collapse) return null;
      if (route.collapse) {
        return (
          <Accordion
            defaultIndex={0}
            allowToggle
            key={key}
          >
            <AccordionItem maxW="100%" w="100%" border="none" key={key}>
              <AccordionButton
                role="group"
                display="flex"
                alignItems="center"
                justifyContent="center"
                _hover={{
                  bg: 'blue.50',
                }}
                _focus={{
                  boxShadow: 'none',
                }}
                transition="background 0.18s ease"
                borderRadius="8px"
                w={{
                  sm: '100%',
                  xl: '100%',
                  '2xl': '95%',
                }}
                px={route.icon ? null : '0px'}
                py="0px"
                bg={'transparent'}
                ms={0}
              >
                {route.icon ? (
                  <Flex
                    align="center"
                    justifyContent={
                      mini === false
                        ? 'space-between'
                        : mini === true && hovered === true
                        ? 'space-between'
                        : 'center'
                    }
                    w="100%"
                  >
                    <HStack
                      mb="6px"
                      spacing="12px"
                    >
                      <Flex
                        w="100%"
                        alignItems="center"
                        justifyContent="flex-start"
                      >
                        <Box
                          color={
                            activeCollapse(route)
                              ? activeIcon
                              : inactiveColor
                          }
                          me={
                            mini === false
                              ? '8px'
                              : mini === true && hovered === true
                              ? '8px'
                              : '0px'
                          }
                          mt="6px"
                          transition="transform 0.18s ease, color 0.18s ease"
                          _groupHover={{ transform: 'scale(1.12)', color: activeIcon }}
                        >
                          {route.icon}
                        </Box>
                        <Text
                          display={
                            mini === false
                              ? 'block'
                              : mini === true && hovered === true
                              ? 'block'
                              : 'none'
                          }
                          me="auto"
                          pe={location.pathname.includes('/organizer') || location.pathname.includes('/member') ? '35px' : 'auto'}
                          color={
                            activeCollapse(route)
                              ? activeColor
                              : inactiveColor
                          }
                          fontWeight="500"
                          fontSize="md"
                          whiteSpace="nowrap"
                          transition="color 0.18s ease"
                          _groupHover={{ color: activeColor }}
                        >
                          {route.name}
                        </Text>
                      </Flex>
                    </HStack>
                    <AccordionIcon
                      display={
                        mini === false
                          ? 'block'
                          : mini === true && hovered === true
                          ? 'block'
                          : 'none'
                      }
                      color={inactiveColor}
                      transform={route.icon ? null : 'translateX(-70%)'}
                      transition="transform 0.22s ease, color 0.18s ease"
                      ms="auto"
                      ml="16px"
                      me="30px"
                      _groupHover={{ color: activeColor }}
                    />
                  </Flex>
                ) : (
                  <Flex
                    pt="0px"
                    pb="10px"
                    justify={'center'}
                    alignItems="center"
                    w="100%"
                  >
                    <HStack
                      spacing="12px"
                      ps={
                        mini === false
                          ? '34px'
                          : mini === true && hovered === true
                          ? '34px'
                          : '0px'
                      }
                    >
                      <Text
                        me="auto"
                        color={
                          activeCollapse(route)
                            ? activeColor
                            : inactiveColor
                        }
                        fontWeight="500"
                        fontSize="sm"
                        transition="color 0.18s ease"
                        _groupHover={{ color: activeColor }}
                      >
                        {mini === false
                          ? route.name
                          : mini === true && hovered === true
                          ? route.name
                          : route.name[0]}
                      </Text>
                    </HStack>
                    <AccordionIcon
                      display={
                        mini === false
                          ? 'block'
                          : mini === true && hovered === true
                          ? 'block'
                          : 'none'
                      }
                      ms="auto"
                      ml="16px"
                      color={inactiveColor}
                      transform={null}
                      transition="transform 0.22s ease, color 0.18s ease"
                      _groupHover={{ color: activeColor }}
                    />
                  </Flex>
                )}
              </AccordionButton>
              <AccordionPanel
                display={
                  mini === false
                    ? 'block'
                    : mini === true && hovered === true
                    ? 'block'
                    : 'flex'
                }
                justifyContent="center"
                alignItems="center"
                flexDirection={'column'}
                // bg="blue"
                pe={route.icon ? '14px !important' : '0px'}
                py="0px"
                ps={route.icon ? '14px !important' : '8px'}
                w="100%"
                maxW="100%"
                overflow="hidden"
              >
                <List w="100%" maxW="100%">
                  {
                    route.icon
                      ? createLinks(route.items) // for bullet accordion links
                      : createAccordionLinks(route.items) // for non-bullet accordion links
                  }
                </List>
              </AccordionPanel>
            </AccordionItem>
          </Accordion>
        );
      } else {
        return (
          <NavLink to={route.layout + route.path} key={key} style={{ display: 'block', width: '100%' }}>
            {route.icon ? (
              <Flex
                role="group"
                align="center"
                justifyContent="space-between"
                w="100%"
                mb="0px"
                borderRadius="md"
                mx={-2}
                px={2}
                py="4px"
                transition="background 0.18s ease, transform 0.18s ease"
                _hover={{ bg: 'blue.50', transform: 'translateX(2px)' }}
              >
                <HStack
                  mb={compact ? '4px' : '6px'}
                  spacing={compact ? '11px' : '12px'}
                >
                  <Flex w="100%" alignItems="center" justifyContent="flex-start">
                    <Box
                      color={
                        activeRoute(route.path.toLowerCase())
                          ? activeIcon
                          : inactiveColor
                      }
                      me="8px"
                      mt={compact ? '4px' : '6px'}
                      transition="transform 0.18s ease, color 0.18s ease"
                      _groupHover={{ transform: 'scale(1.12)', color: activeIcon }}
                    >
                      {route.icon}
                    </Box>
                    <Text
                      me="auto"
                      color={
                        activeRoute(route.path.toLowerCase())
                          ? activeColor
                          : inactiveColor
                      }
                      fontWeight="500"
                      fontSize={compact ? '15px' : 'md'}
                      transition="color 0.18s ease"
                      _groupHover={{ color: activeColor }}
                    >
                      {mini === false
                        ? route.name
                        : mini === true && hovered === true
                        ? route.name
                        : route.name[0]}
                    </Text>
                  </Flex>
                </HStack>
              </Flex>
            ) : (
              <ListItem ms={null} w="100%" minW="0">
                <Flex
                  role="group"
                  ps={
                    mini === false
                      ? '34px'
                      : mini === true && hovered === true
                      ? '34px'
                      : '0px'
                  }
                  alignItems="center"
                  mb="4px"
                  gap="6px"
                  bg={activeRoute(route.path.toLowerCase()) ? '#E2E8F0' : 'transparent'}
                  borderRadius="md"
                  pe={2}
                  py="3px"
                  w="100%"
                  minW="0"
                  overflow="hidden"
                  transition="background 0.18s ease, transform 0.18s ease"
                  _hover={{
                    bg: activeRoute(route.path.toLowerCase()) ? '#E2E8F0' : 'blue.50',
                    transform: 'translateX(2px)',
                  }}
                >
                  <Text
                    color={
                      activeRoute(route.path.toLowerCase())
                        ? activeColor
                        : inactiveColor
                    }
                    fontWeight="500"
                    fontSize="sm"
                    flex="1"
                    minW="0"
                    overflow="hidden"
                    textOverflow="ellipsis"
                    whiteSpace="nowrap"
                    transition="color 0.18s ease"
                    _groupHover={{ color: activeColor }}
                  >
                    {mini === false
                      ? route.name
                      : mini === true && hovered === true
                      ? route.name
                      : route.name[0]}
                  </Text>
                  {route.badge && (mini === false || (mini === true && hovered === true)) && route.badge}
                </Flex>
              </ListItem>
            )}
          </NavLink>
        );
      }
    });
  };
  // this function creates the links from the secondary accordions (for example auth -> sign-in -> default)
  const createAccordionLinks = (routes: RoutesType[]) => {
    return routes.map((route: RoutesType, key: number) => {
      // Skip routes with empty/blank names (hidden utility routes)
      if (!route.name?.trim()) return null;
      return (
        <NavLink to={route.layout + route.path} key={key} style={{ display: 'block', width: '100%' }}>
          <ListItem
            ms={
              mini === false
                ? '28px'
                : mini === true && hovered === true
                ? '28px'
                : '0px'
            }
            mb="4px"
            key={key}
            maxW="100%"
          >
            <Flex
              role="group"
              alignItems="center"
              w="100%"
              bg={activeRoute(route.path.toLowerCase()) ? '#E2E8F0' : 'transparent'}
              borderRadius="md"
              px={2}
              py="3px"
              transition="background 0.18s ease, transform 0.18s ease"
              _hover={{
                bg: activeRoute(route.path.toLowerCase()) ? '#E2E8F0' : 'blue.50',
                transform: 'translateX(2px)',
              }}
            >
              <Icon
                w="6px"
                h="6px"
                me="8px"
                as={FaCircle}
                color={activeIcon}
                flexShrink={0}
                transition="transform 0.18s ease"
                _groupHover={{ transform: 'scale(1.3)' }}
              />
              <Text
                color={
                  activeRoute(route.path.toLowerCase())
                    ? activeColor
                    : inactiveColor
                }
                fontWeight={
                  activeRoute(route.path.toLowerCase()) ? 'bold' : 'normal'
                }
                fontSize="sm"
                flex="1"
                minW="0"
                overflow="hidden"
                textOverflow="ellipsis"
                whiteSpace="nowrap"
                transition="color 0.18s ease"
                _groupHover={{ color: activeColor }}
              >
                {mini === false
                  ? route.name
                  : mini === true && hovered === true
                  ? route.name
                  : route.name[0]}
              </Text>
              {route.badge && (mini === false || (mini === true && hovered === true)) && route.badge}
            </Flex>
          </ListItem>
        </NavLink>
      );
    });
  };
  //  BRAND
  return <Box w="100%" overflow="hidden">{createLinks(filteredRoutes)}</Box>;
}

export default SidebarLinks;
