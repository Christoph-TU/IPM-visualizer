import { Parser } from 'saxen';
import ipm_key_mpi_raw from '/src/keyfiles/ipm_key_mpi.json'

//preload the keyfiles for the parser
function processJSONData(jsonData) {
  const processedData = {};
  for (const key in jsonData) {
    processedData[key] = new Set(jsonData[key])
  }
  return processedData;
}
const ipm_key_mpi = processJSONData(ipm_key_mpi_raw);
const labelMap = {
  wtime: "Wall Time",
  utime: "User Time",
  stime: "System Time",
  mtime: "MPI Time",
  gbyte: "Memory",
  gflop: "GFlop/s"
};
const generateBalanceChartData = (mpiRegion) => {
  let balanceData = {
    labels: mpiRegion.entries.map(task => task.nr),
    datasets: []
  };
  for (let mpiCall of mpiRegion.summary) {
    try {
      let dataset = mpiRegion.entries.map(task => (
        task.mpiCalls[mpiCall.call]?.ttot || 0
      ));
      balanceData.datasets.push({
        label: mpiCall.call,
        fill: false,
        data: dataset
      });
    } catch (e) {
      console.log('Could not generate Balance Chart:', e);
    }
  }

  return balanceData;
};

const parseHpmEntries = (entriesObject, statisticObject) => {
  const result = {};

  const entries = Object.entries(entriesObject);

  entries.forEach(([key, value]) => {
    result[key] = {};
    const maxValue = statisticObject[key]?.max || 1;

    value.forEach((entry, index) => {
      value[index] = entry / maxValue;
    });

    result[key].data = value;
    result[key].sorted = value.slice().sort((a, b) => a - b);
  });

  const unsortedDatasets = Object.keys(result).map(key => ({
    label: key,
    data: result[key].data,
    pointRadius: 0
  }));

  const sortedDatasets = Object.keys(result).map(key => ({
    label: key,
    data: result[key].sorted,
    pointRadius: 0
  }));

  const labels = entries[0][1].map((_, index) => index + 1);

  return {
    unsortedChartData: {
      labels,
      datasets: unsortedDatasets
    },
    sortedChartData: {
      labels,
      datasets: sortedDatasets
    }
  };
};


const generateLineChartData = (performance) => {
  const { maxValues, entries } = performance;
  const labels = entries.map(task => task.nr);

  // Initialize chart data for unsorted and sorted datasets
  const unsortedChartData = {
    labels: labels,
    datasets: []
  };

  const sortedChartData = {
    labels: labels,
    datasets: []
  };

  Object.keys(maxValues).forEach(taskKey => {
    if (taskKey === 'mpiPercent') return;

    let unsortedDataset = entries.map(task => maxValues[taskKey] === 0 ? 0 : task[taskKey] / maxValues[taskKey]);
    let sortedDataset = unsortedDataset.slice().sort((a, b) => a - b);

    const label = labelMap[taskKey] || taskKey;

    // Add to unsorted datasets
    unsortedChartData.datasets.push({
      label: label,
      fill: false,
      data: unsortedDataset,
      pointRadius: 0
    });

    // Add to sorted datasets
    sortedChartData.datasets.push({
      label: label,
      fill: false,
      data: sortedDataset,
      pointRadius: 0
    });
  });

  return {
    unsortedChartData,
    sortedChartData
  };
};

const generateBufferGraph = (entries) => {
  if (entries.length === 0) return null;
  entries.sort((entryA, entryB) => entryA.bytes - entryB.bytes);

  const datasets = {};
  const totalCallTime = {};
  const accumulatedTime = {};
  const accumulatedCount = {};
  const totalCount = {};

  entries.forEach(entry => {
    const key = entry.call;
    const time = entry.ttot;
    const count = entry.count;

    if (!totalCallTime[key]) {
      totalCallTime[key] = time;
    } else {
      totalCallTime[key] += time;
    }
    if (!totalCount[key]) {
      totalCount[key] = count;
    } else {
      totalCount[key] += count;
    }
  });

  entries.forEach(entry => {
    const key = entry.call;
    const bytes = entry.bytes;
    const time = entry.ttot;
    const count = entry.count;

    // Initialize dataset for the call if it doesn't exist
    if (!datasets[key]) {
      datasets[key] = {
        label: key,
        data: []
      };
      accumulatedTime[key] = 0;
      accumulatedCount[key] = 0;
    }

    accumulatedTime[key] += time;
    const percentage = (accumulatedTime[key] / totalCallTime[key]) * 100;

    accumulatedCount[key] += count;
    const percentageCount = (accumulatedCount[key] / totalCount[key]) * 100;

    const countVal = {
      x: bytes,
      cumPer: percentageCount,
      cum: accumulatedCount[key],
      value: count
    }

    const timeVal = {
      x: bytes,
      cumPer: percentage,
      cum: accumulatedTime[key],
      value: time
    }

    datasets[key].data.push({ x: bytes, count: countVal, time: timeVal });
  });

  // Prepare the chart data
  const chartData = {
    datasets: Object.values(datasets)
  };

  return chartData;
};

