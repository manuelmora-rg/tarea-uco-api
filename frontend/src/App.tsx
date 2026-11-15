import { Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { HomePage } from './pages/HomePage';
import { CharactersPage } from './pages/CharactersPage';
import { CharacterDetailPage } from './pages/CharacterDetailPage';
import { FruitsPage } from './pages/FruitsPage';
import { FruitDetailPage } from './pages/FruitDetailPage';
import { CrewsPage } from './pages/CrewsPage';
import { CrewDetailPage } from './pages/CrewDetailPage';
import { BountiesPage } from './pages/BountiesPage';
import { ArcsPage } from './pages/ArcsPage';
import { ArcDetailPage } from './pages/ArcDetailPage';
import { BoatsPage } from './pages/BoatsPage';
import { BoatDetailPage } from './pages/BoatDetailPage';
import { SearchPage } from './pages/SearchPage';
import { NotFoundPage } from './pages/NotFoundPage';

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<HomePage />} />
        <Route path="personajes" element={<CharactersPage />} />
        <Route path="personajes/:id" element={<CharacterDetailPage />} />
        <Route path="frutas" element={<FruitsPage />} />
        <Route path="frutas/:id" element={<FruitDetailPage />} />
        <Route path="tripulaciones" element={<CrewsPage />} />
        <Route path="tripulaciones/:id" element={<CrewDetailPage />} />
        <Route path="recompensas" element={<BountiesPage />} />
        <Route path="arcos" element={<ArcsPage />} />
        <Route path="arcos/:id" element={<ArcDetailPage />} />
        <Route path="barcos" element={<BoatsPage />} />
        <Route path="barcos/:id" element={<BoatDetailPage />} />
        <Route path="buscar" element={<SearchPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
