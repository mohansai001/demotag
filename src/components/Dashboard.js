import React, { useState, useEffect, useRef } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import './Dashboard.css';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, ChartDataLabels);

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    shortlisted: 0,
    rejected: 0,
    resume: 0,
    pending: 0
  });
  const [chartData, setChartData] = useState({
    status: {
      labels: ['Devops', 'Platform', 'Cloudops', 'Migration'],
      datasets: [{
        data: [0, 0, 0, 0],
        backgroundColor: ['#d7bde2', '#7fb3d5', '#76d7c4', '#f5cba7']
      }]
    },
    role: {
      labels: ['App Engineer - Front End', 'App Engineer - Backend', 'LCNC Platform Engineer', 'Integration Engineer'],
      datasets: [{
        label: 'Applicants',
        data: [0, 0, 0, 0],
        backgroundColor: ['#d7bde2', '#7fb3d5', '#f5cba7', '#76d7c4']
      }]
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch dashboard statistics
      const statsResponse = await fetch('/api/dashboard-stats');
      if (statsResponse.ok) {
        const stats = await statsResponse.json();
        setDashboardData(stats);
      }

      // Fetch chart data
      const chartResponse = await fetch('/api/chart-data');
      if (chartResponse.ok) {
        const charts = await chartResponse.json();
        setChartData(charts);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      window.showToast('Error loading dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const chartOptions = {
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
        formatter: (value) => value > 0 ? value : null,
        anchor: 'center',
        align: 'center',
        font: {
          size: 14
        }
      }
    }
  };

  const barChartOptions = {
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
        formatter: (value) => value,
        font: {
          size: 12
        }
      }
    }
  };

  const navigateTo = (page) => {
    window.location.href = page;
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Recruitment Dashboard</h1>
        <div className="dashboard-actions">
          <button className="btn btn-primary" onClick={() => navigateTo('/recruitment')}>
            <i className="fas fa-plus"></i> New Recruitment
          </button>
          <button className="btn btn-secondary" onClick={() => navigateTo('/candidates')}>
            <i className="fas fa-users"></i> View Candidates
          </button>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <div className="card-icon">
            <i className="fas fa-check-circle" style={{ color: '#28a745' }}></i>
          </div>
          <div className="card-content">
            <h3>{dashboardData.shortlisted}</h3>
            <p>Shortlisted</p>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-icon">
            <i className="fas fa-times-circle" style={{ color: '#dc3545' }}></i>
          </div>
          <div className="card-content">
            <h3>{dashboardData.rejected}</h3>
            <p>Rejected</p>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-icon">
            <i className="fas fa-file-alt" style={{ color: '#007bff' }}></i>
          </div>
          <div className="card-content">
            <h3>{dashboardData.resume}</h3>
            <p>Resumes</p>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-icon">
            <i className="fas fa-clock" style={{ color: '#ffc107' }}></i>
          </div>
          <div className="card-content">
            <h3>{dashboardData.pending}</h3>
            <p>Pending</p>
          </div>
        </div>
      </div>

      <div className="charts-container">
        <div className="chart-section">
          <div className="chart-card">
            <div className="card-header">
              <h3>Status Distribution</h3>
            </div>
            <div className="chart-wrapper">
              <Doughnut 
                data={chartData.status} 
                options={chartOptions}
                plugins={[ChartDataLabels]}
              />
            </div>
          </div>

          <div className="chart-card">
            <div className="card-header">
              <h3>Role Distribution</h3>
            </div>
            <div className="chart-wrapper">
              <Bar 
                data={chartData.role} 
                options={barChartOptions}
                plugins={[ChartDataLabels]}
              />
            </div>
          </div>
        </div>

        <div className="chart-section">
          <div className="chart-card">
            <div className="card-header">
              <h3>Application Status</h3>
            </div>
            <div className="chart-wrapper">
              <Doughnut 
                data={{
                  labels: ['App Engineer - Front End', 'App Engineer - Backend', 'LCNC Platform Engineer', 'Integration Engineer'],
                  datasets: [{
                    data: [0, 0, 0, 0],
                    backgroundColor: ['#d7bde2', '#7fb3d5', '#f5cba7', '#76d7c4']
                  }]
                }}
                options={chartOptions}
                plugins={[ChartDataLabels]}
              />
            </div>
          </div>

          <div className="chart-card">
            <div className="card-header">
              <h3>Applications by Role</h3>
            </div>
            <div className="chart-wrapper">
              <Bar 
                data={{
                  labels: ['App Engineer - Front End', 'App Engineer - Backend', 'LCNC Platform Engineer', 'Integration Engineer'],
                  datasets: [{
                    label: 'Applicants',
                    data: [0, 0, 0, 0],
                    backgroundColor: ['#d7bde2', '#7fb3d5', '#f5cba7', '#76d7c4']
                  }]
                }}
                options={barChartOptions}
                plugins={[ChartDataLabels]}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-actions-footer">
        <button className="btn btn-success" onClick={() => navigateTo('/interviews')}>
          <i className="fas fa-calendar"></i> Schedule Interview
        </button>
        <button className="btn btn-info" onClick={() => navigateTo('/panel')}>
          <i className="fas fa-users"></i> Panel Management
        </button>
        <button className="btn btn-warning" onClick={() => navigateTo('/feedback')}>
          <i className="fas fa-comment"></i> Feedback
        </button>
      </div>
    </div>
  );
};

export default Dashboard;