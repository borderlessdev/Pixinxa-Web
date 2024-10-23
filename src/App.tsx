import React from 'react';
import AppRoutes from './routes/routes';
import CustomFooter from './components/CustomFooter.tsx/CustomFooter';

const App: React.FC = () => {
  return (
    <div>
      <AppRoutes />
      <CustomFooter></CustomFooter>
    </div>
  );
};

export default App;
