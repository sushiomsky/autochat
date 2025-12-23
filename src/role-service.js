/**
 * RoleService
 * Manages roles and permissions for team collaboration.
 */
class RoleService {
    constructor() {
        this.ROLES = {
            ADMIN: 'admin',
            EDITOR: 'editor',
            VIEWER: 'viewer'
        };

        // Permission Matrix
        this.PERMISSIONS = {
            [this.ROLES.ADMIN]: [
                'profile.create',
                'profile.update',
                'profile.delete',
                'profile.export',
                'team.manage',
                'team.invite'
            ],
            [this.ROLES.EDITOR]: [
                'profile.create',
                'profile.update',
                'profile.export'
            ],
            [this.ROLES.VIEWER]: [
                'profile.export'
            ]
        };
    }

    /**
     * Check if a role has a specific permission
     * @param {string} role 
     * @param {string} permission 
     * @returns {boolean}
     */
    can(role, permission) {
        if (!role || !this.PERMISSIONS[role]) return false;
        return this.PERMISSIONS[role].includes(permission);
    }

    /**
     * Get the default role for a new team member
     */
    getDefaultRole() {
        return this.ROLES.VIEWER;
    }

    /**
     * Get all available roles
     */
    getRoles() {
        return Object.values(this.ROLES);
    }
}

// Export singleton
const roleService = new RoleService();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = roleService;
} else {
    const globalScope = typeof self !== 'undefined' ? self : (typeof window !== 'undefined' ? window : this);
    globalScope.RoleService = roleService;
}
