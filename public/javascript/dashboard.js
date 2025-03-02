
    // Navigate to index.html on clicking the button
    
   
    function navigateTo(page) {
        window.location.href = page;
    }

    const statusCtx = document.getElementById('statusChart').getContext('2d');
    const roleCtx = document.getElementById('roleChart').getContext('2d');
  //  const experienceCtxCopy = document.getElementById('experienceChartCopy').getContext('2d');
   // const experienceCtx = document.getElementById('experienceChart').getContext('2d');
  //  const experienceCtxCopy2 = document.getElementById('experienceChartCopy2').getContext('2d');

    // Define variables for counts
    let shortlistedCount = 0;
    let rejectedCount = 0;
    let resumeCount = 0; // This can be updated as needed

    // Create the doughnut chart
const statusChart = new Chart(statusCtx, {
    type: 'doughnut',
    data: {
        labels: ['Devops', 'Platform', 'Cloudops', 'Migration'],
        datasets: [{
            data: [, , , ], // Replace with actual data
            backgroundColor: ['#d7bde2', '#7fb3d5', '#76d7c4', '#f5cba7']
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'right',
                labels: {
                    color: 'black'
                }
            },
            datalabels: {
                color: 'black', // Customize the color of the labels
                formatter: function(value, context) {
                    // Do not display the label if the value is 0
                    return value > 0 ? value : null;
                },
                anchor: 'center', // Position in the center of each segment
                align: 'center',
                font: {
                    size: 14 // Customize the font size if needed
                }
            }
        }
    },
    plugins: [ChartDataLabels] // Add the plugin to the chart instance
});



    // Create the bar chart
 // Create the bar chart
const roleChart = new Chart(roleCtx, {
    type: 'bar',
    data: {
        labels: ['DevOps', 'Platform', 'Migration', 'Cloud Ops'],
        datasets: [{
            label: 'Applications',
            data: [0, 0, 0, 0],  // Initial placeholder data
            backgroundColor: ['#d7bde2', '#7fb3d5', '#f5cba7', '#76d7c4']
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    color: 'black'
                }
            },
            x: {
                ticks: {
                    color: 'black'
                }
            }
        },
        plugins: {
            legend: {
                display: false
            },
            datalabels: {
                anchor: 'center', // Aligns the labels at the center of the bars
                align: 'center',  // Positions the labels inside the bars
                color: 'black', // Label text color
                formatter: function(value, context) {
                    return value; // Displays the count directly inside the bar
                },
                font: {
                    size: 12 // Adjust the font size as needed
                }
            }
        }
    },
    plugins: [ChartDataLabels] // Include the plugin in the chart
});

// Get the contexts for the new charts
const newStatusCtx = document.getElementById('newStatusChart').getContext('2d');
const newRoleCtx = document.getElementById('newRoleChart').getContext('2d');

// Create the new doughnut chart
const newStatusChart = new Chart(newStatusCtx, {
    type: 'doughnut',
    data: {
        labels: ['React JS', 'Snowflake', 'Hadoop Engineer', 'Java FullStack' ,'.Net Fullstack'],
        datasets: [{
            data: [0, 0, 0, 0,0], // Replace with actual data
            backgroundColor: ['#d7bde2', '#7fb3d5', '#f5cba7', '#76d7c4','#f9e79f']
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'right',
                labels: {
                    color: 'black'
                }
            },
            datalabels: {
                color: 'black',
                formatter: function(value) {
                    return value > 0 ? value : null;
                },
                anchor: 'center',
                align: 'center',
                font: {
                    size: 14
                }
            }
        }
    },
    plugins: [ChartDataLabels]
});

// Create the new bar chart
const newRoleChart = new Chart(newRoleCtx, {
    type: 'bar',
    data: {
        labels: ['React JS', 'Snowflake', 'Hadoop Engineer', 'Java FullStack' ,'.Net Fullstack'],
        datasets: [{
            label: 'Applicants',
            data: [0, 0, 0, 0,0], // Initial placeholder data
            backgroundColor: ['#d7bde2', '#7fb3d5', '#f5cba7', '#76d7c4','#f9e79f']
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    color: 'black'
                }
            },
            x: {
                ticks: {
                    color: 'black'
                }
            }
        },
        plugins: {
            legend: {
                display: false
            },
            datalabels: {
                anchor: 'center',
                align: 'center',
                color: 'black',
                formatter: function(value) {
                    return value;
                },
                font: {
                    size: 12
                }
            }
        }
    },
    plugins: [ChartDataLabels]
});

// Function to update the new charts
function updateNewChartData(teamACount, teamBCount, teamCCount, teamDCount,teamECount) {
    newStatusChart.data.datasets[0].data = [teamACount, teamBCount, teamCCount, teamDCount,teamECount];
    newStatusChart.update();
}

function updateNewBarChartData(teamACount, teamBCount, teamCCount, teamDCount,teamECount) {
    newRoleChart.data.datasets[0].data = [teamACount, teamBCount, teamCCount, teamDCount,teamECount];
    newRoleChart.update();
}

// Fetch data and update the new charts
async function fetchNewCountsAndUpdateChart() {
    try {
        const teamACount = await fetch('https://demotag.vercel.app/api/reactjs-resume-count').then(res => res.json()).then(data => data.count || 0);
        const teamBCount = await fetch('https://demotag.vercel.app/api/snow-resume-count').then(res => res.json()).then(data => data.count || 0);
        const teamCCount = await fetch('https://demotag.vercel.app/api/hadoop-resume-count').then(res => res.json()).then(data => data.count || 0);
        const teamDCount = await fetch('https://demotag.vercel.app/api/java-resume-count').then(res => res.json()).then(data => data.count || 0);
        const teamECount = await fetch('https://demotag.vercel.app/api/.net-resume-count').then(res => res.json()).then(data => data.count || 0);

        // Update the charts with the fetched counts
        updateNewChartData(teamACount, teamBCount, teamCCount, teamDCount,teamECount);
        updateNewBarChartData(teamACount, teamBCount, teamCCount, teamDCount,teamECount);
    } catch (error) {
        console.error('Error updating new chart data:', error);
    }
}

// Call the function to fetch data and update the new charts
fetchNewCountsAndUpdateChart();

//Data Charts
// Get the contexts for the additional charts
const secondStatusCtx = document.getElementById('secondStatusChart').getContext('2d');
const secondRoleCtx = document.getElementById('secondRoleChart').getContext('2d');

// Second Doughnut Chart Initialization
const secondStatusChart = new Chart(secondStatusCtx, {
    type: 'doughnut',
    data: {
        labels: ['Data Engineer', 'Data-Ops Engineer', 'Data – BI Visualization Engineer', 'Data Modeller','Data Analyst','Data Architect','Data Scientist –AI/ML'],
        datasets: [{
            data: [0, 0, 0, 0,0,0,0], // Placeholder data
            backgroundColor: ['#d7bde2', '#7fb3d5', '#f5cba7', '#76d7c4','#f9e79f','#95a5a6','#3498db']
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'right',
                labels: { color: 'black' }
            },
            datalabels: {
                color: 'black',
                formatter: (value) => (value > 0 ? value : null),
                anchor: 'center',
                align: 'center',
                font: { size: 14 }
            }
        }
    },
    plugins: [ChartDataLabels]
});

