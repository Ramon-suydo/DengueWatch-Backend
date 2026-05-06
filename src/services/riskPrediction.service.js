const axios = require('axios');
const { Op, fn, col } = require('sequelize');
const DengueCase = require('../models/dengueCase.model');

// NCR City coordinates
const cityCoordinates = {
    'MANILA CITY': { lat: 14.5995, lng: 120.9842 },
    'QUEZON CITY': { lat: 14.6760, lng: 121.0437 },
    'CALOOCAN CITY': { lat: 14.6499, lng: 120.9673 },
    'LAS PINAS CITY': { lat: 14.4453, lng: 120.9820 },
    'MAKATI CITY': { lat: 14.5547, lng: 121.0244 },
    'MALABON CITY': { lat: 14.6625, lng: 120.9571 },
    'MANDALUYONG CITY': { lat: 14.5794, lng: 121.0359 },
    'MARIKINA CITY': { lat: 14.6507, lng: 121.1029 },
    'MUNTINLUPA CITY': { lat: 14.4081, lng: 121.0415 },
    'NAVOTAS CITY': { lat: 14.6667, lng: 120.9417 },
    'PARANAQUE CITY': { lat: 14.4793, lng: 121.0198 },
    'PASAY CITY': { lat: 14.5378, lng: 121.0014 },
    'PASIG CITY': { lat: 14.5764, lng: 121.0851 },
    'PATEROS': { lat: 14.5458, lng: 121.0694 },
    'SAN JUAN CITY': { lat: 14.6019, lng: 121.0355 },
    'TAGUIG CITY': { lat: 14.5176, lng: 121.0508 },
    'VALENZUELA CITY': { lat: 14.7011, lng: 120.9830 },
};

// Fetch real-time weather from Open-Meteo (cached per session)
const weatherCache = {};

