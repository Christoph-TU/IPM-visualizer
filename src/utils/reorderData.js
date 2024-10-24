function isReorderingRequiredForBarChart(datasets, preferredOrder) {
    for (let i = 0; i < datasets.length - 1; i++) {
        if (preferredOrder.indexOf(datasets[i].label) > preferredOrder.indexOf(datasets[i + 1].label)) {
            return true;
        }
    }
    return false;
}

export function sortBarChartData(datasets, preferredOrder) {
    if (!isReorderingRequiredForBarChart(datasets, preferredOrder)) {
        return;
    }
    datasets.sort((a, b) => preferredOrder.indexOf(a.label) - preferredOrder.indexOf(b.label));
}


function isReorderingRequiredForPieChart(labels, preferredOrder) {
    for (let i = 0; i < labels.length - 1; i++) {
        if (preferredOrder.indexOf(labels[i]) > preferredOrder.indexOf(labels[i + 1])) {
            return true;
        }
    }
    return false;
}

export function sortPieChartData(pieData, preferredOrder) {
    // Extracting labels and data from the chart
    const { labels, datasets } = pieData;
    const { data } = datasets[0];

    // Check if reordering is required
    if (!isReorderingRequiredForPieChart(labels, preferredOrder)) {
        return; // No reordering needed, exit the function
    }

    // Creating an array of objects with labels and their corresponding data
    let combined = labels.map((label, index) => ({
        label,
        data: data[index],
    }));

    combined.sort((a, b) => {
        // Always place "other" at the last position
        if (a.label === "others") return 1;
        if (b.label === "others") return -1;

        // Otherwise, sort based on the preferred order
        return preferredOrder.indexOf(a.label) - preferredOrder.indexOf(b.label);
    });
    // Updating the chart's labels and data with the sorted order
    pieData.labels = combined.map(item => item.label);
    pieData.datasets[0].data = combined.map(item => item.data);
}
