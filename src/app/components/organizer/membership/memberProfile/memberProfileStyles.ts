export const profileSectionCardStyles = {
  bg: 'white',
  border: '1px solid',
  borderColor: 'gray.200',
  borderRadius: 'xl',
  p: { base: 4, md: 5 },
  boxShadow: 'sm',
} as const;

export const profileSectionTitleStyles = {
  fontSize: 'sm',
  fontWeight: '700',
  color: 'gray.800',
  lineHeight: '1.2',
} as const;

export const profileSectionDescriptionStyles = {
  fontSize: 'xs',
  color: 'gray.500',
  lineHeight: '1.55',
} as const;

export const profileEyebrowStyles = {
  fontSize: '10px',
  fontWeight: '700',
  color: 'gray.400',
  textTransform: 'uppercase',
  letterSpacing: 'wider',
} as const;

export const profileValueStyles = {
  fontSize: 'sm',
  fontWeight: '600',
  color: 'gray.800',
  lineHeight: '1.45',
  wordBreak: 'break-word',
  overflowWrap: 'anywhere',
} as const;
