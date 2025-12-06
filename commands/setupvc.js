const { EmbedBuilder, ChannelType, PermissionFlagsBits } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, VoiceConnectionStatus } = require('@discordjs/voice');
const fs = require('fs');
const path = require('path');

// Store active voice connections
const activeConnections = new Map();

module.exports = {
    name: 'setupvc',
    description: 'Create a dedicated JEBRIL voice channel and connect the bot permanently',
    aliases: ['vcsetup', 'voicesetup'],
    
    async execute(message, args) {
        try {
            const guild = message.guild;
            const member = message.member;
            
            // Permissions are checked in messageCreate.js

            // Check if JEBRIL voice channel already exists
            const existingChannel = guild.channels.cache.find(channel => 
                channel.name === '🎧╰┈➤ JEBRIL - جبريل' && channel.type === ChannelType.GuildVoice
            );

            let voiceChannel;
            
            if (existingChannel) {
                voiceChannel = existingChannel;
            } else {
                // Create the voice channel
                voiceChannel = await guild.channels.create({
                    name: '🎧╰┈➤ JEBRIL - جبريل',
                    type: ChannelType.GuildVoice,
                    bitrate: 96000, // High quality audio
                    userLimit: 0, // No user limit
                    reason: 'JEBRIL dedicated voice channel setup'
                });
            }

            // Connect bot to voice channel
            try {
                const connection = joinVoiceChannel({
                    channelId: voiceChannel.id,
                    guildId: guild.id,
                    adapterCreator: guild.voiceAdapterCreator,
                    selfDeaf: false,
                    selfMute: true
                });

                // Store connection for management
                activeConnections.set(guild.id, {
                    connection,
                    channelId: voiceChannel.id,
                    guildId: guild.id
                });

                // Handle connection events
                connection.on(VoiceConnectionStatus.Ready, () => {
                    console.log(`🎧 JEBRIL connected to voice channel in ${guild.name}`);
                });

                connection.on(VoiceConnectionStatus.Disconnected, async () => {
                    console.log(`🔌 JEBRIL disconnected from voice channel in ${guild.name}`);
                    // Try to reconnect after 5 seconds
                    setTimeout(() => {
                        if (activeConnections.has(guild.id)) {
                            try {
                                const newConnection = joinVoiceChannel({
                                    channelId: voiceChannel.id,
                                    guildId: guild.id,
                                    adapterCreator: guild.voiceAdapterCreator,
                                    selfDeaf: false,
                                    selfMute: true
                                });
                                activeConnections.set(guild.id, {
                                    connection: newConnection,
                                    channelId: voiceChannel.id,
                                    guildId: guild.id
                                });
                                console.log(`🔄 JEBRIL reconnected to voice channel in ${guild.name}`);
                            } catch (error) {
                                console.error(`❌ Failed to reconnect JEBRIL in ${guild.name}:`, error);
                            }
                        }
                    }, 5000);
                });

                connection.on('error', (error) => {
                    console.error(`🚨 Voice connection error in ${guild.name}:`, error);
                });

                // Create success embed
                const successEmbed = new EmbedBuilder()
                    .setTitle('🎧 JEBRIL Voice Setup Complete!')
                    .setDescription(`✅ **Voice channel created and bot connected successfully!**\n\n🎯 **Channel:** ${voiceChannel}\n🔗 **Channel ID:** \`${voiceChannel.id}\`\n🤖 **Bot Status:** Connected & Ready\n🔊 **Audio Quality:** High (96kbps)\n👥 **User Limit:** Unlimited`)
                    .addFields(
                        {
                            name: '🎵 Features',
                            value: '🎧 **Always Connected** - Bot stays in channel 24/7\n🔄 **Auto Reconnect** - Automatically reconnects if disconnected\n🎚️ **High Quality** - Premium audio bitrate\n🔇 **Smart Mute** - Bot is muted but can hear everything',
                            inline: true
                        },
                        {
                            name: '⚙️ Management',
                            value: '🛠️ **Admin Only** - Only administrators can manage\n📊 **Connection Status** - Real-time monitoring\n🔧 **Auto Recovery** - Self-healing connection\n📝 **Activity Logging** - Connection events logged',
                            inline: true
                        },
                        {
                            name: '🎯 Usage Tips',
                            value: '• Bot will stay connected permanently\n• Use voice commands while in the channel\n• Bot can monitor voice activity\n• Perfect for voice-based features',
                            inline: false
                        }
                    )
                    .setColor('#00FF88')
                    .setThumbnail(guild.iconURL({ dynamic: true }))
                    .setFooter({ text: 'WisdomSystem V4.1 ⭕ | By Apollo 👀' })
                    .setTimestamp();

                await message.reply({ embeds: [successEmbed] });

            } catch (voiceError) {
                console.error('Voice connection error:', voiceError);
                
                const errorEmbed = new EmbedBuilder()
                    .setTitle('❌ Voice Connection Failed')
                    .setDescription(`Failed to connect JEBRIL to the voice channel.\n\n**Error:** \`${voiceError.message}\`\n\n**Channel:** ${voiceChannel}\n**Please ensure the bot has proper voice permissions.**`)
                    .setColor('#FF4444')
                    .setTimestamp();

                await message.reply({ embeds: [errorEmbed] });
            }

        } catch (error) {
            console.error('SetupVC command error:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setTitle('❌ Setup Failed')
                .setDescription(`An error occurred while setting up the voice channel.\n\n**Error:** \`${error.message}\`\n\nPlease try again or contact an administrator.`)
                .setColor('#FF4444')
                .setTimestamp();

            await message.reply({ embeds: [errorEmbed] });
        }
    },

    // Utility functions for managing connections
    getActiveConnections() {
        return activeConnections;
    },

    disconnectFromGuild(guildId) {
        const connectionData = activeConnections.get(guildId);
        if (connectionData) {
            connectionData.connection.destroy();
            activeConnections.delete(guildId);
            return true;
        }
        return false;
    },

    isConnectedInGuild(guildId) {
        return activeConnections.has(guildId);
    }
};

// Auto-reconnect system on bot restart
process.on('SIGINT', () => {
    console.log('🔌 Cleaning up voice connections...');
    for (const [guildId, connectionData] of activeConnections) {
        connectionData.connection.destroy();
    }
    activeConnections.clear();
    process.exit(0);
});