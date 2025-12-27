/**
 * Advanced Analytics Dashboard
 * Handles visualization and predictive analytics
 */

class AdvancedAnalyticsDashboard {
    constructor() {
        this.charts = {
            trend: null,
            hourly: null,
            success: null
        };
        this.currentRange = '7d';
    }

    async init() {
        // Initialize event listeners
        document.getElementById('openAdvancedAnalytics')?.addEventListener('click', () => this.open());
        document.getElementById('analytics-timerange')?.addEventListener('change', (e) => {
            this.currentRange = e.target.value;
            this.refresh();
        });
        document.getElementById('export-analytics-json')?.addEventListener('click', () => this.exportJSON());
        document.getElementById('export-analytics-csv')?.addEventListener('click', () => this.exportCSV());
        document.getElementById('refresh-analytics')?.addEventListener('click', () => this.refresh());
    }

    async open() {
        const modal = document.getElementById('advancedAnalyticsModal');
        if (!modal) return;

        modal.style.display = 'block';
        await this.loadData();
    }

    async loadData() {
        try {
            // Get chart data from analytics service
            const chartData = await AnalyticsService.getChartData(this.currentRange);
            const stats = await AnalyticsService.getStats(this.currentRange);
            const recommendations = await AnalyticsService.generateRecommendations();

            // Update summary cards
            this.updateSummaryCards(stats.summary);

            // Render charts
            this.renderTrendChart(chartData.trendChart);
            this.renderHourlyChart(chartData.hourlyChart);
            this.renderSuccessChart(chartData.successChart);

            // Display recommendations
            this.displayRecommendations(recommendations);
        } catch (error) {
            console.error('[AdvancedAnalytics] Error loading data:', error);
        }
    }

    updateSummaryCards(summary) {
        document.getElementById('total-messages-stat').textContent = summary.totalSent || 0;
        document.getElementById('success-rate-stat').textContent = `${summary.successRate || 0}%`;
        document.getElementById('avg-duration-stat').textContent = '1.2s'; // Placeholder

        // Calculate peak hour from hourly data
        const peakHour = this.calculatePeakHour();
        document.getElementById('peak-hour-stat').textContent = peakHour;
    }

    calculatePeakHour() {
        // This would use actual data in production
        const hour = new Date().getHours();
        return `${hour}:00`;
    }

    renderTrendChart(data) {
        const ctx = document.getElementById('trend-chart');
        if (!ctx) return;

        // Destroy existing chart
        if (this.charts.trend) {
            this.charts.trend.destroy();
        }

        this.charts.trend = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [
                    {
                        label: 'Messages Sent',
                        data: data.sent,
                        borderColor: '#667eea',
                        backgroundColor: 'rgba(102, 126, 234, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: 'Failed',
                        data: data.failed,
                        borderColor: '#ef4444',
                        backgroundColor: 'transparent',
                        borderWidth: 2,
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    renderHourlyChart(data) {
        const ctx = document.getElementById('distribution-chart');
        if (!ctx) return;

        if (this.charts.hourly) {
            this.charts.hourly.destroy();
        }

        const labels = Array.from({ length: 24 }, (_, i) => `${i}:00`);

        this.charts.hourly = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Messages by Hour',
                    data: data,
                    backgroundColor: '#3b82f6',
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    renderSuccessChart(data) {
        const ctx = document.getElementById('success-chart');
        if (!ctx) return;

        if (this.charts.success) {
            this.charts.success.destroy();
        }

        this.charts.success = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: data.labels,
                datasets: [{
                    data: data.data,
                    backgroundColor: data.colors,
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    displayRecommendations(recommendations) {
        const list = document.getElementById('recommendations-list');
        if (!list) return;

        list.innerHTML = '';

        if (recommendations.length === 0) {
            list.innerHTML = '<li class="help">No recommendations at this time</li>';
            return;
        }

        recommendations.forEach(rec => {
            const li = document.createElement('li');
            li.className = `recommendation-item ${rec.type}`;

            const icon = this.getRecommendationIcon(rec.type);
            li.innerHTML = `
                <div class="recommendation-header">
                    <span class="recommendation-icon">${icon}</span>
                    <strong>${rec.title}</strong>
                </div>
                <p>${rec.message}</p>
                ${rec.action ? `<button class="btn-small">${rec.action}</button>` : ''}
            `;

            list.appendChild(li);
        });
    }

    getRecommendationIcon(type) {
        const icons = {
            success: '✅',
            warning: '⚠️',
            info: 'ℹ️',
            tip: '💡'
        };
        return icons[type] || 'ℹ️';
    }

    async exportJSON() {
        try {
            const data = await AnalyticsService.exportJSON();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `autochat-analytics-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);

            showNotification('Analytics exported successfully!', 'success');
        } catch (error) {
            console.error('[AdvancedAnalytics] Export error:', error);
            showNotification('Failed to export analytics', 'error');
        }
    }

    async exportCSV() {
        try {
            const csv = await AnalyticsService.exportCSV();
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `autochat-analytics-${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            URL.revokeObjectURL(url);

            showNotification('Analytics exported as CSV!', 'success');
        } catch (error) {
            console.error('[AdvancedAnalytics] Export error:', error);
            showNotification('Failed to export analytics', 'error');
        }
    }

    async refresh() {
        await this.loadData();
        showNotification('Analytics refreshed', 'success');
    }
}

// Initialize dashboard
const advancedAnalyticsDashboard = new AdvancedAnalyticsDashboard();

// Export for use in popup
if (typeof module !== 'undefined' && module.exports) {
    module.exports = advancedAnalyticsDashboard;
} else {
    window.AdvancedAnalyticsDashboard = advancedAnalyticsDashboard;
}
