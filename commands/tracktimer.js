const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');

// ═══════════════════════════════════════════════════════════════════════════════
//                           VOICE TRACKING MANAGEMENT SYSTEM
// ═══════════════════════════════════════════════════════════════════════════════
// This command manages the voice channel tracking system with features:
// • View active voice sessions
// • Get voice channel statistics
// • Monitor tracking system status
// • Manual session management
// ═══════════════════════════════════════════════════════════════════════════════

module.exports = {
    name: 'tracktimer',
    description: 'Manage voice channel tracking system and view statistics',
    aliases: ['vtrack', 'voicetrack', 'vtimer'],
    async execute(message, args) {
        const channelId = process.env.tracktimer_channel_id;
        
        if (!channelId) {
            return message.reply('❌ Voice tracking channel ID is not configured in environment variables!');
        }
        
        try {
            const trackingChannel = await message.client.channels.fetch(channelId);
            
            if (!trackingChannel) {
                return message.reply('❌ Voice tracking channel not found!');
            }

            const subcommand = args[0]?.toLowerCase();
            
            // ═══════════════════════════════════════════════════════════════════════
            //                          SUBCOMMAND HANDLING
            // ═══════════════════════════════════════════════════════════════════════
            switch (subcommand) {
                case 'active':
                case 'sessions':
                    await showActiveSessions(message);
                    break;
                    
                case 'stats':
                case 'statistics':
                    await showVoiceStatistics(message);
                    break;
                    
                case 'status':
                case 'info':
                    await showSystemStatus(message, trackingChannel);
                    break;
                    
                case 'help':
                    await showHelpMenu(message);
                    break;
                    
                default:
                    await showSystemStatus(message, trackingChannel);
                    break;
            }
            
        } catch (error) {
            console.error('Error in tracktimer command:', error);
            message.reply('❌ An error occurred while processing the voice tracking command.');
        }
    },
};

// ═══════════════════════════════════════════════════════════════════════════════
//                          HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

async function showActiveSessions(message) {
    const guild = message.guild;
    const voiceChannels = guild.channels.cache.filter(channel => 
        channel.type === 2 && channel.members.size > 0
    );
    
    if (voiceChannels.size === 0) {
        const noSessionsEmbed = new EmbedBuilder()
            .setTitle('🔇 No Active Voice Sessions')
            .setDescription('```\n🌙 The server is quiet right now...\n\n💡 Voice channels are waiting for members!\n```')
            .setColor(0x2C2F33)
            .setThumbnail('https://cdn.discordapp.com/emojis/123456789012345678.png')
            .addFields({
                name: '📊 Quick Stats',
                value: '```yaml\nActive Channels: 0\nTotal Members: 0\nStatus: Idle\n```',
                inline: false
            })
            .setFooter({ text: 'WisdomSystem V4.1 ⭕ | By Apollo 👀' })
            .setTimestamp();
            
        return message.reply({ embeds: [noSessionsEmbed] });
    }
    
    const totalMembers = voiceChannels.reduce((total, channel) => total + channel.members.size, 0);
    const maxCapacity = voiceChannels.reduce((total, channel) => total + (channel.userLimit || 99), 0);
    const occupancyRate = ((totalMembers / Math.max(maxCapacity, totalMembers)) * 100).toFixed(1);
    
    // Create animated progress bar
    const progressBar = createProgressBar(totalMembers, Math.max(maxCapacity, totalMembers), 20);
    
    const activeEmbed = new EmbedBuilder()
        .setTitle('🎤 Active Voice Sessions')
        .setDescription(`\`\`\`ansi\n\u001b[1;32m🟢 LIVE VOICE ACTIVITY\u001b[0m\n\n${progressBar}\n\u001b[1;36m${totalMembers}\u001b[0m members across \u001b[1;35m${voiceChannels.size}\u001b[0m channels\n\`\`\``)
        .setColor(0x00D4AA)
        .setThumbnail(guild.iconURL({ dynamic: true, size: 256 }))
        .addFields({
            name: '📈 Server Activity Overview',
            value: `\`\`\`yaml\nOccupancy Rate: ${occupancyRate}%\nPeak Capacity: ${Math.max(maxCapacity, totalMembers)}\nActive Ratio: ${((voiceChannels.size / guild.channels.cache.filter(c => c.type === 2).size) * 100).toFixed(1)}%\n\`\`\``,
            inline: false
        });
    
    // Enhanced channel display with rich formatting
    voiceChannels.forEach((channel, index) => {
        const members = channel.members.map(member => {
            let status = '';
            if (member.voice.mute && member.voice.deaf) status = '🔇🔕';
            else if (member.voice.mute) status = '🔇';
            else if (member.voice.deaf) status = '🔕';
            if (member.voice.streaming) status += '📺';
            if (member.voice.selfVideo) status += '📹';
            return `${status} ${member.displayName}`;
        });
        
        const channelProgress = createMiniProgressBar(channel.members.size, channel.userLimit || 99, 10);
        const channelEmoji = getChannelEmoji(index);
        
        activeEmbed.addFields({
            name: `${channelEmoji} ${channel.name}`,
            value: `\`\`\`\n${channelProgress} ${channel.members.size}/${channel.userLimit || '∞'}\n\`\`\`\n${members.join('\n')}`,
            inline: true
        });
    });
    
    message.reply({ embeds: [activeEmbed] });
}

