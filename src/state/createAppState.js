import { signal, computed, effect } from "@preact/signals";
import { colorBarChart, colorPieChart, clearAssignedColors, colorBufLineChart, colorHpmChart, colorPerformanceChart, colorTimeBarChart } from '/src/utils/colorData';
import { sortBarChartData, sortPieChartData } from '/src/utils/reorderData';
import ParserWorker from '/src/worker/parserWorker.js';
import { parseData } from '/src/utils/parser';

export function createAppState() {
  const allFiles = signal([]);
  const parsedDisplay = signal({ file: '' });
  const lockColorAndOrder = signal(false);
  let workerRef = null;
  let lastLockColorAndOrder = false;
  const region = signal(0);
  let openIndex = 1;
  const sortedCalls = new Set();
  let sortedCallsArray = [];

  const onmessage = (e) => {
    const { parsedData, index, name } = e.data;

    let matchingIndex = allFiles.value[index].name === name && !allFiles.value[index].parsed
      ? index
      : allFiles.value.findIndex(file => file.name === name && !file.parsed);

    if (matchingIndex !== -1) {
      allFiles.value[matchingIndex].parsed = true;
      allFiles.value[matchingIndex].file = parsedData;
      allFiles.value[matchingIndex].displayName = parsedData.id.filename;
      allFiles.value[matchingIndex].date = parsedData.id.startDate;
      allFiles.value[matchingIndex].parsing = false;
      parsedDisplay.value = allFiles.value[matchingIndex];
    } else {
      console.log('No matching name found for parsed data:', parsedData);
    }
  };

  const mockWorker = {
    postMessage: (data) => {
      const { file, index, name } = data;
      parseData(file, (parsedData) => {
        onmessage({ data: { parsedData, index, name } });
      });
    },
  }

  try {
    workerRef = new ParserWorker();
    workerRef.onmessage = onmessage;
  } catch (e) {
    workerRef = mockWorker;
    console.log("Could not use web worker for parsing, using main thread instead");
  }

  const parseFile = (index) => {
    if (allFiles.value[index].parsing) return;
    allFiles.value[index].parsing = true;
    allFiles.value = [...allFiles.value];
    const file = allFiles.value[index].file;
    const name = allFiles.value[index].name;
    workerRef.postMessage({ file, index, name });
  };

  const availableData = computed(() => {
    const valid = parsedDisplay.value.file.valid;
    const reg = region.value;
    return {
      valid: valid,
      comPie: valid && parsedDisplay.value.file.regions[reg].mpiPies,
      comBalance: valid && parsedDisplay.value.file.regions[reg].balanceData,
      mpiData: valid && parsedDisplay.value.file.regions[reg].mpiRegion.summary,
      hosts: valid && parsedDisplay.value.file.hosts,
      loadBalance: valid && parsedDisplay.value.file.regions[reg].performance.sortedChartData, //&& unsortedChartData
      hpmChart: valid && parsedDisplay.value.file.regions[reg].hpmRegion.sortedChartData, //&& unsortedChartData
      hpmData: valid && parsedDisplay.value.file.regions[reg].hpmRegion.valid,
      comTopology: valid && parsedDisplay.value.file.regions[reg].topology.valid,
      hashData: valid && parsedDisplay.value.file.regions[reg].hashTable.valid,
      bufferGraph: valid && parsedDisplay.value.file.regions[reg].bufferGraph,
    };
  });

  effect(() => {
    if (parsedDisplay.value.file === '' || !parsedDisplay.value.file.valid) {
      document.title = "IPM-visualizer";
      return;
    }

    document.title = parsedDisplay.value.displayName + " - IPM-visualizer";

    if (region.value >= parsedDisplay.value.file.regions.length) {
      region.value = 0;
    }

    const regVal = region.value;

    if (!lockColorAndOrder.value && lastLockColorAndOrder) {
      // This needs to happen otherwise the component will not re-render
      parsedDisplay.value = { ...parsedDisplay.value, openIndex: undefined };
      for (let index in allFiles.peek()) {
        allFiles.peek()[index].openIndex = undefined;
        // Keep all files consistent with the current file
        if (allFiles.peek()[index].file == parsedDisplay.value.file) {
          allFiles.peek()[index] = parsedDisplay.value;
        }
      }
      openIndex = 1;
    }
    lastLockColorAndOrder = lockColorAndOrder.value;

    if (!lockColorAndOrder.value) {
      sortedCalls.clear();
      sortedCallsArray = [];
      clearAssignedColors();
    } else if (!parsedDisplay.value.openIndex) {
      parsedDisplay.value.openIndex = openIndex++;
    }

    // Order global call order based on current file order
    if (parsedDisplay.value.file.regions) {
      for (let call of parsedDisplay.value.file.regions[regVal].mpiRegion.summary) {
        sortedCalls.add(call.call);
      }
      sortedCallsArray = [...sortedCalls];
    }

    //always color pie chart first
    if (availableData.value.comPie) {
      //always sort before coloring
      sortPieChartData(parsedDisplay.value.file.regions[regVal].mpiPies.mpiPercent, sortedCallsArray);

      colorPieChart(parsedDisplay.value.file.regions[regVal].mpiPies.mpiPercent);
      colorTimeBarChart(parsedDisplay.value.file.regions[regVal].mpiPies.mpiWall);
    }

    if (availableData.value.comBalance) {
      //always sort before coloring
      sortBarChartData(parsedDisplay.value.file.regions[regVal].balanceData.datasets, sortedCallsArray);
      sortBarChartData(parsedDisplay.value.file.regions[regVal].balanceDataSorted.datasets, sortedCallsArray);

      colorBarChart(parsedDisplay.value.file.regions[regVal].balanceData);
      colorBarChart(parsedDisplay.value.file.regions[regVal].balanceDataSorted);
    }

    if (availableData.value.bufferGraph) {
      colorBufLineChart(parsedDisplay.value.file.regions[regVal].bufferGraph);
      sortBarChartData(parsedDisplay.value.file.regions[regVal].bufferGraph.datasets, sortedCallsArray);
    }

    if (availableData.value.loadBalance) {
      colorPerformanceChart(parsedDisplay.value.file.regions[regVal].performance.sortedChartData);
      colorPerformanceChart(parsedDisplay.value.file.regions[regVal].performance.unsortedChartData);
    }

    if (availableData.value.hpmChart) {
      colorHpmChart(parsedDisplay.value.file.regions[regVal].hpmRegion.sortedChartData);
      colorHpmChart(parsedDisplay.value.file.regions[regVal].hpmRegion.unsortedChartData);
    }
  });

  return {
    region,
    allFiles,
    parsedDisplay,
    availableData,
    lockColorAndOrder,
    parseFile,
  };
}
