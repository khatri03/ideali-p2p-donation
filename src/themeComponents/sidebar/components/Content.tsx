// chakra imports
import {
  Avatar,
  Box,
  Flex,
  Stack,
  Text,
  useColorModeValue,
} from '@chakra-ui/react';
//   Custom components
import Brand from 'themeComponents/sidebar/components/Brand';
import Links from 'themeComponents/sidebar/components/Links';
import SidebarCard from 'themeComponents/sidebar/components/SidebarCard';
import avatar4 from 'assets/img/avatars/avatar4.png';

// FUNCTIONS

function SidebarContent(props: {
  routes: RoutesType[];
  hovered?: boolean;
  mini?: boolean;
  compact?: boolean;
}) {
  const { routes, mini, hovered, compact } = props;
  const textColor = useColorModeValue('navy.700', 'white');
  const stickyBg = useColorModeValue('white', 'navy.800');
  // SIDEBAR
  return (
    <Flex direction="column" height="100%" borderRadius="30px">
      <Box
        position="sticky"
        top="0"
        zIndex={2}
        bg={stickyBg}
        pt={compact ? '21px' : '25px'}
      >
        <Brand mini={mini} hovered={hovered} compact={compact} />
      </Box>
      <Stack direction="column" mb="auto" mt="8px">
        <Box
          ps={
            mini === false
              ? '4px'
              : mini === true && hovered === true
              ? '4px'
              : '4px'
          }
          pe={{ md: '4px', '2xl': '0px' }}
          ms={mini && hovered === false ? '-16px' : 'unset'}
        >
          <Links mini={mini} hovered={hovered} routes={routes} compact={compact} />
        </Box>
      </Stack>
{/* 
      <Box
        ps="20px"
        pe={{ md: '16px', '2xl': '0px' }}
        mt="60px"
        borderRadius="30px"
      >
        <SidebarCard mini={mini} hovered={hovered} />
      </Box> */}
      <Flex mt="75px" mb="56px" justifyContent="center" alignItems="center">
        {/* <Avatar
          h="48px"
          w="48px"
          src={avatar4}
          me={
            mini === false
              ? '20px'
              : mini === true && hovered === true
              ? '20px'
              : '0px'
          }
        /> */}
        {/* <Box
          display={
            mini === false
              ? 'block'
              : mini === true && hovered === true
              ? 'block'
              : 'none'
          }
        >
          <Text color={textColor} fontSize="md" fontWeight="700">
            Adela Parkson
          </Text>
          <Text color="secondaryGray.600" fontSize="sm" fontWeight="400">
            Product Designer
          </Text>
        </Box> */}
      </Flex>
    </Flex>
  );
}

export default SidebarContent;
