import { BrowserRouter, Routes, Route } from 'react-router-dom';
import CardList from './pages/CardList';
import NewCard from './pages/NewCard';
import CardDetail from './pages/CardDetail';
import EditCard from './pages/EditCard';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<CardList />} />
        <Route path="/new" element={<NewCard />} />
        <Route path="/detail/:id" element={<CardDetail />} />
        <Route path="/edit/:id" element={<EditCard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
