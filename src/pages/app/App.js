import { h, Fragment } from 'preact';
import { useContext } from 'preact/hooks';
import { ThemeProvider, createTheme } from '@material-ui/core';
import { Grid, Card, CardContent, Typography, Divider, Link } from '@material-ui/core';
import { ComBalance } from '/src/components/comBalance/ComBalance';
import { ComPie } from '/src/components/comPie/ComPie';
import ComTopology from '/src/components/comTopology/ComTopology';
import { Metadata } from '/src/components/metadata/Metadata';
import { BasicLineChart } from '/src/components/basicLineChart/BasicLineChart';
import { AppStateContext } from '/src/state/AppStateContext.js';
import { MsgBufferDist } from '/src/components/msgBufferDist/MsgBufferDist';
import { BasicTable, MpiDataTable, HpmDataTable, HostsTable } from '/src/components/mpiTables/MpiTables';
import { Sidebar } from '/src/components/sidebar/Sidebar';
import { RegionSelector } from '/src/components/regionSelector/RegionSelector';
import { StylesProvider } from '@material-ui/core/styles';
import GitHubIcon from '@material-ui/icons/GitHub';
import { InfoBox } from '/src/components/infoBox/InfoBox';
import tuLogo from '/src/assets/TU-Signet.png';
import './App.css';

const GridItem = ({ title, children, display, className }) => {
  if (!display) return null;
  return (
    <Grid item xs={12} className={className}>
      <Card className='app-card'>
        <CardContent className="dashboard-cardContent">
          {title &&
            <>
              <Typography variant="h5" component="h2" className="app-dashboard-title">{title}</Typography>
              <Divider />
            </>
          }
          {children}
        </CardContent>
      </Card>
    </Grid>
  );
};

const theme = createTheme({
  palette: {
    primary: {
      light: '#add8e6',
      main: '#007ab3',
      dark: '#00557d',
      contrastText: '#fff',
    },
    secondary: {
      light: '#ff7961',
      main: '#f44336',
      dark: '#ba000d',
      contrastText: '#000',
    },
  },
});

const usage = `Open any number of XML files from the IPM profiler or any previously parsed JSON files. Click the leftmost button to parse them into JSON format, enabling data visualization. Save the JSON files for future reference. Click the lock in the bottom left to keep the color assignment and position of the MPI calls consistent over multiple files.`;


const WelcomeScreen = () => (
  <div className="app-welcome-screen">
    <Typography variant="h3" component="h1">
      IPM visualizer
    </Typography>
    <Typography variant="body1" component="p">
      Parse and visualize HPC data profiled with the
      <Link href="https://github.com/nerscadmin/IPM" target="_blank" rel="noopener noreferrer" color='primary'>
        <span> IPM </span>
      </Link>
      profiler.
      <InfoBox title="Usage" text={usage} />
    </Typography>

    <Link href="https://github.com/Christoph-TU/IPM-visualizer" target="_blank" rel="noopener noreferrer" className="github-link">
      <GitHubIcon className="github-icon" /> GitHub Repository
    </Link>
  </div>
);

const ErrorMessages = ({ error }) => {
  if (!error) return <div className="app-welcome-screen">
    <Typography variant="h3" component="h1">
      Unsupported File
    </Typography>
    <Typography variant="body1" component="p">
      The file format is not supported.
    </Typography>
  </div>;
  console.log("Error in parser", error)
  return <div className="app-welcome-screen">
    <Typography variant="h3" component="h1">
      Error
    </Typography>
    <Typography variant="body1" component="p">
      An error has occurred while parsing the file. Please report this issue on the GitHub repository.
    </Typography>
    <pre style={{
      whiteSpace: 'pre-wrap',
      backgroundColor: '#f4f4f4',
      padding: '15px',
      borderRadius: '5px',
      color: '#d32f2f', // Red color for error text
      fontFamily: 'monospace',
      border: '1px solid #d32f2f',
      overflowX: 'auto',
    }}>
      <strong>Error Message:</strong> {error.message}
      <br />
      <strong>Stack Trace:</strong>
      <br />
      {error.stack.split('\n').map((line, index) => (
        <span key={index}>{line}<br /></span>
      ))}
      <br />
      {error.stack}
    </pre>
    <Link href="https://github.com/Christoph-TU/IPM-visualizer" target="_blank" rel="noopener noreferrer" className="github-link">
      <GitHubIcon className="github-icon" /> GitHub Repository
    </Link>
  </div >
}

export function App() {
  const { parsedDisplay, availableData } = useContext(AppStateContext);
  const { valid, comPie, comBalance, mpiData, hpmData, hosts, loadBalance, comTopology, bufferGraph, hpmChart } = availableData.value;
  return (
    <ThemeProvider theme={theme}>
      <StylesProvider injectFirst>
        <div class="App">
          <Sidebar />
          <div className='global-content'>
            <img alt="TU Logo" src={tuLogo} className='app-logo' />
            {parsedDisplay.value.file ? (
              <>{!valid && <ErrorMessages error={parsedDisplay.value.file?.error} />}
                <div className="dashboard-root ">
                  {valid && <RegionSelector />}
                  <Grid container spacing={2} direction="column" className='app-content-grid'>
                    <GridItem display={valid} title="Metadata"><Metadata /></GridItem>
                    <GridItem display={valid} title="Basic Statistics"><BasicTable /></GridItem>
                    <GridItem display={comPie} title="Time Spend"><ComPie /></GridItem>
                    <GridItem display={comBalance} title="Communication balance by task"><ComBalance /></GridItem>
                    <GridItem display={mpiData} title="All MPI Calls"><MpiDataTable /></GridItem>
                    <GridItem display={loadBalance} title="Load balance by task: memory, flops, timings"><BasicLineChart  type="performance"/></GridItem>
                    <GridItem display={hpmChart} title="HPM Counter Chart"><BasicLineChart type="hpmRegion" /></GridItem>
                    <GridItem display={hpmData} title="HPM Counter Statistics"><HpmDataTable /></GridItem>
                    <GridItem display={bufferGraph} title="Message Buffer Size Distributions"><MsgBufferDist /></GridItem>
                    <GridItem display={comTopology} title="Communication Topology : point to point data flow"><ComTopology /></GridItem>
                    <GridItem display={hosts} title="All Hosts"><HostsTable /></GridItem>
                  </Grid>
                </div>
              </>
            ) : <WelcomeScreen />}
          </div>
        </div>
      </StylesProvider>
    </ThemeProvider>
  );


}
