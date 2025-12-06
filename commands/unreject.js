const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const rejectsFile = path.join(__dirname, '..', 'data', 'rejects.json');

// Load rejects from file
function loadRejects() {
    try {
        if (fs.existsSync(rejectsFile)) {
            return JSON.parse(fs.readFileSync(rejectsFile, 'utf8'));
        }
    } catch (error) {
        console.error('Error loading rejects:', error);
    }
    return {};
}

// Save rejects to file
function saveRejects(rejects) {
    try {
        fs.writeFileSync(rejectsFile, JSON.stringify(rejects, null, 2));
    } catch (error) {
        console.error('Error saving rejects:', error);
    }
}

module.exports = {
    name: 'unreject',
    description: 'Remove a user from the reject list',
    async execute(message, args) {
        let target;
        
        // Check for mentions first
        if (message.mentions.users.first()) {
            target = message.mentions.users.first();
        } 
        // Check for user ID in args
        else if (args[0]) {
            const userId = args[0].replace(/[<@!>]/g, ''); // Remove mention formatting if present
            try {
                target = await message.client.users.fetch(userId);
            } catch (error) {
                return message.reply('❌ Invalid user ID or user not found!');
            }
        }
        
        if (!target) {
            return message.reply('❌ Please mention a user or provide a user ID to unreject!');
        }
        
        // Load current rejects
        const rejects = loadRejects();
        const guildId = message.guild.id;
        const userId = target.id;
        
        // Check if user is rejected
        if (!rejects[guildId]?.[userId]) {
            return message.reply('❌ This user is not in the reject list!');
        }
        
        const rejectData = rejects[guildId][userId];
        
        // Get target member
        const targetMember = await message.guild.members.fetch(userId).catch(() => null);
        if (!targetMember) {
            return message.reply('❌ User is not in this server!');
        }

        // Get rejected role ID from environment
        const rejectedRoleId = process.env.rejectedroleid;
        if (rejectedRoleId) {
            const rejectedRole = message.guild.roles.cache.get(rejectedRoleId);
            if (rejectedRole && targetMember.roles.cache.has(rejectedRoleId)) {
                try {
                    // Remove rejected role
                    await targetMember.roles.remove(rejectedRole, `User unrejected by ${message.author.tag}`);
                    console.log(`Removed rejected role from ${target.tag}`);
                } catch (roleError) {
                    console.error('Error removing rejected role:', roleError);
                }
            }
        }

        // Restore previous roles if they exist
        if (rejectData.previousRoles && rejectData.previousRoles.length > 0) {
            try {
                // Filter out roles that no longer exist
                const validRoles = rejectData.previousRoles.filter(roleId => {
                    const role = message.guild.roles.cache.get(roleId);
                    return role && role.editable;
                });

                if (validRoles.length > 0) {
                    await targetMember.roles.add(validRoles, `Roles restored after unreject by ${message.author.tag}`);
                    console.log(`Restored ${validRoles.length} roles to ${target.tag}`);
                }
            } catch (roleError) {
                console.error('Error restoring roles:', roleError);
                message.reply('⚠️ User unrejected but there was an issue restoring some roles.');
            }
        }
        
        // Get reject channel
        const rejectChannelId = process.env.reject_channel_id;
        if (rejectChannelId) {
            try {
                const rejectChannel = await message.client.channels.fetch(rejectChannelId);
                
                // Remove permissions from reject channel
                await rejectChannel.permissionOverwrites.delete(targetMember, {
                    reason: `User unrejected by ${message.author.tag}`
                }).catch(() => {});
                
                // Restore access to original channel if it still exists
                if (rejectData.originalChannelId) {
                    const originalChannel = message.guild.channels.cache.get(rejectData.originalChannelId);
                    if (originalChannel) {
                        await originalChannel.permissionOverwrites.delete(targetMember, {
                            reason: `User unrejected by ${message.author.tag}`
                        }).catch(() => {});
                    }
                }
                
                // Send notification to user in reject channel
                const unrejectedNotification = new EmbedBuilder()
                    .setTitle('✅ You have been unrejected')
                    .setDescription(`You have been unrejected from **#${rejectData.originalChannelName || 'the channel'}** and can now return.`)
                    .addFields(
                        { name: '👮 Unrejected by', value: message.author.tag, inline: true },
                        { name: '📅 Date', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
                        { name: '🔄 Access restored', value: `Your roles have been restored and you can access the server normally again.`, inline: false }
                    )
                    .setColor('#00ff00')
                    .setThumbnail(target.displayAvatarURL({ dynamic: true }))
                    .setTimestamp();
                
                await rejectChannel.send({ content: `${target}`, embeds: [unrejectedNotification] }).catch(() => {});
                
            } catch (permError) {
                console.error('Error restoring channel permissions:', permError);
            }
        }
        
        // Remove from reject list
        delete rejects[guildId][userId];
        
        // Clean up empty guild entries
        if (Object.keys(rejects[guildId]).length === 0) {
            delete rejects[guildId];
        }
        
        // Save rejects
        saveRejects(rejects);
        
        const embed = new EmbedBuilder()
            .setTitle('✅ User Unrejected')
            .setDescription(`**${target.tag}** has been removed from the reject list.`)
            .addFields(
                { name: '👤 User', value: `${target.tag} (${target.id})`, inline: true },
                { name: '👮 Moderator', value: message.author.tag, inline: true }
            )
            .setColor('#00ff00')
            .setThumbnail(target.displayAvatarURL({ dynamic: true }))
            .setFooter({ text: 'WisdomSystem V4.1 ⭕ | By Apollo 👀' })
            .setTimestamp();
        
        message.reply({ embeds: [embed] });
    },
};