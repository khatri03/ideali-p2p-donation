import { Box, Checkbox, Stack, Text } from "@chakra-ui/react";

type MultiSelectOption = {
  label: string;
  value: string;
};

type MultiSelectInputProps = {
  value: string[];
  onChange: (value: string[]) => void;
  options: MultiSelectOption[];
  placeholder?: string;
  isDisabled?: boolean;
  className?: string;
  inputId?: string;
  onBlur?: () => void;
};

function normalizeOptionValue(value: string) {
  return value.trim().toLowerCase();
}

export function MultiSelectInput({
  value,
  onChange,
  options,
  placeholder = "Select options",
  isDisabled = false,
  className,
  inputId,
  onBlur,
}: MultiSelectInputProps) {
  const selectedValueSet = new Set(value.map(normalizeOptionValue));

  return (
    <Box
      id={inputId}
      className={className}
      borderWidth="1px"
      borderColor="gray.200"
      borderRadius="xl"
      bg="white"
      p={3}
      opacity={isDisabled ? 0.7 : 1}
      onBlur={onBlur}
    >
      <Text fontSize="sm" color="gray.500" mb={2}>
        {placeholder}
      </Text>

      <Stack spacing={2} maxH="240px" overflowY="auto" pr={1}>
        {options.length > 0 ? (
          options.map((option) => {
            const checked = selectedValueSet.has(normalizeOptionValue(option.value));

            return (
              <Checkbox
                key={option.value}
                isChecked={checked}
                isDisabled={isDisabled}
                colorScheme="cyan"
                onChange={(event) => {
                  const nextChecked = event.target.checked;

                  if (nextChecked) {
                    onChange([...value, option.value]);
                    return;
                  }

                  onChange(value.filter((current) => normalizeOptionValue(current) !== normalizeOptionValue(option.value)));
                }}
              >
                {option.label}
              </Checkbox>
            );
          })
        ) : (
          <Text fontSize="sm" color="gray.500">
            No options available.
          </Text>
        )}
      </Stack>
    </Box>
  );
}
