import { h, Fragment } from 'preact';
import { useContext } from 'preact/hooks';
import { useSignal } from '@preact/signals';
import { AppStateContext } from '/src/state/AppStateContext.js';
import { Drawer, Divider, List, IconButton, Tooltip, Card } from '@material-ui/core';
import { LoadData } from '../loadData/LoadData';
import { FileListItem } from '/src/components/fileListItem/FileListItem';
import LockIcon from '@material-ui/icons/Lock';
import LockOpenIcon from '@material-ui/icons/LockOpen';
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import { ColorPalette } from '/src/components/colorPalette/ColorPalette';
import { useTheme } from '@material-ui/core/styles';
import useGlobalStyle from '/src/styles/GlobalStyle.js';
import './Sidebar.css';
import '/src/styles/Global.css';

export function Sidebar() {
    const { allFiles, parsedDisplay,  lockColorAndOrder, parseFile } = useContext(AppStateContext);
    const theme = useTheme();
    const primaryColor = theme.palette.primary.main;
    const classes = useGlobalStyle();
    const sidebarVisible = useSignal(true);

    return (
        <>
            <IconButton
                className="display-sidebar-icon"
                onClick={() => sidebarVisible.value = !sidebarVisible.value} // Toggle sidebar visibility
                style={{ left: sidebarVisible.value ? '365px' : '5px' }} // Adjust button position when sidebar is hidden
            >
                {sidebarVisible.value ? <ChevronLeftIcon /> : <ChevronRightIcon />}
            </IconButton>
            <Card className="fileNameBlock" style={{ display: sidebarVisible.value || !parsedDisplay.value.displayName ? 'none' : 'block' }} >{parsedDisplay.value.displayName}</Card>
            <Drawer
                variant="permanent"
                anchor="left"
                className='global-drawer'
                classes={{ paper: 'global-drawer-paper', }}
                style={{ display: sidebarVisible.value ? 'block' : 'none' }}
            >
                <div className='sidebar-header' style={{ backgroundColor: primaryColor }}>IPM visualizer</div>
                <Divider />
                <div className='sidebar-loaddata-container'>
                    <LoadData />
                </div>
                <Divider />
                <List>
                    {allFiles.value.map((oneFile, index) => {
                        return (
                            <FileListItem
                                listItem={oneFile}
                                index={index}
                                onParseFile={(e) => { parseFile(index); }}
                            />
                        );
                    })}
                </List>
                <div className='sidebar-color-container'>
                    <ColorPalette />
                    <Tooltip title="Lock Color Assignment and Order">
                        <IconButton
                            className={classes.iconButton}
                            onClick={(e) => {
                                e.stopPropagation();
                                lockColorAndOrder.value = !lockColorAndOrder.value;
                            }}>
                            {lockColorAndOrder.value ? <LockIcon /> : <LockOpenIcon />}
                        </IconButton>
                    </Tooltip>
                </div>
            </Drawer>
        </>
    );
}
