import { h, Fragment } from 'preact';
import { useContext } from 'preact/hooks';
import Button from '@material-ui/core/Button';
import { AppStateContext } from '/src/state/AppStateContext.js';
import PostAddIcon from '@material-ui/icons/PostAdd';

export function LoadData() {
  const { allFiles, parsedDisplay } = useContext(AppStateContext);

  const readFiles = (files) => {
    let firstFile = true;
    for (const file of files) {
      const { baseName, extension } = splitFilename(file.name);

      if (extension === "xml") {
        allFiles.value = [...allFiles.value, { parsed: false, file: file, name: file.name, displayName: baseName }]
        continue;
      }

      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const jsonContent = JSON.parse(e.target.result);
          allFiles.value = [...allFiles.value, { parsed: true, file: jsonContent, name: file.name, displayName: baseName }]
          if (firstFile || !parsedDisplay.value.file) {
            firstFile = false;
            parsedDisplay.value = allFiles.value[allFiles.value.length - 1];
          }
        } catch (error) {
          console.error("Error parsing JSON:", error);
        }
      };

      reader.readAsText(file);
    }
  };


  const splitFilename = (filename) => {
    // Find the last occurrence of '.' to separate the extension from the base name
    const lastIndex = filename.lastIndexOf('.');

    // Check if there is an extension
    if (lastIndex > 0 && lastIndex < filename.length - 1) {
      const baseName = filename.substring(0, lastIndex);
      const extension = filename.substring(lastIndex + 1);
      return { baseName, extension };
    } else {
      // If there's no '.', return the whole filename as the baseName and leave extension empty
      return { baseName: filename, extension: '' };
    }
  }

  return (
    <Button
      variant="contained"
      color="primary"
      tabIndex={-1}
      component="label"
      endIcon={<PostAddIcon />}
    >
      Add Files
      <input
        multiple
        type="file"
        accept=".json, .xml"
        onChange={(e) => readFiles(e.target.files)}
        hidden
      />

    </Button>
  );


}
