import { h, Fragment } from 'preact';
import { useContext } from 'preact/hooks';
import { AppStateContext } from '/src/state/AppStateContext.js';
import { Select, MenuItem, FormControl, InputLabel } from '@material-ui/core';
import './RegionSelector.css';

export function RegionSelector() {
    const { parsedDisplay, region } = useContext(AppStateContext);
  
    const handleSelectChange = (e) => {
      region.value = parseInt(e.target.value);
    };

    if(parsedDisplay.value.file.regionsMetadata.length === 1){
        return;
    }
  
    return (
      <div className="region-selector-wrapper">
        <FormControl variant="outlined" size="small" className="region-form-control">
          <InputLabel id="region-select-label">Select Region</InputLabel>
          <Select
            labelId="region-select-label"
            value={region.value}
            onChange={handleSelectChange}
            className="region-select-box"
            label="Select Region"
          >
            {parsedDisplay.value.file?.regionsMetadata?.map((name, index) => (
              <MenuItem key={index} value={index}>
                {name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </div>
    );
  }