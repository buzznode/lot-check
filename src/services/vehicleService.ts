const BASE = 'https://vpic.nhtsa.dot.gov/api/vehicles';

let makesCache: string[] | null = null;
const modelsCache = new Map<string, string[]>();

export async function fetchMakes(): Promise<string[]> {
  if (makesCache) return makesCache;
  try {
    const res = await fetch(`${BASE}/GetMakesForVehicleType/car?format=json`);
    const json = await res.json();
    const makes: string[] = Array.from(
      new Set<string>(
        (json.Results as { MakeName: string }[])
          .map(r => r.MakeName.trim())
          .filter(Boolean)
      )
    ).sort();
    makesCache = makes;
    return makes;
  } catch {
    return [];
  }
}

export async function fetchModels(make: string, year: number): Promise<string[]> {
  const key = `${make.trim().toLowerCase()}|${year}`;
  if (modelsCache.has(key)) return modelsCache.get(key)!;
  try {
    const encodedMake = encodeURIComponent(make.trim());
    const res = await fetch(
      `${BASE}/GetModelsForMakeYear/make/${encodedMake}/modelyear/${year}?format=json`
    );
    const json = await res.json();
    const models: string[] = Array.from(
      new Set<string>(
        (json.Results as { Model_Name: string }[])
          .map(r => r.Model_Name.trim())
          .filter(Boolean)
      )
    ).sort();
    modelsCache.set(key, models);
    return models;
  } catch {
    return [];
  }
}
