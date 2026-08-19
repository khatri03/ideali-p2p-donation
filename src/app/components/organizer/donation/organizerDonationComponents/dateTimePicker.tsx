import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  InputGroup,
  InputRightElement,
  Text,
  SimpleGrid,
  Flex,
  Tooltip,
} from '@chakra-ui/react';
import {
  MdCalendarToday,
  MdClose,
  MdChevronLeft,
  MdChevronRight,
  MdKeyboardArrowDown,
} from 'react-icons/md';

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const MONTHS_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

type PickerView = 'calendar' | 'month' | 'year';

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function formatDisplay(date: Date | null): string {
  if (!date) return '';
  let h = date.getHours();
  const m = pad(date.getMinutes());
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${pad(date.getMonth() + 1)}/${pad(date.getDate())}/${date.getFullYear()}  ${pad(h)}:${m} ${ampm}`;
}

export interface DateTimePickerProps {
  label: string;
  required?: boolean;
  value: Date | null;
  minDate?: Date | null;
  onChange: (date: Date | null) => void;
  placeholder?: string;
  error?: string;
}

export default function DateTimePicker({
  label,
  required,
  value,
  minDate,
  onChange,
  placeholder,
  error,
}: DateTimePickerProps) {
  const [open, setOpen] = useState(false);
  const [pickerView, setPickerView] = useState<PickerView>('calendar');
  const [view, setView] = useState<Date>(() => value ?? new Date());
  const [tempDate, setTempDate] = useState<Date | null>(value);
  const [hour, setHour] = useState(12);
  const [minute, setMinute] = useState(0);
  const [ampm, setAmpm] = useState<'AM' | 'PM'>('PM');
  // Year range start for year-grid view (shows 12 years)
  const [yearRangeStart, setYearRangeStart] = useState<number>(() => {
    const y = (value ?? new Date()).getFullYear();
    return Math.floor(y / 12) * 12;
  });

  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTempDate(value);
    if (value) {
      setView(new Date(value.getFullYear(), value.getMonth(), 1));
      setYearRangeStart(Math.floor(value.getFullYear() / 12) * 12);
      let h = value.getHours();
      const ap: 'AM' | 'PM' = h >= 12 ? 'PM' : 'AM';
      h = h % 12 || 12;
      setHour(h);
      setMinute(value.getMinutes());
      setAmpm(ap);
    }
  }, [value]);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
        setPickerView('calendar');
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const daysInMonth = new Date(
    view.getFullYear(),
    view.getMonth() + 1,
    0,
  ).getDate();
  const firstDay = new Date(view.getFullYear(), view.getMonth(), 1).getDay();
  const prevMonthDays = new Date(
    view.getFullYear(),
    view.getMonth(),
    0,
  ).getDate();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // ── Navigation ──────────────────────────────────────────────
  function prevMonth() {
    setView(new Date(view.getFullYear(), view.getMonth() - 1, 1));
  }
  function nextMonth() {
    setView(new Date(view.getFullYear(), view.getMonth() + 1, 1));
  }
  function prevYear() {
    setView(new Date(view.getFullYear() - 1, view.getMonth(), 1));
  }
  function nextYear() {
    setView(new Date(view.getFullYear() + 1, view.getMonth(), 1));
  }

  // ── Month/Year header click ──────────────────────────────────
  function handleHeaderClick() {
    if (pickerView === 'calendar') {
      setPickerView('month');
    } else if (pickerView === 'month') {
      setYearRangeStart(Math.floor(view.getFullYear() / 12) * 12);
      setPickerView('year');
    } else {
      setPickerView('calendar');
    }
  }

  function selectMonth(monthIndex: number) {
    setView(new Date(view.getFullYear(), monthIndex, 1));
    setPickerView('calendar');
  }

  function selectYear(year: number) {
    setView(new Date(year, view.getMonth(), 1));
    setYearRangeStart(Math.floor(year / 12) * 12);
    setPickerView('month');
  }

  // ── Day helpers ──────────────────────────────────────────────
  function selectDay(day: number) {
    const d = new Date(view.getFullYear(), view.getMonth(), day);
    setTempDate(d);
  }

  function isDisabled(day: number): boolean {
    if (!minDate) return false;
    const d = new Date(view.getFullYear(), view.getMonth(), day);
    const min = new Date(minDate);
    min.setHours(0, 0, 0, 0);
    return d < min;
  }

  function isSelected(day: number): boolean {
    if (!tempDate) return false;
    return (
      tempDate.getFullYear() === view.getFullYear() &&
      tempDate.getMonth() === view.getMonth() &&
      tempDate.getDate() === day
    );
  }

  function isToday(day: number): boolean {
    return (
      today.getFullYear() === view.getFullYear() &&
      today.getMonth() === view.getMonth() &&
      today.getDate() === day
    );
  }

  function isMonthDisabled(monthIndex: number): boolean {
    if (!minDate) return false;
    const lastDay = new Date(view.getFullYear(), monthIndex + 1, 0);
    const min = new Date(minDate);
    min.setHours(0, 0, 0, 0);
    return lastDay < min;
  }

  function isYearDisabled(year: number): boolean {
    if (!minDate) return false;
    const lastDay = new Date(year, 11, 31);
    const min = new Date(minDate);
    min.setHours(0, 0, 0, 0);
    return lastDay < min;
  }

  // ── Confirm ──────────────────────────────────────────────────
  function confirm() {
    if (!tempDate) {
      setOpen(false);
      return;
    }
    let h = hour;
    if (ampm === 'PM' && h !== 12) h += 12;
    if (ampm === 'AM' && h === 12) h = 0;
    const final = new Date(tempDate);
    final.setHours(h, minute, 0, 0);
    onChange(final);
    setOpen(false);
    setPickerView('calendar');
  }

  function clear(e: React.MouseEvent) {
    e.stopPropagation();
    onChange(null);
    setTempDate(null);
  }

  // ── Header label ─────────────────────────────────────────────
  function headerLabel() {
    if (pickerView === 'year') {
      return `${yearRangeStart} – ${yearRangeStart + 11}`;
    }
    if (pickerView === 'month') {
      return `${view.getFullYear()}`;
    }
    return `${MONTHS[view.getMonth()]} ${view.getFullYear()}`;
  }

  const selectStyle: React.CSSProperties = {
    fontSize: 13,
    border: '1px solid #e2e8f0',
    borderRadius: 6,
    padding: '4px 8px',
    background: 'white',
    outline: 'none',
    cursor: 'pointer',
    color: '#2d3748',
    fontWeight: 500,
  };

  // ── Prev/Next for year range ──────────────────────────────────
  function prevYearRange() {
    setYearRangeStart((y) => y - 12);
  }
  function nextYearRange() {
    setYearRangeStart((y) => y + 12);
  }

  // ── Prev/Next buttons based on view ─────────────────────────
  function handlePrev() {
    if (pickerView === 'calendar') prevMonth();
    else if (pickerView === 'month') prevYear();
    else prevYearRange();
  }

  function handleNext() {
    if (pickerView === 'calendar') nextMonth();
    else if (pickerView === 'month') nextYear();
    else nextYearRange();
  }

  return (
    <Box ref={wrapRef} position="relative" w="100%">
      <FormControl mb="3">
        <FormLabel fontWeight="semibold" fontSize="sm">
          {label}
          {required && (
            <Text as="span" color="red.500">
              {' '}
              *
            </Text>
          )}
        </FormLabel>

        <InputGroup>
          <Input
            readOnly
            cursor="pointer"
            value={formatDisplay(value)}
            placeholder={placeholder}
            onClick={() => {
              setOpen((o) => !o);
              setPickerView('calendar');
            }}
            pr="5rem"
            borderRadius="lg"
            _focus={{ borderColor: 'blue.400', boxShadow: '0 0 0 1px #63b3ed' }}
          />
          <InputRightElement w="5rem">
            <Flex align="center" gap={1} pr={2}>
              {value && (
                <Box
                  as={MdClose}
                  boxSize={4}
                  color="gray.400"
                  cursor="pointer"
                  onClick={clear}
                  _hover={{ color: 'red.500' }}
                />
              )}
              <Box
                as={MdCalendarToday}
                boxSize={4}
                color="blue.500"
                cursor="pointer"
                onClick={() => {
                  setOpen((o) => !o);
                  setPickerView('calendar');
                }}
              />
            </Flex>
          </InputRightElement>
        </InputGroup>

        {error && (
          <Text fontSize="xs" fontWeight="bold" color="red.600" mt={1}>
            {error}
          </Text>
        )}
      </FormControl>

      {/* ── Dropdown ── */}
      {open && (
        <Box
          position="absolute"
          top="100%"
          left={0}
          zIndex={999}
          mt={1}
          bg="white"
          border="1px solid"
          borderColor="gray.200"
          borderRadius="xl"
          boxShadow="0 8px 32px rgba(0,0,0,0.12)"
          minW="310px"
          overflow="hidden"
        >
          {/* ── Header: Prev / Label / Next ── */}
          <Flex
            align="center"
            justify="space-between"
            px={3}
            py={2}
            bg="blue.500"
          >
            <Box
              as={MdChevronLeft}
              boxSize={6}
              color="white"
              cursor="pointer"
              borderRadius="md"
              _hover={{ bg: 'blue.400' }}
              onClick={handlePrev}
            />

            {/* Clickable header — cycles calendar → month → year */}
            <Tooltip
              label={
                pickerView === 'calendar'
                  ? 'Click to pick month'
                  : pickerView === 'month'
                    ? 'Click to pick year'
                    : 'Back to calendar'
              }
              placement="top"
              hasArrow
              fontSize="xs"
            >
              <Flex
                align="center"
                gap={1}
                cursor="pointer"
                onClick={handleHeaderClick}
                borderRadius="md"
                px={2}
                py={1}
                _hover={{ bg: 'blue.400' }}
                transition="background 0.15s"
              >
                <Text
                  fontSize="sm"
                  fontWeight="700"
                  color="white"
                  letterSpacing="0.3px"
                >
                  {headerLabel()}
                </Text>
                <Box
                  as={MdKeyboardArrowDown}
                  boxSize={4}
                  color="whiteAlpha.800"
                  style={{
                    transform:
                      pickerView !== 'calendar'
                        ? 'rotate(180deg)'
                        : 'rotate(0deg)',
                    transition: 'transform 0.2s',
                  }}
                />
              </Flex>
            </Tooltip>

            <Box
              as={MdChevronRight}
              boxSize={6}
              color="white"
              cursor="pointer"
              borderRadius="md"
              _hover={{ bg: 'blue.400' }}
              onClick={handleNext}
            />
          </Flex>

          {/* ═══════════════════════════════════════════════
              VIEW: YEAR GRID  (12 years at a time)
          ═══════════════════════════════════════════════ */}
          {pickerView === 'year' && (
            <SimpleGrid columns={4} gap="6px" p={3}>
              {Array.from({ length: 12 }, (_, i) => yearRangeStart + i).map(
                (year) => {
                  const disabled = isYearDisabled(year);
                  const isCurrent = year === view.getFullYear();
                  const isNow = year === today.getFullYear();
                  return (
                    <Box
                      key={year}
                      h="44px"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      borderRadius="lg"
                      cursor={disabled ? 'not-allowed' : 'pointer'}
                      bg={isCurrent ? 'blue.500' : undefined}
                      border={
                        isNow && !isCurrent
                          ? '2px solid'
                          : '2px solid transparent'
                      }
                      borderColor={
                        isNow && !isCurrent ? 'blue.200' : 'transparent'
                      }
                      _hover={!disabled && !isCurrent ? { bg: 'blue.50' } : {}}
                      onClick={() => !disabled && selectYear(year)}
                      transition="background 0.12s"
                    >
                      <Text
                        fontSize="13px"
                        fontWeight={isCurrent || isNow ? '700' : '400'}
                        color={
                          isCurrent
                            ? 'white'
                            : disabled
                              ? 'gray.300'
                              : isNow
                                ? 'blue.500'
                                : 'gray.700'
                        }
                      >
                        {year}
                      </Text>
                    </Box>
                  );
                },
              )}
            </SimpleGrid>
          )}

          {/* ═══════════════════════════════════════════════
              VIEW: MONTH GRID
          ═══════════════════════════════════════════════ */}
          {pickerView === 'month' && (
            <SimpleGrid columns={3} gap="6px" p={3}>
              {MONTHS_SHORT.map((m, idx) => {
                const disabled = isMonthDisabled(idx);
                const isCurrent = idx === view.getMonth();
                const isNowMonth =
                  idx === today.getMonth() &&
                  view.getFullYear() === today.getFullYear();
                return (
                  <Box
                    key={m}
                    h="44px"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    borderRadius="lg"
                    cursor={disabled ? 'not-allowed' : 'pointer'}
                    bg={isCurrent ? 'blue.500' : undefined}
                    border={
                      isNowMonth && !isCurrent
                        ? '2px solid'
                        : '2px solid transparent'
                    }
                    borderColor={
                      isNowMonth && !isCurrent ? 'blue.200' : 'transparent'
                    }
                    _hover={!disabled && !isCurrent ? { bg: 'blue.50' } : {}}
                    onClick={() => !disabled && selectMonth(idx)}
                    transition="background 0.12s"
                  >
                    <Text
                      fontSize="13px"
                      fontWeight={isCurrent || isNowMonth ? '700' : '400'}
                      color={
                        isCurrent
                          ? 'white'
                          : disabled
                            ? 'gray.300'
                            : isNowMonth
                              ? 'blue.500'
                              : 'gray.700'
                      }
                    >
                      {m}
                    </Text>
                  </Box>
                );
              })}
            </SimpleGrid>
          )}

          {/* ═══════════════════════════════════════════════
              VIEW: CALENDAR (day grid)
          ═══════════════════════════════════════════════ */}
          {pickerView === 'calendar' && (
            <>
              <Box px={2} pt={2}>
                {/* Day names */}
                <SimpleGrid columns={7} mb={1}>
                  {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
                    <Text
                      key={d}
                      fontSize="11px"
                      fontWeight="600"
                      color="gray.400"
                      textAlign="center"
                      py={1}
                    >
                      {d}
                    </Text>
                  ))}
                </SimpleGrid>

                <SimpleGrid columns={7} gap="2px" mb={2}>
                  {/* Prev month filler */}
                  {Array.from({ length: firstDay }).map((_, i) => (
                    <Box
                      key={`prev-${i}`}
                      h="34px"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                    >
                      <Text fontSize="13px" color="gray.200">
                        {prevMonthDays - firstDay + 1 + i}
                      </Text>
                    </Box>
                  ))}

                  {/* Current month days */}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const disabled = isDisabled(day);
                    const selected = isSelected(day);
                    const tod = isToday(day);

                    return (
                      <Box
                        key={day}
                        h="34px"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        borderRadius="lg"
                        cursor={disabled ? 'not-allowed' : 'pointer'}
                        bg={selected ? 'blue.500' : undefined}
                        border={
                          tod && !selected
                            ? '2px solid'
                            : '2px solid transparent'
                        }
                        borderColor={
                          tod && !selected ? 'blue.200' : 'transparent'
                        }
                        _hover={!disabled && !selected ? { bg: 'blue.50' } : {}}
                        onClick={() => !disabled && selectDay(day)}
                        transition="background 0.1s"
                      >
                        <Text
                          fontSize="13px"
                          fontWeight={tod ? '700' : '400'}
                          color={
                            selected
                              ? 'white'
                              : disabled
                                ? 'gray.200'
                                : tod
                                  ? 'blue.500'
                                  : 'gray.700'
                          }
                        >
                          {day}
                        </Text>
                      </Box>
                    );
                  })}
                </SimpleGrid>
              </Box>

              {/* ── Time selector ── */}
              <Flex
                align="center"
                gap={2}
                px={3}
                py="10px"
                bg="gray.50"
                borderTop="1px solid"
                borderColor="gray.100"
              >
                <Text fontSize="12px" fontWeight="600" color="gray.500">
                  Time
                </Text>

                <select
                  value={hour}
                  onChange={(e) => setHour(+e.target.value)}
                  style={selectStyle}
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                    <option key={h} value={h}>
                      {pad(h)}
                    </option>
                  ))}
                </select>

                <Text fontSize="14px" color="gray.400" fontWeight="bold">
                  :
                </Text>

                <select
                  value={minute}
                  onChange={(e) => setMinute(+e.target.value)}
                  style={selectStyle}
                >
                  {[0, 15, 30, 45].map((m) => (
                    <option key={m} value={m}>
                      {pad(m)}
                    </option>
                  ))}
                </select>

                <select
                  value={ampm}
                  onChange={(e) => setAmpm(e.target.value as 'AM' | 'PM')}
                  style={selectStyle}
                >
                  <option>AM</option>
                  <option>PM</option>
                </select>

                <Button
                  ml="auto"
                  size="sm"
                  colorScheme="blue"
                  borderRadius="lg"
                  onClick={confirm}
                >
                  Done
                </Button>
              </Flex>
            </>
          )}

          {/* Done button for month/year views */}
          {pickerView !== 'calendar' && (
            <Flex justify="flex-end" px={3} pb={3}>
              <Button
                size="sm"
                variant="ghost"
                colorScheme="blue"
                onClick={() => setPickerView('calendar')}
              >
                Back to Calendar
              </Button>
            </Flex>
          )}
        </Box>
      )}
    </Box>
  );
}
