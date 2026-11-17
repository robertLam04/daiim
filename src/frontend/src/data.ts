// Mock marketplace data. Numbers match the Figma frames so screens line up
// with the walkthrough notes.

export interface InputField {
  name: string
  type: 'number'
}

export interface Task {
  id: string
  name: string
  shortName: string
  description: string
  detail: string
  category: string
  inputs: InputField[]
  outputLabel: string
  outputUnit: string
  minStake: number
  registeredProviders: number
  minPayment: number
  minProviders: number
  maxProviders: number
  usualDelivery: string
  joinTime: string
  // Mock result returned when a request for this task completes.
  sampleResult: { value: number; low: number; high: number }
}

export interface ProviderTask {
  taskId: string
  reputation: number
  model: string
  answered: number
}

export interface Provider {
  id: string
  name: string
  joined: string
  tasks: ProviderTask[]
}

export const TASKS: Task[] = [
  {
    id: 'T1',
    name: 'River level forecast (24 h)',
    shortName: 'River level',
    description: 'Predicts the river level one day ahead from gauge and rainfall readings.',
    detail: 'Predicts the river level one day ahead at a gauge station.',
    category: 'Hydrology',
    inputs: [
      { name: 'river_level_m', type: 'number' },
      { name: 'rainfall_24h_mm', type: 'number' },
      { name: 'upstream_flow_m3s', type: 'number' },
    ],
    outputLabel: 'Predicted river level in 24 hours',
    outputUnit: 'm',
    minStake: 20,
    registeredProviders: 9,
    minPayment: 1.5,
    minProviders: 3,
    maxProviders: 7,
    usualDelivery: 'about 10 min',
    joinTime: '5 minutes',
    sampleResult: { value: 2.84, low: 2.61, high: 3.02 },
  },
  {
    id: 'T2',
    name: 'Wildfire risk index',
    shortName: 'Wildfire risk',
    description: 'Scores fire risk for an area from weather and vegetation dryness.',
    detail: 'Scores wildfire risk from 0 (low) to 100 (extreme) for an area.',
    category: 'Emergency management',
    inputs: [
      { name: 'temp_max_c', type: 'number' },
      { name: 'humidity_pct', type: 'number' },
      { name: 'wind_kmh', type: 'number' },
      { name: 'fuel_moisture_pct', type: 'number' },
    ],
    outputLabel: 'Wildfire risk index (0–100)',
    outputUnit: '/100',
    minStake: 20,
    registeredProviders: 6,
    minPayment: 1.5,
    minProviders: 3,
    maxProviders: 6,
    usualDelivery: 'about 15 min',
    joinTime: '5 minutes',
    sampleResult: { value: 63, low: 55, high: 71 },
  },
  {
    id: 'T3',
    name: 'Next-day stock price',
    shortName: 'Stock price',
    description: 'Predicts tomorrow’s closing price from recent trading data.',
    detail: 'Predicts the next trading day’s closing price for one stock.',
    category: 'Finance',
    inputs: [
      { name: 'close_today', type: 'number' },
      { name: 'volume_today', type: 'number' },
      { name: 'close_5d_avg', type: 'number' },
    ],
    outputLabel: 'Predicted closing price tomorrow',
    outputUnit: '$',
    minStake: 15,
    registeredProviders: 14,
    minPayment: 1.0,
    minProviders: 3,
    maxProviders: 10,
    usualDelivery: 'about 5 min',
    joinTime: '2 minutes',
    sampleResult: { value: 182.4, low: 179.9, high: 185.1 },
  },
  {
    id: 'T4',
    name: 'Snowmelt streamflow',
    shortName: 'Streamflow',
    description: 'Predicts streamflow in 48 h for mountain rivers in spring.',
    detail: 'Predicts streamflow 48 hours ahead for a mountain river during spring melt.',
    category: 'Hydrology',
    inputs: [
      { name: 'snowpack_cm', type: 'number' },
      { name: 'temp_avg_c', type: 'number' },
    ],
    outputLabel: 'Predicted streamflow in 48 hours',
    outputUnit: 'm³/s',
    minStake: 25,
    registeredProviders: 3,
    minPayment: 2.0,
    minProviders: 3,
    maxProviders: 5,
    usualDelivery: 'about 20 min',
    joinTime: '10 minutes',
    sampleResult: { value: 41.2, low: 37.5, high: 44.8 },
  },
]

export const PROVIDERS: Provider[] = [
  {
    id: 'P1',
    name: 'Provider 1',
    joined: 'September 2026',
    tasks: [
      { taskId: 'T1', reputation: 82, model: 'M1', answered: 146 },
      { taskId: 'T2', reputation: 64, model: 'M2', answered: 38 },
    ],
  },
  {
    id: 'P2',
    name: 'Provider 2',
    joined: 'October 2026',
    tasks: [
      { taskId: 'T1', reputation: 76, model: 'M7', answered: 97 },
      { taskId: 'T3', reputation: 70, model: 'M8', answered: 210 },
    ],
  },
]

export const USER = {
  displayName: 'Priya Nair',
  firstName: 'Priya',
  handle: 'priya_nair',
  email: 'priya@riverbend.ca',
  wallet: '7xKX…9fQa',
}

export function money(n: number): string {
  const sign = n < 0 ? '−' : ''
  return `${sign}$${Math.abs(n).toFixed(2)}`
}
