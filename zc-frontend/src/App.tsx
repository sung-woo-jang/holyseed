import { RouterProvider } from 'react-router-dom';
import { QueryProvider } from './app/providers/query-provider';
import { router } from './app/routes';

function App() {
  return (
    <QueryProvider>
      <RouterProvider router={router} />
    </QueryProvider>
  );
}

export default App;
