const fs = require('fs');
const path = require('path');

// Role hierarchy: owner > founders > moderators > staff > everyone
const ROLE_LEVELS = {
    owner: 5,
    founders: 4,
    moderators: 3,
    staff: 2,
    everyone: 1
};

// Load role IDs from config
const rolesConfigPath = path.join(__dirname, '..', 'config', 'roles.json');
let roleConfig = {
    owner_role_id: '',
    founders_role_id: '',
    moderators_role_id: '',
    staff_role_id: ''
};

// Load config if exists
if (fs.existsSync(rolesConfigPath)) {
    try {
        roleConfig = JSON.parse(fs.readFileSync(rolesConfigPath, 'utf8'));
    } catch (error) {
        console.error('Error loading roles config:', error);
    }
}

// Command to role mapping
const COMMAND_PERMISSIONS = {
    // Moderation Commands
    'ban': ['founders'],
    'qawed': ['founders'],
    'QAWED': ['founders'],
    'tla7': ['founders'],
    'unban': ['founders'],
    'banlist': ['founders'],
    'kick': ['founders'],
    'warn': ['moderators', 'founders'],
    'showwarnings': ['moderators', 'founders'],
    'removewarn': ['moderators', 'founders'],
    'timeout': ['moderators', 'founders'],
    'rtimeout': ['moderators', 'founders'],
    'mute': ['staff', 'moderators', 'founders'],
    'skot': ['staff', 'moderators', 'founders'],
    'unmute': ['staff', 'moderators', 'founders'],
    'hder': ['staff', 'moderators', 'founders'],
    'muteall': ['moderators', 'founders'],
    'skto': ['moderators', 'founders'],
    'unmuteall': ['moderators', 'founders'],
    'hdro': ['moderators', 'founders'],
    'deafen': ['staff', 'moderators', 'founders'],
    'undeafen': ['staff', 'moderators', 'founders'],
    'reject': ['moderators', 'founders'],
    'unreject': ['moderators', 'founders'],
    'antispam': ['founders'],
    'as': ['founders'],
    'spam': ['founders'],
    'antitag': ['founders'],

    // Management Commands
    'lock': ['moderators', 'founders'],
    'sed': ['moderators', 'founders'],
    'unlock': ['moderators', 'founders'],
    'fte7': ['moderators', 'founders'],
    'slowmode': ['moderators', 'founders'],
    'clear': ['founders'],
    'mse7': ['founders'],
    'say': ['founders'],
    'embed': ['founders'],
    'announce': ['founders'],
    'role': ['founders'],
    'nickname': ['staff', 'moderators', 'founders'],
    'nick': ['staff', 'moderators', 'founders'],
    'smiya': ['staff', 'moderators', 'founders'],
    'nuke': ['owner'],
    'whoisvoice': ['owner'],

    // Info Commands
    'userinfo': ['everyone'],
    'server': ['everyone'],
    'admins': ['founders'],
    'avatar': ['everyone'],
    'a': ['everyone'],
    'av': ['everyone'],
    'AV': ['everyone'],
    'banner': ['everyone'],
    'b': ['everyone'],
    'ba': ['everyone'],
    'ping': ['founders'],
    'tsara': ['everyone'],

    // Voice Commands
    'move': ['staff', 'moderators', 'founders'],
    'moveall': ['founders'],
    'disconnect': ['staff', 'moderators', 'founders'],
    'disconnectall': ['founders'],
    'setupvc': ['owner'],

    // Birthdays
    'setupbirthdays': ['founders'],
    'addbirthday': ['everyone'],
    'birthday': ['everyone'],
    'bd': ['everyone'],
    'birthdays': ['everyone'],
    'bdays': ['everyone'],
    'removebirthday': ['founders'],

    // Special Commands
    'poll': ['everyone'],
    'giveaway': ['moderators', 'founders'],
    'tracktimer': ['owner'],
    'vtrack': ['owner'],
    'voicetrack': ['owner'],
    'vtimer': ['owner'],
    'ja': ['owner'],
    'janotif': ['owner'],
    'voicenotif': ['owner'],
    'setupja': ['owner'],
    'dm': ['moderators', 'founders'],

    // Help & Setup
    'help': ['staff', 'moderators', 'founders'],
    'commands': ['staff', 'moderators', 'founders'],
    'menu': ['staff', 'moderators', 'founders'],
    'lmohim': ['staff', 'moderators', 'founders'],
    'welcome': ['owner'],
    'welcometoggle': ['owner'],
    'wc': ['owner'],
    'setupapply': ['owner'],
    'applysetup': ['owner'],
    'setapply': ['owner']
};

/**
 * Get user's role level based on their roles
 * @param {GuildMember} member - Discord guild member
 * @returns {string} - Highest role level (owner, founders, moderators, staff, everyone)
 */
