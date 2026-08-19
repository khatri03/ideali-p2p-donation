import { extendTheme, HTMLChakraProps, ThemingProps } from '@chakra-ui/react';
import { CardComponent } from './additions/card/card';
import { buttonStyles } from './components/button';
import { badgeStyles } from './components/badge';
import { inputStyles } from './components/input';
import { progressStyles } from './components/progress';
import { sliderStyles } from './components/slider';
import { textareaStyles } from './components/textarea';
import { switchStyles } from './components/switch';
import { linkStyles } from './components/link';
import { breakpoints } from './foundations/breakpoints';
import { globalStyles } from './styles';

const fonts = {
  heading: "'Roboto', sans-serif",
  body: "'Roboto', sans-serif",
};

// Define global styles inside theme to enforce font-family
const theme = extendTheme(
  {
    breakpoints,
    fonts,
    styles: {
      global: {
        'html, body': {
          fontFamily: `${fonts.body} !important`,
        },
        '*': {
          fontFamily: `${fonts.body} !important`,
        },
        'h1, h2, h3, h4, h5, h6': {
          fontFamily: `${fonts.heading} !important`,
        },
      },
    },
  },
  globalStyles,
  badgeStyles,
  buttonStyles,
  linkStyles,
  progressStyles,
  sliderStyles,
  inputStyles,
  textareaStyles,
  switchStyles,
  CardComponent
);

export default theme;

export interface CustomCardProps extends HTMLChakraProps<'div'>, ThemingProps {}