async function showVoiceStatistics(message) {
    const guild = message.guild;
    const allVoiceChannels = guild.channels.cache.filter(channel => channel.type === 2);
    const activeVoiceChannels = allVoiceChannels.filter(channel => channel.members.size > 0);
    const totalMembersInVoice = activeVoiceChannels.reduce((total, channel) => total + channel.members.size, 0);
    
    // Advanced statistics calculation
    const voiceParticipationRate = ((totalMembersInVoice / guild.memberCount) * 100).toFixed(1);
    const channelUtilizationRate = ((activeVoiceChannels.size / allVoiceChannels.size) * 100).toFixed(1);
    const avgMembersPerChannel = activeVoiceChannels.size > 0 ? (totalMembersInVoice / activeVoiceChannels.size).toFixed(1) : 0;
    
    // Get voice features statistics
    const featureStats = getAdvancedVoiceStats(activeVoiceChannels);
    
    const statsEmbed = new EmbedBuilder()
        .setTitle('📊 Advanced Voice Analytics')
        .setDescription('```ansi\n\u001b[1;33m📈 REAL-TIME VOICE METRICS\u001b[0m\n\n🎯 Comprehensive server voice analysis\n```')
        .setColor(0x7289DA)
        .setThumbnail(guild.iconURL({ dynamic: true, size: 256 }))
        .addFields(
            {
                name: '🏢 Channel Overview',
                value: `\`\`\`yaml\nTotal Channels: ${allVoiceChannels.size}\nActive Channels: ${activeVoiceChannels.size}\nUtilization Rate: ${channelUtilizationRate}%\n\`\`\``,
                inline: true
            },
            {
                name: '👥 Member Analytics',
                value: `\`\`\`yaml\nIn Voice: ${totalMembersInVoice}\nTotal Members: ${guild.memberCount}\nParticipation: ${voiceParticipationRate}%\n\`\`\``,
                inline: true
            },
            {
                name: '📈 Performance Metrics',
                value: `\`\`\`yaml\nAvg/Channel: ${avgMembersPerChannel}\nPeak Activity: ${Math.max(...activeVoiceChannels.map(c => c.members.size), 0)}\nEfficiency: ${(parseFloat(channelUtilizationRate) * parseFloat(voiceParticipationRate) / 100).toFixed(1)}%\n\`\`\``,
                inline: true
            }
        )
        .addFields({
            name: '🎛️ Voice Features Usage',
            value: featureStats,
            inline: false
        })
        .addFields({
            name: '📊 Activity Distribution',
            value: createChannelDistributionChart(activeVoiceChannels),
            inline: false
        })
        .setFooter({ text: 'WisdomSystem V4.1 ⭕ | By Apollo 👀' })
        .setTimestamp();
    
    // Add interactive buttons
    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('refresh_stats')
                .setLabel('🔄 Refresh')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('detailed_view')
                .setLabel('📋 Detailed View')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('export_data')
                .setLabel('📤 Export')
                .setStyle(ButtonStyle.Success)
        );
    
    const response = await message.reply({ embeds: [statsEmbed], components: [row] });
    
    // Handle button interactions
    const collector = response.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 300000 // 5 minutes
    });
    
    collector.on('collect', async (interaction) => {
        if (interaction.user.id !== message.author.id) {
            return interaction.reply({ content: '❌ Only the command user can interact with these buttons!', ephemeral: true });
        }
        
        switch (interaction.customId) {
            case 'refresh_stats':
                await interaction.deferUpdate();
                await showVoiceStatistics(message);
                break;
            case 'detailed_view':
                await interaction.reply({ content: '📋 **Detailed View**\n```yaml\nFeature coming soon...\nWill include:\n- Historical data\n- Trend analysis\n- User activity patterns\n```', ephemeral: true });
                break;
            case 'export_data':
                await interaction.reply({ content: '📤 **Export Data**\n```json\n{\n  "timestamp": "' + new Date().toISOString() + '",\n  "totalChannels": ' + allVoiceChannels.size + ',\n  "activeChannels": ' + activeVoiceChannels.size + ',\n  "totalMembers": ' + totalMembersInVoice + '\n}\n```', ephemeral: true });
                break;
        }
    });
    
    collector.on('end', () => {
        row.components.forEach(button => button.setDisabled(true));
        response.edit({ components: [row] }).catch(() => {});
    });
}

