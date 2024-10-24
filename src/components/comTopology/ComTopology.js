import { h, Fragment } from 'preact';
import { useEffect, useRef, useContext } from 'preact/hooks';
import { AppStateContext } from '/src/state/AppStateContext.js';
import { useSignal, useSignalEffect } from '@preact/signals';
import Switch from '@material-ui/core/Switch';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import { InfoBox } from '/src/components/infoBox/InfoBox';
import './ComTopology.css';
import * as d3 from 'd3';

const CommunicationType = {
    SEND: 0,
    RECEIVE: 1,
    TOTAL: 2
}

const ComTopology = () => {
    const { parsedDisplay, region } = useContext(AppStateContext);
    const topology = parsedDisplay.value.file.regions[region.value].topology;
    const totalRanks = parsedDisplay.value.file.metadata.ntasks;
    const svgRef = useRef(null);

    const comType = useSignal(CommunicationType.TOTAL);
    const useColor = useSignal(true);

    const getMaxValue = () => {
        let maxValue = null;
        switch (comType.value) {
            case CommunicationType.SEND:
                maxValue = topology.maxBytesSend;
                break;
            case CommunicationType.RECEIVE:
                maxValue = topology.maxBytesReceived;
                break;
            case CommunicationType.TOTAL:
                maxValue = topology.maxTotalBytesComm;
                break;
        }
        return maxValue;
    };

    useEffect(() => {
        renderTopology();
    }, [parsedDisplay.value, region.value]);

    useSignalEffect(() => {
        renderTopology();
    }, [comType]);

    const renderTopology = () => {
        const container = svgRef.current.parentElement;
        const margin = { top: 20, right: 20, bottom: 40, left: 40 };
        const legendSpace = 200;
        const width = container.clientWidth - 100 - legendSpace;
        const activeData = topology.entries;
        const size = (width - margin.left - margin.right) / totalRanks;
        const height = totalRanks * size + margin.top + margin.bottom;

        const maxValue = getMaxValue();

        // Set up the SVG
        const svg = d3.select(svgRef.current)
            .attr("width", width + legendSpace)
            .attr("height", height)
            .attr("viewBox", [0, 0, width, height])
            .style("cursor", "move")
            .attr("style", "max-width: 100%; height: auto;");

        svg.selectAll("*").remove();  // Clear previous content

        const xScale = d3.scaleLinear()
            .domain([0, totalRanks])
            .range([0, width - margin.left - margin.right]);

        const yScale = d3.scaleLinear()
            .domain([0, totalRanks])
            .range([height - margin.top - margin.bottom, 0]);

        const interpolate = useColor.value ? d3.interpolateTurbo : d3.interpolateGreys;
        const colorScale = d3.scaleSequential(interpolate).domain([0, maxValue]);

        const zoom = d3.zoom()
            .scaleExtent([1, 20])
            .on("zoom", (event) => {
                const transform = event.transform;
                const { x, y, k } = transform;

                const viewWidth = width - margin.left - margin.right;
                const viewHeight = height - margin.top - margin.bottom;

                const xMin = (k > 1) ? -(viewWidth * (k - 1)) : margin.left;
                const xMax = (k > 1) ? margin.right : 0;
                const yMin = (k > 1) ? -(viewHeight * (k - 1)) : margin.top;
                const yMax = (k > 1) ? margin.bottom : 0;

                transform.x = Math.max(xMin, Math.min(x, xMax));
                transform.y = Math.max(yMin, Math.min(y, yMax));

                g.attr("transform", transform);
            });

        const g = svg.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        let dataIndex = null;
        switch (comType.value) {
            case CommunicationType.SEND:
                dataIndex = 'sv';
                break;
            case CommunicationType.RECEIVE:
                dataIndex = 'rv';
                break;
            case CommunicationType.TOTAL:
                dataIndex = 'tv';
                break;
        }
        let filteredData = activeData.filter(d => d[dataIndex] !== 0);

        g.selectAll("rect")
            .data(filteredData)
            .enter().append("rect")
            .attr("x", d => xScale(d.x))
            .attr("y", d => yScale(d.y + 1))
            .attr("width", size)
            .attr("height", size)
            .attr("fill", d => colorScale(d[dataIndex]))
            .append("title")
            .text(d => `X: ${d.x}, Y: ${d.y} Median v: ${d[dataIndex] / 1024 / 1024}MB`);


        g.append("g")
            .attr("transform", `translate(0,${height - margin.bottom - margin.top})`)
            .call(d3.axisBottom(xScale));

        g.append("g").call(d3.axisLeft(yScale));

        svg.call(zoom);

        // vertical color legend
        const legendHeight = height - margin.bottom - margin.top;
        const legendWidth = 20;

        const legend = svg.append("g")
            .attr("class", "legend")
            .attr("transform", `translate(${width - margin.right + legendWidth},${margin.top})`);

        // Create a vertical gradient for the legend
        const defs = svg.append("defs");
        const linearGradient = defs.append("linearGradient")
            .attr("id", "linear-gradient")
            .attr("x1", "0%").attr("y1", "100%") // Start at the bottom
            .attr("x2", "0%").attr("y2", "0%"); // End at the top

        // Define the gradient stops using the colorScale
        linearGradient.selectAll("stop")
            .data(d3.range(0, 1, 1 / 20))
            .enter().append("stop")
            .attr("offset", d => `${d * 100}%`)
            .attr("stop-color", d => colorScale(d * maxValue));

        // Append the color bar to the legend
        legend.append("rect")
            .attr("width", legendWidth)
            .attr("height", legendHeight)
            .style("fill", "url(#linear-gradient)");

        // Create a scale for the legend
        const legendScale = d3.scaleLinear([0, maxValue], [legendHeight, 0])

        // Generate an array of ticks manually
        const tickCount = 10;

        legend.append("g")
            .attr("transform", `translate(${legendWidth}, 0)`)
            .call(d3.axisRight(legendScale)
                .tickValues(d3.range(0, tickCount).map(i => (i / (tickCount - 1)) * maxValue))
                .tickFormat(d => `${(d / 1024 / 1024).toFixed(3)}MB`)  // Format ticks to MB
            );
    }

    const infoDialog = `The topology only reflects directional communication and does not account for collective communication.`;

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
            <div className="svg-container">
                <svg ref={svgRef}></svg>
            </div>
            <div className="controls">
                <div className="control-group">
                    <legend>Direction</legend>
                    <div className="radio-group">
                        <TopLabel currentType={comType} type={CommunicationType.SEND} name="Send" />
                        <TopLabel currentType={comType} type={CommunicationType.RECEIVE} name="Receive" />
                        <TopLabel currentType={comType} type={CommunicationType.TOTAL} name="Total" />
                    </div>
                </div>
                <FormControlLabel
                    control={
                        <Switch
                            checked={useColor.value}
                            onChange={() => useColor.value = !useColor.value}
                            color="primary"
                        />
                    }
                    label="Use Color"
                />
                <InfoBox title="Warning" text={infoDialog} />
            </div>
        </>
    );
};

export default ComTopology;
