import { h, Fragment } from 'preact';
import { useContext, useRef, useEffect } from 'preact/hooks';
import { useSignal } from '@preact/signals';
import { AppStateContext } from '/src/state/AppStateContext.js';
import { Log2Axis } from '/src/utils/Log2Axis.js';
import {
    Chart as ChartJS,
    ArcElement,
    BarElement,
    CategoryScale,
    LinearScale,
    Title,
    Tooltip,
    Legend,
    PointElement,
    LineElement,
} from 'chart.js';
ChartJS.register(
    ArcElement,
    BarElement,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

const textLabels = {
    1024: '1KB',
    2048: '2KB',
    4096: '4KB',
    8192: '8KB',
    16384: '16KB',
    32768: '32KB',
    65536: '64KB',
    131072: '128KB',
    262144: '256KB',
    524288: '512KB',
    1048576: '1MB',
    2097152: '2MB',
    4194304: '4MB',
    8388608: '8MB',
    16777216: '16MB',
    33554432: '32MB',
    67108864: '64MB',
    268435456: '128MB',
    536870912: '256MB',
    1073741824: '512MB'
};

const DataType = {
    COUNT: 'count',
    TIME: 'time',
};

const AccessType = {
    CUM_PER: 'cumPer',
    CUM: 'cum',
    VALUE: 'value',
};

export function MsgBufferDist() {
    const { parsedDisplay, availableData, region } = useContext(AppStateContext);
    const { bufferGraph: valid } = availableData.value;

    const dataType = useSignal(DataType.TIME);
    const accessType = useSignal(AccessType.CUM_PER);

    const chartRef = useRef(null); // Create a reference for the canvas element
    let chartInstance = useRef(null); // Store chart instance to avoid re-creating the chart

    const chartData = parsedDisplay.value.file.regions[region.value].bufferGraph;

    // Dynamically construct the yAxisKey based on the signals
    const yAxisKey = `${dataType.value}.${accessType.value}`;
    const yScale = accessType.value === 'value' ? 'logarithmic' : 'linear';
    const name = dataType.value === 'count' ? 'Calls' : 'Time (ttot)';

    let yLabel = '';
    switch (accessType.value) {
        case 'cumPer':
            yLabel = 'Cumulative %';
            break;
        case 'cum':
            yLabel = 'Cumulative';
            break;
    }
    yLabel = `${yLabel} ${name}`;

    useEffect(() => {
        if (chartInstance.current) {
            chartInstance.current.destroy();
        }

        const ctx = chartRef.current.getContext('2d');
        chartInstance.current = new ChartJS(ctx, {
            type: 'line', // Use the line chart
            data: chartData,
            options: {
                scales: {
                    x: {
                        position: 'bottom',
                        title: {
                            display: true,
                            text: 'Buffer size (bytes)'
                        },
                        ticks: {
                            callback: function (value, index, ticks) {
                                return textLabels[value] || value;
                            }
                        },
                        type: 'log2',
                    },
                    y: {
                        type: yScale,
                        title: {
                            display: true,
                            text: yLabel
                        }
                    }
                },
                parsing: {
                    yAxisKey,
                },
                animation: false,
            }
        });
    }, [parsedDisplay.value, dataType.value, accessType.value, region.value]);

    if (!valid) {
        return null;
    }

    const TopLabel = ({ type, currentType, name }) => {
        return (
            <label>
                <input
                    type="radio"
                    checked={type === currentType.value}
                    onChange={() => { currentType.value = type; }}
                />
                {name}
            </label>
        );
    };

    return (
        <>
            <canvas className='canvas' ref={chartRef}></canvas> {/* Replace Line with canvas */}
            <div className="controls">
                <div className="control-group">
                    <legend>Data Type</legend>
                    <div className="radio-group">
                        <TopLabel currentType={dataType} type={DataType.TIME} name="Time" />
                        <TopLabel currentType={dataType} type={DataType.COUNT} name="Calls" />
                    </div>
                </div>
                <div className="control-group">
                    <legend>Display as</legend>
                    <div className="radio-group">
                        <TopLabel currentType={accessType} type={AccessType.CUM_PER} name="Cumulative %" />
                        <TopLabel currentType={accessType} type={AccessType.CUM} name="Cumulative" />
                        <TopLabel currentType={accessType} type={AccessType.VALUE} name="Value" />
                    </div>
                </div>
            </div>
        </>
    );
}