// ═══════════════════════════════════════════════════════════════════════════════
//                          ADVANCED UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

function createProgressBar(current, max, length = 20) {
    const percentage = Math.min(current / max, 1);
    const filled = Math.round(length * percentage);
    const empty = length - filled;
    
    const fillChar = '█';
    const emptyChar = '░';
    const bar = fillChar.repeat(filled) + emptyChar.repeat(empty);
    
    return `${bar} ${(percentage * 100).toFixed(1)}%`;
}

function createMiniProgressBar(current, max, length = 10) {
    const percentage = Math.min(current / max, 1);
    const filled = Math.round(length * percentage);
    const empty = length - filled;
    
    return '▓'.repeat(filled) + '░'.repeat(empty);
}

function createHealthBar(percentage) {
    const length = 15;
    const filled = Math.round(length * (percentage / 100));
    const empty = length - filled;
    
    let color = '🟢'; // Green
    if (percentage < 80) color = '🟡'; // Yellow
    if (percentage < 60) color = '🔴'; // Red
    
    return `${color} ${'█'.repeat(filled)}${'░'.repeat(empty)}`;
}

function getChannelEmoji(index) {
    const emojis = ['🎵', '🎶', '🎤', '🎧', '🔊', '📢', '📣', '🎺', '🎸', '🥁'];
    return emojis[index % emojis.length];
}

function formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
}

function getAdvancedVoiceStats(activeChannels) {
    let mutedCount = 0;
    let deafenedCount = 0;
    let videoCount = 0;
    let streamingCount = 0;
    let totalMembers = 0;
    
    activeChannels.forEach(channel => {
        channel.members.forEach(member => {
            totalMembers++;
            if (member.voice.mute) mutedCount++;
            if (member.voice.deaf) deafenedCount++;
            if (member.voice.selfVideo) videoCount++;
            if (member.voice.streaming) streamingCount++;
        });
    });
    
    if (totalMembers === 0) {
        return '```yaml\nNo Active Sessions\nStatus: Idle\nFeatures: N/A\n```';
    }
    
    const mutedBar = createMiniProgressBar(mutedCount, totalMembers, 8);
    const deafenedBar = createMiniProgressBar(deafenedCount, totalMembers, 8);
    const videoBar = createMiniProgressBar(videoCount, totalMembers, 8);
    const streamingBar = createMiniProgressBar(streamingCount, totalMembers, 8);
    
    return `\`\`\`yaml\n🔇 Muted:     ${mutedBar} ${mutedCount}/${totalMembers} (${((mutedCount/totalMembers)*100).toFixed(1)}%)\n🔕 Deafened:  ${deafenedBar} ${deafenedCount}/${totalMembers} (${((deafenedCount/totalMembers)*100).toFixed(1)}%)\n📹 Video:     ${videoBar} ${videoCount}/${totalMembers} (${((videoCount/totalMembers)*100).toFixed(1)}%)\n📺 Streaming: ${streamingBar} ${streamingCount}/${totalMembers} (${((streamingCount/totalMembers)*100).toFixed(1)}%)\n\`\`\``;
}

