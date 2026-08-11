/**
 * 4-Wheeler make → models catalogue (Indian market, model-level).
 *
 * Used by utils/seedFourWheelers.js to populate a garage's Masters with cars.
 * This is data only — edit/extend the lists freely; the loader is idempotent
 * and only adds models a garage doesn't already have.
 *
 * Variants (e.g. "VXI", "ZX+") are intentionally omitted to keep the list
 * manageable — the VehicleModel `variant` field can hold those later if needed.
 */
module.exports = {
  'Maruti Suzuki': [
    'Alto 800', 'Alto K10', 'S-Presso', 'Celerio', 'Wagon R', 'Swift', 'Dzire',
    'Baleno', 'Ignis', 'Fronx', 'Brezza', 'Ertiga', 'XL6', 'Ciaz',
    'Grand Vitara', 'Jimny', 'Invicto', 'Eeco', 'Omni', 'Ritz', 'A-Star',
    'S-Cross', 'Kizashi',
  ],
  Hyundai: [
    'Santro', 'Grand i10', 'Grand i10 Nios', 'i20', 'i20 N Line', 'Aura',
    'Xcent', 'Verna', 'Venue', 'Venue N Line', 'Creta', 'Creta N Line',
    'Alcazar', 'Tucson', 'Kona Electric', 'Ioniq 5', 'Exter', 'Elantra',
    'Eon', 'Accent', 'Getz',
  ],
  Tata: [
    'Nano', 'Tiago', 'Tiago EV', 'Tigor', 'Tigor EV', 'Altroz', 'Punch',
    'Punch EV', 'Nexon', 'Nexon EV', 'Harrier', 'Safari', 'Curvv', 'Indica',
    'Indigo', 'Bolt', 'Zest', 'Hexa', 'Sumo',
  ],
  Mahindra: [
    'Bolero', 'Bolero Neo', 'Scorpio', 'Scorpio-N', 'Thar', 'Thar Roxx',
    'XUV300', 'XUV400 EV', 'XUV700', 'XUV500', 'Marazzo', 'KUV100',
    'TUV300', 'Xylo', 'Verito', 'Quanto', 'Alturas G4', 'BE 6', 'XEV 9e',
  ],
  Toyota: [
    'Glanza', 'Urban Cruiser', 'Urban Cruiser Taisor', 'Urban Cruiser Hyryder',
    'Rumion', 'Innova Crysta', 'Innova Hycross', 'Fortuner', 'Hilux',
    'Camry', 'Vellfire', 'Land Cruiser', 'Etios', 'Etios Liva', 'Corolla Altis',
    'Yaris', 'Qualis',
  ],
  Honda: [
    'Amaze', 'City', 'City Hybrid', 'Elevate', 'Jazz', 'WR-V', 'BR-V',
    'Brio', 'Mobilio', 'CR-V', 'Civic', 'Accord',
  ],
  Kia: [
    'Sonet', 'Syros', 'Seltos', 'Carens', 'Carnival', 'EV6', 'EV9',
  ],
  Renault: [
    'Kwid', 'Triber', 'Kiger', 'Duster', 'Captur', 'Lodgy', 'Pulse', 'Scala',
  ],
  Nissan: [
    'Magnite', 'Kicks', 'Terrano', 'Micra', 'Sunny', 'GT-R', 'X-Trail',
  ],
  Volkswagen: [
    'Polo', 'Virtus', 'Vento', 'Taigun', 'Tiguan', 'Ameo', 'Jetta', 'Passat',
  ],
  Skoda: [
    'Kushaq', 'Slavia', 'Kylaq', 'Octavia', 'Superb', 'Kodiaq', 'Rapid', 'Fabia',
  ],
  MG: [
    'Hector', 'Hector Plus', 'Astor', 'ZS EV', 'Gloster', 'Comet EV', 'Windsor EV',
  ],
  Jeep: [
    'Compass', 'Meridian', 'Wrangler', 'Grand Cherokee',
  ],
  Citroen: [
    'C3', 'C3 Aircross', 'eC3', 'C5 Aircross', 'Basalt',
  ],
  BYD: [
    'Atto 3', 'Seal', 'e6', 'eMAX 7',
  ],
  Ford: [
    'EcoSport', 'Figo', 'Aspire', 'Freestyle', 'Endeavour', 'Fiesta', 'Ikon',
  ],
  'Mercedes-Benz': [
    'A-Class', 'C-Class', 'E-Class', 'S-Class', 'GLA', 'GLB', 'GLC', 'GLE',
    'GLS', 'EQB', 'EQE', 'EQS',
  ],
  BMW: [
    '2 Series', '3 Series', '5 Series', '7 Series', 'X1', 'X3', 'X5', 'X7',
    'iX', 'i4', 'i7', 'Z4',
  ],
  Audi: [
    'A4', 'A6', 'A8 L', 'Q3', 'Q5', 'Q7', 'Q8', 'e-tron', 'Q8 e-tron',
  ],
  Volvo: [
    'XC40', 'XC60', 'XC90', 'S90', 'C40 Recharge',
  ],
  'Land Rover': [
    'Defender', 'Discovery', 'Discovery Sport', 'Range Rover', 'Range Rover Sport',
    'Range Rover Velar', 'Range Rover Evoque',
  ],
  Jaguar: [
    'XE', 'XF', 'F-Pace', 'F-Type', 'I-Pace',
  ],
  Lexus: [
    'ES', 'NX', 'RX', 'LX', 'LS',
  ],
  Isuzu: [
    'D-Max', 'V-Cross', 'MU-X', 'Hi-Lander',
  ],
  'Force Motors': [
    'Gurkha', 'Trax', 'Traveller',
  ],
  Datsun: [
    'GO', 'GO Plus', 'redi-GO',
  ],
  Chevrolet: [
    'Beat', 'Spark', 'Sail', 'Cruze', 'Enjoy', 'Tavera', 'Trailblazer',
  ],
  Fiat: [
    'Punto', 'Linea', 'Avventura', 'Palio',
  ],
};