const getMpiPieCharts = (mpiRegion, performance) => {
  let pieCharts = {
    mpiPercent: {
      datasets: [
        {
          data: [],
          backgroundColor: [],
        }
      ],
      labels: []
    }
  };

  let othersData = 0.0;

  for (const mpiCall of mpiRegion.summary) {
    // mpi percent pie
    let value = (mpiCall.ttot / performance.totalValues.mtime) * 100;
    if (value >= 1) {
      pieCharts.mpiPercent.datasets[0].data.push(value.toFixed(2));
      pieCharts.mpiPercent.labels.push(mpiCall.call);
    } else {
      othersData += parseFloat(value);
    }
  }

  // add others to pie chart
  if (othersData != 0) {
    pieCharts.mpiPercent.datasets[0].data.push(othersData.toFixed(2));
    pieCharts.mpiPercent.labels.push('others');
  }

  //region Wall Bar Chart

  pieCharts.mpiWall = {
    datasets: [
      {
        label: labelMap['mtime'],
        data: [],
      },
      {
        label: labelMap['utime'],
        data: [],
      },
      {
        label: labelMap['stime'],
        data: [],
      },
      {
        label: 'Uncategorized Wall Time',
        data: [],
      }
    ],
    labels: ['', '']
  };

  let rest = performance.totalValues.wtime - performance.totalValues.utime - performance.totalValues.stime;
  let restPercentage = rest / performance.totalValues.wtime * 100;
  let mtimePercentage = performance.totalValues.mtime / performance.totalValues.wtime * 100;
  let stimePercentage = performance.totalValues.stime / performance.totalValues.wtime * 100;
  let utimePercentage = performance.totalValues.utime / performance.totalValues.wtime * 100;

  pieCharts.mpiWall.datasets[0].data = [mtimePercentage, 0]
  pieCharts.mpiWall.datasets[1].data = [0, utimePercentage];
  pieCharts.mpiWall.datasets[2].data = [0, stimePercentage];
  pieCharts.mpiWall.datasets[3].data = [0, restPercentage];
  //endregion Wall Bar Chart

  return pieCharts;
};

const createRegion = (regionName) => {
  //load balance data
  let maxValues = { wtime: 0, utime: 0, stime: 0, mtime: 0 };
  let minValues = { wtime: Infinity, utime: Infinity, stime: Infinity, mtime: Infinity };
  let totalValues = { wtime: 0, utime: 0, stime: 0, mtime: 0 };
  const performance = {
    entries: [],
    maxValues,
    minValues,
    totalValues,
  };

  //MPI regions data
  const mpiRegion = {
    entries: [],
    summaryObject: {},
    totalTime: 0.0,
    totalCount: 0,
  };

  //HPM data
  const hpmRegion = {
    valid: false,
    entriesObject: {},
    statisticObject: {},
  };

  //Hashtable data
  const hashTable = {
    valid: false,
    entriesObject: {},
  };

  //Communication topology data
  const topology = {
    valid: false,
    entriesObject: {},
    maxTotalBytesComm: 0,
    maxBytesSend: 0,
    maxBytesReceived: 0,
  }

  return {
    name: regionName,
    performance,
    mpiRegion,
    hpmRegion,
    hashTable,
    topology
  };
};

