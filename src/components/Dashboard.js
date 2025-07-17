import React, { useState, useEffect, useRef } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import ChartDataLabels from 'chartjs-plugin-datalabels';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, ChartDataLabels);

const Dashboard = ({ showToast, userInfo }) => {
  const [dashboardData, setDashboardData] = useState({
    uploadCount: 0,
    shortlistedCount: 0,
    rejectedCount: 0,
    devopsCount: 0,
    platformCount: 0,
    cloudopsCount: 0,
    migrationCount: 0,
    appCounts: {
      frontend: 0,
      backend: 0,
      lcnc: 0,
      integration: 0
    },
    dataCounts: {
      dataEngineer: 0,
      dataOps: 0,
      biVisualization: 0,
      dataModeller: 0,
      dataAnalyst: 0,
      dataArchitect: 0,
      dataScientist: 0
    }
  });

  const [loading, setLoading] = useState(true);
  const [sidebarVisible, setSidebarVisible] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load candidate counts
      const candidateResponse = await fetch('/api/candidate-counts');
      const candidateData = await candidateResponse.json();
      
      // Load cloud counts
      const cloudCounts = await Promise.all([
        fetch('/api/devops-resume-count').then(res => res.json()).then(data => data.count || 0),
        fetch('/api/platform-resume-count').then(res => res.json()).then(data => data.count || 0),
        fetch('/api/cloudops-resume-count').then(res => res.json()).then(data => data.count || 0),
        fetch('/api/migration-resume-count').then(res => res.json()).then(data => data.count || 0),
      ]);

      // Load app counts
      const appCounts = await Promise.all([
        fetch('/api/snow-resume-count').then(res => res.json()).then(data => data.count || 0),
        fetch('/api/reactjs-resume-count').then(res => res.json()).then(data => data.count || 0),
        fetch('/api/hadoop-resume-count').then(res => res.json()).then(data => data.count || 0),
        fetch('/api/java-resume-count').then(res => res.json()).then(data => data.count || 0),
      ]);

      // Load data counts
      const dataCounts = await Promise.all([
        fetch('/api/dataengineer-resume-count').then(res => res.json()).then(data => data.count || 0),
        fetch('/api/dataops-resume-count').then(res => res.json()).then(data => data.count || 0),
        fetch('/api/bivisualization-resume-count').then(res => res.json()).then(data => data.count || 0),
        fetch('/api/datamodeller-resume-count').then(res => res.json()).then(data => data.count || 0),
        fetch('/api/dataanalyst-resume-count').then(res => res.json()).then(data => data.count || 0),
        fetch('/api/dataarchitect-resume-count').then(res => res.json()).then(data => data.count || 0),
        fetch('/api/datascientist-resume-count').then(res => res.json()).then(data => data.count || 0),
      ]);

      setDashboardData({
        uploadCount: candidateData.totalCount || 0,
        shortlistedCount: candidateData.shortlistedCount || 0,
        rejectedCount: candidateData.rejectedCount || 0,
        devopsCount: cloudCounts[0],
        platformCount: cloudCounts[1],
        cloudopsCount: cloudCounts[2],
        migrationCount: cloudCounts[3],
        appCounts: {
          frontend: appCounts[0],
          backend: appCounts[1],
          lcnc: appCounts[2],
          integration: appCounts[3]
        },
        dataCounts: {
          dataEngineer: dataCounts[0],
          dataOps: dataCounts[1],
          biVisualization: dataCounts[2],
          dataModeller: dataCounts[3],
          dataAnalyst: dataCounts[4],
          dataArchitect: dataCounts[5],
          dataScientist: dataCounts[6]
        }
      });

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      showToast('Error loading dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };

  const navigateTo = (page) => {
    window.location.href = page;
  };

  // Chart configurations
  const statusChartData = {
    labels: ['Devops', 'Platform', 'Cloudops', 'Migration'],
    datasets: [{
      data: [
        dashboardData.devopsCount,
        dashboardData.platformCount,
        dashboardData.cloudopsCount,
        dashboardData.migrationCount
      ],
      backgroundColor: ['#d7bde2', '#7fb3d5', '#76d7c4', '#f5cba7'],
    }]
  };

  const appChartData = {
    labels: [
      'App Engineer - Front End',
      'App Engineer - Backend',
      'LCNC Platform Engineer',
      'Integration Engineer'
    ],
    datasets: [{
      data: [
        dashboardData.appCounts.frontend,
        dashboardData.appCounts.backend,
        dashboardData.appCounts.lcnc,
        dashboardData.appCounts.integration
      ],
      backgroundColor: ['#d7bde2', '#7fb3d5', '#f5cba7', '#76d7c4'],
    }]
  };

  const dataChartData = {
    labels: [
      'Data Engineer',
      'Data-Ops Engineer',
      'Data – BI Visualization Engineer',
      'Data Modeller',
      'Data Analyst',
      'Data Architect',
      'Data Scientist –AI/ML'
    ],
    datasets: [{
      data: [
        dashboardData.dataCounts.dataEngineer,
        dashboardData.dataCounts.dataOps,
        dashboardData.dataCounts.biVisualization,
        dashboardData.dataCounts.dataModeller,
        dashboardData.dataCounts.dataAnalyst,
        dashboardData.dataCounts.dataArchitect,
        dashboardData.dataCounts.dataScientist
      ],
      backgroundColor: [
        '#d7bde2', '#7fb3d5', '#76d7c4', '#f5cba7',
        '#85c1e9', '#f8c471', '#82e0aa'
      ],
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          color: 'black',
        },
      },
      datalabels: {
        color: 'black',
        formatter: function (value) {
          return value > 0 ? value : null;
        },
        anchor: 'center',
        align: 'center',
        font: {
          size: 14,
        },
      },
    },
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: 'black',
        },
      },
      x: {
        ticks: {
          color: 'black',
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      datalabels: {
        anchor: 'center',
        align: 'center',
        color: 'black',
        formatter: function (value) {
          return value;
        },
        font: {
          size: 12,
        },
      },
    },
  };

  if (loading) {
    return <div className="loading-spinner"></div>;
  }

  return (
    <div style={{ 
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      margin: 0,
      padding: 0,
      background: "linear-gradient(120deg, #e6e6fa, #daf7a6)",
      color: "#e0e0e0",
      minHeight: "100vh",
      overflowX: "hidden"
    }}>
      {/* Header */}
      <div style={{
        background: "white",
        padding: "10px 20px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
      }}>
        <button
          onClick={toggleSidebar}
          style={{
            backgroundColor: "white",
            color: "black",
            border: "none",
            cursor: "pointer",
            fontSize: "18px",
            width: "93px"
          }}
        >
          ☰ Menu
        </button>
        <h1 style={{ color: "black", margin: 0 }}>Dashboard</h1>
        <div></div>
      </div>

      {/* Main Content */}
      <div style={{ padding: "20px" }}>
        {/* Dashboard Cards */}
        <div className="dashboard-grid">
          <div className="dashboard-card" onClick={() => navigateTo('upload-status.html')}>
            <i className="fas fa-upload" style={{ color: "#007bff" }}></i>
            <h2 style={{ color: "black" }}>{dashboardData.uploadCount}</h2>
            <p style={{ color: "black" }}>Total Uploaded</p>
          </div>
          
          <div className="dashboard-card" onClick={() => navigateTo('candidatespage.html')}>
            <i className="fas fa-user-check" style={{ color: "#28a745" }}></i>
            <h2 style={{ color: "black" }}>{dashboardData.shortlistedCount}</h2>
            <p style={{ color: "black" }}>Shortlisted</p>
          </div>
          
          <div className="dashboard-card" onClick={() => navigateTo('candidatespage.html')}>
            <i className="fas fa-user-times" style={{ color: "#dc3545" }}></i>
            <h2 style={{ color: "black" }}>{dashboardData.rejectedCount}</h2>
            <p style={{ color: "black" }}>Rejected</p>
          </div>
          
          <div className="dashboard-card" onClick={() => navigateTo('existing-candidates.html')}>
            <i className="fas fa-users" style={{ color: "#ffc107" }}></i>
            <h2 style={{ color: "black" }}>0</h2>
            <p style={{ color: "black" }}>Existing Candidates</p>
          </div>
        </div>

        {/* Charts Section */}
        <div style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          flexWrap: "wrap",
          gap: "20px"
        }}>
          {/* Cloud Charts */}
          <div className="dashboard-chart">
            <h3>Cloud Team Distribution</h3>
            <div style={{ height: "165px", padding: "0 20px" }}>
              <Doughnut data={statusChartData} options={chartOptions} />
            </div>
          </div>
          
          <div className="dashboard-chart">
            <h3>Cloud Team Bar Chart</h3>
            <div style={{ height: "165px", padding: "0 20px" }}>
              <Bar data={statusChartData} options={barChartOptions} />
            </div>
          </div>

          {/* App Charts */}
          <div className="dashboard-chart">
            <h3>App Team Distribution</h3>
            <div style={{ height: "165px", padding: "0 20px" }}>
              <Doughnut data={appChartData} options={chartOptions} />
            </div>
          </div>
          
          <div className="dashboard-chart">
            <h3>App Team Bar Chart</h3>
            <div style={{ height: "165px", padding: "0 20px" }}>
              <Bar data={appChartData} options={barChartOptions} />
            </div>
          </div>

          {/* Data Charts */}
          <div className="dashboard-chart">
            <h3>Data Team Distribution</h3>
            <div style={{ height: "165px", padding: "0 20px" }}>
              <Doughnut data={dataChartData} options={chartOptions} />
            </div>
          </div>
          
          <div className="dashboard-chart">
            <h3>Data Team Bar Chart</h3>
            <div style={{ height: "165px", padding: "0 20px" }}>
              <Bar data={dataChartData} options={barChartOptions} />
            </div>
          </div>
        </div>

        {/* Additional Info Cards */}
        <div style={{ 
          display: "flex", 
          gap: "20px", 
          marginTop: "30px",
          flexWrap: "wrap"
        }}>
          <div style={{
            backgroundColor: "white",
            borderRadius: "8px",
            padding: "20px",
            flex: 1,
            minWidth: "200px"
          }}>
            <h3 style={{ color: "black", marginTop: 0 }}>Recent Activity</h3>
            <p style={{ color: "black" }}>Latest candidate uploads and status updates</p>
          </div>
          
          <div style={{
            backgroundColor: "white",
            borderRadius: "8px",
            padding: "20px",
            flex: 1,
            minWidth: "200px"
          }}>
            <h3 style={{ color: "black", marginTop: 0 }}>Quick Actions</h3>
            <button 
              onClick={() => navigateTo('Recruitment.html')}
              className="button"
              style={{ marginRight: "10px" }}
            >
              Upload Resumes
            </button>
            <button 
              onClick={() => navigateTo('candidatespage.html')}
              className="button secondary"
            >
              View Candidates
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;