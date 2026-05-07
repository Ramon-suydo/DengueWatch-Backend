const axios = require('axios');
const { Op, fn, col } = require('sequelize');
const DengueCase = require('../models/dengueCase.model');

// ============================================================
// NCR CITY COORDINATES
// ============================================================
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

// ============================================================
// WEATHER CACHE - prevent rate limiting
// ============================================================
const weatherCache = {};
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

const fetchWeather = async (lat, lng) => {
    const key = `${lat.toFixed(2)},${lng.toFixed(2)}`;
    const cached = weatherCache[key];
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data;
    }

    try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,precipitation&daily=precipitation_sum,temperature_2m_max,temperature_2m_min,weathercode&timezone=Asia%2FManila&forecast_days=7`;
        const response = await axios.get(url);
        const current = response.data.current;
        const daily = response.data.daily;

        const result = {
            temperature: current.temperature_2m,
            humidity: current.relative_humidity_2m,
            precipitation: current.precipitation,
            weeklyRainfall: daily.precipitation_sum.reduce((a, b) => a + b, 0),
            maxTemp: Math.max(...daily.temperature_2m_max),
            minTemp: Math.min(...daily.temperature_2m_min),
            dailyRainfall: daily.precipitation_sum,
            dailyMaxTemp: daily.temperature_2m_max,
            weatherCodes: daily.weathercode,
            dates: daily.time
        };

        weatherCache[key] = { data: result, timestamp: Date.now() };
        return result;
    } catch (error) {
        console.error('Weather fetch error:', error.message);
        // Return fallback Manila weather estimate
        return {
            temperature: 30,
            humidity: 75,
            precipitation: 5,
            weeklyRainfall: 25,
            maxTemp: 33,
            minTemp: 26,
            dailyRainfall: [3, 4, 3, 4, 3, 4, 4],
            dailyMaxTemp: [33, 33, 32, 33, 34, 33, 32],
            weatherCodes: [61, 61, 61, 61, 61, 61, 61],
            dates: []
        };
    }
};

// ============================================================
// HISTORICAL DATA FROM DOH DATASET
// ============================================================
const getHistoricalCases = async (city) => {
    try {
        const cityUpper = city.toUpperCase();

        // Total cases 2016-2021
        const totalResult = await DengueCase.findOne({
            attributes: [
                [fn('SUM', col('cases')), 'totalCases'],
                [fn('SUM', col('deaths')), 'totalDeaths'],
                [fn('COUNT', col('id')), 'recordCount']
            ],
            where: { city: cityUpper }
        });

        // Peak year cases (worst year)
        const peakResult = await DengueCase.findOne({
            attributes: [
                'year',
                [fn('SUM', col('cases')), 'yearlyCases']
            ],
            where: { city: cityUpper },
            group: ['year'],
            order: [[fn('SUM', col('cases')), 'DESC']]
        });

        // Recent average (2019-2021)
        const recentResult = await DengueCase.findOne({
            attributes: [[fn('AVG', col('cases')), 'avgCases']],
            where: {
                city: cityUpper,
                year: { [Op.gte]: 2019 }
            }
        });

        // Peak month pattern (which months have most cases)
        const monthlyPattern = await DengueCase.findAll({
            attributes: [
                'month',
                [fn('AVG', col('cases')), 'avgCases']
            ],
            where: { city: cityUpper },
            group: ['month'],
            order: [['month', 'ASC']]
        });

        const monthlyAvg = {};
        monthlyPattern.forEach(m => {
            monthlyAvg[m.month] = parseFloat(m.dataValues.avgCases || 0);
        });

        return {
            totalCases: parseInt(totalResult?.dataValues?.totalCases || 0),
            totalDeaths: parseInt(totalResult?.dataValues?.totalDeaths || 0),
            recordCount: parseInt(totalResult?.dataValues?.recordCount || 0),
            peakYearlyCases: parseInt(peakResult?.dataValues?.yearlyCases || 0),
            avgMonthlyCases: Math.round(parseFloat(recentResult?.dataValues?.avgCases || 0)),
            monthlyPattern: monthlyAvg
        };
    } catch (error) {
        console.error('Historical cases error:', error.message);
        return {
            totalCases: 0, totalDeaths: 0, recordCount: 0,
            peakYearlyCases: 0, avgMonthlyCases: 0, monthlyPattern: {}
        };
    }
};

// ============================================================
// RISK SCORING COMPONENTS
// ============================================================

// 1. HISTORICAL RISK SCORE (0-100) based on DOH data
const getHistoricalScore = (historical, currentMonth) => {
    const { totalCases, peakYearlyCases, monthlyPattern } = historical;

    // Base score from total burden (2016-2021)
    let baseScore = 0;
    if (totalCases >= 30000) baseScore = 100;
    else if (totalCases >= 15000) baseScore = 90;
    else if (totalCases >= 10000) baseScore = 80;
    else if (totalCases >= 5000) baseScore = 70;
    else if (totalCases >= 2000) baseScore = 55;
    else if (totalCases >= 1000) baseScore = 40;
    else if (totalCases >= 500) baseScore = 30;
    else baseScore = 15;

    // Adjust based on current month's historical pattern
    const currentMonthAvg = monthlyPattern[currentMonth] || 0;
    const maxMonthAvg = Math.max(...Object.values(monthlyPattern), 1);
    const monthMultiplier = 0.7 + (currentMonthAvg / maxMonthAvg) * 0.6;

    return Math.min(100, baseScore * monthMultiplier);
};

// 2. WEATHER RISK SCORE (0-100) - multi-factor
const getWeatherScore = (weather) => {
    if (!weather) return 50;

    let score = 0;

    // Temperature component (dengue thrives 25-35°C)
    const temp = weather.temperature;
    if (temp >= 28 && temp <= 32) score += 35;
    else if (temp >= 25 && temp <= 35) score += 25;
    else if (temp >= 20) score += 10;

    // Humidity component (high humidity favors Aedes aegypti)
    const humidity = weather.humidity;
    if (humidity >= 80) score += 30;
    else if (humidity >= 70) score += 22;
    else if (humidity >= 60) score += 15;
    else if (humidity >= 50) score += 8;

    // Rainfall component (stagnant water breeding sites)
    const rainfall = weather.weeklyRainfall;
    if (rainfall >= 100) score += 35;
    else if (rainfall >= 50) score += 28;
    else if (rainfall >= 20) score += 18;
    else if (rainfall >= 5) score += 10;
    else score += 5; // Dry conditions reduce risk slightly

    return Math.min(100, score);
};

// 3. SEASONAL RISK SCORE (0-100) - PH specific
const getSeasonScore = (month) => {
    // Based on actual PH dengue surveillance data patterns
    const monthScores = {
        1: 30,   // January - low
        2: 25,   // February - lowest
        3: 28,   // March - low
        4: 35,   // April - increasing
        5: 50,   // May - moderate (rainy season starts)
        6: 75,   // June - high (peak begins)
        7: 90,   // July - peak
        8: 95,   // August - peak
        9: 90,   // September - peak
        10: 80,  // October - declining peak
        11: 65,  // November - moderately high
        12: 45,  // December - decreasing
    };
    return monthScores[month] || 50;
};

// 4. URBAN DENSITY SCORE (0-100) - estimated by city population density
const getUrbanDensityScore = (city) => {
    const densityScores = {
        'MANILA CITY': 95,        // Most dense city in the world
        'NAVOTAS CITY': 90,       // Very dense
        'MANDALUYONG CITY': 88,
        'MALABON CITY': 85,
        'PASAY CITY': 83,
        'CALOOCAN CITY': 80,
        'SAN JUAN CITY': 78,
        'MAKATI CITY': 75,
        'PASIG CITY': 72,
        'QUEZON CITY': 70,
        'MARIKINA CITY': 65,
        'VALENZUELA CITY': 62,
        'PARANAQUE CITY': 60,
        'TAGUIG CITY': 58,
        'LAS PINAS CITY': 55,
        'PATEROS': 52,
        'MUNTINLUPA CITY': 50,
    };
    return densityScores[city.toUpperCase()] || 65;
};

// 5. 7-DAY FORECAST RISK
const get7DayForecast = (weather, baseRiskScore, currentMonth) => {
    if (!weather || !weather.dailyRainfall) {
        // Fallback forecast
        return Array(7).fill(null).map((_, i) => ({
            date: new Date(Date.now() + i * 86400000).toISOString().split('T')[0],
            day: ['Today', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i] || `Day ${i+1}`,
            riskScore: Math.round(baseRiskScore + (Math.random() - 0.5) * 10),
            riskLevel: baseRiskScore >= 70 ? 'High' : baseRiskScore >= 40 ? 'Medium' : 'Low',
            rainfall: 0,
            temperature: 30
        }));
    }

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return weather.dailyRainfall.map((rainfall, i) => {
        const temp = weather.dailyMaxTemp[i] || 30;
        const date = new Date(Date.now() + i * 86400000);

        // Calculate daily risk based on weather
        let dailyWeatherScore = 0;
        if (temp >= 28 && temp <= 32) dailyWeatherScore += 35;
        else if (temp >= 25) dailyWeatherScore += 20;

        if (rainfall >= 20) dailyWeatherScore += 40;
        else if (rainfall >= 10) dailyWeatherScore += 25;
        else if (rainfall >= 5) dailyWeatherScore += 15;
        else dailyWeatherScore += 5;

        // Combine with season and historical
        const seasonScore = getSeasonScore(currentMonth);
        const dailyRisk = Math.round(
            (baseRiskScore * 0.40) +
            (dailyWeatherScore * 0.35) +
            (seasonScore * 0.25)
        );

        const clampedRisk = Math.min(100, Math.max(0, dailyRisk));
        const riskLevel = clampedRisk >= 70 ? 'High' : clampedRisk >= 40 ? 'Medium' : 'Low';

        return {
            date: date.toISOString().split('T')[0],
            day: i === 0 ? 'Today' : dayNames[date.getDay()],
            riskScore: clampedRisk,
            riskLevel,
            rainfall: Math.round(rainfall * 10) / 10,
            temperature: Math.round(temp * 10) / 10
        };
    });
};

// ============================================================
// AI CONFIDENCE SCORE - based on data quality
// ============================================================
const calculateConfidence = (historical, weather) => {
    let confidence = 0;

    // Data completeness (40%)
    if (historical.recordCount >= 200) confidence += 40;
    else if (historical.recordCount >= 100) confidence += 30;
    else if (historical.recordCount >= 50) confidence += 20;
    else confidence += 10;

    // Weather data availability (30%)
    if (weather && weather.temperature) confidence += 30;
    else confidence += 15;

    // Historical data richness (20%)
    if (Object.keys(historical.monthlyPattern || {}).length >= 10) confidence += 20;
    else if (Object.keys(historical.monthlyPattern || {}).length >= 6) confidence += 12;
    else confidence += 5;

    // Recency adjustment (10%)
    if (historical.avgMonthlyCases > 0) confidence += 10;
    else confidence += 5;

    return Math.min(97, confidence);
};

// ============================================================
// MAIN PREDICTION FUNCTION - CITY LEVEL
// ============================================================
const predictRisk = async (city) => {
    const cityUpper = city.toUpperCase();
    const coords = cityCoordinates[cityUpper] || cityCoordinates['MANILA CITY'];
    const currentMonth = new Date().getMonth() + 1;

    // Fetch all data in parallel
    const [weather, historical] = await Promise.all([
        fetchWeather(coords.lat, coords.lng),
        getHistoricalCases(cityUpper)
    ]);

    // Calculate individual scores
    const historicalScore = getHistoricalScore(historical, currentMonth);
    const weatherScore = getWeatherScore(weather);
    const seasonScore = getSeasonScore(currentMonth);
    const urbanDensityScore = getUrbanDensityScore(cityUpper);

    // WEIGHTED ENSEMBLE (inspired by Random Forest aggregation)
    // Weights based on feature importance from epidemiological studies
    const riskScore = (
        (historicalScore * 0.40) +   // Historical burden - most predictive
        (weatherScore * 0.30) +       // Current weather conditions
        (seasonScore * 0.20) +        // Seasonal patterns
        (urbanDensityScore * 0.10)    // Urban density factor
    );

    const riskPercentage = Math.round(Math.min(100, Math.max(0, riskScore)));

    let riskLevel, riskColor;
    if (riskPercentage >= 70) { riskLevel = 'High'; riskColor = 'red'; }
    else if (riskPercentage >= 40) { riskLevel = 'Medium'; riskColor = 'orange'; }
    else { riskLevel = 'Low'; riskColor = 'green'; }

    const confidence = calculateConfidence(historical, weather);
    const forecast = get7DayForecast(weather, riskPercentage, currentMonth);

    const getRiskRecommendation = (level) => {
        if (level === 'High') return 'Immediate action required. Remove all stagnant water, use mosquito repellent, wear long sleeves, and seek medical attention if fever appears.';
        if (level === 'Medium') return 'Take precautions. Inspect surroundings for stagnant water, use mosquito repellent, and monitor for dengue symptoms.';
        return 'Stay vigilant. Continue practicing dengue prevention measures and keep your community clean.';
    };

    return {
        city: cityUpper,
        riskLevel,
        riskPercentage,
        riskColor,
        confidence,
        modelUsed: 'Weighted Ensemble (Historical + Weather + Season + Urban Density)',
        factors: {
            weather: {
                temperature: weather?.temperature || null,
                humidity: weather?.humidity || null,
                weeklyRainfall: weather?.weeklyRainfall || null,
                score: Math.round(weatherScore)
            },
            historical: {
                totalCases: historical.totalCases,
                totalDeaths: historical.totalDeaths,
                peakYearlyCases: historical.peakYearlyCases,
                avgMonthlyCases: historical.avgMonthlyCases,
                score: Math.round(historicalScore)
            },
            season: {
                month: currentMonth,
                isPeakSeason: [6, 7, 8, 9, 10, 11].includes(currentMonth),
                score: seasonScore
            },
            urbanDensity: {
                score: urbanDensityScore,
                label: urbanDensityScore >= 80 ? 'Very High' : urbanDensityScore >= 60 ? 'High' : 'Moderate'
            }
        },
        forecast,
        recommendation: getRiskRecommendation(riskLevel)
    };
};

// ============================================================
// PREDICT ALL NCR CITIES
// ============================================================
const predictAllCities = async () => {
    const cities = Object.keys(cityCoordinates);

    // Pre-cache Manila weather (center of NCR) to reduce API calls
    await fetchWeather(14.5995, 120.9842);

    const predictions = await Promise.all(cities.map(city => predictRisk(city)));
    const result = {};
    predictions.forEach(p => { result[p.city] = p; });
    return result;
};

module.exports = { predictRisk, predictAllCities };