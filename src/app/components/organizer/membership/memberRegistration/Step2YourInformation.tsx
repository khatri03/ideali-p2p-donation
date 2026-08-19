import React from 'react';
import { Box, Button, Flex, FormControl, FormErrorMessage, FormLabel, Grid, Icon, Image, Input, InputGroup, InputRightElement, Select, Text } from '@chakra-ui/react';
import { MdPerson, MdOutlineRemoveRedEye } from 'react-icons/md';
import { RiEyeCloseLine } from 'react-icons/ri';
import AvatarCropModal from './AvatarCropModal';
import RegistrationFooter from './RegistrationFooter';
import { useStep2YourInformation } from './useStep2YourInformation';
import { Step2Errors } from '../types';

// ─── Exported data shape ──────────────────────────────────────────────────────

export interface Step2Data {
  email: string;
  password: string;
  confirmPassword: string;
  profilePhoto: File | null;
  prefix: string;
  firstName: string;
  middleName: string;
  lastName: string;
  cellPhone: string;
  addressType: string;
  country: string;
  state: string;
  line1: string;
  line2: string;
  city: string;
  zipCode: string;
}

interface Props {
  initialData?: Partial<Step2Data>;
  onBack: () => void;
  onContinue: (data: Step2Data) => void;
  themeColor?: string;
}

// ─── Small UI helpers ─────────────────────────────────────────────────────────

const field = {
  bg: 'gray.50', borderColor: 'gray.200', borderRadius: 'lg', fontSize: 'sm' as const,
  _focus: { borderColor: 'blue.400', boxShadow: '0 0 0 1px #4299e1', bg: 'white' },
  _hover: { borderColor: 'gray.300' },
};

function SectionCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <Box bg="white" borderRadius="xl" border="1px solid" borderColor="gray.200" p={5} boxShadow="sm">
      <Text fontSize="md" fontWeight="bold" color="gray.900" mb={0.5}>{title}</Text>
      <Text fontSize="xs" color="gray.500" mb={4}>{subtitle}</Text>
      {children}
    </Box>
  );
}
function RequiredLabel({ children }: { children: React.ReactNode }) {
  return (
    <FormLabel fontSize="sm" fontWeight="medium" color="gray.700" mb={1}>
      {children} <Text as="span" color="red.500">*</Text>
    </FormLabel>
  );
}
function Err({ v }: { v?: string }) {
  return <FormErrorMessage fontSize="xs">{v}</FormErrorMessage>;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Step2YourInformation({ initialData, onBack, onContinue, themeColor }: Props) {
  const h = useStep2YourInformation({ initialData, onContinue });
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

  return (
    <Box flex={1} display="flex" flexDirection="column" minH={0}>
      <Box flex={1} overflowY="auto" px={{ base: 4, md: 8 }} py={6} bg="gray.50">
        <Flex direction="column" gap={4} w="full">

          {/* User Login */}
          <SectionCard title="User Login" subtitle="Use these details to sign in after registration.">
            <Grid templateColumns={{ base: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }} gap={3}>
              <FormControl isInvalid={!!h.errors.email}>
                <RequiredLabel>Email</RequiredLabel>
                <Input type="email" placeholder="email@example.com" value={h.email} onChange={(e) => h.handleEmailChange(e.target.value)} maxLength={254} {...field} />
                <Err v={h.errors.email} />
              </FormControl>
              <FormControl isInvalid={!!h.errors.password}>
                <RequiredLabel>Password</RequiredLabel>
                <InputGroup>
                  <Input type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={h.password} onChange={(e) => h.handlePasswordChange(e.target.value)} maxLength={20} {...field} />
                  <InputRightElement>
                    <Icon
                      as={showPassword ? RiEyeCloseLine : MdOutlineRemoveRedEye}
                      color="gray.400"
                      _hover={{ cursor: 'pointer', color: 'gray.600' }}
                      onClick={() => setShowPassword((v) => !v)}
                      w="18px" h="18px"
                    />
                  </InputRightElement>
                </InputGroup>
                <Err v={h.errors.password} />
              </FormControl>
              <FormControl isInvalid={!!h.errors.confirmPassword}>
                <RequiredLabel>Confirm Password</RequiredLabel>
                <InputGroup>
                  <Input type={showConfirmPassword ? 'text' : 'password'} placeholder="••••••••" value={h.confirmPassword} onChange={(e) => h.handleConfirmPasswordChange(e.target.value)} maxLength={20} {...field} />
                  <InputRightElement>
                    <Icon
                      as={showConfirmPassword ? RiEyeCloseLine : MdOutlineRemoveRedEye}
                      color="gray.400"
                      _hover={{ cursor: 'pointer', color: 'gray.600' }}
                      onClick={() => setShowConfirmPassword((v) => !v)}
                      w="18px" h="18px"
                    />
                  </InputRightElement>
                </InputGroup>
                <Err v={h.errors.confirmPassword} />
              </FormControl>
            </Grid>
          </SectionCard>

          {/* Contact Info */}
          <SectionCard title="Contact Info" subtitle="Share the contact details we need for your membership record.">
            <Flex gap={5} align="flex-start" flexDirection={{ base: 'column', md: 'row' }}>
              {/* Avatar */}
              <Flex direction="column" align="center" gap={2} flexShrink={0}>
                <Box
                  w={{ base: '90px', sm: '110px', md: '130px' }} h={{ base: '90px', sm: '110px', md: '130px' }}
                  borderRadius="full" overflow="hidden" border="2px dashed"
                  borderColor={h.photoPreview ? 'blue.400' : '#044bd9'}
                  bg={h.photoPreview ? 'transparent' : 'blue.50'}
                  cursor="pointer" display="flex" alignItems="center" justifyContent="center"
                  flexDirection="column" gap={1.5}
                  _hover={{ bg: 'blue.100', borderColor: 'blue.500' }} transition="all 0.15s"
                  onClick={h.openCrop}
                >
                  {h.photoPreview ? (
                    <Image src={h.photoPreview} w="full" h="full" objectFit="cover" />
                  ) : (
                    <>
                      <Icon as={MdPerson} boxSize={10} color="#044bd9" />
                      <Text fontSize="9px" color="#044bd9" textAlign="center" lineHeight="1.3" fontWeight="bold" letterSpacing="wide">CLICK TO SELECT</Text>
                    </>
                  )}
                </Box>
                <Text fontSize="xs" color="gray.500" textAlign="center" fontWeight="medium">Profile Photo / Avatar</Text>
                {h.photoPreview && (
                  <Button size="xs" variant="outline" borderRadius="full" borderColor="red.300" color="red.400" px={3}
                    _hover={{ bg: 'red.50', borderColor: 'red.400' }} onClick={h.removePhoto}>Remove</Button>
                )}
                <input ref={h.photoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={h.handlePhotoChange} />
              </Flex>

              <Grid flex={1} templateColumns={{ base: '1fr', sm: '1fr', md: 'repeat(3, 1fr)' }} gap={3}>
                <FormControl isInvalid={!!h.errors.prefix}>
                  <FormLabel fontSize="sm" fontWeight="medium" color="gray.700" mb={1}>Prefix <Text as="span" color="red.500">*</Text></FormLabel>
                  <Select placeholder="Select" value={h.prefix} onChange={(e) => h.setPrefix(e.target.value)} {...field}>
                    {h.prefixOptions.map((p) => <option key={p.value} value={String(p.value)}>{p.text}</option>)}
                  </Select>
                  <Err v={h.errors.prefix} />
                </FormControl>
                <FormControl isInvalid={!!h.errors.firstName}>
                  <RequiredLabel>First Name</RequiredLabel>
                  <Input placeholder="First name" value={h.firstName} onChange={(e) => h.handleNameChange('firstName', e.target.value)} maxLength={20} {...field} />
                  <Err v={h.errors.firstName} />
                </FormControl>
                <FormControl isInvalid={!!h.errors.middleName}>
                  <FormLabel fontSize="sm" fontWeight="medium" color="gray.700" mb={1}>Middle Name</FormLabel>
                  <Input placeholder="Middle name" value={h.middleName} onChange={(e) => h.handleNameChange('middleName', e.target.value)} maxLength={20} {...field} />
                  <Err v={h.errors.middleName} />
                </FormControl>
                <FormControl isInvalid={!!h.errors.lastName}>
                  <RequiredLabel>Last Name</RequiredLabel>
                  <Input placeholder="Last name" value={h.lastName} onChange={(e) => h.handleNameChange('lastName', e.target.value)} maxLength={20} {...field} />
                  <Err v={h.errors.lastName} />
                </FormControl>
                <FormControl isInvalid={!!h.errors.cellPhone}>
                  <FormLabel fontSize="sm" fontWeight="medium" color="gray.700" mb={1}>Cell Phone</FormLabel>
                  <Input type="tel" placeholder="+15551234567" value={h.cellPhone} onChange={(e) => h.handlePhoneChange(e.target.value)} inputMode="tel" maxLength={16} {...field} />
                  <Err v={h.errors.cellPhone} />
                </FormControl>
              </Grid>
            </Flex>
          </SectionCard>

          {/* Address */}
          <SectionCard title="Address" subtitle="Add an address if you want one attached to your membership record.">
            <Grid templateColumns={{ base: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }} gap={3} mb={3}>
              <FormControl isInvalid={!!h.errors.addressType}>
                <RequiredLabel>Address Type</RequiredLabel>
                <Select placeholder="Select type" value={h.addressType} onChange={(e) => h.setAddressType(e.target.value)} {...field}>
                  {h.addressTypeOptions.map((t) => <option key={t.value} value={String(t.value)}>{t.text}</option>)}
                </Select>
                <Err v={h.errors.addressType} />
              </FormControl>
              <FormControl isInvalid={!!h.errors.country}>
                <FormLabel fontSize="sm" fontWeight="medium" color="gray.700" mb={1}>Country List</FormLabel>
                <Select placeholder="Select country" value={h.country} onChange={(e) => h.setCountry(e.target.value)} {...field}>
                  {h.countries.map((c) => <option key={c.countryId} value={String(c.countryId)}>{c.name}</option>)}
                </Select>
                <Err v={h.errors.country} />
              </FormControl>
              <FormControl isInvalid={!!h.errors.state}>
                <FormLabel fontSize="sm" fontWeight="medium" color="gray.700" mb={1}>State / Province</FormLabel>
                {h.stateOptions.length > 0 ? (
                  <Select placeholder="Select state" value={h.state} onChange={(e) => h.setStateValue(e.target.value)} isDisabled={h.statesLoading} {...field}>
                    {h.stateOptions.map((s) => <option key={s.stateId} value={String(s.stateId)}>{s.name}</option>)}
                  </Select>
                ) : (
                  <Input placeholder={h.statesLoading ? 'Loading...' : 'State / Province'} value={h.state} onChange={(e) => h.setStateValue(e.target.value)} isDisabled={h.statesLoading} maxLength={50} {...field} />
                )}
                <Err v={h.errors.state} />
              </FormControl>
            </Grid>
            <Grid templateColumns={{ base: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }} gap={3}>
              <FormControl isInvalid={!!h.errors.line1}>
                <RequiredLabel>Line 1</RequiredLabel>
                <Input placeholder="Line 1" value={h.line1} onChange={(e) => h.handleLine1Change(e.target.value)} maxLength={50} {...field} />
                <Err v={h.errors.line1} />
              </FormControl>
              <FormControl isInvalid={!!h.errors.line2}>
                <FormLabel fontSize="sm" fontWeight="medium" color="gray.700" mb={1}>Line 2</FormLabel>
                <Input placeholder="Line 2" value={h.line2} onChange={(e) => h.handleLine2Change(e.target.value)} maxLength={50} {...field} />
                <Err v={h.errors.line2} />
              </FormControl>
              <FormControl isInvalid={!!h.errors.city}>
                <FormLabel fontSize="sm" fontWeight="medium" color="gray.700" mb={1}>City</FormLabel>
                <Input placeholder="City" value={h.city} onChange={(e) => h.handleCityChange(e.target.value)} maxLength={20} {...field} />
                <Err v={h.errors.city} />
              </FormControl>
              <FormControl isInvalid={!!h.errors.zipCode}>
                <FormLabel fontSize="sm" fontWeight="medium" color="gray.700" mb={1}>Zip/Postal Code</FormLabel>
                <Input placeholder="Zip / postal code" value={h.zipCode} onChange={(e) => h.handleZipChange(e.target.value)} maxLength={10} {...field} />
                <Err v={h.errors.zipCode} />
              </FormControl>
            </Grid>
          </SectionCard>

        </Flex>
      </Box>

      <RegistrationFooter onBack={onBack} onContinue={h.handleContinue} color={themeColor} />

      {h.cropSrc && (
        <AvatarCropModal
          isOpen={!!h.cropSrc}
          imageSrc={h.cropSrc}
          onCancel={() => h.setCropSrc(null)}
          onSave={h.handleCropSave}
        />
      )}
    </Box>
  );
}
