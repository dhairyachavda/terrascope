// Check authentication
function checkAuth() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));

    if (!token || !user) {
        window.location.href = '/';
        return;
    }

    document.getElementById('user-name').textContent = user.name || 'User';
}

// Logout
document.getElementById('logout-btn').addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
});

// Index data
const indexData = {
    ndvi: {
        title: 'NDVI - Vegetation Health Index',
        desc: 'Normalized Difference Vegetation Index measures vegetation health and greenness',
        icon: '🌱'
    },
    ndwi: {
        title: 'NDWI - Water Index',
        desc: 'Normalized Difference Water Index detects water presence and moisture content',
        icon: '💧'
    },
    lst: {
        title: 'LST - Land Surface Temperature',
        desc: 'Land Surface Temperature derived from thermal infrared radiation',
        icon: '🌡️'
    },
    ndbi: {
        title: 'NDBI - Built-up Index',
        desc: 'Normalized Difference Built-up Index detects urban and built-up areas',
        icon: '🏗️'
    },
    gndvi: {
        title: 'GNDVI - Green Index',
        desc: 'Green Normalized Difference Vegetation Index for crop monitoring',
        icon: '🍃'
    },
    ndmi: {
        title: 'NDMI - Moisture Index',
        desc: 'Normalized Difference Moisture Index measures soil and vegetation moisture',
        icon: '💦'
    }
};

// Switch indices
document.querySelectorAll('.index-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.index-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const indexKey = btn.getAttribute('data-index');
        const indexInfo = indexData[indexKey];

        document.getElementById('index-title').textContent = indexInfo.title;
        document.getElementById('index-desc').textContent = indexInfo.desc;

        updateStats(indexKey);
        updateCharts(indexKey);
    });
});

// Generate dummy stats
function updateStats(index) {
    const stats = {
        ndvi: { mean: 0.45, std: 0.18, min: 0.12, max: 0.89 },
        ndwi: { mean: 0.32, std: 0.22, min: -0.15, max: 0.78 },
        lst: { mean: 28.5, std: 5.2, min: 18.3, max: 42.1 },
        ndbi: { mean: 0.18, std: 0.14, min: 0.02, max: 0.67 },
        gndvi: { mean: 0.38, std: 0.16, min: 0.08, max: 0.85 },
        ndmi: { mean: 0.22, std: 0.15, min: -0.08, max: 0.64 }
    };

    const data = stats[index] || stats.ndvi;
    document.getElementById('stat-mean').textContent = data.mean;
    document.getElementById('stat-std').textContent = data.std;
    document.getElementById('stat-min').textContent = data.min;
    document.getElementById('stat-max').textContent = data.max;
}

// Update charts
function updateCharts(index) {
    drawTrendChart(index);
    drawChangeChart(index);
}

