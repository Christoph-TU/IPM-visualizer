import { h, Fragment } from 'preact';
import { useSignal } from '@preact/signals';
import { useContext } from 'preact/hooks';
import { AppStateContext } from '/src/state/AppStateContext.js';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import HelpIcon from '@material-ui/icons/Help';
import Tooltip from '@material-ui/core/Tooltip';
import Switch from '@material-ui/core/Switch';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import TextField from '@material-ui/core/TextField';
import ReactTable from 'react-table';
import 'react-table/react-table.css';
import './MpiTables.css';

const labelMap = {
    wtime: "Wall Time",
    utime: "User Time",
    stime: "System Time",
    mtime: "MPI Time",
    gbyte: "Memory",
    gflop: "GFlop/s",
};

export function BasicTable() {
    const decimalPlaces = 4;
    const { parsedDisplay, region } = useContext(AppStateContext);
    const data = parsedDisplay.value.file.regions[region.value].performance;
    const tasks = parsedDisplay.value.file.metadata.ntasks;

    const tableData = Object.keys(data.totalValues).map(key => ({
        name: labelMap[key],
        total: data.totalValues[key].toFixed(decimalPlaces),
        avg: (data.totalValues[key] / tasks).toFixed(decimalPlaces),
        min: data.minValues[key].toFixed(decimalPlaces),
        max: data.maxValues[key].toFixed(decimalPlaces)
    }));

    tableData.splice(4, 0, {
        name: "%mpi/wall",
        avg: (100 * data.totalValues.mtime / data.totalValues.wtime).toFixed(2),
        min: (100 * data.minValues.mtime / data.minValues.mpiPercent).toFixed(2),
        max: (100 * data.maxValues.mtime / data.maxValues.mpiPercent).toFixed(2)
    });

    return (
        <div className="tableInfo">
            <ReactTable
                data={tableData}
                columns={[
                    { Header: 'Name', accessor: 'name', sortable: false, Cell: ({ value }) => <div className='mpiCall'>{value}</div> },
                    { Header: 'Total', accessor: 'total', sortable: false },
                    { Header: 'Avg', accessor: 'avg', sortable: false },
                    { Header: 'Min', accessor: 'min', sortable: false },
                    { Header: 'Max', accessor: 'max', sortable: false }
                ]}
                defaultPageSize={tableData.length}
                showPagination={false}
                className="-striped -highlight"
            />
        </div>
    );
}

