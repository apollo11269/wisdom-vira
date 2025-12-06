const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Simple JSON-based reject system
const rejectsFile = path.join(__dirname, '..', 'data', 'rejects.json');

// Ensure data directory exists
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

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
    name: 'reject',
    description: 'Reject a user and log it to the reject channel',
    async execute(message, args) {
        const target = message.mentions.users.first();
        if (!target) {
            return message.reply('❌ Please mention a user to reject!');
        }
        
        const channelId = process.env.reject_channel_id;
        if (!channelId) {
            return message.reply('❌ Reject channel ID is not configured in environment variables!');
        }
        
        try {
            const rejectChannel = await message.client.channels.fetch(channelId);
            if (!rejectChannel) {
                return message.reply('❌ Reject channel not found!');
            }
            
            // Load current rejects
            const rejects = loadRejects();
            const guildId = message.guild.id;
            const userId = target.id;
            
            // Initialize guild rejects if they don't exist
            if (!rejects[guildId]) rejects[guildId] = {};
            
            // Get target member
            const targetMember = await message.guild.members.fetch(userId).catch(() => null);
            if (!targetMember) {
                return message.reply('❌ User is not in this server!');
            }

            // Get reject role ID from environment
            const rejectedRoleId = process.env.rejectedroleid;
            if (!rejectedRoleId) {
                return message.reply('❌ Rejected role ID is not configured in environment variables! Please add `rejectedroleid` to your .env file.');
            }

            // Get the reject role
            const rejectedRole = message.guild.roles.cache.get(rejectedRoleId);
            if (!rejectedRole) {
                return message.reply(`❌ Rejected role not found! Role ID: ${rejectedRoleId}`);
            }

            const reason = args.slice(1).join(' ') || 'No reason provided';

            // Store user's current roles before removing them (for unreject later)
            const userRoles = targetMember.roles.cache
                .filter(role => role.id !== message.guild.id) // Exclude @everyone role
                .map(role => role.id);

            // Add reject entry with original channel info and stored roles
            rejects[guildId][userId] = {
                username: target.tag,
                rejectedBy: message.author.tag,
                rejectedAt: new Date().toISOString(),
                reason: reason,
                originalChannelId: message.channel.id,
                originalChannelName: message.channel.name,
                previousRoles: userRoles // Store roles for potential restoration
            };
            
            // Save rejects
            saveRejects(rejects);
            
            try {
                // Remove all roles from user (except @everyone)
                if (userRoles.length > 0) {
                    try {
                        await targetMember.roles.remove(userRoles, `User rejected by ${message.author.tag}`);
                        console.log(`Removed ${userRoles.length} roles from ${target.tag}`);
                    } catch (roleError) {
                        console.error('Error removing roles:', roleError);
                        message.reply('⚠️ User rejected but there was an issue removing some roles.');
                    }
                }

                // Add rejected role
                try {
                    await targetMember.roles.add(rejectedRole, `User rejected by ${message.author.tag}`);
                    console.log(`Added rejected role to ${target.tag}`);
                } catch (roleError) {
                    console.error('Error adding rejected role:', roleError);
                    return message.reply('❌ Failed to add rejected role. Please check bot permissions and role hierarchy.');
                }

                // Remove user from current voice channel if they're in one
                if (targetMember.voice.channel) {
                    try {
                        await targetMember.voice.disconnect('User rejected');
                    } catch (voiceError) {
                        console.error('Error disconnecting user from voice:', voiceError);
                    }
                }

                // Send to reject channel
                const rejectEmbed = new EmbedBuilder()
                    .setTitle('❌ User Rejected')
                    .setDescription(`**${target.tag}** has been rejected and all roles removed.`)
                    .addFields(
                        { name: '👤 User', value: `${target.tag} (${target.id})`, inline: true },
                        { name: '👮 Rejected by', value: message.author.tag, inline: true },
                        { name: '📝 Reason', value: reason, inline: false },
                        { name: '🗑️ Roles Removed', value: `${userRoles.length} role(s)`, inline: true },
                        { name: '🏷️ Rejected Role', value: rejectedRole.toString(), inline: true },
                        { name: '📅 Date', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false }
                    )
                    .setColor('#ff4757')
                    .setThumbnail(target.displayAvatarURL({ dynamic: true }))
                    .setFooter({ text: 'WisdomSystem V4.1 ⭕ | By Apollo 👀' })
                    .setTimestamp();
                
                await rejectChannel.send({ embeds: [rejectEmbed] });
                
                // Send beautiful DM to user
                try {
                    const dmEmbed = new EmbedBuilder()
                        .setTitle('🚫 تم رفضك من السيرفر')
                        .setDescription(`**عذراً**، تم رفضك من سيرفر **${message.guild.name}**\n\nتم إزالة جميع الرتب الخاصة بك من السيرفر.`)
                        .addFields(
                            { 
                                name: '📋 السبب', 
                                value: reason.length > 1024 ? reason.substring(0, 1021) + '...' : reason, 
                                inline: false 
                            },
                            { 
                                name: '💬 للمزيد من المعلومات', 
                                value: 'يرجى التواصل مع **فريق Wisdom Team** لمعرفة المزيد حول هذا القرار.', 
                                inline: false 
                            }
                        )
                        .setColor('#ff4757')
                        .setThumbnail(message.guild.iconURL({ dynamic: true, size: 256 }))
                        .setFooter({ text: 'WisdomSystem V4.1 ⭕ | By Apollo 👀' })
                        .setTimestamp();
                    
                    await target.send({ embeds: [dmEmbed] });
                    console.log(`✅ DM sent to ${target.tag}`);
                } catch (dmError) {
                    console.log(`❌ Could not send DM to ${target.tag}:`, dmError.message);
                }
                
            } catch (error) {
                console.error('Error processing rejection:', error);
                message.reply('❌ An error occurred while processing the rejection.');
                return;
            }
            
            // Confirmation message
            const confirmEmbed = new EmbedBuilder()
                .setTitle('✅ User Rejected')
                .setDescription(`**${target.tag}** has been rejected and logged.`)
                .addFields(
                    { name: '👤 User', value: `${target.tag} (${target.id})`, inline: true },
                    { name: '👮 Moderator', value: message.author.tag, inline: true }
                )
                .setColor('#ff4757')
                .setFooter({ text: 'WisdomSystem V4.1 ⭕ | By Apollo 👀' })
                .setTimestamp();
            
            message.reply({ embeds: [confirmEmbed] });
            
        } catch (error) {
            console.error('Error rejecting user:', error);
            message.reply('❌ An error occurred while rejecting the user.');
        }
    },
};