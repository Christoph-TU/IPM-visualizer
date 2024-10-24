import colorAssignments from '/src/assets/color-assignments.json';
const usePredefinedColors = false;
const useHashedColors = false;

export let colorPalettes = [
    {
        palette: ['#7293cb', '#e1974c', '#84ba5b', '#d35e60', '#808585', '#9067a7', '#ab6857', '#ccc210', '#396ab1', '#da7c30', '#3e9651', '#cc2529', '#535154', '#6b4c9a', '#922428', '#948b3d'],
        name: 'ipm-hpc-v2 Palette'
    },
    {
        palette: ['#8dd3c7', '#ffffb3', '#bebada', '#fb8072', '#80b1d3', '#fdb462', '#b3de69', '#fccde5', '#d9d9d9', '#bc80bd', '#ccebc5', '#ffed6f'],
        name: 'Pastel Palette'
    },
    {
        palette: ['#ff0000', '#008000', '#0000ff', '#ffff00', '#800080', '#ff7f50', '#ffa500', '#00008b', '#32cd32', '#87ceeb', '#800000', '#008080', '#ff00ff', '#1e90ff', '#000000', '#9370db', '#9acd32', '#ff8c00', '#d2b48c', '#6b8e23', '#e6e6fa', '#00ffff', '#c0c0c0', '#d3d3d3', '#a9a9a9', '#808080', '#696969'],
        name: 'IPM Colors Original',
    },
    {
        palette: ['#e27c7c', '#a86464', '#6d4b4b', '#503f3f', '#333333', '#3c4e4b', '#466964', '#599e94', '#6cd4c5'],
        name: 'High Contrast Palette'
    }
]

let preDefinedSize = colorPalettes.length;

let userInfo = { colorPalettes: [], currentPalette: colorPalettes[0] };

try {
    const userInfoStorage = localStorage.getItem('paletteInfo');
    if (userInfoStorage) {
        userInfo = JSON.parse(userInfoStorage);
        if (!userInfo.currentPalette) {
            userInfo.currentPalette = colorPalettes[0];
        }
        colorPalettes = colorPalettes.concat(userInfo.colorPalettes);
    }
} catch (err) {
    console.error('Error reading from local storage:', err);
}

export let colorPalette = userInfo.currentPalette;

export const setColorPalette = (palette) => {
    userInfo.currentPalette = palette;
    try {
        localStorage.setItem('paletteInfo', JSON.stringify(userInfo));
    } catch (err) {
        console.error('Error writing to local storage:', err);
    }
    colorPalette = palette;
}

// Define the enum
export const ColorContext = Object.freeze({
    CALLS: 'Calls',
    LOAD_BALANCE: 'LoadBalance',
    HPM: 'Hpm',
});

let predefinedColors = {};

if (usePredefinedColors) {
    predefinedColors[ColorContext.CALLS] = { ...colorAssignments };
}

let colorManager = {};

export const seedColorsCalls = (sortedCalls) => {
    for (const mpiCall of sortedCalls) {
        getAssignedColor(ColorContext.CALLS, mpiCall);
    }
    getAssignedColor(ColorContext.CALLS, 'others');
}

export const clearAssignedColors = () => {
    colorManager = {};
    if (usePredefinedColors) {
        for (let name in predefinedColors) {
            colorManager[name] = {
                associatedColors: { ...predefinedColors[name] },
                currentIndex: { value: 0 }
            };
        }
    }
}

const getAssignedColor = (contextName, label) => {
    if (!colorManager[contextName]) {
        let associatedColors = {};
        if (usePredefinedColors && predefinedColors[contextName]) {
            associatedColors = { ...predefinedColors[contextName] };
        }
        colorManager[contextName] = {
            associatedColors: associatedColors,
            currentIndex: { value: 0 }
        };
    }

    const { associatedColors, currentIndex } = colorManager[contextName];

    let color = associatedColors[label];
    if (!color) {
        let baseColor = useHashedColors ? stringToHexColor(label) : getNextColor(currentIndex);
        const lum = luminance(baseColor.substring(1)); // Remove '#' for calculation
        const borderColor = lum > 0.5 ? adjustColorBrightness(baseColor, -30) : adjustColorBrightness(baseColor, 30);
        associatedColors[label] = { base: baseColor, border: borderColor };
        color = associatedColors[label];
    }
    return color;
}

