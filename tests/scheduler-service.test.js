const schedulerService = require('../src/scheduler-service.js');

describe('SchedulerService', () => {
    let storage = {};

    beforeEach(() => {
        storage = {};

        if (!global.chrome) global.chrome = {};
        if (!global.chrome.storage) global.chrome.storage = {};
        if (!global.chrome.storage.local) global.chrome.storage.local = {};
        if (!global.chrome.alarms) global.chrome.alarms = {};

        global.chrome.storage.local.get = jest.fn((keys, callback) => {
            const result = {};
            keys.forEach(k => result[k] = storage[k]);
            if (callback) callback(result);
            return Promise.resolve(result);
        });

        global.chrome.storage.local.set = jest.fn((data, callback) => {
            Object.assign(storage, data);
            if (callback) callback();
            return Promise.resolve();
        });

        global.chrome.alarms.create = jest.fn();
        global.chrome.alarms.clear = jest.fn();

        // Reset
        schedulerService.schedules = null;
    });

    test('should create schedule and register alarm', async () => {
        const schedule = await schedulerService.create({
            name: 'Test Sched',
            interval: { min: 60, max: 120 }
        });

        expect(schedule.name).toBe('Test Sched');
        expect(global.chrome.alarms.create).toHaveBeenCalled();

        const all = await schedulerService.getAll();
        expect(all.length).toBe(1);
    });

    test('should update schedule and toggle alarm', async () => {
        const schedule = await schedulerService.create({
            name: 'Toggle Me',
            active: true
        });

        await schedulerService.update(schedule.id, { active: false });
        expect(global.chrome.alarms.clear).toHaveBeenCalledWith(`schedule_${schedule.id}`);
    });

    test('should delete schedule and clear alarm', async () => {
        const schedule = await schedulerService.create({ name: 'Delete Me' });
        await schedulerService.delete(schedule.id);

        const all = await schedulerService.getAll();
        expect(all.length).toBe(0);
        expect(global.chrome.alarms.clear).toHaveBeenCalledWith(`schedule_${schedule.id}`);
    });
});
