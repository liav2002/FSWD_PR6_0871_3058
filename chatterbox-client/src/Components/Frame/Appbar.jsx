import React, { useContext, useState } from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import MenuItem from '@mui/material/MenuItem';
import Menu from '@mui/material/Menu';
import MenuIcon from '@mui/icons-material/Menu';
import AccountCircle from '@mui/icons-material/AccountCircle';
import { useNavigate } from 'react-router-dom'
import { Tooltip } from '@mui/material';
import LoginMenuItem from './LoginMenuItem';
import { AnimatePresence } from 'framer-motion';


export default function Appbar() {
  const [anchorEl, setAnchorEl] = useState(null);
  const [loginOpen, setLoginOpen] = useState(false);
  const navigate = useNavigate();

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
    console.log("anchorEl");
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const menuId = 'primary-search-account-menu';



  return (
    <div>
      <Box sx={{ flexGrow: 1 }}>
        <AppBar position="fixed">
          <Toolbar>
            <IconButton
              size="large"
              edge="start"
              color="inherit"
              aria-label="open drawer"
              sx={{ mr: 2 }}
              onClick={() => { navigate('/') }}>
              <MenuIcon />
            </IconButton>
            <Typography
              variant="h6"
              noWrap
              component="div"
              sx={{ display: { xs: 'none', sm: 'block' } }}>
              
            </Typography>
            <Box sx={{ flexGrow: 1 }} />
            <Box sx={{ display: 'flex' }}>
              <Tooltip title="Profile">
                <IconButton
                  size="large"
                  edge="end"
                  aria-label="account of current user"
                  aria-controls={menuId}
                  aria-haspopup="true"
                  onClick={handleProfileMenuOpen}
                  color="inherit">
                  <AccountCircle />
                </IconButton>
              </Tooltip>
            </Box>
          </Toolbar>
        </AppBar>
        <Toolbar />{/*When you render the app bar position fixed, the dimension of the element doesn't impact the rest of the page. This can cause some part of your content to be invisible, behind the app bar. */}
        <Menu
          anchorEl={anchorEl/*the pop over menu */}
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          id={menuId}
          keepMounted
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}>
          {
            localStorage.getItem("username") ?
              <div>
                <MenuItem onClick={()=> {handleMenuClose(); navigate('/info')}}>{"My account " + localStorage.getItem("username")}</MenuItem>
                <MenuItem onClick={() => { handleMenuClose(); localStorage.removeItem('username'); navigate('/');}}>Sign out</MenuItem>
              </div>
              :
              <div>
                <MenuItem onClick={() => { handleMenuClose(); setLoginOpen(true); }}>Login</MenuItem>
                <AnimatePresence>
                  {loginOpen &&
                    <LoginMenuItem loginOpen={loginOpen} setLoginOpen={setLoginOpen} />
                  }
                </AnimatePresence>
                <MenuItem onClick={() => { handleMenuClose(); navigate('../Register') }}>Register</MenuItem>
              </div>
          }
        </Menu>
      </Box>
    </div>
  );
}


