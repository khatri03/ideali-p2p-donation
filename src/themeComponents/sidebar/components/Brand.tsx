// Chakra imports
import { Flex, Image, Text, useColorModeValue } from '@chakra-ui/react';

// Custom components
import { HSeparator } from 'themeComponents/separator/Separator';

export function SidebarBrand(props: { mini: boolean; hovered: boolean; compact?: boolean }) {
  const { mini, hovered, compact } = props;
  //   Chakra color mode
  let logoColor = useColorModeValue('navy.700', 'white');

  return (
    <Flex alignItems="center" flexDirection="column">
      <Image
        src="/idealiLogo.svg"
        alt="Ideali Logo"
        h="auto"
        w={compact ? '160px' : '175px'}
        my="8px"
        display={
          mini === false
            ? 'block'
            : mini === true && hovered === true
            ? 'block'
            : 'none'
        }
      />
      <Text
        display={
          mini === false
            ? 'none'
            : mini === true && hovered === true
            ? 'none'
            : 'block'
        }
        fontSize={compact ? '27px' : '30px'}
        fontWeight="800"
        color={logoColor}
      >
        I
      </Text>
      <HSeparator mb={compact ? '17px' : '20px'} />
    </Flex>
  );
}

export default SidebarBrand;