export const parseData = (file, callback) => {
  const startTime = performance.now();

  const reader = new FileReader();

  reader.onload = function (event) {
    const readingTime = performance.now();
    console.log("Reading took", readingTime - startTime, 'ms');
    const fileContent = event.target.result;

    const reg = [];
    reg[0] = createRegion("Entire Application");
    //for region 0 we can also collect gflop and gbyte performance data
    reg[0].performance.maxValues.gflop = 0;
    reg[0].performance.minValues.gflop = Infinity;
    reg[0].performance.totalValues.gflop = 0;
    reg[0].performance.maxValues.gbyte = 0;
    reg[0].performance.minValues.gbyte = Infinity;
    reg[0].performance.totalValues.gbyte = 0;

    let mpiRank = '0';
    let mpiRankInt = 0;

    const metadata = {};
    metadata.start = Infinity;
    metadata.stop = 0;
    metadata.env = [];

    //Hosts data
    const hostsObj = {};

    //Store the most recent attributes parsed, will overwrite itself
    const attributes = {};
    let lastText = ''; //Store the most recent text parsed

    //performance data
    let perfMetrics = {};

    //region data
    let regionAmount = 0;
    let multiRegion = false;
    let regionMpiTime = 0;
    let regionId = 0;
    let regCalls = [];
    let regionName;
    let currentRegions = [0];

    const parser = new Parser();

    function handleOpeningTask(attr) {
      mpiRank = attr.mpi_rank;
      mpiRankInt = parseInt(attr.mpi_rank);
      const start = parseFloat(attr.stamp_init);
      const end = parseFloat(attr.stamp_final);
      if (start < metadata.start) metadata.start = start;
      if (end > metadata.stop) metadata.stop = end;
    }

    function handleOpeningJob(attr) {
      metadata.nhosts = parseInt(attr.nhosts);
      metadata.ntasks = parseInt(attr.ntasks);
    }

    function performanceHelperFunction(regValues, index, attr) {
      Object.keys(regValues).forEach(metric => {
        let value = parseFloat(regValues[metric]);
        //TODO: Check if the times are always negative if nexits is 0
        if (attr.nexits === "0") {
          value = perfMetrics[metric] + value;
        }
        const perfReg = reg[index].performance
        if (value > perfReg.maxValues[metric]) {
          perfReg.maxValues[metric] = value;
          if (metric == 'mtime') perfReg.maxValues.mpiPercent = regValues.wtime;
        }
        if (value < perfReg.minValues[metric]) {
          perfReg.minValues[metric] = value;
          if (metric == 'mtime') perfReg.minValues.mpiPercent = regValues.wtime;
        }
        perfReg.totalValues[metric] += value;
        regValues[metric] = value;
      });
      regValues.nr = mpiRankInt;
      reg[index].performance.entries.push(regValues);
    }

    function handleOpeningPerf(attr) {
      perfMetrics = { wtime: attr.wtime, utime: attr.utime, stime: attr.stime, mtime: attr.mtime, gflop: attr.gflop, gbyte: attr.gbyte };
      performanceHelperFunction(perfMetrics, 0, attr);
    }

    function handleOpeningRegions(attr) {
      regionAmount = parseInt(attr.n);
      multiRegion = multiRegion || regionAmount > 1;
      regCalls = [];
      regCalls[0] = {};
    }

    function handleOpeningRegion(attr) {
      regionId = parseInt(attr.id) + 1;
      currentRegions = multiRegion ? [0, regionId] : [0];

      if (!multiRegion) {
        regionMpiTime = parseFloat(attr.mtime);
        return;
      };

      regionName = attr.label;
      regCalls[regionId] = {};
      if (reg[regionId] === undefined) {
        reg[regionId] = createRegion(regionName);
      }
      const regMetrics = { wtime: attr.wtime, stime: attr.stime, utime: attr.utime, mtime: attr.mtime };
      performanceHelperFunction(regMetrics, regionId, attr);
      regionMpiTime = regMetrics.mtime;
    }

    parser.on('openTag', function (elementName, attrGetter) {
      const attr = attrGetter();
      switch (elementName) {
        case 'task':
          handleOpeningTask(attr);
          break;
        case 'job':
          handleOpeningJob(attr);
          break;
        case 'perf':
          handleOpeningPerf(attr);
          break;
        case 'regions':
          handleOpeningRegions(attr);
          break;
        case 'region':
          handleOpeningRegion(attr);
          break;
      }
      attributes[elementName] = attr;
    });

    parser.on('text', function (value) {
      lastText = value;
    });

    function handleClosingFunc() {
      const name = attributes.func.name;
      const count = parseInt(attributes.func.count);
      const bytes = parseFloat(attributes.func.bytes);
      const ttot = parseFloat(lastText);

      for (const activeRegion of currentRegions) {
        if (regCalls[activeRegion][name] === undefined) {
          regCalls[activeRegion][name] = { call: name, ttot: ttot, count: count }
        }
        else {
          regCalls[activeRegion][name].ttot += ttot;
          regCalls[activeRegion][name].count += count;
        }

        // MPI calls summarized
        if (reg[activeRegion].mpiRegion.summaryObject[name] !== undefined) {
          // add to existing call
          reg[activeRegion].mpiRegion.summaryObject[name].ttot += ttot;
          reg[activeRegion].mpiRegion.summaryObject[name].count += count;
          reg[activeRegion].mpiRegion.summaryObject[name].bytes += bytes;
        } else {
          // create new mpi call
          reg[activeRegion].mpiRegion.summaryObject[name] = { call: name, ttot: ttot, count: count, bytes: bytes };
        }
      }
    }

    function handleClosingHent() {
      const values = lastText.match(/(.*) (.*) (.*)/);
      const ttot = parseFloat(values[1]);
      const tmin = parseFloat(values[2]);
      const tmax = parseFloat(values[3]);
      const mpiCall = attributes.hent.call;
      const bytes = parseInt(attributes.hent.bytes);
      const count = parseInt(attributes.hent.count);
      const orank = parseInt(attributes.hent.orank);
      const callRegion = parseInt(attributes.hent.region) + 1;
      const currentRegions = multiRegion ? [0, callRegion] : [0];
      // Topology
      const hashKey = mpiRankInt + '-' + orank;
      // MPI calls separated by bytes size
      const mpiCallsObjectKey = mpiCall + attributes.hent.bytes;

      for (const activeRegion of currentRegions) {
        const top = reg[activeRegion].topology;
        const topologyHashTable = top.entriesObject;

        if (ipm_key_mpi[mpiCall]?.has("DATA_TXRX")) {
          const totalBytesComm = bytes * count;
          if (topologyHashTable[hashKey] === undefined) {
            topologyHashTable[hashKey] = { x: mpiRankInt, y: orank, sv: totalBytesComm, rv: 0, tv: totalBytesComm };
          } else {
            topologyHashTable[hashKey].sv += totalBytesComm;
            topologyHashTable[hashKey].totalBytesComm += totalBytesComm;
          }

          const hashKeyMirror = orank + '-' + mpiRankInt;
          if (topologyHashTable[hashKeyMirror] === undefined) {
            topologyHashTable[hashKeyMirror] = { x: orank, y: mpiRankInt, sv: 0, rv: totalBytesComm, tv: totalBytesComm };
          } else {
            topologyHashTable[hashKeyMirror].rv += totalBytesComm;
            topologyHashTable[hashKeyMirror].tv += totalBytesComm;
          }

          if (topologyHashTable[hashKey].sv > top.maxBytesSend) {
            top.maxBytesSend = topologyHashTable[hashKey].sv;
          }
          if (topologyHashTable[hashKeyMirror].rv > top.maxBytesReceived) {
            top.maxBytesReceived = topologyHashTable[hashKeyMirror].rv;
          }
          if (topologyHashTable[hashKey].tv > top.maxTotalBytesComm) {
            top.maxTotalBytesComm = topologyHashTable[hashKey].tv;
          }
          if (topologyHashTable[hashKeyMirror].tv > top.maxTotalBytesComm) {
            top.maxTotalBytesComm = topologyHashTable[hashKeyMirror].tv;
          }

        } else if (ipm_key_mpi[mpiCall]?.has("DATA_TX")) {
          const totalBytesComm = bytes * count;
          if (topologyHashTable[hashKey] === undefined) {
            topologyHashTable[hashKey] = { x: mpiRankInt, y: orank, sv: totalBytesComm, rv: 0, tv: totalBytesComm };
          } else {
            topologyHashTable[hashKey].sv += totalBytesComm;
            topologyHashTable[hashKey].tv += totalBytesComm;
          }

          if (topologyHashTable[hashKey].sv > top.maxBytesSend) {
            top.maxBytesSend = topologyHashTable[hashKey].sv;
          }
          if (topologyHashTable[hashKey].tv > top.maxTotalBytesComm) {
            top.maxTotalBytesComm = topologyHashTable[hashKey].tv;
          }

        } else if (ipm_key_mpi[mpiCall]?.has("DATA_RX")) {
          const totalBytesComm = bytes * count;
          if (topologyHashTable[hashKey] === undefined) {
            topologyHashTable[hashKey] = { x: orank, y: mpiRankInt, sv: 0, rv: totalBytesComm, tv: totalBytesComm };
          } else {
            topologyHashTable[hashKey].rv += totalBytesComm;
            topologyHashTable[hashKey].tv += totalBytesComm;
          }

          if (topologyHashTable[hashKey].rv > top.maxBytesReceived) {
            top.maxBytesReceived = topologyHashTable[hashKey].rv;
          }
          if (topologyHashTable[hashKey].tv > top.maxTotalBytesComm) {
            top.maxTotalBytesComm = topologyHashTable[hashKey].tv;
          }
        }

        const mpiCallsObject = reg[activeRegion].hashTable.entriesObject;

        if (mpiCallsObject[mpiCallsObjectKey] !== undefined) {
          // add to existing call
          mpiCallsObject[mpiCallsObjectKey].ttot += ttot;
          mpiCallsObject[mpiCallsObjectKey].count += count;
        } else {
          // create new mpi call
          mpiCallsObject[mpiCallsObjectKey] = {
            call: mpiCall,
            ttot: ttot,
            count: count,
            tmin: tmin,
            tmax: tmax,
            bytes: bytes,
            count: count
          };
        }
      }

    }

    function handleClosingCounter() {
      for (const activeRegion of currentRegions) {
        reg[activeRegion].hpmRegion.valid = true;
        const hmpRegion = reg[0].hpmRegion
        let name = attributes.counter.name;
        let counter = parseInt(lastText);
        if (hmpRegion.entriesObject[name] === undefined) {
          hmpRegion.entriesObject[name] = [counter];
        } else {
          hmpRegion.entriesObject[name].push(counter);
        }
        if (hmpRegion.statisticObject[name] === undefined) {
          hmpRegion.statisticObject[name] = {
            name: name,
            counter: counter,
            ncalls: 1,
            min: counter,
            max: counter
          };
        } else {
          hmpRegion.statisticObject[name].counter += counter;
          hmpRegion.statisticObject[name].ncalls += 1;
          if (counter < hmpRegion.statisticObject[name].min) {
            hmpRegion.statisticObject[name].min = counter;
            hmpRegion.statisticObject[name].minProc = mpiRank;
          }
          if (counter > hmpRegion.statisticObject[name].max) {
            hmpRegion.statisticObject[name].max = counter;
            hmpRegion.statisticObject[name].maxProc = mpiRank;
          }
        }
      }
    }

    function handleClosingEnv() {
      metadata.env.push(lastText);
    }

    function handleClosingRegion() {
      if (multiRegion) {
        reg[regionId].mpiRegion.entries.push({ nr: mpiRank, mpiCalls: regCalls[regionId], ttot: regionMpiTime });
      } else {
        reg[0].mpiRegion.entries.push({ nr: mpiRank, mpiCalls: regCalls[0], ttot: regionMpiTime });
      }
    }

    function handleClosingHost() {
      if (!hostsObj[lastText]) {
        hostsObj[lastText] = {
          name: lastText,
          mach_name: attributes.host.mach_name,
          mach_info: attributes.host.mach_info,
          tasks: [mpiRank],
        }
      } else {
        hostsObj[lastText].tasks.push(mpiRank);
      }
    }

    function handleClosingCmdline() {
      metadata.cmdline = lastText;
    }

    function handleClosingRegions() {
      if (multiRegion) {
        reg[0].mpiRegion.entries.push({ nr: mpiRank, mpiCalls: regCalls[0], ttot: perfMetrics.mtime });
      }
    }

    parser.on('closeTag', function (elementName) {
      switch (elementName) {
        case 'host':
          handleClosingHost();
          break;
        case 'cmdline':
          handleClosingCmdline();
          break;
        case 'func':
          handleClosingFunc()
          break;
        case 'regions':
          handleClosingRegions();
          break;
        case 'region':
          handleClosingRegion();
          break;
        case 'counter':
          /*TODO: Maybe this is too generic and we need to keep track of the outer tag, 
          but for now we assume that the counter tag is always inside a hpm tag*/
          handleClosingCounter();
          break;
        case 'hent':
          handleClosingHent();
          break;
        case 'env':
          handleClosingEnv();
          break;
      }
    });

    try {
      parser.parse(fileContent);
    } catch (error) {
      console.error("Error parsing file", error);
      callback({ valid: false, error });
      return;
    }

    //finish metadata
    metadata.username = attributes.task.username;
    metadata.ipm_version = attributes.task.ipm_version;
    metadata.walltime = (metadata.stop - metadata.start).toFixed(6);
    metadata.totalWallTime = metadata.walltime * reg[0].performance.maxValues.wtime;
    if (metadata.env.length == 0) delete metadata.env;

    //transform hosts
    const hosts = Object.values(hostsObj);

    const parsingTime = performance.now();
    console.log("Parsing took", parsingTime - readingTime, 'ms');

    const data = {
      valid: true,
      metadata,
      hosts,
      regions: reg
    }

    data.regionsMetadata = data.regions.map(region => {
      return region.name;
    });

    data.id = generateIds(data.metadata);

    for (let region of data.regions) {
      //MPI calls over regions
      region.mpiRegion.summary = Object.values(region.mpiRegion.summaryObject);
      region.mpiRegion.summary.forEach(call => { 
        call.avg = call.ttot / call.count; 
        call.accurateBuffer = ipm_key_mpi[call.call]?.has("BYTES_SCOUNT") || ipm_key_mpi[call.call]?.has("DATA_COLLECTIVE")
      });
      region.mpiRegion.summary.sort((callA, callB) => callB.ttot - callA.ttot);
      delete region.mpiRegion.summaryObject;

      //HPM data over regions
      if (region.hpmRegion.valid) {
        const { sortedChartData, unsortedChartData } = parseHpmEntries(region.hpmRegion.entriesObject, region.hpmRegion.statisticObject);
        region.hpmRegion.sortedChartData = sortedChartData;
        region.hpmRegion.unsortedChartData = unsortedChartData;
        delete region.hpmRegion.entriesObject;
        region.hpmRegion.statistic = Object.values(region.hpmRegion.statisticObject);
        region.hpmRegion.statistic.sort((a, b) => b.counter - a.counter);
        delete region.hpmRegion.statisticObject;
      }

      //Hashtable data
      region.hashTable.entries = Object.values(region.hashTable.entriesObject);
      region.bufferGraph = generateBufferGraph(region.hashTable.entries);
      region.hashTable.entries.forEach(entry => { 
        entry.avg = entry.ttot / entry.count; 
        entry.accurateBuffer = ipm_key_mpi[entry.call]?.has("BYTES_SCOUNT") || ipm_key_mpi[entry.call]?.has("DATA_COLLECTIVE")
      });
      region.hashTable.entries.sort((entryA, entryB) => entryB.ttot - entryA.ttot);
      delete region.hashTable.entriesObject;
      region.hashTable.valid = region.hashTable.entries.length > 0;

      //Communication topology data
      region.topology.entries = Object.values(region.topology.entriesObject);
      delete region.topology.entriesObject;
      region.topology.valid = region.topology.entries.length > 0;
      //MPI pie charts
      region.mpiPies = getMpiPieCharts(region.mpiRegion, region.performance);
      //Balance data
      region.balanceData = generateBalanceChartData(region.mpiRegion);
      region.mpiRegion.entries.sort((taskA, taskB) => taskB.ttot - taskA.ttot);
      region.balanceDataSorted = generateBalanceChartData(region.mpiRegion);

      const { sortedChartData, unsortedChartData } = generateLineChartData(region.performance);
      region.performance.sortedChartData = sortedChartData;
      region.performance.unsortedChartData = unsortedChartData;

    }

    const graphTime = performance.now();
    console.log("Creating graphs took", graphTime - parsingTime, 'ms');
    callback(data);
  };

  reader.readAsText(file);
};

function generateIds(data) {
  const cmdlineParts = data.cmdline.trim().split('/');
  const topFileWithArgs = cmdlineParts[cmdlineParts.length - 1];
  const topFile = topFileWithArgs.split(' ')[0];

  const tasks = data.ntasks;
  const username = data.username;

  const startDate = new Date(data.start * 1000);
  const formattedDate = startDate.toISOString().replace(/[:.]/g, '-');

  return { filename: `${topFile}_${tasks}_${username}`, startDate: formattedDate };
}