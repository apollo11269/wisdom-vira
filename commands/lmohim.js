const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'lmohim',
    description: 'Display all important commands and their aliases',
    async execute(message, args) {
        const embed = new EmbedBuilder()
            .setTitle('🛡️ Important Commands')
            .setDescription('List of all important commands and their aliases')
            .addFields(
                {
                    name: '👤 Nickname',
                    value: '`!nickname` | `!nick`\nChange a user\'s nickname',
                    inline: false
                },
                {
                    name: '🔇 Mute',
                    value: '`!mute` - Mute user\n`!unmute` - Unmute user\n`!muteall` - Mute all in VC\n`!unmuteall` - Unmute all in VC',
                    inline: false
                },
                {
                    name: '🔨 Ban',
                    value: '`!ban`\nBan a user from the server',
                    inline: false
                },
                {
                    name: '🔒 Channel Lock',
                    value: '`!lock` - Lock channel\n`!unlock` - Unlock channel',
                    inline: false
                },
                {
                    name: '🧹 Clear',
                    value: '`!clear`\nDelete multiple messages',
                    inline: false
                },
                {
                    name: '🎂 Birthday Commands',
                    value: '`!setupbirthdays` - Setup birthday system\n`!addbirthday` | `!birthday` | `!bd` - Add your birthday\n`!birthdays` | `!bdays` - View all birthdays\n`!removebirthday` - Remove your birthday',
                    inline: false
                },
                {
                    name: '🎵 Voice Check Commands',
                    value: '`!tsara` - Check if user is in voice channel\nUsage: `!tsara @user`',
                    inline: false
                },
                {
                    name: '📝 Usage Examples',
                    value: '`!smiya @user NewName`\n`!skot @user`\n`!qawed @user reason`\n`!sed`\n`!mse7 10`\n`!addbirthday 15/03`\n`!tsara @user`',
                    inline: false
                }
            )
            .setColor('#5865F2')
            .setThumbnail(message.guild.iconURL({ dynamic: true }))
            .setFooter({ text: 'WisdomSystem V4.1 ⭕ | By Apollo 👀' })
            .setTimestamp();

        message.reply({ embeds: [embed] });
    },
};