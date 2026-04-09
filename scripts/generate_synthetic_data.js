/**
 * Synthetic Data Generator for QueueLess Wait Time Prediction
 * 
 * Rules applied for realism:
 * 1. Wait time scales linearly with peopleAheadAtJoin.
 * 2. Wait time scales inversely with availableStaffAtJoin.
 * 3. Service types have distinct mean service durations.
 * 4. Hour of day affects efficiency (fatigue/rush).
 * 5. Branch ID and Department ID introduce specific variance.
 * 6. Gaussian noise added for real-world stochasticity.
 */

const fs = require('fs');
const path = require('path');

const NUM_RECORDS = 5000;
const OUTPUT_FILE = path.join(__dirname, 'data', 'synthetic_queue_history.csv');

// Configuration for realism
const serviceTypes = {
  'walk-in': { mean: 12, variance: 4 },
  'online': { mean: 8, variance: 2 },
  'kiosk': { mean: 10, variance: 3 }
};

const branches = {
  '651b2c3d': { efficiency: 1.0 }, 
  '651b2c3e': { efficiency: 1.2 }, 
  '651b2c3f': { efficiency: 0.85 }
};

const departments = {
  'deptA': { factor: 1.0 },
  'deptB': { factor: 1.5 },
  'deptC': { factor: 0.8 }
};

const days = [0, 1, 2, 3, 4, 5, 6];

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getGaussianNoise(mean = 0, stdev = 1) {
  let u = 1 - Math.random();
  let v = 1 - Math.random();
  let z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return z * stdev + mean;
}

function generateData() {
  const records = [];
  const serviceTypeKeys = Object.keys(serviceTypes);
  const branchKeys = Object.keys(branches);
  const deptKeys = Object.keys(departments);

  for (let i = 0; i < NUM_RECORDS; i++) {
    const serviceType = serviceTypeKeys[getRandomInt(0, serviceTypeKeys.length - 1)];
    const branchId = branchKeys[getRandomInt(0, branchKeys.length - 1)];
    const departmentId = deptKeys[getRandomInt(0, deptKeys.length - 1)];
    const dayOfWeek = days[getRandomInt(0, 6)];
    const hourOfDay = getRandomInt(8, 20); // 8 AM to 8 PM

    // People ahead: Randomly distributed but slightly higher in peak hours
    let sameDepartmentPeopleAhead = getRandomInt(0, 15);
    if (hourOfDay >= 10 && hourOfDay <= 12) sameDepartmentPeopleAhead += getRandomInt(5, 10);
    if (hourOfDay >= 17 && hourOfDay <= 19) sameDepartmentPeopleAhead += getRandomInt(3, 8);

    const stConfig = serviceTypes[serviceType];
    const branchConfig = branches[branchId];
    const deptConfig = departments[departmentId];
    
    // Base wait time calculation: (People Ahead + Current) * Mean Service Time 
    // Notice: we do not divide by staff anymore as synthetic mapping is not possible.
    let waitMinutes = ((sameDepartmentPeopleAhead + 1) * stConfig.mean);

    // Apply Multipliers
    waitMinutes *= branchConfig.efficiency;
    waitMinutes *= deptConfig.factor;

    // Peak Hour Fatigue / Rush (Slower between 11-1 and 5-7)
    if ((hourOfDay >= 11 && hourOfDay <= 13) || (hourOfDay >= 17 && hourOfDay <= 19)) {
      waitMinutes *= 1.25;
    }

    // Weekend Rush
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      waitMinutes *= 1.15;
    }

    // Add Random Noise (+/- 15%)
    const noise = getGaussianNoise(0, waitMinutes * 0.15);
    waitMinutes += noise;

    // Ensure wait time is strictly positive
    waitMinutes = Math.max(0.5, waitMinutes);

    records.push({
      branchId,
      departmentId,
      serviceType,
      sameDepartmentPeopleAhead,
      dayOfWeek,
      hourOfDay,
      actualWaitMinutes: waitMinutes.toFixed(2)
    });
  }

  return records;
}

function saveToCSV(data) {
  const header = 'branchId,departmentId,serviceType,sameDepartmentPeopleAhead,dayOfWeek,hourOfDay,actualWaitMinutes';
  const rows = data.map(r => `${r.branchId},${r.departmentId},${r.serviceType},${r.sameDepartmentPeopleAhead},${r.dayOfWeek},${r.hourOfDay},${r.actualWaitMinutes}`);
  
  const dir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(OUTPUT_FILE, [header, ...rows].join('\n'));
  console.log(`✅ Generated ${NUM_RECORDS} synthetic records at ${OUTPUT_FILE}`);
}

const data = generateData();
saveToCSV(data);
