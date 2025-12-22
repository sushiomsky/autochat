/**
 * SchedulerService
 * Manages automated message schedules and drip campaigns.
 */
class SchedulerService {
    constructor() {
        this.STORAGE_KEY = 'schedules_v5';
        this.schedules = null;
    }

    async init() {
        await this._loadSchedules();
    }

    async getAll() {
        if (!this.schedules) await this._loadSchedules();
        return Object.values(this.schedules);
    }

    async create(scheduleData) {
        if (!this.schedules) await this._loadSchedules();

        const id = 'sched_' + Date.now();
        const newSchedule = {
            id,
            name: scheduleData.name || 'Untitled Schedule',
            profileId: scheduleData.profileId || 'default',
            type: scheduleData.type || 'drip',
            startTime: scheduleData.startTime || '00:00',
            endTime: scheduleData.endTime || '23:59',
            interval: scheduleData.interval || { min: 300, max: 600 },
            active: scheduleData.active !== false,
            created: Date.now()
        };

        this.schedules[id] = newSchedule;
        await this._saveSchedules();

        if (newSchedule.active) {
            this.registerAlarm(newSchedule);
        }

        return newSchedule;
    }

    async update(id, updates) {
        if (!this.schedules) await this._loadSchedules();
        if (!this.schedules[id]) throw new Error('Schedule not found');

        this.schedules[id] = { ...this.schedules[id], ...updates };
        await this._saveSchedules();

        // Update alarm if active state changed
        if (this.schedules[id].active) {
            this.registerAlarm(this.schedules[id]);
        } else {
            this.unregisterAlarm(id);
        }

        return this.schedules[id];
    }

    async delete(id) {
        if (!this.schedules) await this._loadSchedules();
        delete this.schedules[id];
        await this._saveSchedules();
        this.unregisterAlarm(id);
    }

    /**
     * Register a chrome alarm for the schedule
     */
    registerAlarm(schedule) {
        const name = `schedule_${schedule.id}`;
        // For drip campaigns, we'll set a recurring alarm based on interval.min
        // Real logic would be more complex (randomizing next firing)
        const periodInMinutes = Math.max(1, Math.floor(schedule.interval.min / 60));

        chrome.alarms.create(name, {
            delayInMinutes: periodInMinutes,
            periodInMinutes: periodInMinutes
        });
        console.log(`[SchedulerService] Registered alarm: ${name} (every ${periodInMinutes}m)`);
    }

    unregisterAlarm(id) {
        chrome.alarms.clear(`schedule_${id}`);
    }

    // --- Private Methods ---

    async _loadSchedules() {
        const data = await chrome.storage.local.get([this.STORAGE_KEY]);
        this.schedules = data[this.STORAGE_KEY] || {};
    }

    async _saveSchedules() {
        await chrome.storage.local.set({ [this.STORAGE_KEY]: this.schedules });
    }
}

// Export singleton
const schedulerService = new SchedulerService();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = schedulerService;
} else {
    const globalScope = typeof self !== 'undefined' ? self : (typeof window !== 'undefined' ? window : this);
    globalScope.SchedulerService = schedulerService;
}