// Trend chart
function drawTrendChart(index) {
    const canvas = document.getElementById('trendCanvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = canvas.parentElement.clientWidth - 40;
    canvas.height = 250;

    const data = generateTrendData(index);
    const width = canvas.width;
    const height = canvas.height;
    const padding = 40;

    // Clear canvas
    ctx.fillStyle = 'rgba(10, 14, 39, 0.3)';
    ctx.fillRect(0, 0, width, height);

    // Draw grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
        const y = padding + (height - padding * 2) * (i / 4);
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(width - padding, y);
        ctx.stroke();
    }

    // Draw line chart
    const graphWidth = width - padding * 2;
    const graphHeight = height - padding * 2;
    const pointSpacing = graphWidth / (data.length - 1);

    ctx.strokeStyle = 'rgba(0, 212, 255, 0.8)';
    ctx.lineWidth = 3;
    ctx.beginPath();

    data.forEach((value, i) => {
        const x = padding + i * pointSpacing;
        const y = height - padding - (value / 1) * graphHeight;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Draw points
    ctx.fillStyle = 'rgba(0, 212, 255, 1)';
    data.forEach((value, i) => {
        const x = padding + i * pointSpacing;
        const y = height - padding - (value / 1) * graphHeight;
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
    });

    // Labels
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    for (let i = 0; i < data.length; i += Math.ceil(data.length / 5)) {
        const x = padding + i * pointSpacing;
        ctx.fillText(`Day ${i + 1}`, x, height - 10);
    }
}

// Change detection chart
function drawChangeChart(index) {
    const canvas = document.getElementById('changeCanvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = canvas.parentElement.clientWidth - 40;
    canvas.height = 250;

    const changes = [
        { label: 'Increase', value: 35, color: 'rgba(0, 255, 100, 0.8)' },
        { label: 'No Change', value: 45, color: 'rgba(255, 200, 87, 0.8)' },
        { label: 'Decrease', value: 20, color: 'rgba(255, 50, 50, 0.8)' }
    ];

    const width = canvas.width;
    const height = canvas.height;
    const barWidth = width / (changes.length * 2);
    const maxValue = 50;

    ctx.fillStyle = 'rgba(10, 14, 39, 0.3)';
    ctx.fillRect(0, 0, width, height);

    // Draw bars
    changes.forEach((item, i) => {
        const barHeight = (item.value / maxValue) * (height - 100);
        const x = width / (changes.length + 1) * (i + 1) - barWidth / 2;
        const y = height - 50 - barHeight;

        ctx.fillStyle = item.color;
        ctx.fillRect(x, y, barWidth, barHeight);

        // Label
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${item.value}%`, x + barWidth / 2, y - 10);

        ctx.font = '12px sans-serif';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.fillText(item.label, x + barWidth / 2, height - 15);
    });
}

// Generate dummy data
function generateTrendData(index) {
    const baseValues = {
        ndvi: [0.35, 0.38, 0.42, 0.45, 0.48, 0.52, 0.55, 0.58, 0.60, 0.62, 0.63, 0.65, 0.64, 0.62, 0.60, 0.58, 0.56, 0.54, 0.52, 0.50, 0.48, 0.46, 0.44, 0.42, 0.40, 0.38, 0.36, 0.35, 0.34, 0.33],
        ndwi: [0.15, 0.18, 0.22, 0.28, 0.35, 0.42, 0.48, 0.52, 0.55, 0.58, 0.60, 0.62, 0.60, 0.58, 0.55, 0.52, 0.48, 0.45, 0.42, 0.38, 0.35, 0.32, 0.28, 0.25, 0.22, 0.20, 0.18, 0.16, 0.15, 0.14],
        lst: [25, 26, 27, 28, 29, 30, 31, 32, 32, 33, 33, 34, 34, 33, 32, 31, 30, 29, 28, 27, 26, 25, 24, 23, 22, 21, 20, 19, 18, 18],
        ndbi: [0.10, 0.11, 0.12, 0.13, 0.14, 0.15, 0.16, 0.17, 0.17, 0.18, 0.18, 0.19, 0.19, 0.18, 0.18, 0.17, 0.17, 0.16, 0.15, 0.15, 0.14, 0.13, 0.12, 0.11, 0.11, 0.10, 0.09, 0.09, 0.08, 0.08],
        gndvi: [0.28, 0.30, 0.34, 0.38, 0.42, 0.46, 0.50, 0.54, 0.57, 0.60, 0.62, 0.64, 0.62, 0.60, 0.57, 0.54, 0.50, 0.46, 0.42, 0.38, 0.34, 0.30, 0.26, 0.22, 0.20, 0.18, 0.16, 0.15, 0.14, 0.13],
        ndmi: [0.12, 0.14, 0.17, 0.21, 0.26, 0.31, 0.37, 0.42, 0.46, 0.50, 0.52, 0.54, 0.52, 0.50, 0.47, 0.44, 0.40, 0.36, 0.32, 0.28, 0.24, 0.20, 0.16, 0.13, 0.11, 0.09, 0.08, 0.07, 0.06, 0.05]
    };

    return baseValues[index] || baseValues.ndvi;
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    updateStats('ndvi');
    updateCharts('ndvi');
});