const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'tsara',
    description: 'Check if a user is currently in a voice channel',
    usage: '!tsara @user',
    category: 'information',
    async execute(message, args) {
        try {
            // Check if user mentioned someone
            if (!args[0]) {
                const err = new EmbedBuilder()
                    .setTitle('❌ Missing User')
                    .setDescription('Please mention a user to check.\n\n**Usage:** `!tsara @user`')
                    .setColor('#E74C3C');
                return message.reply({ embeds: [err] });
            }

            // Get the mentioned user
            const targetUser = message.mentions.users.first() || 
                              message.guild.members.cache.get(args[0])?.user;

            if (!targetUser) {
                const err = new EmbedBuilder()
                    .setTitle('❌ User Not Found')
                    .setDescription('Please mention a valid user or provide a valid user ID.')
                    .setColor('#E74C3C');
                return message.reply({ embeds: [err] });
            }

            // Get the guild member
            const member = message.guild.members.cache.get(targetUser.id);
            if (!member) {
                const err = new EmbedBuilder()
                    .setTitle('❌ Not a Server Member')
                    .setDescription('The specified user is not a member of this server.')
                    .setColor('#E74C3C');
                return message.reply({ embeds: [err] });
            }

            // Check voice state
            const voiceState = member.voice;
            
            const embed = new EmbedBuilder()
                .setColor(voiceState.channel ? '#00FF00' : '#FF0000')
                .setTitle('🎵 Voice Channel Status')
                .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
                .setTimestamp()
                .setFooter({ text: 'WisdomSystem V4.1 ⭕ | By Apollo 👀' });

            if (voiceState.channel) {
                // User is in a voice channel
                const channelInfo = [];
                
                // Basic channel info
                channelInfo.push(`**Channel:** ${voiceState.channel.name}`);
                channelInfo.push(`**Channel Type:** ${voiceState.channel.type === 2 ? 'Voice Channel' : 'Stage Channel'}`);
                channelInfo.push(`**Members in Channel:** ${voiceState.channel.members.size}`);
                
                // Voice states
                const states = [];
                if (voiceState.mute) states.push('🔇 Server Muted');
                if (voiceState.deaf) states.push('🔇 Server Deafened');
                if (voiceState.selfMute) states.push('🎤 Self Muted');
                if (voiceState.selfDeaf) states.push('🔇 Self Deafened');
                if (voiceState.streaming) states.push('📹 Streaming');
                if (voiceState.selfVideo) states.push('📹 Camera On');
                
                embed.setDescription(`✅ **${targetUser.displayName}** is currently in a voice channel!`);
                embed.addFields(
                    {
                        name: '📍 Channel Information',
                        value: channelInfo.join('\n'),
                        inline: false
                    }
                );
                
                if (states.length > 0) {
                    embed.addFields({
                        name: '🎛️ Voice States',
                        value: states.join('\n'),
                        inline: false
                    });
                }
                
                // Show other members in the channel if any
                if (voiceState.channel.members.size > 1) {
                    const otherMembers = voiceState.channel.members
                        .filter(m => m.id !== targetUser.id)
                        .map(m => m.displayName)
                        .slice(0, 10); // Limit to 10 members
                    
                    let membersList = otherMembers.join(', ');
                    if (voiceState.channel.members.size - 1 > 10) {
                        membersList += ` and ${voiceState.channel.members.size - 1 - 10} more...`;
                    }
                    
                    embed.addFields({
                        name: '👥 Other Members',
                        value: membersList,
                        inline: false
                    });
                }
                
            } else {
                // User is not in a voice channel
                embed.setDescription(`❌ **${targetUser.displayName}** is not currently in any voice channel.`);
                embed.addFields(
                    {
                        name: '💡 Information',
                        value: 'The user is either offline, not connected to voice, or in a different server.',
                        inline: false
                    }
                );
            }

            // Add user info
            embed.addFields(
                {
                    name: '👤 User Details',
                    value: `**Username:** ${targetUser.username}\n**Display Name:** ${targetUser.displayName}\n**User ID:** ${targetUser.id}`,
                    inline: true
                },
                {
                    name: '📊 Status',
                    value: `**Online Status:** ${member.presence?.status || 'Unknown'}\n**Joined Server:** <t:${Math.floor(member.joinedTimestamp / 1000)}:R>`,
                    inline: true
                }
            );

            await message.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Error in tsara command:', error);
            const err = new EmbedBuilder()
                .setTitle('❌ Error')
                .setDescription('An error occurred while checking the user\'s voice status. Please try again later or contact an administrator.')
                .setColor('#E74C3C');
            await message.reply({ embeds: [err] });
        }
    }
};