function createChannelDistributionChart(activeChannels) {
    if (activeChannels.size === 0) {
        return '```\n📊 No active channels to display\n```';
    }
    
    const maxMembers = Math.max(...activeChannels.map(c => c.members.size));
    let chart = '```\n';
    
    activeChannels.forEach((channel, index) => {
        const memberCount = channel.members.size;
        const barLength = Math.max(1, Math.round((memberCount / maxMembers) * 20));
        const bar = '█'.repeat(barLength);
        const channelName = channel.name.length > 15 ? channel.name.substring(0, 12) + '...' : channel.name;
        
        chart += `${channelName.padEnd(15)} ${bar} ${memberCount}\n`;
    });
    
    chart += '```';
    return chart;
}

function getVoiceFeaturesStats(activeChannels) {
    return getAdvancedVoiceStats(activeChannels);
}

async function showSystemStatus(message, trackingChannel) {
    const guild = message.guild;
    const botMember = guild.members.cache.get(message.client.user.id);
    const hasPerms = trackingChannel.permissionsFor(botMember).has(['ViewChannel', 'SendMessages', 'EmbedLinks']);
    
    // System health metrics
    const uptime = process.uptime();
    const uptimeFormatted = formatUptime(uptime);
    const memoryUsage = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
    const ping = message.client.ws.ping;
    
    // Permission analysis
    const permissions = trackingChannel.permissionsFor(botMember);
    const permissionStatus = {
        viewChannel: permissions.has('ViewChannel'),
        sendMessages: permissions.has('SendMessages'),
        embedLinks: permissions.has('EmbedLinks'),
        manageMessages: permissions.has('ManageMessages'),
        readMessageHistory: permissions.has('ReadMessageHistory')
    };
    
    const healthScore = Object.values(permissionStatus).filter(Boolean).length / Object.keys(permissionStatus).length * 100;
    const statusColor = healthScore === 100 ? 0x00FF88 : healthScore >= 80 ? 0xFFAA00 : 0xFF4444;
    const statusIcon = healthScore === 100 ? '🟢' : healthScore >= 80 ? '🟡' : '🔴';
    
    const statusEmbed = new EmbedBuilder()
        .setTitle(`${statusIcon} Voice Tracking System Status`)
        .setDescription(`\`\`\`ansi\n\u001b[1;32m🤖 SYSTEM DIAGNOSTICS\u001b[0m\n\n${createHealthBar(healthScore)} ${healthScore.toFixed(1)}%\n\`\`\``)
        .setColor(statusColor)
        .setThumbnail(message.client.user.displayAvatarURL({ dynamic: true, size: 256 }))
        .addFields(
            {
                name: '⚡ System Performance',
                value: `\`\`\`yaml\nUptime: ${uptimeFormatted}\nMemory: ${memoryUsage} MB\nLatency: ${ping}ms\n\`\`\``,
                inline: true
            },
            {
                name: '🔐 Permission Status',
                value: `\`\`\`diff\n${permissionStatus.viewChannel ? '+' : '-'} View Channel\n${permissionStatus.sendMessages ? '+' : '-'} Send Messages\n${permissionStatus.embedLinks ? '+' : '-'} Embed Links\n${permissionStatus.manageMessages ? '+' : '-'} Manage Messages\n${permissionStatus.readMessageHistory ? '+' : '-'} Read History\n\`\`\``,
                inline: true
            },
            {
                name: '📍 Configuration',
                value: `\`\`\`yaml\nTracking Channel: ${trackingChannel.name}\nChannel ID: ${trackingChannel.id}\nGuild: ${guild.name}\n\`\`\``,
                inline: true
            }
        )
        .addFields({
            name: '🎮 Available Commands',
            value: '```yaml\nPrimary Commands:\n  !tracktimer        → System overview\n  !tracktimer active → Live sessions\n  !tracktimer stats  → Advanced analytics\n  !tracktimer status → System diagnostics\n  !tracktimer help   → Command reference\n\nAliases: !vtrack, !voicetrack, !vtimer\n```',
            inline: false
        })
        .addFields({
            name: '📊 Quick System Stats',
            value: `\`\`\`\n🏢 Guilds: ${message.client.guilds.cache.size}\n👥 Users: ${message.client.users.cache.size}\n📺 Channels: ${message.client.channels.cache.size}\n🎵 Voice Channels: ${guild.channels.cache.filter(c => c.type === 2).size}\n\`\`\``,
            inline: false
        })
        .setFooter({ text: 'WisdomSystem V4.1 ⭕ | By Apollo 👀' })
        .setTimestamp();
    
    message.reply({ embeds: [statusEmbed] });
}

