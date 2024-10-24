import { h, Fragment } from 'preact';
import { useContext } from 'preact/hooks';
import { AppStateContext } from '/src/state/AppStateContext.js';
import { ListItem, ListItemIcon, Button, CircularProgress, Tooltip, IconButton, ListItemText } from '@material-ui/core';
import SaveIcon from '@material-ui/icons/Save';
import DeleteIcon from '@material-ui/icons/Delete';
import DoneIcon from '@material-ui/icons/Done';
import SwapHorizSharpIcon from '@material-ui/icons/SwapHorizSharp';

export function FileListItem({ listItem, index, onParseFile}) {
    const { allFiles, parsedDisplay } = useContext(AppStateContext);
    const { name, displayName, parsed, parsing, file, openIndex, date } = listItem
    const labelId = `checkbox-list-label-${displayName}`;

    const displayFile = (index) => {
        const data = allFiles.value[index];
        if (data.parsed) {
            parsedDisplay.value = allFiles.value[index];
        }
    }

    const saveFile = (index) => {
        const data = allFiles.value[index];
        const jsonStr = JSON.stringify(data.file, null, 2);
        const blob = new Blob([jsonStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        let filename = data.displayName;
        if (!filename.endsWith('_parsed')) {
            filename += '_parsed';
        }
        link.download = `${filename}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    const deleteFile = (index) => {
        if (allFiles.value[index] === parsedDisplay.value) {
            parsedDisplay.value = { file: '' };
        }
        allFiles.value.splice(index, 1);
        allFiles.value = [...allFiles.value];
    }

    return (
        <ListItem
            className={`sidebar-item ${!parsed ? "unparsed" : ""}`}
            selected={file === parsedDisplay.value.file}
            key={name}
            role={undefined}
            dense
            button
            onClick={e => displayFile(index)}
        >
            <ListItemIcon>
                <Tooltip title={parsed ? "Parsed File" : "Parse to Json"}>
                    <span>
                        <Button
                            className="sidebar-parse-button"
                            variant="contained"
                            color="primary"
                            disabled={parsed}
                            tabIndex={-1}
                            onClick={onParseFile}>

                            {parsing ? <CircularProgress size={24} color='white' /> :
                                !parsed ? <SwapHorizSharpIcon /> :
                                    openIndex ? <div className='sidebar-numberBox'>{openIndex}</div> : <DoneIcon />}
                        </Button>
                    </span>
                </Tooltip>
            </ListItemIcon>
            <ListItemText id={labelId} className='sidebar-text' primary={displayName} secondary={date}/>
            <Tooltip title="Save">
                <span>
                    <IconButton
                        disabled={!parsed}
                        onClick={e => saveFile(index)}>
                        <SaveIcon />
                    </IconButton>
                </span>
            </Tooltip>
            <Tooltip title="Delete">
                <IconButton
                    tabIndex={2}
                        onClick={e => {e.stopPropagation(); deleteFile(index)}}>
                    <DeleteIcon />
                </IconButton>
            </Tooltip>
        </ListItem>
    );
}
