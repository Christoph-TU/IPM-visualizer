import { h } from 'preact';
import { useContext, useEffect, useRef } from 'preact/hooks';
import { AppStateContext } from '/src/state/AppStateContext.js';
import { Chart as ChartJS, ArcElement, BarElement, CategoryScale, LinearScale, Title, Tooltip, Legend } from 'chart.js';
import './ComPie.css';

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Title, Tooltip, Legend);

export function ComPie() {
    const { parsedDisplay, availableData, region } = useContext(AppStateContext);
    const chartRefWall = useRef(null);
    const chartRefPercent = useRef(null);
    const chartInstanceWall = useRef(null);
    const chartInstancePercent = useRef(null);

    const initializePieChart = (chartRef, chartInstance, data) => {
        if (!chartInstance.current && chartRef.current) {
            chartInstance.current = new ChartJS(chartRef.current, {
                type: 'pie',
                data,
                options: {
                    responsive: true,
                    aspectRatio: 2,
                    plugins: {
                        legend: {
                            position: 'right',
                        },
                    },
                },
            });
        } else if (chartInstance.current) {
            chartInstance.current.data = { ...data };
            chartInstance.current.update();
        }
    };

    const initializeBarChart = (chartRef, chartInstance, data) => {
        if (!chartInstance.current && chartRef.current) {
            chartInstance.current = new ChartJS(chartRef.current, {
                type: 'bar',
                data,
                options: {
                    responsive: true,
                    aspectRatio: 2,
                    indexAxis: 'y', // Horizontal bar chart
                    scales: {
                        x: {
                            beginAtZero: true,
                            max: 100,
                            stacked: true // Enable stacking for x-axis
                        },
                        y: {
                            stacked: true // Enable stacking for y-axis
                        }
                    },
                    plugins: {
                        legend: {
                            position: 'top',
                        },
                    },
                },
            });
        } else if (chartInstance.current) {
            chartInstance.current.data = { ...data };
            chartInstance.current.update();
        }
    };

    const updateCharts = () => {
        const mpiWall = parsedDisplay.value.file.regions[region.value].mpiPies.mpiWall;
        const mpiPercent = parsedDisplay.value.file.regions[region.value].mpiPies.mpiPercent;

        initializeBarChart(chartRefWall, chartInstanceWall, mpiWall);

        initializePieChart(chartRefPercent, chartInstancePercent, mpiPercent);
    };

    useEffect(() => {
        updateCharts();
    }, [parsedDisplay.value, region.value]);

    if (!availableData.value.comPie) {
        return null;
    }

    return (
        <div className="compie-container">
            <div className="compie-element">
                <h3>Breakdown of Time Usage in %</h3>
                <canvas ref={chartRefWall} />
            </div>
            <div className="compie-element">
                <h3>Summarized MPI Time in %</h3>
                <canvas ref={chartRefPercent} />
            </div>
        </div>
    );
}
