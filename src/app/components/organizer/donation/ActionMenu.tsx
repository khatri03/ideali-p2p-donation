// ActionMenu.tsx - Reusable three-dot menu component
import React from 'react';
import {
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
  Icon
} from '@chakra-ui/react';
import { BsThreeDotsVertical } from 'react-icons/bs';
import { MdEmail, MdVisibility } from 'react-icons/md';

export interface ActionMenuItem {
  label: string;
  icon?: React.ElementType;
  onClick: () => void;
  colorScheme?: string;
}

interface ActionMenuProps {
  items: ActionMenuItem[];
}

export const ActionMenu: React.FC<ActionMenuProps> = ({ items }) => {
  return (
    <Menu>
      <MenuButton
        as={IconButton}
        aria-label="Actions"
        icon={<BsThreeDotsVertical />}
        variant="ghost"
        size="sm"
        _hover={{ bg: 'gray.100' }}
        _active={{ bg: 'gray.200' }}
      />
      <MenuList minW="160px" shadow="md">
        {items.map((item, index) => (
          <MenuItem
            key={index}
            icon={item.icon ? <Icon as={item.icon} /> : undefined}
            onClick={item.onClick}
            fontSize="sm"
            _hover={{ bg: 'gray.50' }}
          >
            {item.label}
          </MenuItem>
        ))}
      </MenuList>
    </Menu>
  );
};

export default ActionMenu;