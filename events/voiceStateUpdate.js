const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { loadJASettings } = require('../commands/ja.js');

// ═══════════════════════════════════════════════════════════════════════════════
//                           VOICE STATE UPDATE EVENT
// ═══════════════════════════════════════════════════════════════════════════════
// This event handles voice channel tracking with advanced features:
// • Automatic join/leave detection
// • Time calculation and statistics
// • Detailed embed reports
// • Channel-specific tracking
// • Session history logging
// ═══════════════════════════════════════════════════════════════════════════════

// In-memory storage for voice sessions
const voiceSessions = new Map();
const dailySessionCounts = new Map();

// ═══════════════════════════════════════════════════════════════════════════════
//                           UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Creates a visual progress bar for duration display
 * @param {number} duration - Duration in milliseconds
 * @returns {string} - Formatted progress bar
 */
function createDurationBar(duration) {
    const maxDuration = 7200000; // 2 hours max for full bar
    const percentage = Math.min((duration / maxDuration) * 100, 100);
    const filledBlocks = Math.round(percentage / 10);
    const emptyBlocks = 10 - filledBlocks;
    
    const filled = '█'.repeat(filledBlocks);
    const empty = '░'.repeat(emptyBlocks);
    
    return `\`${filled}${empty}\` ${percentage.toFixed(1)}%`;
}

/**
 * Gets the count of sessions for a user today
 * @param {string} userId - User ID
 * @returns {number} - Session count for today
 */
function getTodaySessionCount(userId) {
    const today = new Date().toDateString();
    const userKey = `${userId}_${today}`;
    
    if (!dailySessionCounts.has(userKey)) {
        dailySessionCounts.set(userKey, 0);
    }
    
    const count = dailySessionCounts.get(userKey) + 1;
    dailySessionCounts.set(userKey, count);
    
    return count;
}

/**
 * Cleans up old daily session counts (run daily)
 */
function cleanupOldSessionCounts() {
    const today = new Date().toDateString();
    for (const [key] of dailySessionCounts) {
        if (!key.endsWith(today)) {
            dailySessionCounts.delete(key);
        }
    }
}

// Clean up old session counts daily
setInterval(cleanupOldSessionCounts, 24 * 60 * 60 * 1000);