async function showHelpMenu(message) {
    const helpEmbed = new EmbedBuilder()
        .setTitle('🎵 Voice Tracking System - Complete Guide')
        .setDescription('```ansi\n\u001b[1;36m🚀 ADVANCED VOICE MONITORING SYSTEM\u001b[0m\n\n🎯 Real-time voice activity tracking with rich analytics\n```')
        .setColor(0x5865F2)
        .setThumbnail(message.client.user.displayAvatarURL({ dynamic: true, size: 256 }))
        .addFields(
            {
                name: '🎮 Core Commands',
                value: '```yaml\n!tracktimer\n  └─ System overview and health status\n\n!tracktimer active\n  └─ Live voice sessions with real-time data\n\n!tracktimer stats\n  └─ Advanced analytics and metrics\n\n!tracktimer status\n  └─ System diagnostics and performance\n\n!tracktimer help\n  └─ This comprehensive guide\n```',
                inline: false
            },
            {
                name: '🔗 Command Aliases',
                value: '```\n!vtrack     → !tracktimer\n!voicetrack → !tracktimer\n!vtimer     → !tracktimer\n```',
                inline: true
            },
            {
                name: '⚡ Quick Access',
                value: '```\n!vtrack active  → Live sessions\n!vtimer stats   → Analytics\n!voicetrack     → System status\n```',
                inline: true
            }
        )
        .addFields({
            name: '🌟 Advanced Features',
            value: '```diff\n+ Real-time voice session monitoring\n+ Advanced analytics with participation rates\n+ Interactive buttons and components\n+ Rich visual progress bars and charts\n+ Comprehensive permission diagnostics\n+ System performance metrics\n+ Export functionality for data analysis\n+ Animated embeds with color coding\n```',
            inline: false
        })
        .addFields({
            name: '📊 Data Tracking',
            value: '```yaml\nVoice States:\n  • Join/Leave timestamps\n  • Mute/Deafen status\n  • Video/Streaming activity\n  • Channel occupancy rates\n\nAnalytics:\n  • Participation percentages\n  • Channel utilization rates\n  • Peak activity tracking\n  • Feature usage statistics\n```',
            inline: false
        })
        .addFields({
            name: '🎨 Visual Elements',
            value: '```\n🟢 Active sessions    🔴 System issues\n🟡 Limited access     🔵 Normal operation\n📊 Progress bars      📈 Live charts\n🎵 Voice indicators   ⚡ Performance data\n```',
            inline: false
        })
        .setFooter({ text: 'WisdomSystem V4.1 ⭕ | By Apollo 👀' })
        .setTimestamp();
    
    message.reply({ embeds: [helpEmbed] });
}