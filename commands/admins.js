const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'admins',
    description: 'Show all administrators in the server',
    async execute(message, args) {
        try {
            // Fetch all members to ensure we have the latest data
            await message.guild.members.fetch();
            
            // Get all members with administrator permission
            const admins = message.guild.members.cache.filter(member => 
                member.permissions.has(PermissionFlagsBits.Administrator) && !member.user.bot
            );
            
            if (admins.size === 0) {
                return message.reply('❌ No administrators found in this server!');
            }
            
            // Sort admins by join date
            const sortedAdmins = admins.sort((a, b) => a.joinedTimestamp - b.joinedTimestamp);
            
            // Create admin list
            const adminList = sortedAdmins.map((member, index) => {
                const status = member.presence?.status || 'offline';
                const statusEmoji = {
                    online: '🟢',
                    idle: '🟡',
                    dnd: '🔴',
                    offline: '⚫'
                }[status];
                
                return `${index + 1}. ${statusEmoji} ${member.user.tag} ${member.user.id === message.guild.ownerId ? '👑' : ''}`;
            }).join('\n');
            
            const embed = new EmbedBuilder()
                .setTitle(`👮 Server Administrators (${admins.size})`)
                .setDescription(adminList)
                .addFields(
                    { name: '📊 Statistics', value: `**Total Admins:** ${admins.size}\n**Server Owner:** <@${message.guild.ownerId}>`, inline: false }
                )
                .setColor('#7289da')
                .setThumbnail(message.guild.iconURL({ dynamic: true }))
                .setFooter({ text: 'WisdomSystem V4.1 ⭕ | By Apollo 👀' })
                .setTimestamp();
            
            message.reply({ embeds: [embed] });
            
        } catch (error) {
            console.error('Error fetching admins:', error);
            message.reply('❌ An error occurred while fetching administrators.');
        }
    },
};