export function MpiDataTable() {
    const decimalPlaces = 2;
    const { parsedDisplay, availableData, region } = useContext(AppStateContext);
    const { mpiData: valid, hashData } = availableData.value;
    const data = parsedDisplay.value.file.regions[region.value];
    const { summary } = data.mpiRegion;
    const hashTable = data.hashTable.entries;

    const useSummarized = useSignal(!hashData);
    const filtered = useSignal([]); // Signal to track filtering

    if (!useSummarized.value && !hashData) useSummarized.value = true;
    if (!valid || (!hashData && !summary)) return null;

    const commonColumns = [
        { Header: 'Call', accessor: 'call', Cell: ({ value }) => <div className='mpiCall'>{value}</div> },
        { Header: 'accurateBuffer', accessor: 'accurateBuffer', show: false },
        {
            Header: 'Bytes', accessor: 'bytes',
            Cell: ({ row }) => (
                <div>
                    {row.bytes}
                    {row.accurateBuffer ?
                        <Tooltip title="The byte amount should be accurate">
                            <CheckCircleIcon className="buffInfoIcon correct" />
                        </Tooltip> :
                        <Tooltip title="The byte amount may not be accurate, since IPM is only expected to collect correct message sizes for MPI send and MPI collective functions">
                            <HelpIcon className="buffInfoIcon question" />
                        </Tooltip>
                    }
                </div>
            )
        },
        { Header: '# Calls', accessor: 'count' },
        {
            Header: 'Total Time',
            accessor: 'ttot',
            Cell: ({ value }) => <div>{value.toFixed(decimalPlaces)}</div>
        },
        { Header: 'Avg Time', accessor: 'avg', Cell: ({ value }) => <div>{value.toExponential(decimalPlaces)}</div> },
    ];

    const percentColumns = [
        {
            Header: '%MPI',
            accessor: d => ((d.ttot / data.performance.totalValues.mtime) * 100),
            id: 'percentMpi',
            Cell: ({ value }) => <div>{value.toFixed(decimalPlaces)}</div>
        },
        {
            Header: '%Wall',
            accessor: d => ((d.ttot / data.performance.totalValues.wtime) * 100),
            id: 'percentWall',
            Cell: ({ value }) => <div>{value.toFixed(decimalPlaces)}</div>
        }
    ];

    const extraColumns = [
        {
            Header: 'Min Time',
            accessor: 'tmin',
            Cell: ({ value }) => <div>{value.toExponential(decimalPlaces)}</div>
        },
        {
            Header: 'Max Time',
            accessor: 'tmax',
            Cell: ({ value }) => <div>{value.toExponential(decimalPlaces)}</div>
        },
    ];

    const tableData = useSummarized.value ? summary : hashTable;
    const tableColumns = useSummarized.value
        ? [...commonColumns, ...percentColumns]
        : [...commonColumns, ...extraColumns, ...percentColumns];

    const handleFilterChange = (e) => {
        const value = e.target.value;
        if (!value) {
            filtered.value = [];
        } else {
            filtered.value = [{ id: 'call', value }];
        }
    };

    return (
        <div className="tableInfo">
            <div>
                <ReactTable
                    data={tableData}
                    columns={tableColumns}
                    filtered={filtered.value}
                    onFilteredChange={(newFiltered) => {
                        filtered.value = newFiltered;
                    }}
                    pageSizeOptions={[2, 5, 10, 20, 25, 50, 100]}
                    defaultPageSize={10}
                    className="-striped -highlight"
                />
            </div>
            <div className='mpiTables-button-container'>
                <div className="filter-container">
                    <TextField
                        id="callFilter"
                        label="Filter by Call Name"
                        variant="outlined"
                        size="small"
                        onInput={handleFilterChange}
                        placeholder="Enter call name"
                        className="call-filter-input"
                    />
                </div>
                <FormControlLabel
                    control={
                        <Switch
                            disabled={!hashData}
                            checked={useSummarized.value}
                            onChange={() => { useSummarized.value = !useSummarized.value }}
                            color="primary"
                        />
                    }
                    label="Summarized MPI Calls"
                />
            </div>
        </div>
    );
}

export function HpmDataTable() {
    const { parsedDisplay, availableData, region } = useContext(AppStateContext);
    const { hpmData: valid } = availableData.value;
    const data = parsedDisplay.value.file.regions[region.value].hpmRegion.statistic;

    if (!valid) {
        return null;
    }
    return <div className="tableInfo">
        <ReactTable
            data={data}
            columns={[
                { Header: 'Event', accessor: 'name', Cell: ({ value }) => <div className='mpiCall'>{value}</div> },
                { Header: 'Total Count', accessor: 'counter' },
                { Header: 'Avg', accessor: d => (d.counter / d.ncalls).toFixed(2), id: 'avg' },
                { Header: 'minProc', accessor: 'minProc', show: false },
                {
                    Header: 'Min', accessor: 'min',
                    Cell: ({ row }) => <div>{row.min} ({row.minProc})</div>
                },
                { Header: 'maxProc', accessor: 'maxProc', show: false },
                {
                    Header: 'Max', accessor: 'max',
                    Cell: ({ row }) => <div>{row.max} ({row.maxProc})</div>
                }
            ]}
            pageSizeOptions={[2, 5, 10, 20, 25, 50, 100]}
            defaultPageSize={10}
            className="-striped -highlight"
        />
    </div>
}

export function HostsTable() {
    const { parsedDisplay, availableData } = useContext(AppStateContext);
    const { hosts: valid } = availableData.value;
    const data = parsedDisplay.value.file.hosts;

    if (!valid) {
        return null;
    }
    return <div className="tableInfoHosts">
        <ReactTable
            data={data}
            columns={[
                { Header: 'Name', accessor: 'name' },
                { Header: 'Mach Name', accessor: 'mach_name' },
                { Header: 'Mach Info', accessor: 'mach_info' },
                { Header: 'Tasks', id: 'tasks', accessor: d => d.tasks.join(', '), minWidth: 350 }
            ]}
            pageSizeOptions={[2, 5, 10, 20, 25, 50, 100]}
            defaultPageSize={10}
            className="-striped -highlight"
        />
    </div>
}