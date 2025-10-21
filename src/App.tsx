import './App.css'
import FormationDashboard from './RowComponent'
import { JsonDataProvider } from './context/JsonDataContext'

function App() {

  return (
    <JsonDataProvider>
      <FormationDashboard />
    </JsonDataProvider>
  )
}

export default App;