function getUserRoleLevel(member) {
    if (!member || !member.guild) return 'everyone';

    // Note: Bot owner check is done separately in checkPermission
    // This function only checks role-based permissions
    
    // Check roles in hierarchy order (highest first)
    const roles = member.roles.cache;
    
    // Check owner role (if configured as a role, not bot owner)
    // Bot owner is checked separately via isBotOwner()
    if (roleConfig.owner_role_id && roles.has(roleConfig.owner_role_id)) {
        return 'owner';
    }
    
    // Check founders role
    if (roleConfig.founders_role_id && roles.has(roleConfig.founders_role_id)) {
        return 'founders';
    }
    
    // Check moderators role
    if (roleConfig.moderators_role_id && roles.has(roleConfig.moderators_role_id)) {
        return 'moderators';
    }
    
    // Check staff role
    if (roleConfig.staff_role_id && roles.has(roleConfig.staff_role_id)) {
        return 'staff';
    }
    
    // Default to everyone
    return 'everyone';
}

/**
 * Check if a role level has access to a command
 * @param {string} userLevel - User's role level
 * @param {string[]} requiredRoles - Required role levels for the command
 * @returns {boolean} - Whether user has permission
 */
function hasRoleAccess(userLevel, requiredRoles) {
    if (!requiredRoles || requiredRoles.length === 0) return true;
    
    // Owner has access to everything
    if (userLevel === 'owner') return true;
    
    // Check if user's role is directly in required roles
    if (requiredRoles.includes(userLevel)) return true;
    
    // Check hierarchy: higher roles inherit access to lower role commands
    const userLevelNum = ROLE_LEVELS[userLevel] || 0;
    
    // founders have access to moderators, staff, everyone commands
    if (userLevel === 'founders') {
        if (requiredRoles.some(role => ['moderators', 'staff', 'everyone'].includes(role))) {
            return true;
        }
    }
    
    // moderators have access to staff and everyone commands
    if (userLevel === 'moderators') {
        if (requiredRoles.some(role => ['staff', 'everyone'].includes(role))) {
            return true;
        }
    }
    
    // staff have access to everyone commands
    if (userLevel === 'staff') {
        if (requiredRoles.includes('everyone')) {
            return true;
        }
    }
    
    return false;
}

/**
 * Check if user is bot owner
 * @param {string} userId - User ID
 * @param {Client} client - Discord client
 * @returns {Promise<boolean>} - Whether user is bot owner
 */
async function isBotOwner(userId, client) {
    try {
        const application = await client.application.fetch();
        return application.owner.id === userId;
    } catch (error) {
        console.error('Error checking bot owner:', error);
        return false;
    }
}

/**
 * Main permission check function
 * @param {Message} message - Discord message
 * @param {string} commandName - Command name
 * @returns {Promise<{allowed: boolean, reason?: string}>} - Permission check result
 */
async function checkPermission(message, commandName) {
    const command = commandName.toLowerCase();
    
    // Get required roles for command
    const requiredRoles = COMMAND_PERMISSIONS[command];
    
    // If command not found in permissions, deny access (fail-safe)
    if (!requiredRoles) {
        console.warn(`Command ${command} not found in permissions list, denying access`);
        return { allowed: false, reason: 'Command not configured' };
    }
    
    // Check if command is available to everyone
    if (requiredRoles.includes('everyone')) {
        return { allowed: true };
    }
    
    // Owner commands: allow bot owner or users with owner role id
    if (requiredRoles.includes('owner')) {
        const ownerCheck = await isBotOwner(message.author.id, message.client);
        if (ownerCheck) {
            return { allowed: true };
        }
        const levelForOwner = getUserRoleLevel(message.member);
        if (levelForOwner === 'owner') {
            return { allowed: true };
        }
        return { allowed: false, reason: 'owner_only' };
    }
    
    // Get user's role level
    let userLevel = getUserRoleLevel(message.member);
    
    // Check if user is bot owner (bot owner has access to everything)
    const isOwner = await isBotOwner(message.author.id, message.client);
    if (isOwner) {
        return { allowed: true };
    }
    
    // Check if user has required role access
    const hasAccess = hasRoleAccess(userLevel, requiredRoles);
    
    if (hasAccess) {
        return { allowed: true };
    }
    
    return { allowed: false, reason: 'insufficient_permissions' };
}

/**
 * Get all commands accessible by a role level
 * @param {string} roleLevel - Role level
 * @returns {string[]} - List of accessible commands
 */
function getAccessibleCommands(roleLevel) {
    const accessibleCommands = [];
    
    for (const [command, requiredRoles] of Object.entries(COMMAND_PERMISSIONS)) {
        if (hasRoleAccess(roleLevel, requiredRoles)) {
            accessibleCommands.push(command);
        }
    }
    
    return accessibleCommands;
}

module.exports = {
    checkPermission,
    getUserRoleLevel,
    hasRoleAccess,
    isBotOwner,
    getAccessibleCommands,
    COMMAND_PERMISSIONS,
    ROLE_LEVELS,
    roleConfig
};

