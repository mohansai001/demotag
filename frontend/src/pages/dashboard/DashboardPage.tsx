import React from 'react'
import { Typography, Grid, Card, CardContent, Box } from '@mui/material'
import { useAuth } from '@contexts/AuthContext'

const DashboardPage: React.FC = () => {
  const { user } = useAuth()

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      
      <Typography variant="h6" color="textSecondary" gutterBottom>
        Welcome back, {user?.first_name} {user?.last_name}!
      </Typography>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Total Revenue
              </Typography>
              <Typography variant="h4" color="primary">
                $45,385
              </Typography>
              <Typography variant="body2" color="textSecondary">
                +12.5% from last month
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Total Users
              </Typography>
              <Typography variant="h4" color="primary">
                2,340
              </Typography>
              <Typography variant="body2" color="textSecondary">
                +3.4% from last month
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Transactions
              </Typography>
              <Typography variant="h4" color="primary">
                1,234
              </Typography>
              <Typography variant="body2" color="textSecondary">
                +8.2% from last month
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Active Sessions
              </Typography>
              <Typography variant="h4" color="primary">
                573
              </Typography>
              <Typography variant="body2" color="textSecondary">
                +2.1% from last month
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Activity
              </Typography>
              <Typography variant="body1">
                This is where recent activity data would be displayed. 
                Charts, tables, and other analytics components can be added here.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}

export default DashboardPage