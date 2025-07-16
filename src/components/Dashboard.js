import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { toast } from 'react-toastify';
import SidebarMenu from './common/SidebarMenu';
import './Dashboard.css';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels
);

const Dashboard = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [ecMapping, setEcMapping] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    totalCandidates: 0,
    shortlisted: 0,
    rejected: 0,
    pending: 0,
    cloudRoles: [0, 0, 0, 0],
    appRoles: [0, 0, 0, 0],
    dataRoles: [0, 0, 0, 0, 0, 0, 0],
  });

  useEffect(() => {
    const ecMappingParam = searchParams.get('ec_mapping');
    if (ecMappingParam) {
      setEcMapping(ecMappingParam);
    }
    fetchDashboardData();
  }, [searchParams]);

  const fetchDashboardData = async () => {
    try {
      // Fetch various counts from the API
      const fetchCount = async (endpoint) => {
        const response = await fetch(`/api/${endpoint}`);
        const data = await response.json();
        return data.count || 0;
      };

      // Cloud roles
      const devopsCount = await fetchCount('devops-resume-count');
      const platformCount = await fetchCount('platform-resume-count');
      const cloudopsCount = await fetchCount('cloudops-resume-count');
      const migrationCount = await fetchCount('migration-resume-count');

      // App roles
      const reactCount = await fetchCount('reactjs-resume-count');
      const snowCount = await fetchCount('snow-resume-count');
      const hadoopCount = await fetchCount('hadoop-resume-count');
      const javaCount = await fetchCount('java-resume-count');

      // Data roles
      const dataEngineerCount = await fetchCount('data-engineer-resume-count');
      const dataOpsCount = await fetchCount('data-ops-resume-count');
      const dataBICount = await fetchCount('data-bi-resume-count');
      const dataModellerCount = await fetchCount('data-modeller-resume-count');
      const dataAnalystCount = await fetchCount('data-analyst-resume-count');
      const dataArchitectCount = await fetchCount('data-architect-resume-count');
      const dataScientistCount = await fetchCount('data-scientist-resume-count');

      // Status counts
      const totalCandidates = await fetchCount('total-candidates');
      const shortlisted = await fetchCount('shortlisted-candidates');
      const rejected = await fetchCount('rejected-candidates');

      setDashboardData({
        totalCandidates,
        shortlisted,
        rejected,
        pending: totalCandidates - shortlisted - rejected,
        cloudRoles: [devopsCount, platformCount, cloudopsCount, migrationCount],
        appRoles: [reactCount, snowCount, hadoopCount, javaCount],
        dataRoles: [dataEngineerCount, dataOpsCount, dataBICount, dataModellerCount, dataAnalystCount, dataArchitectCount, dataScientistCount],
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    }
  };

  const cloudChartData = {
    labels: ['DevOps', 'Platform', 'CloudOps', 'Migration'],
    datasets: [
      {
        data: dashboardData.cloudRoles,
        backgroundColor: ['#d7bde2', '#7fb3d5', '#76d7c4', '#f5cba7'],
      },
    ],
  };

  const appChartData = {
    labels: ['App Engineer - Front End', 'App Engineer - Backend', 'LCNC Platform Engineer', 'Integration Engineer'],
    datasets: [
      {
        data: dashboardData.appRoles,
        backgroundColor: ['#d7bde2', '#7fb3d5', '#f5cba7', '#76d7c4'],
      },
    ],
  };

  const dataChartData = {
    labels: ['Data Engineer', 'Data-Ops Engineer', 'Data – BI Visualization Engineer', 'Data Modeller', 'Data Analyst', 'Data Architect', 'Data Scientist –AI/ML'],
    datasets: [
      {
        data: dashboardData.dataRoles,
        backgroundColor: ['#d7bde2', '#7fb3d5', '#f5cba7', '#76d7c4', '#ffd7b9', '#e6ccff', '#ffb3d1'],
      },
    ],
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
        formatter: (value) => value > 0 ? value : null,
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
        formatter: (value) => value,
        font: {
          size: 12,
        },
      },
    },
  };

  const handleNavigation = (path) => {
    navigate(path);
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <button 
          className="sidebar-toggle-btn" 
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <i className="fas fa-bars"></i>
        </button>
        <h1>Dashboard - {ecMapping}</h1>
      </div>

      <SidebarMenu 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        onNavigate={handleNavigation}
      />

      <div className="dashboard-content">
        <div className="dashboard-grid">
          <div className="dashboard-card">
            <i className="fas fa-users"></i>
            <h3>Total Candidates</h3>
            <p>{dashboardData.totalCandidates}</p>
          </div>
          <div className="dashboard-card">
            <i className="fas fa-check-circle"></i>
            <h3>Shortlisted</h3>
            <p>{dashboardData.shortlisted}</p>
          </div>
          <div className="dashboard-card">
            <i className="fas fa-times-circle"></i>
            <h3>Rejected</h3>
            <p>{dashboardData.rejected}</p>
          </div>
          <div className="dashboard-card">
            <i className="fas fa-clock"></i>
            <h3>Pending</h3>
            <p>{dashboardData.pending}</p>
          </div>
        </div>

        <div className="dashboard-charts">
          <div className="dashboard-chart">
            <h3>Cloud Team Distribution</h3>
            <div className="chart-container">
              <Doughnut data={cloudChartData} options={chartOptions} />
            </div>
          </div>
          <div className="dashboard-chart">
            <h3>Cloud Team Applications</h3>
            <div className="chart-container">
              <Bar data={{
                labels: cloudChartData.labels,
                datasets: [{
                  label: 'Applications',
                  data: dashboardData.cloudRoles,
                  backgroundColor: ['#d7bde2', '#7fb3d5', '#76d7c4', '#f5cba7'],
                }]
              }} options={barChartOptions} />
            </div>
          </div>
        </div>

        <div className="dashboard-charts">
          <div className="dashboard-chart">
            <h3>App Team Distribution</h3>
            <div className="chart-container">
              <Doughnut data={appChartData} options={chartOptions} />
            </div>
          </div>
          <div className="dashboard-chart">
            <h3>App Team Applications</h3>
            <div className="chart-container">
              <Bar data={{
                labels: appChartData.labels,
                datasets: [{
                  label: 'Applications',
                  data: dashboardData.appRoles,
                  backgroundColor: ['#d7bde2', '#7fb3d5', '#f5cba7', '#76d7c4'],
                }]
              }} options={barChartOptions} />
            </div>
          </div>
        </div>

        <div className="dashboard-charts">
          <div className="dashboard-chart">
            <h3>Data Team Distribution</h3>
            <div className="chart-container">
              <Doughnut data={dataChartData} options={chartOptions} />
            </div>
          </div>
          <div className="dashboard-chart">
            <h3>Data Team Applications</h3>
            <div className="chart-container">
              <Bar data={{
                labels: dataChartData.labels,
                datasets: [{
                  label: 'Applications',
                  data: dashboardData.dataRoles,
                  backgroundColor: ['#d7bde2', '#7fb3d5', '#f5cba7', '#76d7c4', '#ffd7b9', '#e6ccff', '#ffb3d1'],
                }]
              }} options={barChartOptions} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;