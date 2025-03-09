import React, { useContext } from 'react';
import { Link as RouterLink, useHistory } from 'react-router-dom';
import {
  Box,
  Flex,
  Text,
  Button,
  Stack,
  Link,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  useColorModeValue,
  useDisclosure,
  HStack,
  IconButton,
} from '@chakra-ui/react';
import { HamburgerIcon, CloseIcon, ChevronDownIcon } from '@chakra-ui/icons';
import { AuthContext } from '../context/AuthContext';

const Navbar = () => {
  const { isOpen, onToggle } = useDisclosure();
  const { user, logout } = useContext(AuthContext);
  const history = useHistory();

  const handleLogout = () => {
    logout();
    history.push('/login');
  };

  return (
    <Box>
      <Flex
        bg={useColorModeValue('white', 'gray.800')}
        color={useColorModeValue('gray.600', 'white')}
        minH={'60px'}
        py={{ base: 2 }}
        px={{ base: 4, md: 6 }}
        borderBottom={1}
        borderStyle={'solid'}
        borderColor={useColorModeValue('gray.200', 'gray.900')}
        align={'center'}
        justify={'space-between'}
      >
        <Flex
          flex={{ base: 1, md: 'auto' }}
          ml={{ base: -2 }}
          display={{ base: 'flex', md: 'none' }}
        >
          <IconButton
            onClick={onToggle}
            icon={isOpen ? <CloseIcon w={3} h={3} /> : <HamburgerIcon w={5} h={5} />}
            variant={'ghost'}
            aria-label={'Toggle Navigation'}
          />
        </Flex>
        
        <Flex flex={{ base: 1 }} justify={{ base: 'center', md: 'start' }}>
          <Link
            as={RouterLink}
            to="/"
            textAlign={useColorModeValue('left', 'center')}
            fontFamily={'heading'}
            fontWeight={'bold'}
            color={useColorModeValue('gray.800', 'white')}
            _hover={{
              textDecoration: 'none',
            }}
          >
            Business Partner Portal
          </Link>
        </Flex>

        <Stack
          flex={{ base: 1, md: 0 }}
          justify={'flex-end'}
          direction={'row'}
          spacing={6}
          display={{ base: isOpen ? 'flex' : 'none', md: 'flex' }}
        >
          {user ? (
            <HStack spacing={4}>
              {user.role === 'admin' && (
                <Link
                  as={RouterLink}
                  to="/admin"
                  fontSize={'sm'}
                  fontWeight={500}
                  variant={'link'}
                  _hover={{
                    textDecoration: 'none',
                    color: 'blue.500',
                  }}
                >
                  Admin Panel
                </Link>
              )}
              
              <Link
                as={RouterLink}
                to="/dashboard"
                fontSize={'sm'}
                fontWeight={500}
                variant={'link'}
                _hover={{
                  textDecoration: 'none',
                  color: 'blue.500',
                }}
              >
                Dashboard
              </Link>
              
              <Menu>
                <MenuButton
                  as={Button}
                  rounded={'full'}
                  variant={'link'}
                  cursor={'pointer'}
                  rightIcon={<ChevronDownIcon />}
                >
                  {`${user.firstName} ${user.lastName}`}
                </MenuButton>
                <MenuList>
                  <MenuItem isDisabled>
                    <Text fontSize="xs" color="gray.600">
                      {user.email}
                    </Text>
                  </MenuItem>
                  <MenuItem isDisabled>
                    <Text fontSize="xs" color="gray.600">
                      {user.businessPartnerName}
                    </Text>
                  </MenuItem>
                  <MenuDivider />
                  <MenuItem onClick={handleLogout}>Logout</MenuItem>
                </MenuList>
              </Menu>
            </HStack>
          ) : (
            <Button
              as={RouterLink}
              to="/login"
              fontSize={'sm'}
              fontWeight={600}
              color={'white'}
              bg={'blue.400'}
              _hover={{
                bg: 'blue.500',
              }}
            >
              Sign In
            </Button>
          )}
        </Stack>
      </Flex>
    </Box>
  );
};

export default Navbar;