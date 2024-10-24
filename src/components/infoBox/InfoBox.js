import { h, Fragment } from 'preact';
import { useSignal } from '@preact/signals';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import IconButton from '@material-ui/core/IconButton';
import Tooltip from '@material-ui/core/Tooltip';
import HelpIcon from '@material-ui/icons/Help';
import './InfoBox.css';

export function InfoBox({ title, text }) {
    const dialogOpen = useSignal(false); // Signal to control dialog open state

    const handleDialogToggle = () => {
        dialogOpen.value = !dialogOpen.value; // Toggle dialog visibility
    };

    return (
        <>
            <Tooltip title={title}>
                <IconButton
                    onClick={handleDialogToggle}>
                    <HelpIcon />
                </IconButton>
            </Tooltip>
            <Dialog open={dialogOpen.value} onClose={handleDialogToggle} >
                <DialogTitle>{title}</DialogTitle>
                <DialogContent>
                    <DialogContentText className='infoBox-textfield'>
                        {text}
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleDialogToggle} color="primary">
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
