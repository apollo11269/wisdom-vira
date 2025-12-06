const { EmbedBuilder, ChannelType } = require('discord.js');

module.exports = {
    name: 'whoisvoice',
    description: 'Show detailed voice activity information across all voice/stage channels',
    async execute(message, args) {
        const guild = message.guild;

        const voiceChannels = guild.channels.cache
            .filter(ch => ch.type === ChannelType.GuildVoice || ch.type === ChannelType.GuildStageVoice)
            .sort((a, b) => b.members.size - a.members.size || a.name.localeCompare(b.name));

        const makeBar = (count, total, width = 12) => {
            const filled = total === 0 ? 0 : Math.round((count / total) * width);
            return `▮`.repeat(filled) + `▯`.repeat(width - filled);
        };

        const formatList = (members, limit = 10) => {
            const arr = members.map(m => `<@${m.id}>`);
            if (arr.length === 0) return 'None';
            if (arr.length > limit) return `${arr.slice(0, limit).join(', ')} +${arr.length - limit} more`;
            return arr.join(', ');
        };

        const fields = [];

        let totalMembers = 0;
        let totalMuted = 0;
        let totalDeaf = 0;
        let totalVideo = 0;
        let totalStream = 0;

        voiceChannels.forEach(channel => {
            const members = channel.members.filter(m => !m.user.bot);

            const active = members.filter(m => !(m.voice.mute || m.voice.selfMute || m.voice.deaf || m.voice.selfDeaf));
            const muted = members.filter(m => m.voice.mute || m.voice.selfMute);
            const deafened = members.filter(m => m.voice.deaf || m.voice.selfDeaf);
            const camera = members.filter(m => m.voice.selfVideo);
            const streaming = members.filter(m => m.voice.streaming);

            totalMembers += members.size;
            totalMuted += muted.size;
            totalDeaf += deafened.size;
            totalVideo += camera.size;
            totalStream += streaming.size;

            let lastJoinedText = 'Not tracked yet';
            if (message.client.voiceChannelLastJoin && message.client.voiceChannelLastJoin.has(channel.id)) {
                const lj = message.client.voiceChannelLastJoin.get(channel.id);
                lastJoinedText = `<@${lj.userId}> • <t:${Math.floor(lj.time / 1000)}:R>`;
            }

            const bar = makeBar(active.size, Math.max(members.size, 1));
            const value = [
                `Members: **${members.size}** • Active: **${active.size}**`,
                `${bar}`,
                '```yaml',
                `Active:   ${formatList([...active.values()], 6)}`,
                `Muted:    ${formatList([...muted.values()], 6)}`,
                `Deafened: ${formatList([...deafened.values()], 6)}`,
                `Camera:   ${formatList([...camera.values()], 6)}`,
                `Streaming:${formatList([...streaming.values()], 6)}`,
                '```',
                `Last Joined: ${lastJoinedText}`
            ].join('\n');

            fields.push({
                name: `${channel.type === ChannelType.GuildStageVoice ? '🎭' : '🔊'} ${channel.name}`,
                value: value.length > 1024 ? `${value.slice(0, 1019)}...` : value,
                inline: true
            });
        });

        const activeRatio = totalMembers === 0 ? 0 : Math.round(((totalMembers - totalMuted - totalDeaf) / totalMembers) * 100);
        const color = totalMembers === 0 ? '#95A5A6' : activeRatio >= 60 ? '#2ECC71' : activeRatio >= 30 ? '#F1C40F' : '#E74C3C';

        const summary = new EmbedBuilder()
            .setAuthor({ name: guild.name, iconURL: guild.iconURL({ dynamic: true }) || undefined })
            .setTitle('🎙️ Voice Activity Overview')
            .setDescription('━━━━━━━━━━━━━━━━━━━━━━━━')
            .setColor(color)
            .addFields(
                {
                    name: 'Overview',
                    value: [
                        `Channels: **${voiceChannels.size}**`,
                        `Members: **${totalMembers}**`,
                        `Muted: **${totalMuted}**  ${makeBar(totalMuted, Math.max(totalMembers, 1))}`,
                        `Deafened: **${totalDeaf}** ${makeBar(totalDeaf, Math.max(totalMembers, 1))}`,
                        `Camera: **${totalVideo}** ${makeBar(totalVideo, Math.max(totalMembers, 1))}`,
                        `Streaming: **${totalStream}** ${makeBar(totalStream, Math.max(totalMembers, 1))}`
                    ].join('\n'),
                    inline: false
                }
            )
            .setThumbnail(guild.iconURL({ dynamic: true }))
            .setFooter({ text: 'WisdomSystem V4.1 ⭕ | By Apollo 👀' })
            .setTimestamp();

        const maxFields = 18;
        const mainFields = fields.slice(0, maxFields);
        const remaining = fields.length - mainFields.length;
        if (remaining > 0) {
            mainFields.push({ name: 'More Channels', value: `+${remaining} additional channels not shown.`, inline: false });
        }

        summary.addFields(mainFields.length > 0 ? mainFields : [{ name: 'No Voice/Stage Channels', value: 'There are no voice or stage channels to report.', inline: false }]);
        await message.reply({ embeds: [summary] });
    }
};