// Second Bar Chart Initialization
const secondRoleChart = new Chart(secondRoleCtx, {
    type: 'bar',
    data: {
        labels: ['Data Engineer', 'Data-Ops Engineer', 'Data – BI Visualization Engineer', 'Data Modeller','Data Analyst','Data Architect','Data Scientist –AI/ML'],
        datasets: [{
            label: 'Applications',
            data: [0, 0, 0, 0,0,0,0], // Placeholder data
            backgroundColor: ['#d7bde2', '#7fb3d5', '#f5cba7', '#76d7c4','#f9e79f','#95a5a6','#3498db']
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: {
                beginAtZero: true,
                ticks: { color: 'black' }
            },
            x: {
                ticks: { color: 'black' }
            }
        },
        plugins: {
            legend: { display: false },
            datalabels: {
                anchor: 'center',
                align: 'center',
                color: 'black',
                formatter: (value) => value,
                font: { size: 12 }
            }
        }
    },
    plugins: [ChartDataLabels]
});

// Fetch Data Function for New Charts
// Fetch Data Function for New Charts
async function fetchNewCounts(apiEndpoint, label) {
    try {
        const response = await fetch(apiEndpoint);
        if (!response.ok) throw new Error(`Failed to fetch ${label} data`);
        const data = await response.json();
        console.log(`Fetched ${label} data:`, data);
        return data.count || 0;
    } catch (error) {
        console.error(`Error fetching ${label} data:`, error);
        return 0;
    }
}

// Update New Charts Data
function updateSecondCharts(
    dataEngineerCount,
    dataOpsEngineerCount,
    dataBIVisualizationCount,
    dataModellerCount,
    dataAnalystCount,
    dataArchitectCount,
    dataScientistCount
) {
    // Update Second Doughnut Chart
    secondStatusChart.data.datasets[0].data = [
        dataEngineerCount,
        dataOpsEngineerCount,
        dataBIVisualizationCount,
        dataModellerCount,
        dataAnalystCount,
        dataArchitectCount,
        dataScientistCount
    ];
    secondStatusChart.update();

    // Update Second Bar Chart
    secondRoleChart.data.datasets[0].data = [
        dataEngineerCount,
        dataOpsEngineerCount,
        dataBIVisualizationCount,
        dataModellerCount,
        dataAnalystCount,
        dataArchitectCount,
        dataScientistCount
    ];
    secondRoleChart.update();
}

// Update Applicant Counts in HTML (Second Set)
function updateSecondApplicantCountsHTML(
    dataEngineerCount,
    dataOpsEngineerCount,
    dataBIVisualizationCount,
    dataModellerCount,
    dataAnalystCount,
    dataArchitectCount,
    dataScientistCount
) {
    document.getElementById('data-engineer-applicants').innerText = `${dataEngineerCount} Applicants`;
    document.getElementById('data-ops-engineer-applicants').innerText = `${dataOpsEngineerCount} Applicants`;
    document.getElementById('data-bi-visualization-applicants').innerText = `${dataBIVisualizationCount} Applicants`;
    document.getElementById('data-modeller-applicants').innerText = `${dataModellerCount} Applicants`;
    document.getElementById('data-analyst-applicants').innerText = `${dataAnalystCount} Applicants`;
    document.getElementById('data-architect-applicants').innerText = `${dataArchitectCount} Applicants`;
    document.getElementById('data-scientist-applicants').innerText = `${dataScientistCount} Applicants`;
}

// Fetch Data and Update New Charts
async function fetchAndUpdateSecondCharts() {
    try {
        const [
            dataEngineerCount,
            dataOpsEngineerCount,
            dataBIVisualizationCount,
            dataModellerCount,
            dataAnalystCount,
            dataArchitectCount,
            dataScientistCount
        ] = await Promise.all([
            fetchNewCounts('https://demotag.vercel.app/api/data-resume-count', 'Data Engineer'),
            fetchNewCounts('https://demotag.vercel.app/api/data-ops-resume-count', 'Data-Ops Engineer'),
            fetchNewCounts('https://demotag.vercel.app/api/data-bi-resume-count', 'Data – BI Visualization Engineer'),
            fetchNewCounts('https://demotag.vercel.app/api/data-modeller-resume-count', 'Data Modeller'),
            fetchNewCounts('https://demotag.vercel.app/api/data-analyst-resume-count', 'Data Analyst'),
            fetchNewCounts('https://demotag.vercel.app/api/data-architect-resume-count', 'Data Architect'),
            fetchNewCounts('https://demotag.vercel.app/api/data-scientist-resume-count', 'Data Scientist – AI/ML')
        ]);

        // Update New Charts and HTML
        updateSecondCharts(
            dataEngineerCount,
            dataOpsEngineerCount,
            dataBIVisualizationCount,
            dataModellerCount,
            dataAnalystCount,
            dataArchitectCount,
            dataScientistCount
        );
        updateSecondApplicantCountsHTML(
            dataEngineerCount,
            dataOpsEngineerCount,
            dataBIVisualizationCount,
            dataModellerCount,
            dataAnalystCount,
            dataArchitectCount,
            dataScientistCount
        );
    } catch (error) {
        console.error('Error updating data for second charts:', error);
    }
}

// Initialize on Page Load for Second Set of Charts
fetchAndUpdateSecondCharts();





// Doughnut Chart for Department Overview
async function fetchTotalCountAndUpdateCharts(ecMapping) {
    try {
        // Convert the EC mapping array to a comma-separated string
        const ecs = ecMapping.join(",");
        console.log("EC Mapping:", ecs); // Debugging line

        // Fetch total counts by team from the API, passing the ECs as a query parameter
        const response = await fetch(`https://demotag.vercel.app/api/candidate-total-by-team?ecs=${encodeURIComponent(ecs)}`);

        if (!response.ok) {
            throw new Error("Failed to fetch data");
        }

        const data = await response.json();
        console.log("Fetched Data:", data); // Debugging line

        // Extract counts for each department (EC)
        const cloudCount = data["Cloud EC"] || 0;
        const appCount = data["App EC"] || 0;
        const dataCount = data["Data EC"] || 0;

        // Render Doughnut Chart (Department Chart)
        const departmentCtx = document.getElementById("departmentChart").getContext("2d");
        new Chart(departmentCtx, {
            type: "doughnut",
            data: {
                labels: ["Cloud", "App", "Data"],
                datasets: [{
                    data: [cloudCount, appCount, dataCount],
                    backgroundColor: ["#FFB6C1", "#87CEEB", "#FFD700"],
                }],
            },
            plugins: [ChartDataLabels],
        });

        // Render Bar Chart (Applications per Department)
        const departmentRoleCtx = document.getElementById("departmentRoleChart").getContext("2d");
        new Chart(departmentRoleCtx, {
            type: "bar",
            data: {
                labels: ["Cloud", "App", "Data"],
                datasets: [{
                    label: "Applications",
                    data: [cloudCount, appCount, dataCount],
                    backgroundColor: ["#ADD8E6", "#FFA07A", "#90EE90"],
                }],
            },
            plugins: [ChartDataLabels],
        });
    } catch (error) {
        console.error("Error fetching total count by team:", error);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    // Extract the 'ec_mapping' parameter from the URL query string
    const urlParams = new URLSearchParams(window.location.search);
    const ecMappingParam = urlParams.get("ec_mapping");

    let ecMapping = [];

    if (ecMappingParam) {
        // Store the EC Mapping in localStorage
        localStorage.setItem("ec_mapping", ecMappingParam);
        ecMapping = ecMappingParam.split(",");

        // Ensure the URL always contains the ec_mapping parameter
        history.replaceState(null, "", `?ec_mapping=${encodeURIComponent(ecMappingParam)}`);
    } else {
        // Retrieve the EC Mapping from localStorage if not in the URL
        const storedEcMapping = localStorage.getItem("ec_mapping");
        if (storedEcMapping) {
            ecMapping = storedEcMapping.split(",");

            // Update the URL to include ec_mapping from localStorage
            history.replaceState(null, "", `?ec_mapping=${encodeURIComponent(storedEcMapping)}`);
        }
    }

    console.log("EC Mapping array:", ecMapping); // Debugging line

    // Call the function to fetch data and update charts
    fetchTotalCountAndUpdateCharts(ecMapping);
});
document.addEventListener("DOMContentLoaded", () => {
    // Get the EC mapping from the URL query string
    const urlParams = new URLSearchParams(window.location.search);
    const ecMappingParam = urlParams.get("ec_mapping");

    if (ecMappingParam) {
        // Split the EC mapping into an array
        const ecMapping = ecMappingParam.split(",").map(ec => ec.trim());

        // Iterate over EC mapping and unhide corresponding sections
        ecMapping.forEach(ec => {
            switch (ec) {
                case "Cloud EC":
                    document.querySelectorAll('.dashboard-charts .dashboard-chart').forEach(chart => {
                        const h3 = chart.querySelector("h3");
                        if (h3 && h3.textContent.includes("Cloud EC")) {
                            chart.hidden = false;
                        }
                    });
                    break;

                case "App EC":
                    document.querySelectorAll('.dashboard-charts .dashboard-chart1').forEach(chart => {
                        const h3 = chart.querySelector("h3");
                        if (h3 && h3.textContent.includes("App EC")) {
                            chart.hidden = false;
                        }
                    });
                    break;

                case "Data EC":
                    document.querySelectorAll('.dashboard-charts .dashboard-chart1').forEach(chart => {
                        const h3 = chart.querySelector("h3");
                        if (h3 && h3.textContent.includes("Data EC")) {
                            chart.hidden = false;
                        }
                    });
                    break;

                default:
                    console.warn(`Unknown EC type: ${ec}`);
            }
        });
    }
});










document.addEventListener("DOMContentLoaded", async () => {
    try {
        const response = await fetch('https://demotag.vercel.app/api/rrf-details');
        if (!response.ok) {
            throw new Error('Failed to fetch data');
        }
 
        const data = await response.json();
 
        // Aggregate resume counts by eng_center
        const aggregatedData = data.reduce((acc, item) => {
            acc[item.eng_center] = (acc[item.eng_center] || 0) + item.resume_count;
            return acc;
        }, {});
 
        // Update the total applicants count
        const totalApplicants = Object.values(aggregatedData).reduce((total, count) => total + count, 0);
        const totalApplicantsStr = totalApplicants.toString().replace(/^0+/, '');
        document.querySelector('.center-circle p').textContent = totalApplicantsStr;
 
        // Update individual metrics
        Object.entries(aggregatedData).forEach(([eng_center, resume_count]) => {
            let metricSelector;
            resume_count = Number(resume_count);
            resume_count = resume_count.toString().replace(/^0+/, '');
 
            if (eng_center === 'App EC') {
                metricSelector = '.metric:nth-child(1) span:nth-child(1)';
            } else if (eng_center === 'Cloud EC') {
                metricSelector = '.metric:nth-child(2) span:nth-child(1)';
            } else if (eng_center === 'Data EC') {
                metricSelector = '.metric:nth-child(3) span:nth-child(1)';
            }
 
            if (metricSelector) {
                document.querySelector(metricSelector).textContent = resume_count;
            }
        });
    } catch (error) {
        console.error('Error fetching or updating data:', error);
    }
});





// Call the function when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', fetchTotalCountAndUpdateCharts);


   

async function fetchDevOpsCount() {
    try {
        const response = await fetch('https://demotag.vercel.app/api/devops-resume-count');
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        console.log('Fetched data for DevOps:', data);
        // document.getElementById('devops-count').innerText = data.count || 'No data';
        return data.count || 0;  // Return the count
    } catch (error) {
        console.error('Error fetching DevOps count:', error);
        document.getElementById('devops-count').innerText = 'Error';
        return 0;  // Return 0 in case of error
    }
}

async function fetchplatformCount() {
    try {
        const response = await fetch('https://demotag.vercel.app/api/platform-resume-count');
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        console.log('Fetched data for Platform:', data);
        // document.getElementById('platform-count').innerText = data.count || 'No data';
        return data.count || 0;
    } catch (error) {
        console.error('Error fetching Platform count:', error);
        document.getElementById('platform-count').innerText = 'Error';
        return 0;
    }
}

async function fetchcloudopsCount() {
    try {
        const response = await fetch('https://demotag.vercel.app/api/cloudops-resume-count');
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        console.log('Fetched data for CloudOps:', data);
        // document.getElementById('cloudops-count').innerText = data.count || 'No data';
        return data.count || 0;
    } catch (error) {
        console.error('Error fetching CloudOps count:', error);
        document.getElementById('cloudops-count').innerText = 'Error';
        return 0;
    }
}

async function fetchsiteCount() {
    try {
        const response = await fetch('https://demotag.vercel.app/api/site-resume-count');
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        console.log('Fetched data for Site:', data);
        // document.getElementById('site-count').innerText = data.count || 'No data';
        return data.count || 0;
    } catch (error) {
        console.error('Error fetching Site count:', error);
        document.getElementById('site-count').innerText = 'Error';
        return 0;
    }
}


//data count
async function fetchdataengineerCount() {
    try {
        const response = await fetch('https://demotag.vercel.app/api/data-resume-count');
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        console.log('Fetched data for Site:', data);
        // document.getElementById('site-count').innerText = data.count || 'No data';
        return data.count || 0;
    } catch (error) {
        console.error('Error fetching Site count:', error);
        document.getElementById('site-count').innerText = 'Error';
        return 0;
    }
}
async function fetchdatabiCount() {
    try {
        const response = await fetch('https://demotag.vercel.app/api/data-bi-resume-count');
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        console.log('Fetched data for Site:', data);
        // document.getElementById('site-count').innerText = data.count || 'No data';
        return data.count || 0;
    } catch (error) {
        console.error('Error fetching Site count:', error);
        document.getElementById('site-count').innerText = 'Error';
        return 0;
    }
}
async function fetchdatamodellerCount() {
    try {
        const response = await fetch('https://demotag.vercel.app/api/data-modeller-resume-count');
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        console.log('Fetched data for Site:', data);
        // document.getElementById('site-count').innerText = data.count || 'No data';
        return data.count || 0;
    } catch (error) {
        console.error('Error fetching Site count:', error);
        document.getElementById('site-count').innerText = 'Error';
        return 0;
    }
}
async function fetchdataanalystCount() {
    try {
        const response = await fetch('https://demotag.vercel.app/api/data-analyst-resume-count');
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        console.log('Fetched data for Site:', data);
        // document.getElementById('site-count').innerText = data.count || 'No data';
        return data.count || 0;
    } catch (error) {
        console.error('Error fetching Site count:', error);
        document.getElementById('site-count').innerText = 'Error';
        return 0;
    }
}


// Function to update the chart data
function updateChartData(devOpsCount, platformCount, cloudOpsCount, siteCount) {
    statusChart.data.datasets[0].data = [devOpsCount, platformCount, cloudOpsCount, siteCount];
    statusChart.update();
}

// Function to update the bar chart data
function updateBarChartData(devOpsCount, platformCount, cloudOpsCount, siteCount) {
    roleChart.data.datasets[0].data = [devOpsCount, platformCount, siteCount, cloudOpsCount]; // Update the chart data
    roleChart.update(); // Update the chart display
}

		async function updateApplicantCounts() {
    try {
        const devOpsCount = await fetchDevOpsCount();
        const platformCount = await fetchplatformCount();
        const cloudOpsCount = await fetchcloudopsCount();
        const siteCount = await fetchsiteCount();
        const dataEngineer= await fetchdataengineerCount();
        const dataBIVisualizationCount =await fetchdatabiCount();
        const dataAnalystCount =await fetchdataanalystCount();
        const dataModellerCount =await fetchdatamodellerCount();
;
        // Update the HTML elements with fetched counts
        document.getElementById('devops-applicants').innerText = `${devOpsCount} Applicants`;
        document.getElementById('platform-applicants').innerText = `${platformCount} Applicants`;
        document.getElementById('cloudops-applicants').innerText = `${cloudOpsCount} Applicants`;
        document.getElementById('site-applicants').innerText = `${siteCount} Applicants`;
        document.getElementById('data-engineer-applicants').innerText=`${dataEngineer}`;
        document.getElementById('bi-visualization-applicants').innerText=`${dataBIVisualizationCount}`;
        document.getElementById('data-analyst-applicants').innerText=`${dataAnalystCount}`;
        document.getElementById('data-modeller-applicants').innerText=`${dataModellerCount}`;

    } catch (error) {
        console.error('Error updating applicant counts:', error);
    }
}

// Call the function on page load
updateApplicantCounts();


// Fetch data and update the chart
async function fetchAllCountsAndUpdateChart() {
    try {
        const devOpsCount = await fetchDevOpsCount();
        const platformCount = await fetchplatformCount();
        const cloudOpsCount = await fetchcloudopsCount();
        const siteCount = await fetchsiteCount();

        // Update the chart with the fetched counts
        updateChartData(devOpsCount, platformCount, cloudOpsCount, siteCount);
		 updateBarChartData(devOpsCount, platformCount, cloudOpsCount, siteCount);
    } catch (error) {
        console.error('Error updating chart data:', error);
    }
}
//table data
async function fetchgetCandidates() {
            try {
                const response = await fetch('https://demotag.vercel.app/api/getcandidates');
                const data = await response.json();

                const tableBody = document.querySelector('#candidateTable tbody');
                tableBody.innerHTML = ''; // Clear existing rows

                data.forEach(candidate => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${candidate.candidate_name}</td>
                        <td>${candidate.candidate_email}</td>
                        <td>${candidate.prescreening_status}</td>
                        <td>${candidate.role}</td>
                        <td>${candidate.recruitment_phase}</td>
                        <td>${candidate.resume_score || '-'}</td>
                    `;
                    tableBody.appendChild(row);
                });
            } catch (error) {
                console.error('Error fetching candidate data:', error);
            }
        }










    // Update the status chart with latest values
    //function updateStatusChart() {
       // statusChart.data.datasets[0].data = [shortlistedCount, rejectedCount, resumeCount];
      //  statusChart.update(); // Redraw the chart
   // }

    // Call the functions when the page loads
   window.onload = async function () {
    // Show the loading overlay
    const loadingOverlay = document.getElementById('loading-overlay');
    loadingOverlay.style.display = 'flex';

    try {
        // Fetch all necessary data
        await loadCandidateCounts();
        await fetchDevOpsCount();
        await fetchplatformCount();
        await fetchcloudopsCount();
        await fetchsiteCount();
	await fetchdataanalystCount();
        await fetchdatabiCount();
        await fetchdataengineerCount();
        await fetchdatamodellerCount();
        await fetchAllCountsAndUpdateChart();
	 await  fetchgetCandidates();  
     await fetchPrescreeningCount();
     await fetchL1Count();
     await fetchL2Count();
        // await fetchCounts();
        // await fetchCounts1();
    } catch (error) {
        console.error('Error fetching data:', error);
    } finally {
        // Hide the loading overlay
        loadingOverlay.style.display = 'none';
    }
};
	
	//document.getElementById('imochaTestResults').addEventListener('click', () => {
        // Call the backend to generate the Excel file
     //   fetch('https://demotag.vercel.app/download-candidate-info', {
          //  method: 'GET',
          //  headers: {
             //   'Content-Type': 'application/json',
          //  },
      ///  })
       // .then(response => {
         //   if (response.ok) {
         //       return response.blob();  // Receive the response as a Blob (binary data)
        //    } else {
          //      throw new Error('Failed to download the report.');
         //   }
       // })
       // .then(blob => {
          //  const url = window.URL.createObjectURL(new Blob([blob]));
         //   const a = document.createElement('a');
          //  a.href = url;
         //   a.download = 'Candidate_Info_Report.xlsx';  // Specify the download file name
          //  document.body.appendChild(a);
         //   a.click();
        //    a.remove();  // Remove the anchor element after download
     //   })
      //  .catch(error => {
      //      console.error('Error downloading the report:', error);
      //  });
   // });
	//document.getElementById('imochareport').addEventListener('click', () => {
        // Call the backend to generate the Excel file
     //   fetch('https://demotag.vercel.app/Imocha-candidate-info', {
       //     method: 'GET',
     //       headers: {
    //            'Content-Type': 'application/json',
     //       },
     //   })
    //    .then(response => {
       //     if (response.ok) {
      //          return response.blob();  // Receive the response as a Blob (binary data)
      //      } else {
      //          throw new Error('Failed to download the report.');
       //     }
       // })
       // .then(blob => {
         //   const url = window.URL.createObjectURL(new Blob([blob]));
        //    const a = document.createElement('a');
         //   a.href = url;
//a.download = 'Candidate_Info_Report.xlsx';  // Specify the download file name
//document.body.appendChild(a);
//a.click();
            //a.remove();  // Remove the anchor element after download
//})
      //  .catch(error => {
     //       console.error('Error downloading the report:', error);
    //    });
   // });

   //imocha popup
 // Get modal elements
 const modal = document.getElementById('popupModal');
    const closeModal = document.querySelector('.close');
    const clickableContainer = document.getElementById('clickableContainer');

    // Show modal when the entire container is clicked
    clickableContainer.addEventListener('click', () => {
      modal.style.display = 'block';
    });

    // Close modal when the close button is clicked
    closeModal.addEventListener('click', () => {
      modal.style.display = 'none';
    });

    // Close modal when clicking outside the modal content
    window.addEventListener('click', (event) => {
      if (event.target === modal) {
        modal.style.display = 'none';
      }
    });



//    function downloadExcelReport() {
//             fetch('https://demotag.vercel.app/api/candidate-info', {
//                 method: 'GET',
//                 headers: {
//                     'Content-Type': 'application/json',
//                 },
//             })
//             .then(response => {
//                 if (response.ok) {
//                     return response.blob();  // Receive the response as a Blob (binary data)
//                 } else {
//                     throw new Error('Failed to download the report.');
//                 }
//             })
//             .then(blob => {
//                 const url = window.URL.createObjectURL(new Blob([blob]));
//                 const a = document.createElement('a');
//                 a.href = url;
//                 a.download = 'Candidate_Info_Report.xlsx';  // Specify the download file name
//                 document.body.appendChild(a);
//                 a.click();
//                 a.remove();  // Remove the anchor element after download
//             })
//             .catch(error => {
//                 console.error('Error downloading the report:', error);
//             });
//         }
    function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('show');
}
function handleDownloadSelection() {
            const dropdown = document.getElementById('downloadDropdown');
            const selectedOption = dropdown.value;
            const icon = document.getElementById('candidateinfo');

            // Remove existing click event listeners
            icon.onclick = null;

            // Attach the appropriate click event based on the selection
            if (selectedOption === 'ppt') {
                icon.onclick = downloadPageAsPpt;
            } else if (selectedOption === 'excel') {
                icon.onclick = downloadExcelReport;
            }
        }

        // fetch counts
  // Function to get URL parameters
function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

// Function to load candidate counts
let isLoading = false;

async function loadCandidateCounts(ec_mapping) {
    if (isLoading) return;  // Prevent duplicate calls
    isLoading = true;

    try {
        console.log("Fetching data for:", ec_mapping);
        const response = await fetch(`https://demotag.vercel.app/api/candidate-counts?eng_center=${encodeURIComponent(ec_mapping)}`);
        const data = await response.json();

        console.log("API Response:", data);

        if (data.error) {
            console.error(data.error);
            return;
        }

        document.getElementById('uploadCount').innerText = data.totalCount;
        document.getElementById('shortlistedCount').innerText = data.shortlistedCount;
        document.getElementById('rejectedCount').innerText = data.rejectedCount;
    } catch (error) {
        console.error('Error fetching candidate counts:', error);
    } finally {
        isLoading = false;  // Reset flag after fetching
    }
}



// Extract ec_mapping from URL and load data
document.addEventListener("DOMContentLoaded", () => {
    const ec_mapping = getQueryParam("ec_mapping");
    if (ec_mapping) {
        loadCandidateCounts(ec_mapping);
    } else {
        console.error("ec_mapping parameter is missing in the URL.");
    }
});


function downloadPageAsPpt() {
        html2canvas(document.body).then(canvas => {
            // Convert the canvas to a base64 image URL
            const imgData = canvas.toDataURL('image/png');

            // Create a new PowerPoint presentation
            let ppt = new PptxGenJS();
            let slide = ppt.addSlide();

            // Add the screenshot image to the slide
            slide.addImage({
                data: imgData,
                x: 0,
                y: 0,
                w: 10, // Width in inches (adjust to fit the slide)
                h: 5.63 // Height in inches (adjust to fit the slide)
            });

            // Download the presentation as a .pptx file
            ppt.writeFile({ fileName: 'webpage-screenshot.pptx' });
        });
    }
    document.querySelectorAll('.progress-ring').forEach((ring) => {
  // Get the progress value from the `--progress` inline style
  const progress = parseFloat(ring.style.getPropertyValue('--progress')) || 0;

  // Update the conic-gradient to reflect the progress
  ring.style.backgroundImage = `conic-gradient(green ${progress}%, lightgray 0)`;
});
// Get all the numbers from the DOM
// Function to fetch the `imocha_results` count from the backend
async function fetchCounts() {
    // Fetch counts for specific test names from your backend API
    try {
        const response = await fetch('https://demotag.vercel.app/api/test-counts');
        if (!response.ok) {
            throw new Error(`Failed to fetch counts: ${response.status}`);
        }
        const counts = await response.json();
        
        // Combined count for specific roles
        const combinedCloudCount = 
            (counts['Senior Azure DevOps Engineer - Cloud EC'] || 0) +
            (counts['Jr DevSecOps Engineer - AWS'] || 0) +
            (counts['Junior Azure DevOps Engineer'] || 0) +
            (counts['AWS Platform Lead'] || 0) +
            (counts['Azure Cloud Engineer - Cloud EC'] || 0);
        
        return {
            cloneJavaBackend: counts['Clone of_Java Backend Developer'] || 0,
            dataPythonPySpark: counts['Data_EC_ERIE_Python_PySpark'] || 0,
            combinedCloud: combinedCloudCount
        };
    } catch (error) {
        console.error('Error fetching test counts:', error);
        return {
            cloneJavaBackend: 0,
            dataPythonPySpark: 0,
            combinedCloud: 0
        };
    }
}

async function updateChartAndMetrics() {
    // Fetch the counts
    const counts = await fetchCounts();

    // Example data: other numbers would typically come from your backend
    const numbers = {
        totalApplicants: counts.cloneJavaBackend + counts.dataPythonPySpark + counts.combinedCloud,
        app: counts.cloneJavaBackend, // Replace with Clone of_Java Backend Developer count
        cloud: counts.combinedCloud, // Replace with combined Azure/AWS roles count
        data: counts.dataPythonPySpark, // Replace with Data_EC_ERIE_Python_PySpark count
        core: 0                      // Core applicants (if needed)
    };

    // Update metrics grid
    const totalApplicants = document.querySelector('.total-number');
    const appNumber = document.querySelector('.metrics-grid .dot-job-boards + div .number');
    const cloudNumber = document.querySelector('.metrics-grid .dot-referrals + div .number');
    const dataNumber = document.querySelector('.metrics-grid .dot-social + div .number');
    const coreNumber = document.querySelector('.metrics-grid .dot-agencies + div .number');

    totalApplicants.textContent = numbers.totalApplicants;
    appNumber.textContent = numbers.app; // Display Clone of_Java Backend Developer count
    cloudNumber.textContent = numbers.cloud; // Display combined Azure/AWS roles count
    dataNumber.textContent = numbers.data; // Display Data_EC_ERIE_Python_PySpark count
    coreNumber.textContent = numbers.core;

    // Calculate the percentage for each section
    const total = numbers.app + numbers.cloud + numbers.data + numbers.core;
    const appPercent = (numbers.app / total) * 100;
    const cloudPercent = (numbers.cloud / total) * 100;
    const dataPercent = (numbers.data / total) * 100;
    const corePercent = (numbers.core / total) * 100;

    // Create the conic-gradient string for the donut chart based on percentages
    let angleStart = 0;
    let gradientString = [
        `#e0e9ff ${angleStart}deg ${angleStart + (appPercent / 100) * 360}deg`, // App (Clone of_Java Backend Developer) color
        `#7de7d0 ${angleStart + (appPercent / 100) * 360}deg ${angleStart + (appPercent + cloudPercent) / 100 * 360}deg`, // Cloud (combined count) color
        `#c3f4ff ${angleStart + (appPercent + cloudPercent) / 100 * 360}deg ${angleStart + (appPercent + cloudPercent + dataPercent) / 100 * 360}deg`, // Data (Data_EC_ERIE_Python_PySpark) color
        `#b4ecd7 ${angleStart + (appPercent + cloudPercent + dataPercent) / 100 * 360}deg ${360}deg` // Core color
    ].join(', ');

    // Set the background of the donut chart dynamically
    document.querySelector('.donut-chart').style.background = `conic-gradient(${gradientString})`;
}

// Function to open the popup and fetch data
document.getElementById("card").addEventListener("click", function() {
    fetchCandidates(ec_mapping); // Call this function if needed for additional candidate data
    document.getElementById("popup").style.display = "flex";
    updateChartAndMetrics(); // Update metrics and chart when the popup opens
});

// Initial call to update the chart and metrics
updateChartAndMetrics();



// Your function to fetch candidates data
function getQueryParam(name) {
    const params = new URLSearchParams(window.location.search);
    console.log("Query Params:", params.toString()); // Debugging log
    return params.get(name) || ''; 
}

// Extract `ec_mapping`
const ec_mapping = getQueryParam('ec_mapping');
console.log("Extracted ec_mapping:", ec_mapping); 

// Fetch candidates using extracted `ec_mapping`
fetchCandidates(ec_mapping);

async function fetchCandidates(ec_mapping = '') {
    const headerSpinner = document.getElementById("headerSpinner");

    try {
        headerSpinner.style.display = "table-header-group";

        // Build API URL with eng_center query parameter
        let url = 'https://demotag.vercel.app/api/candidates';
        if (ec_mapping) {
            url += `?eng_center=${encodeURIComponent(ec_mapping)}`;
        }

        console.log("Fetching candidates from:", url); // Debugging log

        const response = await fetch(url);
        const data = await response.json();

        const tableBody = document.querySelector('#applicationsTable tbody');
        tableBody.innerHTML = ''; // Clear existing rows

        data.forEach(candidate => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${candidate.rrf_id}</td>
                <td>${candidate.candidate_name}</td>
                <td>${candidate.candidate_email}</td>
                <td>${candidate.prescreening_status}</td>
            `;
            tableBody.appendChild(row);
        });

        attachFilters();
    } catch (error) {
        console.error('Error fetching candidate data:', error);
    } finally {
        headerSpinner.style.display = "none";
    }
}
// Attach filtering functionality to all columns
function attachFilters() {
  document.getElementById('rrfFilter').addEventListener('input', function () {
        filterTable(0, this.value);
    });
    document.getElementById('nameFilter').addEventListener('input', function () {
        filterTable(1, this.value);
    });

    document.getElementById('emailFilter').addEventListener('input', function () {
        filterTable(2, this.value);
    });

    document.getElementById('statusFilter').addEventListener('input', function () {
        filterTable(3, this.value);
    });

    document.getElementById('roleFilter').addEventListener('input', function () {
        filterTable(4, this.value);
    });

    document.getElementById('phaseFilter').addEventListener('input', function () {
        filterTable(5, this.value);
    });

    document.getElementById('reasonFilter').addEventListener('input', function () {
        filterTable(6, this.value);
    });
    document.getElementById('rejectedDateFilter').addEventListener('input', function () {
        filterRejectedTable(7, this.value);
    });
}

// Generic filter function for all columns
function filterTable(columnIndex, filterValue) {
    const table = document.getElementById('applicationsTable');
    const rows = table.querySelectorAll('tbody tr');
    filterValue = filterValue.toLowerCase();

    rows.forEach(row => {
        const cell = row.cells[columnIndex];
        if (cell) {
            const cellText = cell.textContent || cell.innerText;
            row.style.display = cellText.toLowerCase().includes(filterValue) ? '' : 'none';
        }
    });
}

// Load data on page load
document.addEventListener('DOMContentLoaded', fetchCandidates);


// Function to close the popup
function closePopup() {
    document.getElementById("popup").style.display = "none";
}
// Function to open the popup for Shortlisted candidates and fetch data from the backend
document.getElementById("shortlistedCard").addEventListener("click", function() {
    fetchShortlistedCandidates(ec_mapping);
    document.getElementById("shortlistedPopup").style.display = "flex";
});

// Function to fetch shortlisted candidates' data
async function fetchShortlistedCandidates(ec_mapping = '') {
    const shortlistedSpinner = document.getElementById("shortlistedSpinner");

    try {
        // Show the spinner
        shortlistedSpinner.style.display = "table-header-group";

        let url = 'https://demotag.vercel.app/api/candidates/shortlisted';
        if (ec_mapping) {
            url += `?eng_center=${encodeURIComponent(ec_mapping)}`;
        }

        const response = await fetch(url);
        const data = await response.json();

        const tableBody = document.querySelector('#shortlistedTable tbody');
        tableBody.innerHTML = ''; // Clear existing rows

        data.forEach(candidate => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${candidate.rrf_id}</td>
                <td>${candidate.candidate_name}</td>
                <td>${candidate.candidate_email}</td>
                <td>${candidate.prescreening_status}</td>
            `;
            tableBody.appendChild(row);
        });

        attachFiltersToShortlistedTable();
    } catch (error) {
        console.error('Error fetching shortlisted candidate data:', error);
    } finally {
        shortlistedSpinner.style.display = "none";
    }
}

// Attach filtering functionality to shortlisted candidates
function attachFiltersToShortlistedTable() {
  document.getElementById('rrfFilter').addEventListener('input', function () {
        filterTable(0, this.value);
    });
    document.getElementById('shortlistedNameFilter').addEventListener('input', function () {
        filterShortlistedTable(1, this.value);
    });

    document.getElementById('shortlistedEmailFilter').addEventListener('input', function () {
        filterShortlistedTable(2, this.value);
    });

    document.getElementById('shortlistedStatusFilter').addEventListener('input', function () {
        filterShortlistedTable(3, this.value);
    });

    document.getElementById('shortlistedRoleFilter').addEventListener('input', function () {
        filterShortlistedTable(4, this.value);
    });

    document.getElementById('shortlistedPhaseFilter').addEventListener('input', function () {
        filterShortlistedTable(5, this.value);
    });

    document.getElementById('shortlistedReasonFilter').addEventListener('input', function () {
        filterShortlistedTable(6, this.value);
    });
    document.getElementById('rejectedDateFilter').addEventListener('input', function () {
        filterRejectedTable(7, this.value);
    });

}

// Generic filter function for shortlisted candidates
function filterShortlistedTable(columnIndex, filterValue) {
    const table = document.getElementById('shortlistedTable');
    const rows = table.querySelectorAll('tbody tr');
    filterValue = filterValue.toLowerCase();

    rows.forEach(row => {
        const cell = row.cells[columnIndex];
        if (cell) {
            const cellText = cell.textContent || cell.innerText;
            row.style.display = cellText.toLowerCase().includes(filterValue) ? '' : 'none';
        }
    });
}

// Load shortlisted candidates data on page load
document.addEventListener('DOMContentLoaded', fetchShortlistedCandidates);


// Function to close the shortlisted popup
function closeShortlistedPopup() {
    document.getElementById("shortlistedPopup").style.display = "none";
}
// Function to open the popup for Rejected candidates and fetch data from the backend
document.getElementById("rejectedCard").addEventListener("click", function() {
    fetchRejectedCandidates(ec_mapping);
    document.getElementById("rejectedPopup").style.display = "flex";
});

// Function to fetch rejected candidates' data
async function fetchRejectedCandidates(ec_mapping = '') {
    const rejectedSpinner = document.getElementById("rejectedSpinner");

    try {
        // Show the spinner
        rejectedSpinner.style.display = "table-header-group";

        let url = 'https://demotag.vercel.app/api/candidates/rejected';
        if (ec_mapping) {
            url += `?eng_center=${encodeURIComponent(ec_mapping)}`;
        }

        const response = await fetch(url);
        const data = await response.json();

        const tableBody = document.querySelector('#rejectedTable tbody');
        tableBody.innerHTML = ''; // Clear existing rows

        data.forEach(candidate => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${candidate.rrf_id}</td>
                <td>${candidate.candidate_name}</td>
                <td>${candidate.candidate_email}</td>
                <td>${candidate.prescreening_status}</td>
            `;
            tableBody.appendChild(row);
        });

        attachFiltersToRejectedTable();
    } catch (error) {
        console.error('Error fetching rejected candidate data:', error);
    } finally {
        rejectedSpinner.style.display = "none";
    }
}
// Attach filtering functionality to rejected candidates
function attachFiltersToRejectedTable() {
  document.getElementById('rrfFilter').addEventListener('input', function () {
        filterTable(0, this.value);
    });
    document.getElementById('rejectedNameFilter').addEventListener('input', function () {
        filterRejectedTable(1, this.value);
    });

    document.getElementById('rejectedEmailFilter').addEventListener('input', function () {
        filterRejectedTable(2, this.value);
    });

    document.getElementById('rejectedStatusFilter').addEventListener('input', function () {
        filterRejectedTable(3, this.value);
    });

    document.getElementById('rejectedRoleFilter').addEventListener('input', function () {
        filterRejectedTable(4, this.value);
    });

    document.getElementById('rejectedPhaseFilter').addEventListener('input', function () {
        filterRejectedTable(5, this.value);
    });

    document.getElementById('rejectedReasonFilter').addEventListener('input', function () {
        filterRejectedTable(6, this.value);
    });
    document.getElementById('rejectedDateFilter').addEventListener('input', function () {
        filterRejectedTable(7, this.value);
    });
}

// Generic filter function for rejected candidates
function filterRejectedTable(columnIndex, filterValue) {
    const table = document.getElementById('rejectedTable');
    const rows = table.querySelectorAll('tbody tr');
    filterValue = filterValue.toLowerCase();

    rows.forEach(row => {
        const cell = row.cells[columnIndex];
        if (cell) {
            const cellText = cell.textContent || cell.innerText;
            row.style.display = cellText.toLowerCase().includes(filterValue) ? '' : 'none';
        }
    });
}

// Load rejected candidates data on page load
document.addEventListener('DOMContentLoaded', fetchRejectedCandidates);

async function fetchPrescreeningCount() {
    try {
        // Replace with your actual API endpoint
        const response = await fetch('https://demotag.vercel.app/api/prescreening-count');
        const data = await response.json();

        const count = data.prescreening_count; // Fetch the prescreening count
        const progressRing = document.getElementById('prescreeningProgressRing');

        // Calculate the percentage progress (use `count` directly if it's a percentage)
        const progressPercentage = count; // Assuming count is already a percentage

        // Update the --progress variable dynamically
        progressRing.style.setProperty('--progress', `${progressPercentage}%`);

        // Update the inner text to show the count with percentage
        progressRing.textContent = `${count}%`;
    } catch (error) {
        console.error('Error fetching prescreening count:', error);

        // Fallback in case of error
        const progressRing = document.getElementById('prescreeningProgressRing');
        progressRing.textContent = 'Error';
    }
}
//move to l1
async function fetchL1Count() {
    try {
        // Replace with your actual API endpoint
        const response = await fetch('https://demotag.vercel.app/api/move-to-l1-count');
        const data = await response.json();

        const count = data.move_to_l1_count; // Fetch the prescreening count
        const progressRing = document.getElementById('l1ProgressRing');

        // Calculate the percentage progress (use `count` directly if it's a percentage)
        const progressPercentage = count; // Assuming count is already a percentage

        // Update the --progress variable dynamically
        progressRing.style.setProperty('--progress', `${progressPercentage}%`);

        // Update the inner text to show the count with percentage
        progressRing.textContent = `${count}%`;
    } catch (error) {
        console.error('Error fetching prescreening count:', error);

        // Fallback in case of error
        const progressRing = document.getElementById('l1ProgressRing');
        progressRing.textContent = 'Error';
    }
}
//move to l1
async function fetchL2Count() {
    try {
        // Replace with your actual API endpoint
        const response = await fetch('https://demotag.vercel.app/api/moved-to-l2-count');
        const data = await response.json();

        const count = data.moved_to_l2_count; // Fetch the prescreening count
        const progressRing = document.getElementById('l2ProgressRing');

        // Calculate the percentage progress (use `count` directly if it's a percentage)
        const progressPercentage = count; // Assuming count is already a percentage

        // Update the --progress variable dynamically
        progressRing.style.setProperty('--progress', `${progressPercentage}%`);

        // Update the inner text to show the count with percentage
        progressRing.textContent = `${count}%`;
    } catch (error) {
        console.error('Error fetching prescreening count:', error);

        // Fallback in case of error
        const progressRing = document.getElementById('l2ProgressRing');
        progressRing.textContent = 'Error';
    }
}

// Call the function when the page loads
//window.onload = fetchPrescreeningCount;


// Call the function when the page loads



// Call the function when the page loads
// window.onload = fetchPrescreeningCount;





// Call the function when the page loads



// Function to close the rejected popup
function closeRejectedPopup() {
    document.getElementById("rejectedPopup").style.display = "none";
}
document.addEventListener("DOMContentLoaded", () => {
        const popup = document.getElementById("popup");
        popup.style.display = "none";
    });

    function openPopup() {
        const popup = document.getElementById("popup");
        popup.style.display = "flex"; // Show popup
        document.body.classList.add("popup-active"); // Prevent scrolling
    }

    function closePopup() {
        const popup = document.getElementById("popup");
        popup.style.display = "none"; // Hide popup
        document.body.classList.remove("popup-active"); // Enable scrolling
    }

    function populateTaskDate() {
    const today = new Date();
 
    // Format the date (e.g., Month Day, Year)
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    const formattedDate = today.toLocaleDateString(undefined, options);
 
    // Find the task-date element and set its content
    const taskDateElement = document.querySelector('.task-date');
    if (taskDateElement) {
      taskDateElement.textContent = formattedDate;
    }
  }
 
  // Call the function to populate the date
  populateTaskDate();










  // Initialize the chart with empty data (no static data)
document.addEventListener('DOMContentLoaded', () => {
    const ctx = document.getElementById('hrChart').getContext('2d');

    let hrChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Prescreening', 'Technical L1(Imocha)', 'Techincal L2','EC Fitment','Project Fitment','Client Interview', 'Shortlisted'], // All recruitment phases as labels
        datasets: [], // Data will be added dynamically here
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'top',
            labels: { boxWidth: 12, font: { size: 10 } },
          },
        },
        scales: {
          x: { stacked: true },
          y: { stacked: true, beginAtZero: true },
        },
      },
    });

    // Fetch phase counts and update chart for all HRs
    async function fetchPhaseCounts() {
      try {
        const response = await fetch('https://demotag.vercel.app/api/phase-counts');
        const data = await response.json();

        // Map recruitment_phase to the dataset index
        const phaseMap = {
          prescreening: 0,
          'Move to L1': 1,
          'L2 Scheduled': 2,
          Shortlisted: 3,
        };

        // Prepare a map of HR emails to their corresponding phase data
        const hrData = {};

        // Organize data by HR email and phase
        data.forEach((item) => {
          const hrEmail = item.hr_email;
          const phase = item.recruitment_phase;
          const count = parseInt(item.phase_count, 10);

          if (!hrData[hrEmail]) {
            hrData[hrEmail] = [0, 0, 0, 0]; // Initialize array for HR's phases
          }

          if (phaseMap[phase] !== undefined) {
            hrData[hrEmail][phaseMap[phase]] = count;
          }
        });

        // Reset datasets
        hrChart.data.datasets = [];

        // Add a dataset for each HR email
        Object.keys(hrData).forEach((hrEmail) => {
          hrChart.data.datasets.push({
            label: hrEmail, // Use HR email as the label
            data: hrData[hrEmail],
            backgroundColor: getRandomColor(), // Random color for each HR
          });
        });

        // Update the chart with the new data
        hrChart.update();
      } catch (error) {
        console.error('Error fetching phase counts:', error);
      }
    }

    // Function to generate a random color for each HR email
    function getRandomColor() {
      const letters = '0123456789ABCDEF';
      let color = '#';
      for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
      }
      return color;
    }

    // Fetch and update the chart when the page loads
    fetchPhaseCounts();
  });

  document.addEventListener("DOMContentLoaded", () => {
    // Get references to the elements
    const rrfContainer = document.querySelector('.container-RRF');
    const popup = document.getElementById('popup');

    // Function to open the popup
    const openPopup = () => {
        popup.style.display = 'block'; // Make the popup visible
    };

    // Function to close the popup
    const closePopup = () => {
        popup.style.display = 'none'; // Hide the popup
    };

    // Add click event listener to the RRF container
    rrfContainer.addEventListener('click', openPopup);

    // Add click event listener to the close button inside the popup
    document.querySelector('#popup span').addEventListener('click', closePopup);
});

document.addEventListener("DOMContentLoaded", function () {
    const urlParams = new URLSearchParams(window.location.search);
    const ecMappingParam = urlParams.get("ec_mapping");

    console.log("EC Mapping Value:", ecMappingParam); // Debugging

    // Define role groups for different EC mappings
    const roleGroups = {
        "Data EC": [
            "data-engineer-applicants",
            "bi-visualization-applicants",
            "data-analyst-applicants",
            "data-modeller-applicants"
        ],
        "Cloud EC": [
            "cloudops-applicants",
            "site-applicants",
            "platform-applicants",
            "devops-applicants"
        ],
        "App EC": [
            "cloud-native-backend-applicants",
            "cloud-native-frontend-applicants",
            "lcnc-platform-engineer-applicants",
            "integration-engineer-applicants"
        ]
    };

    // Get all job cards
    const jobCards = document.querySelectorAll(".cardss");
    const qaCard = document.getElementById("qa-engineer-card");

    if (ecMappingParam) {
        // Split EC mappings if multiple values exist
        const selectedECs = ecMappingParam.split(",").map(ec => ec.trim());

        // If all three ECs are selected, show the QA Engineer card
        if (
            selectedECs.includes("App EC") &&
            selectedECs.includes("Data EC") &&
            selectedECs.includes("Cloud EC")
        ) {
            qaCard.style.display = "block"; // Show the QA Engineer card
        } else {
            qaCard.style.display = "none"; // Hide the QA Engineer card
        }

        // If only one EC is selected, use previous logic
        if (selectedECs.length === 1 && roleGroups[selectedECs[0]]) {
            jobCards.forEach(card => {
                const applicantsDiv = card.querySelector(".applicants");
                if (!roleGroups[selectedECs[0]].includes(applicantsDiv.id)) {
                    card.style.display = "none"; // Hide non-matching cards
                }
            });
        } else {
            // Multiple ECs are present, so pick one role from each EC
            let selectedRoles = new Set(); // To store unique selected roles

            selectedECs.forEach(ec => {
                if (roleGroups[ec]) {
                    selectedRoles.add(roleGroups[ec][0]); // Pick the first role from each EC
                }
            });

            jobCards.forEach(card => {
                const applicantsDiv = card.querySelector(".applicants");
                if (!selectedRoles.has(applicantsDiv.id)) {
                    card.style.display = "none"; // Hide non-matching cards
                }
            });
        }
    }
});

document.addEventListener("DOMContentLoaded", function () {
    // Retrieve selected filter from localStorage
    const savedFilter = localStorage.getItem("selectedFilter");
    if (savedFilter) {
        document.getElementById("filterSelect").value = savedFilter;
        toggleDateInputs();
    }

    // Retrieve and set custom date values if stored
    if (savedFilter === "custom_range") {
        document.getElementById("startDate").value = localStorage.getItem("startDate") || "";
        document.getElementById("endDate").value = localStorage.getItem("endDate") || "";
    }
});

function toggleDateInputs() {
    const filterType = document.getElementById('filterSelect').value;
    const customDateRange = document.getElementById('customDateRange');

    customDateRange.style.display = (filterType === 'custom_range') ? 'block' : 'none';
}

async function updateFilter() {
    const filterType = document.getElementById('filterSelect').value;
    let startDate = null, endDate = null;

    // Save selected filter to localStorage
    localStorage.setItem("selectedFilter", filterType);

    if (filterType === 'custom_range') {
        startDate = document.getElementById('startDate').value;
        endDate = document.getElementById('endDate').value;

        if (!startDate || !endDate) {
            alert("Please select both start and end dates.");
            return;
        }

        // Save custom range dates
        localStorage.setItem("startDate", startDate);
        localStorage.setItem("endDate", endDate);
    }

    await fetch('https://demotag.vercel.app/api/update-visibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filterType, startDate, endDate })
    });

    window.location.reload(); // Reload to reflect changes
}




  // Fetch HR names and populate the dropdown
//   async function fetchHRNames() {
//     try {
//       const response = await fetch('https://demotag.vercel.app/api/hr-names');
//       const result = await response.json();

//       if (result.success) {
//         const hrDropdown = document.getElementById('hrnames');
//         hrDropdown.innerHTML = '<option value="default" disabled selected>Select HR</option>'; // Reset dropdown

//         result.hrNames.forEach((name) => {
//           const option = document.createElement('option');
//           option.value = name;
//           option.textContent = name;
//           hrDropdown.appendChild(option);
//         });
//       } else {
//         console.error('Failed to fetch HR names:', result.error);
//       }
//     } catch (error) {
//       console.error('Error fetching HR names:', error);
//     }
//   }

  // Fetch recruitment phase data for the selected HR
//   async function fetchHRPhaseData(hrName) {
//     try {
//       const response = await fetch(`https://demotag.vercel.app/api/hr-phases?hrName=${encodeURIComponent(hrName)}`);
//       const result = await response.json();

//       if (result.success) {
//         // Update the chart with dynamic data for selected HR
//         hrChart.data.labels = ['Recruitment Phases']; // Single bar
//         hrChart.data.datasets[0].data = [result.data.PreScreening || 0];
//         hrChart.data.datasets[1].data = [result.data['L1 iMocha'] || 0];
//         hrChart.data.datasets[2].data = [result.data['L2 Interview'] || 0];
//         hrChart.data.datasets[3].data = [result.data['Fitment Round'] || 0];
//         hrChart.update();
//       } else {
//         console.error('Failed to fetch HR phase data:', result.error);
//       }
//     } catch (error) {
//       console.error('Error fetching HR phase data:', error);
//     }
//   }

  // Update chart data based on "Last Week/Last Month" dropdown
//   document.getElementById('filter').addEventListener('change', (event) => {
//     const selected = event.target.value;
//     // Fetch the HR phase data for the selected HR and time period
//     const selectedHR = document.getElementById('hrnames').value;
//     if (selectedHR !== 'default') {
//       fetchHRPhaseData(selectedHR, selected); // Fetch dynamic HR data for the selected time period
//     }
//   });

  // Handle HR name change to fetch dynamic HR data
//   document.getElementById('hrnames').addEventListener('change', (event) => {
//     const hrName = event.target.value;
//     if (hrName !== 'default') {
//       fetchHRPhaseData(hrName); // Fetch dynamic HR data
//     }
//   });

  // Initialize by fetching HR names when the page loads
//   document.addEventListener('DOMContentLoaded', fetchHRNames);