module.exports = {
    name: 'voiceStateUpdate',
    async execute(oldState, newState) {
        try {
            const member = newState.member || oldState.member;
            const guild = member.guild;
            const userId = member.id;
            // Ensure client-level mirrors exist
            member.client.voiceSessions = member.client.voiceSessions || new Map();
            member.client.voiceChannelLastJoin = member.client.voiceChannelLastJoin || new Map();
            member.client.jaCooldowns = member.client.jaCooldowns || new Map();
            member.client.jaGuildCooldowns = member.client.jaGuildCooldowns || new Map();
            member.client.voiceTrackBuckets = member.client.voiceTrackBuckets || new Map();
            
            // Get tracking channel from environment
            const trackingChannelId = process.env.tracktimer_channel_id;
            if (!trackingChannelId) {
                console.log('⚠️ tracktimer_channel_id not configured in .env file');
                return;
            }

            const trackingChannel = guild.channels.cache.get(trackingChannelId);
            if (!trackingChannel) {
                console.log(`⚠️ Tracking channel not found (ID: ${trackingChannelId})`);
                return;
            }

            // ═══════════════════════════════════════════════════════════════════════
            //                          MEMBER JOINED VOICE CHANNEL
            // ═══════════════════════════════════════════════════════════════════════
            if (!oldState.channel && newState.channel) {
                const joinTime = Date.now();
                const sessionId = `${userId}_${joinTime}`;
                
                // Store session data
                const session = {
                    sessionId,
                    userId,
                    username: member.user.username,
                    displayName: member.displayName,
                    channelId: newState.channel.id,
                    channelName: newState.channel.name,
                    joinTime,
                    isDeafened: newState.deaf,
                    isMuted: newState.mute,
                    isSelfDeafened: newState.selfDeaf,
                    isSelfMuted: newState.selfMute,
                    isStreaming: newState.streaming,
                    hasVideo: newState.selfVideo
                };
                voiceSessions.set(userId, session);
                member.client.voiceSessions.set(userId, session);
                member.client.voiceChannelLastJoin.set(newState.channel.id, { userId, time: joinTime });

                console.log(`🎤 ${member.user.tag} joined voice channel: ${newState.channel.name}`);

                // Create advanced join embed
                const joinEmbed = new EmbedBuilder()
                    .setTitle('🎤 Voice Channel Joined')
                    .setDescription(`**${member.displayName}** has joined the voice channel`)
                    .addFields(
                        {
                            name: '👤 Member',
                            value: `\`${member.user.tag}\`\n<@${member.id}>`,
                            inline: true
                        },
                        {
                            name: '🔊 Channel',
                            value: `**${newState.channel.name}**\n\`${newState.channel.id}\``,
                            inline: true
                        },
                        {
                            name: '⏰ Join Time',
                            value: `<t:${Math.floor(joinTime / 1000)}:T>\n<t:${Math.floor(joinTime / 1000)}:R>`,
                            inline: true
                        },
                        {
                            name: '🎛️ Voice Status',
                            value: `${newState.mute ? '🔇' : '🔊'} ${newState.mute ? 'Muted' : 'Unmuted'}\n${newState.deaf ? '🔇' : '👂'} ${newState.deaf ? 'Deafened' : 'Listening'}\n${newState.streaming ? '📺 Streaming' : ''}${newState.selfVideo ? '📹 Video On' : ''}`.trim(),
                            inline: false
                        }
                    )
                    .setColor('#00D26A')
                    .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 128 }))
                    .setFooter({ 
                        text: `Session ID: ${sessionId.slice(-8)}`, 
                        iconURL: guild.iconURL({ dynamic: true }) 
                    })
                    .setTimestamp();

                {
                    const now = Date.now();
                    const bucket = member.client.voiceTrackBuckets.get(trackingChannel.id) || { count: 0, windowStart: now };
                    if (now - bucket.windowStart > 60000) {
                        bucket.windowStart = now;
                        bucket.count = 0;
                    }
                    if (bucket.count < 20) {
                        await trackingChannel.send({ embeds: [joinEmbed] });
                        bucket.count += 1;
                        member.client.voiceTrackBuckets.set(trackingChannel.id, bucket);
                    }
                }

                // ═══════════════════════════════════════════════════════════════════════
                //                          JA NOTIFICATION SYSTEM
                // ═══════════════════════════════════════════════════════════════════════
                
                // Load JA settings and send notification if enabled
                const jaSettings = loadJASettings();
                const guildJASettings = jaSettings[guild.id];
                
                if (guildJASettings && guildJASettings.enabled && guildJASettings.channelId) {
                    const jaNotificationChannel = guild.channels.cache.get(guildJASettings.channelId);
                    
                    if (jaNotificationChannel && jaNotificationChannel.permissionsFor(guild.members.me).has(['SEND_MESSAGES', 'EMBED_LINKS'])) {
                        const key = `${guild.id}:${userId}`;
                        const lastNotified = member.client.jaCooldowns.get(key) || 0;
                        const guildKey = guild.id;
                        const lastGuildPing = member.client.jaGuildCooldowns.get(guildKey) || 0;
                        const now = Date.now();
                        const canUserNotify = now - lastNotified >= 120000;
                        const canPingRole = now - lastGuildPing >= 120000;
                        if (canUserNotify) {
                            const jaEmbed = new EmbedBuilder()
                                .setTitle('🎤 Someone Joined Voice Channel!')
                                .setDescription(`<@&1351406824753987594>\n\nRah ${member} Ja lroom dyal ${newState.channel} dkhell ched m3ah stoune bash yt7rek server <3`)
                                .addFields(
                                    {
                                        name: '👤 Member',
                                        value: `${member}`,
                                        inline: true
                                    },
                                    {
                                        name: '🎧 Voice Channel',
                                        value: `${newState.channel}`,
                                        inline: true
                                    },
                                    {
                                        name: '⏰ Time',
                                        value: `<t:${Math.floor(joinTime / 1000)}:R>`,
                                        inline: true
                                    }
                                )
                                .setColor('#00D26A')
                                .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
                                .setFooter({ 
                                    text: 'JA Voice Notification System', 
                                    iconURL: guild.iconURL({ dynamic: true }) 
                                })
                                .setTimestamp();
                            try {
                                const payload = { embeds: [jaEmbed] };
                                if (canPingRole) {
                                    payload.content = `<@&1351406824753987594>`;
                                }
                                await jaNotificationChannel.send(payload);
                                member.client.jaCooldowns.set(key, now);
                                if (canPingRole) {
                                    member.client.jaGuildCooldowns.set(guildKey, now);
                                }
                            } catch (error) {
                                console.error('Error sending JA notification:', error);
                            }
                        }
                    }
                }

            // ═══════════════════════════════════════════════════════════════════════
            //                          MEMBER LEFT VOICE CHANNEL
            // ═══════════════════════════════════════════════════════════════════════
            } else if (oldState.channel && !newState.channel) {
                const session = voiceSessions.get(userId);
                if (!session) {
                    console.log(`⚠️ No session found for ${member.user.tag}`);
                    return;
                }

                const leaveTime = Date.now();
                const duration = leaveTime - session.joinTime;
                
                // Calculate time components
                const hours = Math.floor(duration / (1000 * 60 * 60));
                const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((duration % (1000 * 60)) / 1000);
                
                const durationText = hours > 0 
                    ? `${hours}h ${minutes}m ${seconds}s`
                    : minutes > 0 
                        ? `${minutes}m ${seconds}s`
                        : `${seconds}s`;

                console.log(`🎤 ${member.user.tag} left voice channel: ${session.channelName} (Duration: ${durationText})`);

                // Create advanced leave embed with session summary
                const sessionQuality = duration > 3600000 ? '🏆 Long Session' : 
                                      duration > 1800000 ? '⭐ Good Session' : 
                                      duration > 300000 ? '👍 Short Session' : '⚡ Quick Visit';
                
                const progressBar = createDurationBar(duration);
                
                const leaveEmbed = new EmbedBuilder()
                    .setTitle('🚪 Voice Channel Left')
                    .setDescription(`**${member.displayName}** has left the voice channel`)
                    .addFields(
                        {
                            name: '👤 Member',
                            value: `\`${member.user.tag}\`\n<@${member.id}>`,
                            inline: true
                        },
                        {
                            name: '🔊 Channel',
                            value: `**${session.channelName}**\n\`${session.channelId}\``,
                            inline: true
                        },
                        {
                            name: '⏱️ Session Duration',
                            value: `**${durationText}**\n${progressBar}\n${sessionQuality}`,
                            inline: false
                        },
                        {
                            name: '📅 Session Times',
                            value: `**Joined:** <t:${Math.floor(session.joinTime / 1000)}:T>\n**Left:** <t:${Math.floor(leaveTime / 1000)}:T>`,
                            inline: true
                        },
                        {
                            name: '📊 Session Stats',
                            value: `**Total Time:** ${durationText}\n**Quality:** ${sessionQuality.split(' ')[1]}\n**Status:** Completed ✅`,
                            inline: true
                        }
                    )
                    .setColor('#FF4757')
                    .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 128 }))
                    .setFooter({ 
                        text: `Session ID: ${session.sessionId.slice(-8)} • Total Sessions Today: ${getTodaySessionCount(userId)}`, 
                        iconURL: guild.iconURL({ dynamic: true }) 
                    })
                    .setTimestamp();

                {
                    const now = Date.now();
                    const bucket = member.client.voiceTrackBuckets.get(trackingChannel.id) || { count: 0, windowStart: now };
                    if (now - bucket.windowStart > 60000) {
                        bucket.windowStart = now;
                        bucket.count = 0;
                    }
                    if (bucket.count < 20) {
                        await trackingChannel.send({ embeds: [leaveEmbed] });
                        bucket.count += 1;
                        member.client.voiceTrackBuckets.set(trackingChannel.id, bucket);
                    }
                }

                // Clean up session data
                voiceSessions.delete(userId);
                member.client.voiceSessions.delete(userId);
            }

            // ═══════════════════════════════════════════════════════════════════════
            //                          MEMBER SWITCHED CHANNELS
            // ═══════════════════════════════════════════════════════════════════════
            else if (oldState.channel && newState.channel && oldState.channel.id !== newState.channel.id) {
                const session = voiceSessions.get(userId);
                if (session) {
                    const switchTime = Date.now();
                    const timeInPrevious = switchTime - session.joinTime;
                    
                    // Calculate time in previous channel
                    const prevHours = Math.floor(timeInPrevious / (1000 * 60 * 60));
                    const prevMinutes = Math.floor((timeInPrevious % (1000 * 60 * 60)) / (1000 * 60));
                    const prevSeconds = Math.floor((timeInPrevious % (1000 * 60)) / 1000);
                    
                    const prevDurationText = prevHours > 0 
                        ? `${prevHours}h ${prevMinutes}m ${prevSeconds}s`
                        : prevMinutes > 0 
                            ? `${prevMinutes}m ${prevSeconds}s`
                            : `${prevSeconds}s`;

                    console.log(`🔄 ${member.user.tag} switched from ${oldState.channel.name} to ${newState.channel.name}`);

                    // Create advanced switch embed
                    const switchProgressBar = createDurationBar(timeInPrevious);
                    
                    const switchEmbed = new EmbedBuilder()
                        .setTitle('🔄 Voice Channel Switch')
                        .setDescription(`**${member.displayName}** switched voice channels`)
                        .addFields(
                            {
                                name: '📤 From Channel',
                                value: `**${oldState.channel.name}**\n\`${oldState.channel.id}\``,
                                inline: true
                            },
                            {
                                name: '📥 To Channel',
                                value: `**${newState.channel.name}**\n\`${newState.channel.id}\``,
                                inline: true
                            },
                            {
                                name: '⏱️ Time in Previous',
                                value: `**${prevDurationText}**\n${switchProgressBar}`,
                                inline: false
                            },
                            {
                                name: '👤 Member Info',
                                value: `\`${member.user.tag}\`\n<@${member.id}>`,
                                inline: true
                            },
                            {
                                name: '🎛️ Voice Status',
                                value: `${newState.mute ? '🔇' : '🔊'} ${newState.mute ? 'Muted' : 'Unmuted'}\n${newState.deaf ? '🔇' : '👂'} ${newState.deaf ? 'Deafened' : 'Listening'}`,
                                inline: true
                            }
                        )
                        .setColor('#FFA726')
                        .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 128 }))
                        .setFooter({ 
                            text: `Session continues • Total session time will be calculated on leave`, 
                            iconURL: guild.iconURL({ dynamic: true }) 
                        })
                        .setTimestamp();

                    {
                        const now = Date.now();
                        const bucket = member.client.voiceTrackBuckets.get(trackingChannel.id) || { count: 0, windowStart: now };
                        if (now - bucket.windowStart > 60000) {
                            bucket.windowStart = now;
                            bucket.count = 0;
                        }
                        if (bucket.count < 20) {
                            await trackingChannel.send({ embeds: [switchEmbed] });
                            bucket.count += 1;
                            member.client.voiceTrackBuckets.set(trackingChannel.id, bucket);
                        }
                    }

                    // Update session with new channel info
                    session.channelId = newState.channel.id;
                    session.channelName = newState.channel.name;
                    // Keep the original join time to track total session duration
                    voiceSessions.set(userId, session);
                    member.client.voiceSessions.set(userId, session);
                    member.client.voiceChannelLastJoin.set(newState.channel.id, { userId, time: switchTime });
                }
            }

        } catch (error) {
            console.error(`❌ Error in voiceStateUpdate event: ${error.message}`);
            console.error(error.stack);
        }
    },
};