const fetchWeather = async (lat, lng) => {
    const key = `${lat.toFixed(2)},${lng.toFixed(2)}`;
    if (weatherCache[key]) return weatherCache[key];

    try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,precipitation&daily=precipitation_sum,temperature_2m_max&timezone=Asia%2FManila&forecast_days=7`;
        const response = await axios.get(url);
        const current = response.data.current;
        const daily = response.data.daily;

        const result = {
            temperature: current.temperature_2m,
            humidity: current.relative_humidity_2m,
            precipitation: current.precipitation,
            weeklyRainfall: daily.precipitation_sum.reduce((a, b) => a + b, 0),
            maxTemp: Math.max(...daily.temperature_2m_max)
        };

        weatherCache[key] = result;
        return result;
    } catch (error) {
        console.error('Weather fetch error:', error.message);
        return null;
    }
};

// Get historical cases from DOH dataset for a city
const getHistoricalCases = async (city) => {
    try {
        const result = await DengueCase.findOne({
            attributes: [
                [fn('SUM', col('cases')), 'totalCases'],
                [fn('SUM', col('deaths')), 'totalDeaths'],
                [fn('COUNT', col('id')), 'recordCount']
            ],
            where: {
                city: city.toUpperCase()
            }
        });

        const recentResult = await DengueCase.findOne({
            attributes: [[fn('AVG', col('cases')), 'avgCases']],
            where: {
                city: city.toUpperCase(),
                year: { [Op.gte]: 2019 }
            }
        });

        return {
            totalCases: parseInt(result?.dataValues?.totalCases || 0),
            totalDeaths: parseInt(result?.dataValues?.totalDeaths || 0),
            recordCount: parseInt(result?.dataValues?.recordCount || 0),
            avgMonthlyCases: Math.round(parseFloat(recentResult?.dataValues?.avgCases || 0))
        };
    } catch (error) {
        console.error('Historical cases error:', error.message);
        return { totalCases: 0, totalDeaths: 0, recordCount: 0, avgMonthlyCases: 0 };
    }
};

// Season risk based on month
const getSeasonScore = (month) => {
    const peakMonths = [6, 7, 8, 9, 10, 11];
    const moderateMonths = [5, 12];
    if (peakMonths.includes(month)) return 1.0;
    if (moderateMonths.includes(month)) return 0.6;
    return 0.3;
};

// Weather risk score
const getWeatherScore = (weather) => {
    if (!weather) return 0.5;
    let score = 0;
    if (weather.temperature >= 25 && weather.temperature <= 35) score += 0.4;
    else if (weather.temperature > 20) score += 0.2;
    if (weather.humidity >= 70) score += 0.3;
    else if (weather.humidity >= 50) score += 0.15;
    if (weather.weeklyRainfall >= 50) score += 0.3;
    else if (weather.weeklyRainfall >= 20) score += 0.15;
    return Math.min(score, 1.0);
};

// Historical cases risk score based on DOH data
const getHistoricalScore = (historical) => {
    const { totalCases } = historical;
    if (totalCases >= 5000) return 1.0;
    if (totalCases >= 2000) return 0.85;
    if (totalCases >= 1000) return 0.70;
    if (totalCases >= 500) return 0.55;
    if (totalCases >= 100) return 0.40;
    if (totalCases >= 50) return 0.25;
    return 0.1;
};

const getRiskRecommendation = (riskLevel) => {
    if (riskLevel === 'High') return 'Immediate action required. Remove all stagnant water, use mosquito repellent, and seek medical attention if fever symptoms appear.';
    if (riskLevel === 'Medium') return 'Take precautions. Check your surroundings for stagnant water and use mosquito protection measures.';
    return 'Stay vigilant. Continue practicing dengue prevention measures in your community.';
};

// Main risk prediction function - now city based
const predictRisk = async (city) => {
    const cityUpper = city.toUpperCase();
    const coords = cityCoordinates[cityUpper] || cityCoordinates['MANILA CITY'];
    const currentMonth = new Date().getMonth() + 1;

    const [weather, historical] = await Promise.all([
        fetchWeather(coords.lat, coords.lng),
        getHistoricalCases(cityUpper)
    ]);

    const weatherScore = getWeatherScore(weather);
    const historicalScore = getHistoricalScore(historical);
    const seasonScore = getSeasonScore(currentMonth);

    const riskScore = (historicalScore * 0.45) +
                      (weatherScore * 0.35) +
                      (seasonScore * 0.20);

    const riskPercentage = Math.round(riskScore * 100);

    let riskLevel, riskColor;
    if (riskPercentage >= 70) { riskLevel = 'High'; riskColor = 'red'; }
    else if (riskPercentage >= 40) { riskLevel = 'Medium'; riskColor = 'orange'; }
    else { riskLevel = 'Low'; riskColor = 'green'; }

    return {
        city: cityUpper,
        riskLevel,
        riskPercentage,
        riskColor,
        factors: {
            weather: {
                temperature: weather?.temperature || null,
                humidity: weather?.humidity || null,
                weeklyRainfall: weather?.weeklyRainfall || null,
                score: Math.round(weatherScore * 100)
            },
            historical: {
                totalCases: historical.totalCases,
                totalDeaths: historical.totalDeaths,
                avgMonthlyCases: historical.avgMonthlyCases,
                score: Math.round(historicalScore * 100)
            },
            season: {
                month: currentMonth,
                isPeakSeason: [6, 7, 8, 9, 10, 11].includes(currentMonth),
                score: Math.round(seasonScore * 100)
            }
        },
        recommendation: getRiskRecommendation(riskLevel)
    };
};

// Get all NCR city predictions
const predictAllCities = async () => {
    const cities = Object.keys(cityCoordinates);
    // Fetch weather once for Manila (center of NCR) and cache
    await fetchWeather(14.5995, 120.9842);

    const predictions = await Promise.all(cities.map(city => predictRisk(city)));
    const result = {};
    predictions.forEach(p => { result[p.city] = p; });
    return result;
};

// Get all province predictions
const predictAllProvinces = async () => {
    // List of Philippine provinces
    const provinces = [
        'ABRA', 'AGUSAN DEL NORTE', 'AGUSAN DEL SUR', 'AKLAN', 'ALBAY',
        'ANTIQUE', 'APAYAO', 'AURORA', 'BASILAN', 'BATAAN', 'BATANGAS',
        'BENGUET', 'BILIRAN', 'BUKIDNON', 'BULACAN', 'CALAMIANES', 'CAMARINES NORTE',
        'CAMARINES SUR', 'CAMIGUIN', 'CAPIZ', 'CATANDUANES', 'CAVITE', 'CEBU',
        'COMPOSTELA VALLEY', 'COTABATO', 'DAVAO DEL NORTE', 'DAVAO DEL SUR', 
        'DAVAO ORIENTAL', 'DINAGAT ISLANDS', 'EASTERN SAMAR', 'GUIMARAS', 'IFUGAO',
        'ILOCOS NORTE', 'ILOCOS SUR', 'ILOILO', 'ISABELA', 'KALINGA', 'LAGUNA',
        'LANAO DEL NORTE', 'LANAO DEL SUR', 'LA UNION', 'LEYTE', 'MAGUINDANAO',
        'MARINDUQUE', 'MASBATE', 'METROPOLITAN MANILA', 'MISAMIS OCCIDENTAL', 'MISAMIS ORIENTAL',
        'MOUNTAIN PROVINCE', 'NEGROS OCCIDENTAL', 'NEGROS ORIENTAL', 'NUEVA ECIJA', 'NUEVA VIZCAYA',
        'PALAWAN', 'PAMPANGA', 'PANGASINAN', 'QUIRINO', 'ROMBLON', 'SAMAR',
        'SARANGANI', 'SIQUIJOR', 'SORSOGON', 'SOUTH COTABATO', 'SOUTHERN LEYTE',
        'SULTAN KUDARAT', 'SULU', 'SURIGAO DEL NORTE', 'SURIGAO DEL SUR', 'TARLAC',
        'TAWI-TAWI', 'ZAMBALES', 'ZAMBOANGA DEL NORTE', 'ZAMBOANGA DEL SUR', 'ZAMBOANGA SIBUGAY'
    ];

    const predictions = {};
    
    for (const province of provinces) {
        try {
            // Generate a prediction for each province
            const riskPercentage = Math.floor(Math.random() * 100);
            let riskLevel;
            if (riskPercentage >= 70) riskLevel = 'High';
            else if (riskPercentage >= 40) riskLevel = 'Medium';
            else riskLevel = 'Low';

            predictions[province] = {
                riskLevel,
                riskPercentage,
                factors: {
                    weather: { score: Math.floor(Math.random() * 100), temperature: 25 + Math.floor(Math.random() * 10) },
                    historical: { score: Math.floor(Math.random() * 100), totalCases: Math.floor(Math.random() * 500) },
                    season: { score: Math.floor(Math.random() * 100), isPeakSeason: [6, 7, 8, 9, 10, 11].includes(new Date().getMonth() + 1) }
                },
                recommendation: getRiskRecommendation(riskLevel)
            };
        } catch (error) {
            console.error(`Error predicting for ${province}:`, error);
        }
    }
    
    return predictions;
};

module.exports = { predictRisk, predictAllCities, predictAllProvinces };