const express = require('express');
const cors = require('cors');
const swe = require('sweph');
const app = express();
app.use(cors());
app.use(express.json());

swe.set_ephe_path(__dirname + '/ephe');

const signs = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
];

function getZodiacSign(longitude) {
  return signs[Math.floor(longitude / 30)];
}

function formatLongitude(longitude) {
  const signIndex = Math.floor(longitude / 30);
  const degreeInSign = longitude % 30;
  const degrees = Math.floor(degreeInSign);
  const minutes = Math.floor((degreeInSign - degrees) * 60);
  return `${degrees}°${minutes.toString().padStart(2, '0')}′ ${signs[signIndex]}`;
}

app.post('/natal-chart', (req, res) => {
  const { date, time, lat, lng } = req.body;
  if (!date || !time || lat === undefined || lng === undefined) {
    return res.status(400).json({ error: 'Missing input' });
  }

  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  const jd = swe.julday(year, month, day, hour + minute / 60, 1);

  const planets = {
    sun: 0, moon: 1, mercury: 2, venus: 3, mars: 4,
    jupiter: 5, saturn: 6, uranus: 7, neptune: 8, pluto: 9,
    mean_node: 10, chiron: 15
  };

  let planetary_positions = {};
  for (let name in planets) {
    const resPlanet = swe.calc_ut(jd, planets[name], 2);
    const long = resPlanet.data[0];
    planetary_positions[name] = {
      longitude: Number(long.toFixed(6)),
      zodiac_sign: getZodiacSign(long),
      formatted: formatLongitude(long)
    };
  }

  const houses = swe.swe_houses(jd, lat, lng, 'P');
  const houseCusps = houses.cusps.map(deg => ({
    degree: deg,
    zodiac_sign: getZodiacSign(deg),
    formatted: formatLongitude(deg)
  }));

  res.json({
    ascendant: {
      degree: houses.ascendant,
      zodiac_sign: getZodiacSign(houses.ascendant),
      formatted: formatLongitude(houses.ascendant)
    },
    midheaven: {
      degree: houses.mc,
      zodiac_sign: getZodiacSign(houses.mc),
      formatted: formatLongitude(houses.mc)
    },
    houses: houseCusps,
    planetary_positions
  });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Natal chart API running on port ${PORT}`);
});
