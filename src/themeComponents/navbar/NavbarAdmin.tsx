/* eslint-disable */
// Chakra Imports
import {
  Box,
  Button,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Flex,
  Link,
  useColorModeValue,
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import React from 'react';
import AdminNavbarLinks from 'themeComponents/navbar/NavbarLinksAdmin';

export default function AdminNavbar(props: {
  secondary: boolean;
  brandText: string;
  logoText: string;
  fixed: boolean;
  onOpen: (...args: any[]) => any;
  sidebarContent?: React.ReactNode;
  expandedLeft?: string;
  collapsedLeft?: string;
  navMinH?: string;
  [x: string]: any;
}) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    window.addEventListener('scroll', changeNavbar);

    return () => {
      window.removeEventListener('scroll', changeNavbar);
    };
  });

  const {
    secondary,
    brandText,
    mini,
    setMini,
    theme,
    setTheme,
    hovered,
    sidebarContent,
    expandedLeft = '310px',
    collapsedLeft = '120px',
    navMinH = '75px',
  } = props;

  // Here are all the props that may change depending on navbar's type or state.(secondary, variant, scrolled)
  let mainText = useColorModeValue('navy.700', 'white');
  let secondaryText = useColorModeValue('gray.700', 'white');
  let navbarPosition = 'fixed' as const;
  let navbarFilter = 'none';
  let navbarShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
  let navbarBg = '#ffffff'; // pure white

  let navbarBottomBorder = useColorModeValue('gray.200', 'gray.600');
  let secondaryMargin = '0px';
  let paddingX = '15px';
  let gap = '0px';
  const changeNavbar = () => {
    if (window.scrollY > 1) {
      setScrolled(true);
    } else {
      setScrolled(false);
    }
  };
  return (
    <Box
      position={navbarPosition}
      boxShadow={navbarShadow}
      bg={navbarBg}
      filter={navbarFilter}
      backgroundPosition="center"
      backgroundSize="cover"
      borderRadius="10px"
      transitionDelay="0s, 0s, 0s, 0s"
      transitionDuration=" 0.25s, 0.25s, 0.25s, 0s"
      transition-property="box-shadow, background-color, filter"
      transitionTimingFunction="linear, linear, linear, linear"
      alignItems={{ xl: 'center' }}
      display={secondary ? 'block' : 'flex'}
      minH={navMinH}
      justifyContent={{ xl: 'center' }}
      lineHeight="25.6px"
      mx="0"
      mt={secondaryMargin}
      pb="4px"
      right="20px"
      left={
        mini === false
          ? {
              base: '0',
              md: '0',
              lg: '0',
              xl: expandedLeft,
              '2xl': expandedLeft,
            }
          : mini === true && hovered === true
          ? {
              base: '0',
              md: '0',
              lg: '0',
              xl: expandedLeft,
              '2xl': expandedLeft,
            }
          : {
              base: '0',
              md: '0',
              lg: '0',
              xl: collapsedLeft,
              '2xl': collapsedLeft,
            }
      }
      px={{
        sm: paddingX,
        md: '10px',
      }}
      ps={{
        xl: '0px',
      }}
      pt="8px"
      top="0px"
      w="auto"
    >
      <Flex
        w="100%"
        flexDirection="row"
        alignItems="center"
        mb={gap}
      >
        {/* Mobile hamburger — hidden on xl+ where the sidebar is always visible */}
        {sidebarContent && (
          <Box display={{ base: 'flex', xl: 'none' }} alignItems="center" flexShrink={0}>
            {sidebarContent}
          </Box>
        )}

        <Box>
          <Link
            color={mainText}
            href="#"
            bg="inherit"
            ml={{ base: 1, md: 4 }}
            fontSize={{ base: '16px', md: '22px', xl: '29px' }}
            _hover={{ color: { mainText } }}
            _active={{ bg: 'inherit', transform: 'none', borderColor: 'transparent' }}
            _focus={{ boxShadow: 'none' }}
          >
            {brandText}
          </Link>
        </Box>

        <Box ms="auto" flexShrink={0}>
          <AdminNavbarLinks
            mini={mini}
            setMini={setMini}
            theme={theme}
            setTheme={setTheme}
            secondary={props.secondary}
          />
        </Box>
      </Flex>
    </Box>
  );
}
