import { h, Fragment } from 'preact';
import { useContext, useEffect, useRef } from 'preact/hooks';
import { AppStateContext } from '/src/state/AppStateContext.js';
import { Chart as ChartJS, ArcElement, BarElement, CategoryScale, LinearScale, Title, Tooltip, Legend, PointElement, LineElement } from 'chart.js';
import { useSignal } from '@preact/signals';
import Switch from '@material-ui/core/Switch';
import FormControlLabel from '@material-ui/core/FormControlLabel';

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export function BasicLineChart({ type }) {
    if (!type) {
        return null;
    }

    const { parsedDisplay, availableData, region } = useContext(AppStateContext);
    const chartRef = useRef(null);
    const chartInstance = useRef(null);
    const sorted = useSignal(true);

    const getChartData = () => {
        if(options){
            options.scales.x.title.text = sorted.value ? '' : 'MPI Ranks';
        }
        return sorted.value
            ? parsedDisplay.value.file.regions[region.value][type].sortedChartData
            : parsedDisplay.value.file.regions[region.value][type].unsortedChartData;
    }

    const xLabel = sorted.value ? '' : 'MPI Ranks';

    const options = {
        responsive: true,
        animation: false,
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    callback: function (value) {
                        return `${(value * 100).toFixed(0)} %`; // Convert to percentage and round off
                    },
                },
                title: {
                    display: true,
                    text: '% of Maximum across MPI ranks', // Y-axis label
                },
            },
            x: {
                title: {
                    display: true,
                    text: xLabel, // X-axis label
                },
            },
        },
    };

    const initializeChart = (chartRef, chartInstance, data) => {
        if (chartRef.current && !chartInstance.current) {
            // Create a new chart instance
            chartInstance.current = new ChartJS(chartRef.current, {
                type: 'line',
                data,
                options,
            });
        } else if (chartInstance.current) {
            // Update the data only
            chartInstance.current.data.datasets = data.datasets;
            chartInstance.current.update();
        }
    };

    const destroyAndRecreateChart = (chartRef, chartInstance, data) => {
        if (chartInstance.current) {
            chartInstance.current.destroy(); // Destroy the existing chart instance
            chartInstance.current = null;
        }
        initializeChart(chartRef, chartInstance, data); // Recreate the chart
    };

    const updateChartData = () => {
        const chartData = getChartData();
        if (chartInstance.current) {
            // Replace the entire dataset object to ensure proper update
            chartInstance.current.data = {
                ...chartInstance.current.data,
                datasets: chartData.datasets,
            };
            chartInstance.current.update();
        }
    };

    useEffect(() => {
        // On parsedDisplay change, destroy and recreate the chart
        destroyAndRecreateChart(chartRef, chartInstance, getChartData());
    }, [parsedDisplay.value]);

    useEffect(() => {
        updateChartData();
    }, [sorted.value, region.value]);

    if (!availableData.value.loadBalance) {
        return null;
    }

    return (
        <>
            <canvas ref={chartRef} />
            <div className="controls">
                <FormControlLabel
                    control={
                        <Switch
                            checked={sorted.value}
                            onChange={() => sorted.value = !sorted.value}
                            color="primary"
                        />
                    }
                    label="Sorted Data"
                />
            </div>
        </>
    );
}
