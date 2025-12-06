const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

const warningsFile = path.join(__dirname, '..', 'data', 'warnings.json');

// Load warnings from file
function loadWarnings() {
    try {
        if (fs.existsSync(warningsFile)) {
            return JSON.parse(fs.readFileSync(warningsFile, 'utf8'));
        }
    } catch (error) {
        console.error('Error loading warnings:', error);
    }
    return {};
}

module.exports = {
    name: 'showwarnings',
    description: 'Display all server warnings or specific user warning details',
    usage: '!showwarnings | !showwarnings @user',
    async execute(message, args) {
        // Check if user has manage messages permission for viewing all warnings
        const canViewAll = message.member.permissions.has(PermissionFlagsBits.ManageMessages);
        
        const warnings = loadWarnings();
        const guildId = message.guild.id;
        const guildWarnings = warnings[guildId] || {};
        
        // If no arguments and user has permission, show all warnings
        if (args.length === 0 && canViewAll) {
            return this.showAllWarnings(message, guildWarnings);
        }
        
        // If no arguments but no permission, show help
        if (args.length === 0 && !canViewAll) {
            return this.showUsageHelp(message);
        }
        
        // Show specific user warnings
        const target = message.mentions.users.first();
        if (!target) {
            return message.reply('❌ Please mention a user to view their warnings!');
        }
        
        return this.showUserWarnings(message, target, guildWarnings);
    },
    
    async showAllWarnings(message, guildWarnings) {
        const userIds = Object.keys(guildWarnings);
        
        if (userIds.length === 0) {
            const embed = new EmbedBuilder()
                .setColor('#2ed573')
                .setTitle('📋 Server Warnings Overview')
                .setDescription(`🎉 **No warnings found!**\n\n**${message.guild.name}** has a clean record with no active warnings.`)
                .addFields(
                    { name: '📊 Statistics', value: '• **Total Users with Warnings:** 0\n• **Total Warnings:** 0\n• **Server Status:** ✅ Clean Record', inline: false },
                    { name: '💡 Usage', value: '`!showwarnings @user` - View specific user warnings\n`!warn @user [reason]` - Add a warning', inline: false }
                )
                .setFooter({ text: 'WisdomSystem V4.1 ⭕ | By Apollo 👀' })
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }
        
        let totalWarnings = 0;
        const userWarningData = [];
        
        // Process each user's warnings
        for (const userId of userIds) {
            const userWarnings = guildWarnings[userId] || [];
            if (userWarnings.length > 0) {
                totalWarnings += userWarnings.length;
                
                try {
                    const user = await message.client.users.fetch(userId);
                    userWarningData.push({
                        username: user.username,
                        tag: user.tag,
                        id: userId,
                        count: userWarnings.length,
                        lastWarning: userWarnings[userWarnings.length - 1]
                    });
                } catch (error) {
                    // If user can't be fetched, still show their data
                    userWarningData.push({
                        username: 'Unknown User',
                        tag: 'Unknown#0000',
                        id: userId,
                        count: userWarnings.length,
                        lastWarning: userWarnings[userWarnings.length - 1]
                    });
                }
            }
        }
        
        // Sort by warning count (highest first)
        userWarningData.sort((a, b) => b.count - a.count);
        
        const embed = new EmbedBuilder()
            .setColor('#ffa502')
            .setTitle('📋 Server Warnings Overview')
            .setDescription(`Complete warning overview for **${message.guild.name}**`)
            .addFields(
                { name: '📊 Server Statistics', value: `• **Users with Warnings:** ${userWarningData.length}\n• **Total Warnings:** ${totalWarnings}\n• **Average per User:** ${userWarningData.length > 0 ? (totalWarnings / userWarningData.length).toFixed(1) : '0'}`, inline: false }
            )
            .setFooter({ text: 'WisdomSystem V4.1 ⭕ | By Apollo 👀' })
            .setTimestamp();
        
        // Add top warned users (limit to 10)
        if (userWarningData.length > 0) {
            const topUsers = userWarningData.slice(0, 10);
            const userList = topUsers.map((user, index) => {
                const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '📍';
                const lastWarningDate = new Date(user.lastWarning.timestamp).toLocaleDateString();
                return `${medal} **${user.username}**\n⚠️ ${user.count} warning${user.count > 1 ? 's' : ''} | 📅 Last: ${lastWarningDate}\n\`${user.id}\``;
            }).join('\n\n');
            
            embed.addFields({ name: `👥 Users with Warnings (Top ${Math.min(10, userWarningData.length)})`, value: userList, inline: false });
        }
        
        if (userWarningData.length > 10) {
            embed.addFields({ name: '📝 Note', value: `Showing top 10 users. **${userWarningData.length - 10} more users** have warnings.\nUse \`!showwarnings @user\` for detailed information.`, inline: false });
        }
        
        embed.addFields({ name: '🔧 Quick Actions', value: '• `!showwarnings @user` - View user details\n• `!warn @user [reason]` - Add new warning\n• `!clearwarnings @user` - Clear user warnings', inline: false });
        
        return message.reply({ embeds: [embed] });
    },
    
    showUserWarnings(message, target, guildWarnings) {
        const userId = target.id;
        const userWarnings = guildWarnings[userId] || [];
        
        const embed = new EmbedBuilder()
            .setThumbnail(target.displayAvatarURL({ dynamic: true }))
            .setFooter({ text: 'WisdomSystem V4.1 ⭕ | By Apollo 👀' })
            .setTimestamp();
        
        if (userWarnings.length === 0) {
            embed
                .setTitle(`✅ Clean Record - ${target.username}`)
                .setColor('#2ed573')
                .setDescription('🎉 This user has no warnings!')
                .addFields(
                    { name: '👤 User Info', value: `**Username:** ${target.username}\n**User ID:** \`${target.id}\`\n**Status:** ✅ Clean Record`, inline: false },
                    { name: '📊 Warning Stats', value: '• **Total Warnings:** 0/3\n• **Recent Activity:** None\n• **Account Status:** Good Standing', inline: false }
                );
        } else {
            embed
                .setTitle(`⚠️ Warnings for ${target.username}`)
                .setColor(userWarnings.length >= 3 ? '#ff4757' : '#ff9500')
                .setDescription(`**Total Warnings:** ${userWarnings.length}/3${userWarnings.length >= 3 ? ' ⚠️ **MAX REACHED**' : ''}`)
                .addFields(
                    { name: '👤 User Information', value: `**Username:** ${target.username}\n**User ID:** \`${target.id}\`\n**Warning Status:** ${userWarnings.length >= 3 ? '🔴 Critical' : userWarnings.length >= 2 ? '🟡 Caution' : '🟢 Minor'}`, inline: true },
                    { name: '📊 Warning Statistics', value: `**Total Warnings:** ${userWarnings.length}/3\n**First Warning:** ${new Date(userWarnings[0].timestamp).toLocaleDateString()}\n**Latest Warning:** ${new Date(userWarnings[userWarnings.length - 1].timestamp).toLocaleDateString()}`, inline: true }
                );
            
            // Show recent warnings (last 5)
            const recentWarnings = userWarnings.slice(-5);
            const warningList = recentWarnings.map((warning, index) => {
                const warningNumber = userWarnings.length - recentWarnings.length + index + 1;
                const date = new Date(warning.timestamp).toLocaleDateString();
                return `**${warningNumber}.** ${warning.reason}\n📅 **Date:** ${date} | 👮 **Moderator:** ${warning.moderator}`;
            }).join('\n\n');
            
            embed.addFields({ name: `📝 Recent Warnings (${Math.min(5, userWarnings.length)} of ${userWarnings.length})`, value: warningList, inline: false });
            
            if (userWarnings.length > 5) {
                embed.addFields({ name: '📋 Additional Info', value: `This user has **${userWarnings.length - 5} more warnings** not shown above.\nShowing the 5 most recent warnings only.`, inline: false });
            }
            
            // Add warning level indicator
            let statusMessage = '';
            if (userWarnings.length >= 3) {
                statusMessage = '🔴 **Critical Level** - Maximum warnings reached!';
            } else if (userWarnings.length >= 2) {
                statusMessage = '🟡 **Caution Level** - Close to maximum warnings.';
            } else {
                statusMessage = '🟢 **Minor Level** - Few warnings on record.';
            }
            
            embed.addFields({ name: '⚠️ Warning Level', value: statusMessage, inline: false });
        }
        
        return message.reply({ embeds: [embed] });
    },
    
    showUsageHelp(message) {
        const embed = new EmbedBuilder()
            .setColor('#3742fa')
            .setTitle('📋 Warning System Help')
            .setDescription('Learn how to use the warning system commands')
            .addFields(
                { name: '👤 View User Warnings', value: '`!showwarnings @user` - View specific user\'s warnings\n*Available to everyone*', inline: false },
                { name: '📊 View All Warnings', value: '`!showwarnings` - View server warning overview\n*Requires Manage Messages permission*', inline: false },
                { name: '🔧 Management Commands', value: '`!warn @user [reason]` - Add a warning\n`!clearwarnings @user` - Clear user warnings\n*Requires appropriate permissions*', inline: false },
                { name: '💡 Pro Tips', value: '• Users can view their own warnings\n• Moderators can see all server warnings\n• Maximum 3 warnings per user', inline: false }
            )
            .setFooter({ text: 'WisdomSystem V4.1 ⭕ | By Apollo 👀' })
            .setTimestamp();
        
        return message.reply({ embeds: [embed] });
    }
};