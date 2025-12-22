/**
 * chart-config.js
 * Shared configuration for accessible, premium-looking charts.
 */

const THEME = {
    light: {
        text: '#64748b',
        grid: '#e2e8f0',
        tooltipBg: 'rgba(255, 255, 255, 0.95)',
        tooltipText: '#1e293b'
    },
    dark: {
        text: '#94a3b8',
        grid: '#334151',
        tooltipBg: 'rgba(30, 41, 59, 0.95)',
        tooltipText: '#f8fafc'
    }
};

export function isDarkMode() {
    return document.documentElement.getAttribute('data-theme') === 'dark';
}

export function getChartColors() {
    const isDark = isDarkMode();
    return isDark ? THEME.dark : THEME.light;
}

export function createGradient(ctx, colorStart, colorEnd) {
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, colorStart);
    gradient.addColorStop(1, colorEnd);
    return gradient;
}

export function getCommonOptions() {
    const colors = getChartColors();

    return {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            mode: 'index',
            intersect: false,
        },
        plugins: {
            legend: {
                display: false
            },
            tooltip: {
                backgroundColor: colors.tooltipBg,
                titleColor: colors.tooltipText,
                bodyColor: colors.tooltipText,
                borderColor: colors.grid,
                borderWidth: 1,
                padding: 10,
                displayColors: true,
                usePointStyle: true,
                callbacks: {
                    label: function (context) {
                        return ` ${context.dataset.label}: ${context.parsed.y}`;
                    }
                }
            }
        },
        scales: {
            x: {
                grid: {
                    display: false,
                    drawBorder: false
                },
                ticks: {
                    color: colors.text,
                    font: {
                        size: 10
                    },
                    maxRotation: 0
                }
            },
            y: {
                grid: {
                    color: colors.grid,
                    borderDash: [5, 5],
                    drawBorder: false
                },
                ticks: {
                    color: colors.text,
                    font: {
                        size: 10
                    },
                    precision: 0
                },
                beginAtZero: true
            }
        },
        animation: {
            duration: 750,
            easing: 'easeOutQuart'
        }
    };
}

export function getMainChartConfig(ctx, timeSeriesData) {
    // Data format: { labels: [], sent: [], failed: [] }
    const colors = getChartColors();

    return {
        type: 'line',
        data: {
            labels: timeSeriesData.labels,
            datasets: [
                {
                    label: 'Messages Sent',
                    data: timeSeriesData.sent,
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    borderWidth: 2,
                    pointBackgroundColor: '#667eea',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: '#667eea',
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'Failed',
                    data: timeSeriesData.failed,
                    borderColor: '#ef4444', // Red
                    backgroundColor: 'transparent',
                    borderWidth: 2,
                    pointBackgroundColor: '#ef4444',
                    pointBorderColor: '#fff',
                    pointRadius: timeSeriesData.failed.map(v => v > 0 ? 3 : 0), // Only show point if > 0
                    tension: 0.4
                }
            ]
        },
        options: getCommonOptions()
    };
}

export function getHourlyChartConfig(ctx, hourlyData) {
    // hourlyData: Array(24) of counts
    const colors = getChartColors();

    // Generate labels "12 AM", "1 AM"...
    const labels = Array.from({ length: 24 }, (_, i) => {
        const d = new Date();
        d.setHours(i);
        return d.toLocaleTimeString([], { hour: 'numeric', hour12: true }).replace(' ', '');
    });

    return {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Activity',
                data: hourlyData,
                backgroundColor: '#3b82f6',
                borderRadius: 4,
                hoverBackgroundColor: '#2563eb'
            }]
        },
        options: {
            ...getCommonOptions(),
            scales: {
                x: {
                    display: true,
                    grid: { display: false },
                    ticks: {
                        color: colors.text,
                        font: { size: 9 },
                        maxTicksLimit: 8
                    }
                },
                y: { display: false }
            }
        }
    };
}
