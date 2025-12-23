const roleService = require('../src/role-service.js');

describe('RoleService', () => {
    test('Admin should have all permissions', () => {
        expect(roleService.can('admin', 'profile.create')).toBe(true);
        expect(roleService.can('admin', 'profile.update')).toBe(true);
        expect(roleService.can('admin', 'profile.delete')).toBe(true);
        expect(roleService.can('admin', 'team.manage')).toBe(true);
    });

    test('Editor should have edit but not delete/manage permissions', () => {
        expect(roleService.can('editor', 'profile.create')).toBe(true);
        expect(roleService.can('editor', 'profile.update')).toBe(true);
        expect(roleService.can('editor', 'profile.delete')).toBe(false);
        expect(roleService.can('editor', 'team.manage')).toBe(false);
    });

    test('Viewer should be restricted', () => {
        expect(roleService.can('viewer', 'profile.create')).toBe(false);
        expect(roleService.can('viewer', 'profile.update')).toBe(false);
        expect(roleService.can('viewer', 'profile.delete')).toBe(false);
        expect(roleService.can('viewer', 'profile.export')).toBe(true);
    });

    test('Invalid role should return false', () => {
        expect(roleService.can('hacker', 'profile.delete')).toBe(false);
        expect(roleService.can(null, 'profile.delete')).toBe(false);
    });
});