const getNextColor = (currentIndex) => {
    let color = colorPalette.palette[currentIndex.value];
    currentIndex.value = (currentIndex.value + 1) % colorPalette.palette.length;
    return color;
}

// Function to adjust color brightness
function adjustColorBrightness(hex, amount) {
    let usePound = false;
    if (hex[0] == "#") {
        hex = hex.slice(1);
        usePound = true;
    }
    let num = parseInt(hex, 16);
    let r = (num >> 16) + amount;
    let g = ((num >> 8) & 0x00FF) + amount;
    let b = (num & 0x0000FF) + amount;
    r = Math.min(Math.max(0, r), 255);
    g = Math.min(Math.max(0, g), 255);
    b = Math.min(Math.max(0, b), 255);
    let newColor = (r << 16) | (g << 8) | b;
    return (usePound ? "#" : "") + newColor.toString(16).padStart(6, '0');
}

// Function to calculate luminance
function luminance(hex) {
    const a = [0, 0, 0].map(function (v, i) {
        v = parseInt(hex.substr(i * 2, 2), 16) / 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow(((v + 0.055) / 1.055), 2.4);
    });
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

function stringToHexColor(inputString) {
    let hash = 0;
    for (let i = 0; i < inputString.length; i++) {
        hash = inputString.charCodeAt(i) + ((hash << 5) - hash);
    }
    let color = '#';
    for (let i = 0; i < 3; i++) {
        const value = (hash >> (i * 8)) & 0xFF;
        color += ('00' + value.toString(16)).substr(-2);
    }
    return color;
}

const defaultColorBarChart = (barChart, contextName) => {
    for (const dataset of barChart.datasets) {
        let color = getAssignedColor(contextName, dataset.label);
        dataset.backgroundColor = color.base;
        dataset.borderColor = color.border;
        dataset.borderWidth = 1;
        dataset.pointRadius = 0;
        dataset.fill = true;
    }
}

export const colorBarChart = (barChart) => {
    defaultColorBarChart(barChart, ColorContext.CALLS);
}

export const colorTimeBarChart = (barChart) => {
    defaultColorBarChart(barChart, ColorContext.LOAD_BALANCE);
}

const colorLineChart = (data, contextName, pointRadius, borderWit) => {
    for (const dataset of data.datasets) {
        let color = getAssignedColor(contextName, dataset.label);
        dataset.backgroundColor = color.base;
        dataset.borderColor = color.border;
        dataset.pointRadius = pointRadius;
        dataset.borderWidth = borderWit;
    }
}

export const colorBufLineChart = (line) => {
    colorLineChart(line, ColorContext.CALLS, 2, 2);
}

export const colorPerformanceChart = (lineChart) => {
    colorLineChart(lineChart, ColorContext.LOAD_BALANCE, 0, 3);
}

export const colorHpmChart = (lineChart) => {
    colorLineChart(lineChart, ColorContext.HPM, 0, 3);
}

export const colorPieChart = (pieChart) => {
    pieChart.datasets[0].backgroundColor = [];
    pieChart.datasets[0].borderColor = [];
    pieChart.datasets[0].borderWidth = [];
    for (let label of pieChart.labels) {
        let color = getAssignedColor(ColorContext.CALLS, label);
        pieChart.datasets[0].backgroundColor.push(color.base);
        pieChart.datasets[0].borderColor.push(color.border);
        pieChart.datasets[0].borderWidth.push(2);
    }
}