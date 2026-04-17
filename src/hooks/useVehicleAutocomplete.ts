import { useState, useEffect } from 'react';
import { fetchMakes, fetchModels } from '../services/vehicleService';

export function useVehicleAutocomplete() {
  const [makes, setMakes] = useState<string[]>([]);
  const [makesLoading, setMakesLoading] = useState(false);
  const [models, setModels] = useState<string[]>([]);
  const [modelsLoading, setModelsLoading] = useState(false);

  useEffect(() => {
    setMakesLoading(true);
    fetchMakes().then(result => {
      setMakes(result);
      setMakesLoading(false);
    });
  }, []);

  async function fetchModelsForSelection(make: string, year: number) {
    setModels([]);
    setModelsLoading(true);
    const result = await fetchModels(make, year);
    setModels(result);
    setModelsLoading(false);
  }

  return { makes, makesLoading, models, modelsLoading, fetchModelsForSelection };
}
