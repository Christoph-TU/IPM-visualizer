import { h, Fragment } from 'preact';
import { useState } from 'preact/hooks';
import { useContext } from 'preact/hooks';
import { useSignal } from '@preact/signals';
import { AppStateContext } from '/src/state/AppStateContext.js';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import MuiDialogTitle from '@material-ui/core/DialogTitle';
import DialogActions from '@material-ui/core/DialogActions';
import IconButton from '@material-ui/core/IconButton';
import CloseIcon from '@material-ui/icons/Close';
import Typography from '@material-ui/core/Typography';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import Box from '@material-ui/core/Box';
import PaletteIcon from '@material-ui/icons/Palette';
import Tooltip from '@material-ui/core/Tooltip';
import useGlobalStyle from '/src/styles/GlobalStyle.js';
import './ColorPalette.css';
import { colorPalettes, colorPalette, setColorPalette } from '/src/utils/colorData.js';

const DialogTitle = ((props) => {
  const { children, classes, onClose, ...other } = props;
  return (
    <MuiDialogTitle disableTypography {...other}>
      <Typography variant="h6">{children}</Typography>
      {onClose ? (
        <IconButton aria-label="close" className='colorPalette-closeButton' onClick={onClose}>
          <CloseIcon />
        </IconButton>
      ) : null}
    </MuiDialogTitle>
  );
});

export function ColorPalette() {
  const { lockColorAndOrder } = useContext(AppStateContext);
  const [open, setOpen] = useState(false);
  const palette = useSignal(colorPalette);
  const changed = useSignal(false);
  const classes = useGlobalStyle();

  function PaletteList() {
    return (
      <List>
        {colorPalettes.map((value) => (
          <ListItem
            button
            onClick={() => { palette.value = value, changed.value = true}}
            selected={value.name === palette.value.name}
            style={{ flexDirection: 'column', alignItems: 'flex-start' }}
          >
            <Box
              display="flex"
              justifyContent="space-between"
              width="100%"
            >
              <Box>{value.name}</Box>
              <Box>Size: {value.palette.length}</Box>
            </Box>
            <Box
              display="flex"
              flexWrap="wrap"
              p={1}
            >
              {value.palette.map((color) => (
                <Box
                  key={color}
                  width={20}
                  height={20}
                  bgcolor={color}
                  className='colorPalette-colorBox'
                />
              ))}
            </Box>
          </ListItem>
        ))}
      </List>

    );
  }

  const changePalette = () => {
    setColorPalette(palette.value);
    //TODO: Fix this hack
    lockColorAndOrder.value = !lockColorAndOrder.value;
    setTimeout(() => { lockColorAndOrder.value = !lockColorAndOrder.value }, 0);
  }

  const handleClickOpen = () => {
    palette.value = colorPalette;
    changed.value = false;
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
  };

  const handleSaveChanges = () => {
    changePalette();
    handleClose();
  }


  return (
    <>
      <Tooltip title="Change Cor Palette">
        <IconButton
          className={classes.iconButton}
          onClick={handleClickOpen}>
          <PaletteIcon />
        </IconButton>
      </Tooltip>
      <Dialog onClose={handleClose} aria-labelledby="customized-dialog-title" open={open}>
        <DialogTitle id="customized-dialog-title" onClose={handleClose}>Change color palette</DialogTitle>
        <PaletteList />
        <DialogActions>
          <Button
            variant={changed.value ? 'contained' : 'outlined'}
            autoFocus onClick={handleSaveChanges} color="primary">
            Save changes
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
