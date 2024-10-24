import { h, Fragment } from 'preact';
import { useContext, useRef, useEffect } from 'preact/hooks';
import Button from '@material-ui/core/Button';
import Switch from '@material-ui/core/Switch';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import ButtonGroup from '@material-ui/core/ButtonGroup';
import TextField from '@material-ui/core/TextField';
import { InfoBox } from '/src/components/infoBox/InfoBox';
import zoomPlugin from 'chartjs-plugin-zoom';
import {
    Chart as ChartJS,
    ArcElement,
    BarElement,
    CategoryScale,
    LinearScale,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js/auto';
ChartJS.register(
    ArcElement,
    BarElement,
    CategoryScale,
    LinearScale,
    Filler,
    Title,
    Tooltip,
    Legend,
    zoomPlugin
);
import { AppStateContext } from '/src/state/AppStateContext.js';
import { useSignal } from '@preact/signals';
import LockIcon from '@material-ui/icons/Lock';
import LockOpenIcon from '@material-ui/icons/LockOpen';
import './ComBalance.css';

export function ComBalance() {
    const { availableData, parsedDisplay, region } = useContext(AppStateContext);
    const { comBalance: valid } = availableData.value;
    const chartRef = useRef(null);
    const chartInstanceRef = useRef(null);
    const useSorted = useSignal(false);
    const yScaleValue = useSignal(undefined);
    const yScaleLocked = useSignal(false);
    var chartType = "bar";
    var bigChart = false;
    const bigChartThreshold = 256;

    // Create chart instance
    const createChart = () => {
        const dataSorted = parsedDisplay.value.file.regions[region.value].balanceDataSorted;
        const data = parsedDisplay.value.file.regions[region.value].balanceData;

        const ctx = chartRef.current?.getContext('2d');
        if (!ctx) return; // Ensure the context is available

        const chartData = useSorted.value ? dataSorted : data;

        chartType = "bar"
        if (chartData.labels.length >= bigChartThreshold) {
            bigChart = true;
            chartType = "line";
        }
        const options = {
            scales: {
                x: {
                    stacked: true,
                    title: {
                        display: true,
                        text: useSorted.value ? 'sorted ranks' : 'ranks'
                    }
                },
                y: {
                    stacked: true,
                    max: yScaleLocked.value ? parseFloat(yScaleValue.value) : undefined,
                    min: 0,
                    title: {
                        display: true,
                        text: 'time in seconds'
                    }
                }
            },
            plugins: {
                zoom: {
                    pan: {
                        enabled: true,
                        mode: 'x',
                        modifierKey: 'ctrl',
                    },
                    zoom: {
                        drag: {
                            enabled: true
                        },
                        mode: 'x',
                        onZoom: function ({ chart }) {
                            const scale = chart.scales.x;
                            /* HACK.1.1: If the scale is less than 256, switch to line chart
                             This currently renders the bar chart in an offset if zoomed in from a line chart
                             What should be happening is to destroy the chart and recreate it with the new type 
                             But getting this to work with the zoom plugin is a bit tricky
                             If fixed also edit HACK.1.2*/
                            if (scale && (scale.max - scale.min) <= bigChartThreshold && chartType == "line") {
                                chartType = "bar";
                                chart.config.type = "bar";
                                chart.stop(); // make sure animations are not running
                                chart.update('none');
                            }
                        }
                    },
                },
            },
            categoryPercentage: 1.0,
            barPercentage: 1.0,
            animation: false,
        };

        if (chartInstanceRef.current) {
            chartInstanceRef.current.destroy(); // Destroy the previous chart instance if it exists
        }
        chartInstanceRef.current = new ChartJS(ctx, {
            type: chartType,
            data: chartData,
            options,
        });
    };

    // Use effect for initialization. Info: This could be done with useSignalEffect but useSignalEffect is not working when the page is run entirely local
    useEffect(() => {
        createChart();
        return () => {
            if (chartInstanceRef.current) {
                chartInstanceRef.current.destroy(); // Cleanup chart on component unmount
            }
        };
    }, [parsedDisplay.value, useSorted.value, yScaleValue.value, yScaleLocked.value, region.value]);

    const resetZoom = () => {
        //HACK.1.2: Revert to line if it was changed to bar during zoom, See HACK.1.1
        if (bigChart && chartType == "bar") {
            chartType = "line";
            chartInstanceRef.current.config.type = "line";
            chartInstanceRef.current.stop(); // make sure animations are not running
            chartInstanceRef.current.update('none');
        }
        chartInstanceRef.current.resetZoom();
    };

    const switchData = () => {
        useSorted.value = !useSorted.value;
    };

    const toggleLockedYScale = () => {
        if (yScaleValue.value !== undefined && yScaleValue.value > 0) {
            yScaleLocked.value = !yScaleLocked.value;
        }
    };

    const infoDialog = `Drag to zoom. Ctrl + drag to pan. Use "Reset Zoom" to reset. Enter a value in "Y Scale" and click the lock to set Y-Axis.`;

    if (!valid) {
        return null;
    }

    return (
        <>
            <canvas className='canvas' ref={chartRef}></canvas>
            <div className='comBalance-button-container'>
                <ButtonGroup>
                    <TextField
                        InputLabelProps={{
                            shrink: true,
                        }}
                        label="Y Scale"
                        type="number"
                        value={yScaleValue.value}
                        className='comBalance-yScale-input'
                        size='small'
                        disabled={yScaleLocked.value}
                        onInput={(e) => yScaleValue.value = e.target.value} />
                    <Button onClick={toggleLockedYScale} variant="contained" color="primary">
                        {yScaleLocked.value ? <LockIcon /> : <LockOpenIcon />}
                    </Button>
                </ButtonGroup>
                <Button onClick={resetZoom} variant="contained" color="primary">
                    Reset Zoom
                </Button>
                <FormControlLabel
                    control={
                        <Switch
                            checked={useSorted.value}
                            onChange={switchData}
                            color="primary"
                        />
                    }
                    label="Sorted Data"
                />
                <InfoBox title="Controls Explanation" text={infoDialog} />
            </div>
        </>
    );
}
