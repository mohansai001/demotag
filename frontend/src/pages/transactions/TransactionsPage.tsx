import React from 'react'
import { Typography, Box } from '@mui/material'

const TransactionsPage: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Transactions
      </Typography>
      <Typography variant="body1">
        This page will display transaction management functionality.
      </Typography>
    </Box>
  )
}

export default TransactionsPage