const { EmbedBuilder, PermissionFlagsBits, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');

module.exports = {
    name: 'moveall',
    description: 'Advanced mass move system - Move all users between voice/stage channels with multiple options',
    usage: '!moveall [channel_name] | !moveall menu | !moveall list',
    async execute(message, args) {
        // Check if bot has move members permission
        if (!message.guild.members.me.permissions.has(PermissionFlagsBits.MoveMembers)) {
            const err = new EmbedBuilder()
                .setColor('#E74C3C')
                .setTitle('❌ Missing Permission')
                .setDescription('I need the **Move Members** permission to perform this action.')
                .setTimestamp();
            return message.reply({ embeds: [err] });
        }
        
        // Check if command author is in a voice or stage channel
        if (!message.member.voice.channel) {
            const helpEmbed = new EmbedBuilder()
                .setColor('#ff4757')
                .setTitle('❌ Not in Voice/Stage Channel')
                .setDescription('You need to be in a voice or stage channel to use this command!')
                .addFields(
                    { name: '📋 Available Commands', value: '`!moveall [channel_name]` - Move to specific channel\n`!moveall menu` - Interactive channel selector\n`!moveall list` - Show all available channels', inline: false }
                )
                .setFooter({ text: 'WisdomSystem V4.1 ⭕ | By Apollo 👀' })
                .setTimestamp();
            return message.reply({ embeds: [helpEmbed] });
        }
        
        const sourceChannel = message.member.voice.channel;
        const members = sourceChannel.members.filter(member => !member.user.bot);
        
        if (members.size === 0) {
            const err = new EmbedBuilder()
                .setColor('#E74C3C')
                .setTitle('❌ No Users Found')
                .setDescription('There are no non-bot users in your current voice/stage channel.')
                .setTimestamp();
            return message.reply({ embeds: [err] });
        }
        
        // Handle different command modes
        const command = args[0]?.toLowerCase();
        
        if (command === 'list') {
            return this.showChannelList(message);
        }
        
        if (command === 'menu') {
            return this.showInteractiveMenu(message, sourceChannel, members);
        }
        
        const channelName = args.join(' ');
        if (!channelName) {
            return this.showUsageHelp(message, sourceChannel, members.size);
        }
        
        // Direct channel name search
        return this.moveToChannel(message, sourceChannel, members, channelName);
    },
    
    async moveToChannel(message, sourceChannel, members, channelName) {
        try {
            // Find the target voice or stage channel with better matching
            const allChannels = message.guild.channels.cache.filter(channel => 
                (channel.type === 2 || channel.type === 13) && // Voice or Stage
                channel.id !== sourceChannel.id
            );
            
            let targetChannel = allChannels.find(channel => 
                channel.name.toLowerCase() === channelName.toLowerCase()
            );
            
            if (!targetChannel) {
                targetChannel = allChannels.find(channel => 
                    channel.name.toLowerCase().includes(channelName.toLowerCase())
                );
            }
            
            if (!targetChannel) {
                const suggestions = allChannels
                    .filter(channel => channel.name.toLowerCase().includes(channelName.toLowerCase().substring(0, 3)))
                    .first(3)
                    .map(ch => ch.name)
                    .join(', ');
                
                const embed = new EmbedBuilder()
                    .setColor('#ff4757')
                    .setTitle('❌ Channel Not Found')
                    .setDescription(`Could not find a voice/stage channel matching "**${channelName}**"`)
                    .addFields(
                        { name: '💡 Suggestions', value: suggestions || 'No similar channels found', inline: false },
                        { name: '📋 Available Options', value: '`!moveall menu` - Interactive selector\n`!moveall list` - Show all channels', inline: false }
                    )
                    .setTimestamp();
                
                return message.reply({ embeds: [embed] });
            }
            
            // Show confirmation with preview
            return this.showMoveConfirmation(message, sourceChannel, targetChannel, members);
            
        } catch (error) {
            console.error('Error in moveToChannel:', error);
            message.reply('❌ An error occurred while processing the move request.');
        }
    },
    
    async showMoveConfirmation(message, sourceChannel, targetChannel, members) {
        const sourceType = sourceChannel.type === 13 ? 'Stage' : 'Voice';
        const targetType = targetChannel.type === 13 ? 'Stage' : 'Voice';
        
        const embed = new EmbedBuilder()
            .setColor('#ffa502')
            .setTitle('⚠️ Confirm Mass Move')
            .setDescription(`Are you sure you want to move **${members.size} users** from **${sourceChannel.name}** to **${targetChannel.name}**?`)
            .addFields(
                { name: '📤 Source', value: `${sourceChannel.name} (${sourceType})\n👥 ${members.size} users`, inline: true },
                { name: '📥 Target', value: `${targetChannel.name} (${targetType})\n🔊 ${targetChannel.members.size} current users`, inline: true },
                { name: '👥 Users to Move', value: members.map(m => m.user.username).slice(0, 10).join(', ') + (members.size > 10 ? `\n+${members.size - 10} more...` : ''), inline: false }
            )
            .setFooter({ text: 'WisdomSystem V4.1 ⭕ | By Apollo 👀' })
            .setTimestamp();
        
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('confirm_move')
                    .setLabel('✅ Confirm Move')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('cancel_move')
                    .setLabel('❌ Cancel')
                    .setStyle(ButtonStyle.Danger)
            );
        
        const confirmMessage = await message.reply({ embeds: [embed], components: [row] });
        
        try {
            const interaction = await confirmMessage.awaitMessageComponent({
                componentType: ComponentType.Button,
                filter: i => i.user.id === message.author.id,
                time: 30000
            });
            
            if (interaction.customId === 'confirm_move') {
                await interaction.deferUpdate();
                return this.executeMassMove(message, sourceChannel, targetChannel, members, confirmMessage);
            } else {
                const cancelEmbed = new EmbedBuilder()
                    .setColor('#ff4757')
                    .setTitle('❌ Move Cancelled')
                    .setDescription('Mass move operation has been cancelled.')
                    .setTimestamp();
                
                await interaction.update({ embeds: [cancelEmbed], components: [] });
            }
        } catch (error) {
            const timeoutEmbed = new EmbedBuilder()
                .setColor('#ff4757')
                .setTitle('⏰ Confirmation Timeout')
                .setDescription('Move confirmation timed out. Please try again.')
                .setTimestamp();
            
            await confirmMessage.edit({ embeds: [timeoutEmbed], components: [] });
        }
    },
    
    async executeMassMove(message, sourceChannel, targetChannel, members, confirmMessage) {
        const sourceType = sourceChannel.type === 13 ? 'Stage' : 'Voice';
        const targetType = targetChannel.type === 13 ? 'Stage' : 'Voice';
        
        // Show progress embed
        const progressEmbed = new EmbedBuilder()
            .setColor('#3742fa')
            .setTitle('🔄 Moving Users...')
            .setDescription(`Moving ${members.size} users from **${sourceChannel.name}** to **${targetChannel.name}**`)
            .addFields({ name: '📊 Progress', value: '⏳ Starting move operation...', inline: false })
            .setTimestamp();
        
        await confirmMessage.edit({ embeds: [progressEmbed], components: [] });
        
        let movedCount = 0;
        let failedCount = 0;
        const failedUsers = [];
        
        // Move members with progress updates
        for (const [id, member] of members) {
            try {
                await member.voice.setChannel(targetChannel, `Advanced mass move by ${message.author.tag}`);
                movedCount++;
                
                // Update progress every 3 moves
                if (movedCount % 3 === 0) {
                    progressEmbed.setFields({ name: '📊 Progress', value: `✅ Moved: ${movedCount}/${members.size}\n⏳ In progress...`, inline: false });
                    await confirmMessage.edit({ embeds: [progressEmbed] }).catch(() => {});
                }
            } catch (error) {
                console.error(`Failed to move ${member.user.tag}:`, error);
                failedCount++;
                failedUsers.push(member.user.username);
            }
        }
        
        // Final result embed
        const resultEmbed = new EmbedBuilder()
            .setTitle('🎉 Advanced Mass Move Complete')
            .setDescription(`Successfully moved users from **${sourceChannel.name}** (${sourceType}) to **${targetChannel.name}** (${targetType})`)
            .addFields(
                { name: '👮 Moderator', value: `${message.author.tag}\n${message.author.id}`, inline: true },
                { name: '📤 Source Channel', value: `${sourceChannel.name}\n(${sourceType})`, inline: true },
                { name: '📥 Target Channel', value: `${targetChannel.name}\n(${targetType})`, inline: true },
                { name: '📊 Move Results', value: `✅ Successfully moved: **${movedCount}**\n❌ Failed to move: **${failedCount}**\n👥 Total processed: **${members.size}**`, inline: false }
            )
            .setColor(failedCount === 0 ? '#2ed573' : '#ffa502')
            .setFooter({ text: 'WisdomSystem V4.1 ⭕ | By Apollo 👀' })
            .setTimestamp();
        
        if (failedUsers.length > 0) {
            resultEmbed.addFields({
                name: '⚠️ Failed Users',
                value: failedUsers.slice(0, 10).join(', ') + (failedUsers.length > 10 ? `\n+${failedUsers.length - 10} more...` : ''),
                inline: false
            });
        }
        
        await confirmMessage.edit({ embeds: [resultEmbed] });
    },
    
    async showInteractiveMenu(message, sourceChannel, members) {
        const channels = message.guild.channels.cache
            .filter(channel => 
                (channel.type === 2 || channel.type === 13) && 
                channel.id !== sourceChannel.id &&
                channel.permissionsFor(message.guild.members.me).has(PermissionFlagsBits.Connect)
            )
            .sort((a, b) => a.name.localeCompare(b.name))
            .first(25);
        
        if (channels.size === 0) {
            return message.reply('❌ No available voice/stage channels found!');
        }
        
        const options = channels.map(channel => ({
            label: `${channel.name} (${channel.type === 13 ? 'Stage' : 'Voice'})`,
            description: `${channel.members.size} users currently in channel`,
            value: channel.id,
            emoji: channel.type === 13 ? '🎭' : '🔊'
        }));
        
        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('select_target_channel')
            .setPlaceholder('Choose a channel to move users to...')
            .addOptions(options);
        
        const row = new ActionRowBuilder().addComponents(selectMenu);
        
        const embed = new EmbedBuilder()
            .setColor('#3742fa')
            .setTitle('🎯 Interactive Channel Selector')
            .setDescription(`Select a target channel to move **${members.size} users** from **${sourceChannel.name}**`)
            .addFields(
                { name: '📤 Source Channel', value: `${sourceChannel.name} (${sourceChannel.type === 13 ? 'Stage' : 'Voice'})`, inline: true },
                { name: '👥 Users to Move', value: `${members.size} users`, inline: true },
                { name: '📋 Available Channels', value: `${channels.size} channels available`, inline: true }
            )
            .setFooter({ text: 'WisdomSystem V4.1 ⭕ | By Apollo 👀' })
            .setTimestamp();
        
        const menuMessage = await message.reply({ embeds: [embed], components: [row] });
        
        try {
            const interaction = await menuMessage.awaitMessageComponent({
                componentType: ComponentType.StringSelect,
                filter: i => i.user.id === message.author.id,
                time: 60000
            });
            
            const targetChannel = message.guild.channels.cache.get(interaction.values[0]);
            await interaction.deferUpdate();
            
            return this.showMoveConfirmation(message, sourceChannel, targetChannel, members);
            
        } catch (error) {
            const timeoutEmbed = new EmbedBuilder()
                .setColor('#ff4757')
                .setTitle('⏰ Selection Timeout')
                .setDescription('Channel selection timed out. Please try again.')
                .setTimestamp();
            
            await menuMessage.edit({ embeds: [timeoutEmbed], components: [] });
        }
    },
    
    async showChannelList(message) {
        const channels = message.guild.channels.cache
            .filter(channel => (channel.type === 2 || channel.type === 13))
            .sort((a, b) => a.name.localeCompare(b.name));
        
        const voiceChannels = channels.filter(ch => ch.type === 2);
        const stageChannels = channels.filter(ch => ch.type === 13);
        
        const embed = new EmbedBuilder()
            .setColor('#3742fa')
            .setTitle('📋 Available Channels')
            .setDescription('List of all voice and stage channels in this server')
            .setTimestamp();
        
        if (voiceChannels.size > 0) {
            const voiceList = voiceChannels
                .map(ch => `🔊 **${ch.name}** (${ch.members.size} users)`)
                .join('\n');
            embed.addFields({ name: `🔊 Voice Channels (${voiceChannels.size})`, value: voiceList.length > 1024 ? voiceList.substring(0, 1021) + '...' : voiceList, inline: false });
        }
        
        if (stageChannels.size > 0) {
            const stageList = stageChannels
                .map(ch => `🎭 **${ch.name}** (${ch.members.size} users)`)
                .join('\n');
            embed.addFields({ name: `🎭 Stage Channels (${stageChannels.size})`, value: stageList.length > 1024 ? stageList.substring(0, 1021) + '...' : stageList, inline: false });
        }
        
        embed.addFields({
            name: '💡 Usage Tips',
            value: '• Use `!moveall [channel_name]` to move directly\n• Use `!moveall menu` for interactive selection\n• Partial channel names work too!',
            inline: false
        });
        
        return message.reply({ embeds: [embed] });
    },
    
    async showUsageHelp(message, sourceChannel, memberCount) {
        const embed = new EmbedBuilder()
            .setColor('#3742fa')
            .setTitle('🎯 Advanced Move System')
            .setDescription(`Ready to move **${memberCount} users** from **${sourceChannel.name}**`)
            .addFields(
                { name: '📋 Available Commands', value: '`!moveall [channel_name]` - Move to specific channel\n`!moveall menu` - Interactive channel selector\n`!moveall list` - Show all available channels', inline: false },
                { name: '💡 Pro Tips', value: '• Partial channel names work (e.g., "gen" for "general")\n• Use the menu for easier selection\n• Confirmation required for all moves', inline: false },
                { name: '🔧 Features', value: '• Smart channel matching\n• Progress tracking\n• Detailed move reports\n• Cross-platform support (Voice ↔ Stage)', inline: false }
            )
            .setFooter({ text: 'WisdomSystem V4.1 ⭕ | By Apollo 👀' })
            .setTimestamp();
        
        return message.reply({ embeds: [embed] });
    }
};